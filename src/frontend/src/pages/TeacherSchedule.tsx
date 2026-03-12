/*
 * OPEC Schedule
 * Copyright (c) 2026 Cczzarr, qqsharki4
 * All Rights Reserved.
 *
 * Authors:
 * - GitHub: Cczzarr   | Telegram: t.me/cczzar
 * - GitHub: qqsharki4 | Telegram: t.me/now_shark
 *
 * Repository: https://github.com/Cczzarr/OPEC
 *
 * This source code is published for viewing and reference only.
 * Copying, modification, redistribution, reuse, or deployment of this code,
 * in whole or in part, without explicit permission from the authors is prohibited.
 */

import clsx from 'clsx';
import { addDays, format, isSameDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { ReactElement } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { API_BASE_URL } from '../api/apiBaseUrl.ts';
import { CursorGlow } from '../components/layout/CursorGlow.tsx';
import { Footer } from '../components/layout/Footer.tsx';
import { ScrollProgress } from '../components/layout/ScrollProgress.tsx';
import { TeacherScheduleCard } from '../components/schedule/TeacherScheduleCard.tsx';
import { StatusPanel } from '../components/status/StatusPanel.tsx';
import { getStatusPreset } from '../components/status/statusPresets.tsx';
import { DemoModeBadge } from '../components/status/DemoModeBadge.tsx';
import { SyncLoadingIndicator } from '../components/status/SyncLoadingIndicator.tsx';
import { useHydrated } from '../hooks/useHydrated.ts';
import { usePageMeta } from '../hooks/usePageMeta.ts';
import { getTeacherPageMeta, getTeacherPageMetaByDate } from '../seo/pageMeta.ts';
import type { TeacherDayScheduleResponse } from '../types/api.ts';
import { isDateRouteSegment, routeDateToLocalDate } from '../utils/dateRoute.ts';
import { buildTeacherPath, buildTeacherPathByDate, decodeTeacherSlug, formatTeacherName } from '../utils/teachers.ts';

type TeacherLoadingResponse = {
  status: 'loading';
};

type TeacherSchedulePayload = TeacherDayScheduleResponse | TeacherLoadingResponse;
type MotionModule = typeof import('framer-motion');

const REQUEST_TIMEOUT_MS = 20000;
const READY_RETRY_DELAY_MS = 900;
const MAX_READY_RETRIES = 20;
const MIN_CARD_SWAP_MS = 220;

function capitalizeFirst(text: string): string {
  if (!text) {
    return text;
  }

  return text.charAt(0).toUpperCase() + text.slice(1);
}

function isLoadingResponse(payload: unknown): payload is TeacherLoadingResponse {
  if (typeof payload !== 'object' || payload === null) {
    return false;
  }

  return (payload as TeacherLoadingResponse).status === 'loading';
}

function isTeacherDayScheduleResponse(payload: unknown): payload is TeacherDayScheduleResponse {
  if (typeof payload !== 'object' || payload === null) {
    return false;
  }

  const candidate = payload as Partial<TeacherDayScheduleResponse>;
  return Array.isArray(candidate.lessons) && typeof candidate.teacher_query === 'string';
}

function waitWithAbort(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException('Request aborted', 'AbortError'));
      return;
    }

    const timeoutId = window.setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);

    function onAbort(): void {
      window.clearTimeout(timeoutId);
      signal.removeEventListener('abort', onAbort);
      reject(new DOMException('Request aborted', 'AbortError'));
    }

    signal.addEventListener('abort', onAbort, { once: true });
  });
}

function isAbortError(error: unknown): boolean {
  if (error instanceof DOMException) {
    return error.name === 'AbortError';
  }

  return error instanceof Error && error.name === 'AbortError';
}

function isErrorMessage(error: unknown, message: string): boolean {
  return error instanceof Error && error.message === message;
}

type TeacherSchedulePageProps = {
  forcedTeacherSlug?: string;
  forcedDate?: string | null;
};

export function TeacherSchedulePage({
  forcedTeacherSlug,
  forcedDate = null,
}: TeacherSchedulePageProps = {}): ReactElement {
  const navigate = useNavigate();
  const { teacherSlug: teacherSlugFromRoute = '', date: dateFromRoute = '' } = useParams();
  const teacherSlug = forcedTeacherSlug ?? teacherSlugFromRoute;
  const routeDate = forcedDate ?? dateFromRoute;
  const isDateMode = isDateRouteSegment(routeDate);
  const todayRouteDate = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const [sessionDate, setSessionDate] = useState(todayRouteDate);
  const targetDate = isDateMode ? routeDate : sessionDate;
  const teacherName = useMemo(() => decodeTeacherSlug(teacherSlug), [teacherSlug]);
  const teacherDisplayName = useMemo(
    () => formatTeacherName(teacherName || 'Преподаватель'),
    [teacherName]
  );
  const pageMeta = useMemo(
    () =>
      isDateMode
        ? getTeacherPageMetaByDate(teacherName || teacherSlug, targetDate)
        : getTeacherPageMeta(teacherName || teacherSlug),
    [isDateMode, targetDate, teacherName, teacherSlug]
  );

  usePageMeta(pageMeta);

  const isHydrated = useHydrated();
  const [teacherData, setTeacherData] = useState<TeacherDayScheduleResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [isTimeout, setIsTimeout] = useState(false);
  const [isGeneralError, setIsGeneralError] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [motionModule, setMotionModule] = useState<MotionModule | null>(null);
  const [calendarDirection, setCalendarDirection] = useState(1);

  useEffect(() => {
    if (!isDateMode) {
      setSessionDate(todayRouteDate);
    }
  }, [isDateMode, teacherSlug, todayRouteDate]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const touchQuery = window.matchMedia('(pointer: coarse)');
    function updatePointerMode(): void {
      setIsTouchDevice(touchQuery.matches);
    }

    updatePointerMode();
    touchQuery.addEventListener('change', updatePointerMode);
    return () => touchQuery.removeEventListener('change', updatePointerMode);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    function updateReducedMotion(): void {
      setPrefersReducedMotion(reducedMotionQuery.matches);
    }

    updateReducedMotion();
    reducedMotionQuery.addEventListener('change', updateReducedMotion);
    return () => reducedMotionQuery.removeEventListener('change', updateReducedMotion);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) {
      return;
    }

    let cancelled = false;
    import('framer-motion').then((module) => {
      if (!cancelled) {
        setMotionModule(module);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (!teacherName) {
      setLoading(false);
      setIsGeneralError(true);
      return;
    }

    const requestStartedAt = performance.now();
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const todayDate = targetDate;
    let isActive = true;
    let demoFallbackTimer: number | null = null;

    async function fetchTeacherSchedule(): Promise<TeacherDayScheduleResponse> {
      for (let retries = 0; retries < MAX_READY_RETRIES; retries += 1) {
        const response = await fetch(
          `${API_BASE_URL}/schedule/teacher/${encodeURIComponent(teacherName)}?date=${todayDate}`,
          { signal: controller.signal }
        );

        if (response.status === 429) {
          throw new Error('RATE_LIMITED');
        }
        if (!response.ok) {
          throw new Error('API_ERROR');
        }

        const payload = (await response.json()) as TeacherSchedulePayload;
        if (isLoadingResponse(payload)) {
          await waitWithAbort(READY_RETRY_DELAY_MS, controller.signal);
          continue;
        }

        if (!isTeacherDayScheduleResponse(payload)) {
          throw new Error('API_SHAPE_ERROR');
        }

        return payload;
      }

      throw new Error('SYNC_TIMEOUT');
    }

    function applyDemoFallback(): void {
      if (!isActive) {
        return;
      }

      if (demoFallbackTimer !== null) {
        window.clearTimeout(demoFallbackTimer);
      }

      demoFallbackTimer = window.setTimeout(() => {
        if (!isActive) {
          return;
        }

        setIsOffline(true);
        setLoading(false);
      }, 800);
    }

    setLoading(true);
    setIsOffline(false);
    setIsRateLimited(false);
    setIsTimeout(false);
    setIsGeneralError(false);
    if (!hasLoadedOnce) {
      setTeacherData(null);
    }

    void fetchTeacherSchedule()
      .then((payload) => {
        if (!isActive) {
          return;
        }

        const elapsedMs = performance.now() - requestStartedAt;
        const restMs = Math.max(0, MIN_CARD_SWAP_MS - elapsedMs);

        window.setTimeout(() => {
          if (!isActive) {
            return;
          }

          setTeacherData(payload);
          setLoading(false);
          setHasLoadedOnce(true);
          window.clearTimeout(timeoutId);
        }, restMs);
      })
      .catch((error: unknown) => {
        if (!isActive) {
          return;
        }

        window.clearTimeout(timeoutId);

        if (isErrorMessage(error, 'RATE_LIMITED')) {
          setIsRateLimited(true);
          setLoading(false);
          return;
        }

        if (isErrorMessage(error, 'SYNC_TIMEOUT')) {
          setIsTimeout(true);
          setLoading(false);
          return;
        }

        if (isErrorMessage(error, 'API_ERROR') || isErrorMessage(error, 'API_SHAPE_ERROR')) {
          setIsGeneralError(true);
          setLoading(false);
          return;
        }

        if (isAbortError(error)) {
          setIsTimeout(true);
          setLoading(false);
          return;
        }

        applyDemoFallback();
      });

    return () => {
      isActive = false;
      window.clearTimeout(timeoutId);
      if (demoFallbackTimer !== null) {
        window.clearTimeout(demoFallbackTimer);
      }
      controller.abort();
    };
  }, [isHydrated, targetDate, teacherName]);

  const hasChanges = teacherData?.lessons.some((lesson) => lesson.is_change) ?? false;
  const today = useMemo(() => {
    const value = routeDateToLocalDate(todayRouteDate) ?? new Date();
    value.setHours(0, 0, 0, 0);
    return value;
  }, [todayRouteDate]);
  const targetDateObject = routeDateToLocalDate(targetDate) ?? today;
  const dateLabel = capitalizeFirst(format(targetDateObject, 'EEEE, d MMMM', { locale: ru }));
  const shouldShowDateLabel = isDateMode || isHydrated;
  const dateLabelText = shouldShowDateLabel ? dateLabel : '\u00A0';
  const teacherRouteName = teacherName || teacherSlug;

  function handleCompactCalendarDateSelect(date: Date): void {
    if (!teacherRouteName) {
      return;
    }

    if (date.getDay() === 0) {
      return;
    }

    const selectedDate = format(date, 'yyyy-MM-dd');
    const todayDate = todayRouteDate;
    setCalendarDirection(date.getTime() >= targetDateObject.getTime() ? 1 : -1);

    if (!isDateMode) {
      if (selectedDate !== targetDate) {
        setLoading(true);
        setSessionDate(selectedDate);
      }
      return;
    }

    const nextPath =
      selectedDate === todayDate
        ? buildTeacherPath(teacherRouteName)
        : buildTeacherPathByDate(teacherRouteName, selectedDate);

    if (nextPath !== window.location.pathname) {
      setLoading(true);
      navigate(nextPath, { state: { preserveScroll: true } });
    }
  }

  function renderTeacherCalendar(): ReactElement | null {
    if (!shouldShowDateLabel) {
      return null;
    }

    const days = Array.from({ length: 7 }, (_, index) => addDays(targetDateObject, index - 3));
    const motion = motionModule?.motion;
    const AnimatePresence = motionModule?.AnimatePresence;

    function renderCalendarWeek(weekDays: Date[]): ReactElement {
      return (
        <div className="flex flex-col">
          <div className="grid grid-cols-7 mb-2">
            {weekDays.map((day) => (
              <div
                key={`label-${day.toISOString()}`}
                className="text-center text-[10px] font-black text-md-on-surface-variant py-2"
              >
                {format(day, 'EEEEEE', { locale: ru }).toUpperCase()}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((day) => renderDayButton(day))}
          </div>
        </div>
      );
    }

    function renderDayButton(day: Date): ReactElement {
      const isSelected = isSameDay(day, targetDateObject);
      const isToday = isSameDay(day, today);
      const isSunday = day.getDay() === 0;
      const dayNumber = format(day, 'd');

      return (
        <button
          type="button"
          key={day.toISOString()}
          onClick={() => handleCompactCalendarDateSelect(day)}
          disabled={isSunday}
          className={clsx(
            'group relative aspect-square flex items-center justify-center text-sm font-bold rounded-xl transition-colors duration-200',
            isSelected ? 'text-md-bg' : 'text-md-on-surface hover:bg-white/5',
            isSunday && !isSelected && 'opacity-30 pointer-events-none cursor-default'
          )}
          aria-label={`Открыть расписание на ${format(day, 'd MMMM', { locale: ru })}`}
        >
          {!isTouchDevice && !isSelected && !isSunday && (
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="mini-blob animate-blob-morph [animation-duration:3s]" />
            </div>
          )}

          {isSelected && (
            <div className="absolute inset-0 z-0 flex items-center justify-center">
              <div className={clsx('w-full h-full', isTouchDevice ? 'scale-[1.04]' : 'scale-110')}>
                {motion ? (
                  <motion.div
                    layoutId="teacher-inline-calendar-selected"
                    transition={
                      isTouchDevice
                        ? { duration: 0.28, ease: [0.22, 1, 0.36, 1] }
                        : { type: 'spring', stiffness: 260, damping: 26, mass: 0.9 }
                    }
                    className="w-full h-full"
                  >
                    <div
                      className={clsx(
                        'w-full h-full mini-blob',
                        !isTouchDevice && 'animate-blob-morph [animation-duration:5s]'
                      )}
                    />
                  </motion.div>
                ) : (
                  <div
                    className={clsx(
                      'w-full h-full mini-blob',
                      !isTouchDevice && 'animate-blob-morph [animation-duration:5s]'
                    )}
                  />
                )}
              </div>
            </div>
          )}

          {isToday && !isSelected && (
            <div className="absolute inset-0 z-0 flex items-center justify-center scale-[1.05]">
              <div
                className={clsx(
                  'w-full h-full today-blob',
                  !isTouchDevice && 'animate-blob-morph [animation-duration:8s]'
                )}
              />
            </div>
          )}

          <span
            className={clsx(
              'relative z-10 transition-colors duration-300',
              isSelected
                ? 'text-md-bg delay-75'
                : clsx('text-md-on-surface group-hover:text-md-bg', isToday && 'text-md-primary font-black')
            )}
          >
            {dayNumber}
          </span>
        </button>
      );
    }

    return (
      <div className="w-full max-w-[500px] mx-auto mb-12 bg-md-surface border border-white/5 rounded-[32px] p-4 sm:p-6 shadow-2xl backdrop-blur-md overflow-hidden flex flex-col">
        {motion && AnimatePresence ? (
          <div className="relative min-h-[88px] sm:min-h-[96px]">
            <AnimatePresence mode="sync" initial={false}>
              <motion.div
                key={targetDate}
                initial={
                  prefersReducedMotion
                    ? { opacity: 0 }
                    : { opacity: 0, x: calendarDirection > 0 ? 28 : -28, filter: 'blur(3px)' }
                }
                animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                exit={
                  prefersReducedMotion
                    ? { opacity: 0 }
                    : { opacity: 0, x: calendarDirection > 0 ? -28 : 28, filter: 'blur(3px)' }
                }
                transition={{ duration: prefersReducedMotion ? 0.16 : 0.32, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0"
              >
                {renderCalendarWeek(days)}
              </motion.div>
            </AnimatePresence>
          </div>
        ) : (
          renderCalendarWeek(days)
        )}
      </div>
    );
  }

  function renderBody(): ReactElement {
    if (isRateLimited) {
      return <StatusPanel {...getStatusPreset('rate_limited')} />;
    }

    if (isTimeout) {
      return <StatusPanel {...getStatusPreset('timeout')} />;
    }

    if (isGeneralError) {
      return <StatusPanel {...getStatusPreset('sync_error')} />;
    }

    return (
      <>
        {renderTeacherCalendar()}
        <div className="relative min-h-[420px] overflow-visible">
          <div
            className={clsx(
              'absolute inset-0 z-20 flex flex-col items-center justify-center py-32 gap-6',
              'transition-all duration-300',
              loading
                ? 'opacity-100 translate-y-0 pointer-events-auto delay-150'
                : 'opacity-0 pointer-events-none translate-y-4'
            )}
          >
            <SyncLoadingIndicator />
          </div>

          <div
            className={clsx(
              'w-full relative',
              'transition-all duration-300',
              loading
                ? 'opacity-0 pointer-events-none -translate-y-4'
                : 'opacity-100 translate-y-0 delay-150'
            )}
          >
            <TeacherScheduleCard
              teacherName={teacherDisplayName}
              hasChanges={hasChanges}
              lessons={teacherData?.lessons ?? []}
            />
          </div>
        </div>
      </>
    );
  }

  function renderPlaceholder(): ReactElement {
    return (
      <>
        {renderTeacherCalendar()}
        <div
          role="status"
          aria-live="polite"
          className="relative transform-gpu translate-y-0 bg-md-surface border border-white/5 rounded-[32px] p-8 flex flex-col h-full cursor-default isolate shadow-[0_22px_40px_rgba(0,0,0,0.35)]"
        >
          <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/5 gap-4">
            <div className="h-7 w-[220px] rounded-lg bg-white/[0.04] animate-pulse" />
            <div className="h-6 w-20 rounded-full bg-white/[0.03] animate-pulse" />
          </div>

          <div className="flex grow items-center justify-center rounded-[28px] bg-white/[0.02] px-6 py-16 text-center">
            <div className="w-full max-w-[420px]">
              <Loader2 className="w-7 h-7 text-md-primary animate-spin mx-auto" />
              <span className="sr-only">Загрузка расписания преподавателя...</span>
              <div className="mt-6 grid gap-3">
                <div className="h-4 w-full rounded bg-white/[0.03] animate-pulse" />
                <div className="h-4 w-5/6 mx-auto rounded bg-white/[0.03] animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {isHydrated ? <ScrollProgress /> : null}
      {isHydrated ? <CursorGlow /> : null}

      <main className="container mx-auto px-6 max-w-[1200px] relative z-10 pt-32">
        <section className="flex flex-col items-center text-center max-w-[720px] mx-auto">
          <p className="text-sm font-black uppercase tracking-[0.32em] text-md-tertiary/85">
            {dateLabelText}
          </p>
          <div className="relative mt-5 inline-flex items-center">
            <h1 className="text-[clamp(2.4rem,4.6vw,4rem)] font-black tracking-[-0.04em] text-md-on-surface">
              {teacherDisplayName}
            </h1>
            {isOffline ? (
              <DemoModeBadge className="absolute left-full ml-3 top-1/2 -translate-y-1/2" />
            ) : null}
          </div>
          <p className="mt-4 text-lg text-md-on-surface-variant/80 max-w-[620px]">
            Расписание преподавателя на выбранную дату.
          </p>
        </section>

        <section className="mt-10 min-h-[60vh] max-w-[580px] mx-auto">
          {isHydrated ? renderBody() : renderPlaceholder()}
        </section>

        <Footer />
      </main>
    </>
  );
}
