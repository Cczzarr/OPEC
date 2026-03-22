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
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { GraduationCap, Loader2, Zap } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';

import { API_BASE_URL } from '../api/apiBaseUrl.ts';
import { CursorGlow } from '../components/layout/CursorGlow.tsx';
import { Footer } from '../components/layout/Footer.tsx';
import { ScrollProgress } from '../components/layout/ScrollProgress.tsx';
import { StatusPanel } from '../components/status/StatusPanel.tsx';
import { getStatusPreset } from '../components/status/statusPresets.tsx';
import { DemoModeBadge } from '../components/status/DemoModeBadge.tsx';
import { SyncLoadingIndicator } from '../components/status/SyncLoadingIndicator.tsx';
import { DEMO_TEACHERS } from '../data/demoData.ts';
import { useHydrated } from '../hooks/useHydrated.ts';
import { usePageMeta } from '../hooks/usePageMeta.ts';
import { getTeachersPageMetaByDate, TEACHERS_PAGE_META } from '../seo/pageMeta.ts';
import type { PairsAvailability } from '../ssg/payload.ts';
import { useSsgPayload } from '../ssg/SsgPayloadContext.tsx';
import type { AvailableTeachersResponse } from '../types/api.ts';
import { isDateRouteSegment, routeDateToLocalDate } from '../utils/dateRoute.ts';
import { buildTeacherPath, buildTeacherPathByDate, formatTeacherName } from '../utils/teachers.ts';

type MotionModule = typeof import('framer-motion');

type TeachersLoadingResponse = {
  status: 'loading';
};

type TeachersResponse = AvailableTeachersResponse | TeachersLoadingResponse;
type TeacherDayAllResponse = {
  teachers: Array<{
    teacher: string;
    has_changes?: boolean;
    schedule: unknown[];
  }>;
};
type TeacherDayAllPayload = TeacherDayAllResponse | TeachersLoadingResponse;

const REQUEST_TIMEOUT_MS = 20000;
const READY_RETRY_DELAY_MS = 900;
const MAX_READY_RETRIES = 20;

function isLoadingResponse(payload: unknown): payload is TeachersLoadingResponse {
  if (typeof payload !== 'object' || payload === null) {
    return false;
  }

  return (payload as TeachersLoadingResponse).status === 'loading';
}

function isTeachersResponse(payload: unknown): payload is AvailableTeachersResponse {
  if (typeof payload !== 'object' || payload === null) {
    return false;
  }

  const candidate = payload as Partial<AvailableTeachersResponse>;
  return Array.isArray(candidate.teachers) && typeof candidate.total === 'number';
}

function isTeacherDayAllResponse(payload: unknown): payload is TeacherDayAllResponse {
  if (typeof payload !== 'object' || payload === null) {
    return false;
  }

  const candidate = payload as Partial<TeacherDayAllResponse>;
  return Array.isArray(candidate.teachers);
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

function formatPairsCount(value: number): string {
  const abs = Math.abs(value);
  const mod100 = abs % 100;
  const mod10 = abs % 10;

  if (mod100 >= 11 && mod100 <= 14) {
    return `${value} пар`;
  }
  if (mod10 === 1) {
    return `${value} пара`;
  }
  if (mod10 >= 2 && mod10 <= 4) {
    return `${value} пары`;
  }
  return `${value} пар`;
}

function countTeacherPairs(schedule: unknown): number {
  if (!Array.isArray(schedule) || schedule.length === 0) {
    return 0;
  }

  const pairNumbers = new Set<number>();
  for (const item of schedule) {
    if (typeof item !== 'object' || item === null) {
      continue;
    }
    const numberValue = (item as { number?: unknown }).number;
    if (typeof numberValue !== 'number' || !Number.isFinite(numberValue)) {
      continue;
    }
    const pairNumber = Math.trunc(numberValue);
    if (pairNumber >= 1 && pairNumber <= 6) {
      pairNumbers.add(pairNumber);
    }
  }

  if (pairNumbers.size > 0) {
    return pairNumbers.size;
  }

  return Math.min(schedule.length, 6);
}

type TeachersProps = {
  forcedDate?: string | null;
};

export function Teachers({ forcedDate = null }: TeachersProps = {}): ReactElement {
  const requestedDate = forcedDate ?? '';
  const isDateMode = isDateRouteSegment(requestedDate);
  const targetDate = isDateMode ? requestedDate : format(new Date(), 'yyyy-MM-dd');
  const targetDateObject = routeDateToLocalDate(targetDate);
  const subtitle = isDateMode && targetDateObject
    ? `Архивная дата: ${format(targetDateObject, 'd MMMM yyyy', { locale: ru })}. Выберите преподавателя что-бы увидеть его расписание на архивную дату.`
    : 'Выберите преподавателя что-бы увидеть его актуальное расписание.';

  usePageMeta(isDateMode ? getTeachersPageMetaByDate(targetDate) : TEACHERS_PAGE_META);

  const isHydrated = useHydrated();
  const [teachers, setTeachers] = useState<string[]>([]);
  const [teacherPairsToday, setTeacherPairsToday] = useState<Record<string, number>>({});
  const [teacherHasChanges, setTeacherHasChanges] = useState<Record<string, boolean>>({});
  const [pairsAvailability, setPairsAvailability] = useState<PairsAvailability>('unknown');
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [isTimeout, setIsTimeout] = useState(false);
  const [isGeneralError, setIsGeneralError] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [motionModule, setMotionModule] = useState<MotionModule | null>(null);
  const ssgPayload = useSsgPayload();

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
    void import('framer-motion').then((module) => {
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

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const todayDate = targetDate;
    let hasLoadedTeachers = false;
    let isActive = true;
    let demoFallbackTimer: number | null = null;

    async function fetchTeachersList(): Promise<string[]> {
      for (let retries = 0; retries < MAX_READY_RETRIES; retries += 1) {
        const response = await fetch(`${API_BASE_URL}/schedule/info/teachers`, {
          signal: controller.signal,
        });

        if (response.status === 429) {
          throw new Error('RATE_LIMITED');
        }
        if (!response.ok) {
          throw new Error('API_ERROR');
        }

        const payload = (await response.json()) as TeachersResponse;

        if (isLoadingResponse(payload)) {
          await waitWithAbort(READY_RETRY_DELAY_MS, controller.signal);
          continue;
        }

        if (!isTeachersResponse(payload)) {
          throw new Error('API_SHAPE_ERROR');
        }

        return payload.teachers
          .map((name) => name.trim())
          .filter((name) => name.length > 0);
      }

      throw new Error('SYNC_TIMEOUT');
    }

    async function fetchTeachersListFromStaticAsset(): Promise<string[] | null> {
      try {
        const response = await fetch('/teachers.json', { signal: controller.signal });
        if (!response.ok) {
          return null;
        }
        const payload = (await response.json()) as unknown;
        if (!Array.isArray(payload)) {
          return null;
        }
        return payload.map((name) => String(name).trim()).filter((name) => name.length > 0);
      } catch (error: unknown) {
        if (isAbortError(error)) {
          throw error;
        }
        return null;
      }
    }

    async function fetchPairsMap(
      dateKey: string
    ): Promise<{ pairsMap: Record<string, number>; changesMap: Record<string, boolean> } | null> {
      for (let retries = 0; retries < MAX_READY_RETRIES; retries += 1) {
        const response = await fetch(`${API_BASE_URL}/schedule/teacher/day/all?date=${dateKey}`, {
          signal: controller.signal,
        });

        if (response.status === 429 || !response.ok) {
          return null;
        }

        const payload = (await response.json()) as TeacherDayAllPayload;
        if (isLoadingResponse(payload)) {
          await waitWithAbort(READY_RETRY_DELAY_MS, controller.signal);
          continue;
        }

        if (!isTeacherDayAllResponse(payload)) {
          return null;
        }

        const pairsMap: Record<string, number> = {};
        const changesMap: Record<string, boolean> = {};
        for (const teacherItem of payload.teachers) {
          const teacherName = typeof teacherItem.teacher === 'string' ? teacherItem.teacher.trim() : '';
          if (!teacherName) {
            continue;
          }
          pairsMap[teacherName] = countTeacherPairs(teacherItem.schedule);
          changesMap[teacherName] = Boolean(teacherItem.has_changes);
        }

        return { pairsMap, changesMap };
      }

      return null;
    }

    async function loadTeachers(): Promise<void> {
      setLoading(true);
      setIsOffline(false);
      setIsRateLimited(false);
      setIsTimeout(false);
      setIsGeneralError(false);
      setTeachers([]);
      setTeacherPairsToday({});
      setTeacherHasChanges({});
      setPairsAvailability('unknown');

      const cleanedTeachers =
        (await fetchTeachersListFromStaticAsset()) ?? (await fetchTeachersList());

      if (!isActive) {
        return;
      }

      let pairsPayload: { pairsMap: Record<string, number>; changesMap: Record<string, boolean> } | null = null;
      try {
        pairsPayload = await fetchPairsMap(todayDate);
      } catch (error: unknown) {
        if (!isActive) {
          return;
        }

        if (!isAbortError(error)) {
          throw error;
        }
      }

      if (!isActive) {
        return;
      }

      setTeachers(cleanedTeachers);
      if (pairsPayload) {
        setTeacherPairsToday(pairsPayload.pairsMap);
        setTeacherHasChanges(pairsPayload.changesMap);
        setPairsAvailability('ready');
      } else {
        setTeacherPairsToday({});
        setTeacherHasChanges({});
        setPairsAvailability('unavailable');
      }
      setLoading(false);
      hasLoadedTeachers = true;
      window.clearTimeout(timeoutId);
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
        const mockPairs: Record<string, number> = {};
        const mockChanges: Record<string, boolean> = {};
        const mockTeachers = DEMO_TEACHERS.map((item) => {
          mockPairs[item.name] = item.pairsToday;
          mockChanges[item.name] = false;
          return item.name;
        });

        setTeachers(mockTeachers);
        setTeacherPairsToday(mockPairs);
        setTeacherHasChanges(mockChanges);
        setPairsAvailability('ready');
        setIsOffline(true);
        setLoading(false);
      }, 800);
    }

    void loadTeachers()
      .catch((error: unknown) => {
        if (!isActive) {
          return;
        }
        window.clearTimeout(timeoutId);

        if (hasLoadedTeachers) {
          return;
        }

        if (isErrorMessage(error, 'RATE_LIMITED')) {
          setIsRateLimited(true);
          setLoading(false);
          return;
        }

        if (isErrorMessage(error, 'API_ERROR')) {
          setIsGeneralError(true);
          setLoading(false);
          return;
        }

        if (isErrorMessage(error, 'SYNC_TIMEOUT')) {
          setIsTimeout(true);
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
  }, [isHydrated, targetDate]);

  const teacherCards = useMemo(() => {
    const cards = teachers.map((teacherName) => ({
      key: teacherName,
      title: formatTeacherName(teacherName),
      path: isDateMode
        ? buildTeacherPathByDate(teacherName, targetDate)
        : buildTeacherPath(teacherName),
      hasChanges: teacherHasChanges[teacherName] ?? false,
      pairsToday:
        pairsAvailability === 'ready' ? (teacherPairsToday[teacherName] ?? 0) : undefined,
    }));

    cards.sort((a, b) => a.title.localeCompare(b.title, 'ru'));

    if (pairsAvailability !== 'ready') {
      return cards;
    }

    const withPairs = cards.filter((card) => (card.pairsToday ?? 0) > 0);
    const withoutPairs = cards.filter((card) => (card.pairsToday ?? 0) === 0);
    return [...withPairs, ...withoutPairs];
  }, [isDateMode, pairsAvailability, targetDate, teacherHasChanges, teacherPairsToday, teachers]);
  const isLightMotion = prefersReducedMotion || isTouchDevice;
  const motion = motionModule?.motion;

  function renderTeacherCard(teacher: (typeof teacherCards)[number], key: string): ReactElement {
    return (
      <Link
        key={key}
        to={teacher.path}
        className="teacher-tile"
        aria-label={`Открыть расписание преподавателя ${teacher.title}`}
      >
        <div className="teacher-tile-icon">
          <GraduationCap className="w-7 h-7" />
        </div>
        <div className="teacher-tile-text flex-1">
          <strong className="block min-w-0 truncate">{teacher.title}</strong>
          <div className="mt-1 flex items-center gap-2">
            <p className="teacher-tile-meta">
              {typeof teacher.pairsToday === 'number'
                ? formatPairsCount(teacher.pairsToday)
                : 'Сегодня пар: нет данных'}
            </p>
            {teacher.hasChanges && (
              <div className="group relative flex shrink-0 items-center">
                <span
                  className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500/10 text-red-400 border border-red-500/20"
                  aria-label="Замены"
                >
                  <Zap className="h-3 w-3 fill-current" />
                </span>
                <div className="absolute left-1/2 top-full z-20 mt-2 w-max max-w-[160px] -translate-x-1/2 rounded-2xl border border-white/10 bg-md-surface/95 px-3 py-2 text-center text-sm font-medium leading-relaxed text-md-on-surface-variant opacity-0 translate-y-1 pointer-events-none transition-all duration-200 backdrop-blur-xl shadow-2xl shadow-black/50 group-hover:opacity-100 group-hover:translate-y-0">
                  Замены
                </div>
              </div>
            )}
          </div>
        </div>
      </Link>
    );
  }

  function renderTeacherCardsGrid(): ReactElement {
    const gridClassName = 'grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(320px,1fr))]';

    if (!motion) {
      return (
        <div className={gridClassName}>
          {teacherCards.map((teacher) => renderTeacherCard(teacher, teacher.key))}
        </div>
      );
    }

    const Motion = motion;
    return (
      <Motion.div
        key={`teachers-grid-${teacherCards.length}-${pairsAvailability}`}
        initial={isLightMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: isLightMotion ? 0.14 : 0.2, ease: [0.22, 1, 0.36, 1] }}
        className={gridClassName}
      >
        {teacherCards.map((teacher) => renderTeacherCard(teacher, teacher.key))}
      </Motion.div>
    );
  }

  function renderTeachersBody(): ReactElement {
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
      <div
        className={clsx('relative min-h-[420px]', loading ? 'overflow-hidden' : 'overflow-visible')}
      >
        <div
          className={clsx(
            'absolute inset-0 z-20 flex flex-col items-center justify-center py-32 gap-6 transition-opacity duration-200',
            loading ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          )}
        >
          <SyncLoadingIndicator />
        </div>

        <div
          className={clsx(
            'w-full',
            loading ? 'invisible pointer-events-none absolute inset-0' : 'visible relative'
          )}
        >
          {!loading && pairsAvailability === 'unavailable' && (
            <div className="mb-6 rounded-2xl border border-md-tertiary/25 bg-md-tertiary/8 px-5 py-3 text-center text-sm font-semibold text-md-tertiary">
              Данные по количеству пар временно не доступны.
            </div>
          )}
          {teacherCards.length > 0 ? (
            renderTeacherCardsGrid()
          ) : (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <div className="w-24 h-24 mb-8 bg-md-surface border border-white/5 rounded-full flex items-center justify-center text-md-on-surface-variant/35">
                <GraduationCap className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-md-on-surface-variant">Преподаватели не найдены</h3>
              <p className="text-md-on-surface-variant/65 mt-3 font-semibold">
                Синхронизация вернула пустой список.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderTeachersPlaceholder(): ReactElement {
    const teacherLinks = ssgPayload.teachers;
    if (teacherLinks.length > 0) {
      return (
        <div className="rounded-[32px] border border-white/5 bg-md-surface p-6 shadow-[0_22px_40px_rgba(0,0,0,0.35)]">
          <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]">
            {teacherLinks.map((teacherName) => (
              <a
                key={teacherName}
                href={buildTeacherPath(teacherName)}
                className="rounded-2xl border border-white/5 bg-white/[0.02] px-5 py-4 font-bold text-md-on-surface hover:bg-white/[0.04] transition-colors"
              >
                {formatTeacherName(teacherName)}
              </a>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-[32px] border border-white/5 bg-md-surface px-6 py-8 shadow-[0_22px_40px_rgba(0,0,0,0.35)]"
      >
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-md-primary animate-spin" />
          <span className="sr-only">Загрузка списка преподавателей...</span>
          <div className="h-5 w-56 rounded-lg bg-white/[0.04] animate-pulse" />
        </div>
        <div className="mt-6 grid gap-3">
          <div className="h-4 w-full max-w-[760px] rounded bg-white/[0.03] animate-pulse" />
          <div className="h-4 w-full max-w-[660px] rounded bg-white/[0.03] animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <>
      {isHydrated ? <ScrollProgress /> : null}
      {isHydrated ? <CursorGlow /> : null}

      <main className="container mx-auto px-6 max-w-[1200px] relative z-10 pt-32">
        <section className="flex flex-col items-center text-center">
          <div className="relative inline-flex items-center">
            <h1 className="text-[clamp(2.6rem,4.8vw,4.2rem)] font-black tracking-[-0.04em] text-md-on-surface">
              Преподаватели
            </h1>
            {isOffline ? (
              <DemoModeBadge className="absolute left-full ml-3 top-1/2 -translate-y-1/2" />
            ) : null}
          </div>
          <p className="mt-4 text-lg text-md-on-surface-variant/80 max-w-[520px]">
            {subtitle}
          </p>
        </section>

        <section className="mt-12 min-h-[60vh]">
          {isHydrated ? renderTeachersBody() : renderTeachersPlaceholder()}
        </section>

        <Footer />
      </main>
    </>
  );
}
