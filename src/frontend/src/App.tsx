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
import { Loader2, Search, Sparkles, Zap } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { ReactElement } from 'react';

import { API_BASE_URL } from './api/apiBaseUrl.ts';
import { StatusPanel } from './components/status/StatusPanel.tsx';
import { getStatusPreset } from './components/status/statusPresets.tsx';
import { CursorGlow } from './components/layout/CursorGlow.tsx';
import { Footer } from './components/layout/Footer.tsx';
import { ScrollProgress } from './components/layout/ScrollProgress.tsx';
import { Calendar } from './components/schedule/Calendar.tsx';
import { ScheduleCard } from './components/schedule/ScheduleCard.tsx';
import { DemoModeBadge } from './components/status/DemoModeBadge.tsx';
import { SyncLoadingIndicator } from './components/status/SyncLoadingIndicator.tsx';
import { createDemoDaySchedule } from './data/demoData.ts';
import { useHydrated } from './hooks/useHydrated.ts';
import { usePageMeta } from './hooks/usePageMeta.ts';
import { HOME_PAGE_META } from './seo/pageMeta.ts';
import type { DayScheduleResponse, GroupSchedule } from './types/api.ts';

type MotionModule = typeof import('framer-motion');

const DATE_FORMAT = 'yyyy-MM-dd';

function capitalizeFirst(text: string): string {
  if (!text) {
    return text;
  }
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export default function App(): ReactElement {
  usePageMeta(HOME_PAGE_META);

  const isHydrated = useHydrated();
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [previewDate, setPreviewDate] = useState<Date | null>(null);
  const [changeDates] = useState<Set<string>>(() => new Set());
  const [dayData, setDayData] = useState<DayScheduleResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [scheduleSwapAnimationEnabled, setScheduleSwapAnimationEnabled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOffline, setIsOffline] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [isGeneralError, setIsGeneralError] = useState(false);
  const [isTimeout, setIsTimeout] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [motionModule, setMotionModule] = useState<MotionModule | null>(null);

  function resetFlags(): void {
    setIsOffline(false);
    setIsRateLimited(false);
    setIsGeneralError(false);
    setIsTimeout(false);
  }

  function handleDateSelectionStart(date: Date): void {
    setPreviewDate(date);
    setLoading(true);
    resetFlags();
  }

  useEffect(() => {
    setPreviewDate(null);
  }, [selectedDate]);

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
    const timeoutId = window.setTimeout(async () => {
      const module = await import('framer-motion');
      if (!cancelled) {
        setMotionModule(module);
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    let isActive = true;
    setLoading(true);
    resetFlags();
    const dateStr = format(selectedDate, DATE_FORMAT);

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 8000);

    fetch(`${API_BASE_URL}/schedule/day/all?date=${dateStr}`, {
      signal: controller.signal,
    })
      .then((res) => {
        clearTimeout(timeoutId);
        if (res.status === 429) {
          setIsRateLimited(true);
          throw new Error('429');
        }
        if (!res.ok) {
          setIsGeneralError(true);
          throw new Error('API_ERROR');
        }
        return Promise.all([res.json(), new Promise((resolve) => setTimeout(resolve, 300))]);
      })
      .then(([data]) => {
        if (!isActive) {
          return;
        }

        setDayData(data);
        setLoading(false);
      })
      .catch((err) => {
        if (!isActive) {
          return;
        }

        clearTimeout(timeoutId);
        if (err.message === '429' || err.message === 'API_ERROR') {
          setLoading(false);
          return;
        }

        if (err.name === 'AbortError') {
          setIsTimeout(true);
          setLoading(false);
          return;
        }

        window.setTimeout(() => {
          if (!isActive) {
            return;
          }

          setDayData(createDemoDaySchedule(dateStr));
          setLoading(false);
          setIsOffline(true);
        }, 800);
      });

    return () => {
      isActive = false;
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [isHydrated, selectedDate]);

  useEffect(() => {
    if (!loading) {
      setScheduleSwapAnimationEnabled(true);
    }
  }, [loading]);

  const filteredGroups = useMemo(() => {
    const groups = dayData?.groups || [];
    const query = searchQuery.toLowerCase().trim();
    if (!query) {
      return groups;
    }

    function normalize(text: string): string {
      return text.toLowerCase().replace(/[\s.-]/g, '');
    }

    const normalizedQuery = normalize(query);

    return groups.filter((group) => {
      if (normalize(group.group).includes(normalizedQuery)) {
        return true;
      }

      return group.schedule.some((pair) =>
        [
          pair.subject,
          pair.teacher,
          pair.room,
          pair.sub1?.subject,
          pair.sub1?.teacher,
          pair.sub2?.subject,
          pair.sub2?.teacher,
        ].some((text) => text?.toLowerCase().includes(query))
      );
    });
  }, [dayData, searchQuery]);

  const displayDate = previewDate ?? selectedDate;
  const displayDateKey = format(displayDate, DATE_FORMAT);
  const displayDateLabel = capitalizeFirst(
    format(displayDate, 'EEEE, d MMMM', { locale: ru })
  );
  const isLightMotion = prefersReducedMotion || isTouchDevice;
  const isSearching = searchQuery.trim().length > 0;
  const shouldUseLayoutTransitions =
    !isLightMotion && (isSearching || filteredGroups.length <= 16);
  const motion = motionModule?.motion;
  const AnimatePresence = motionModule?.AnimatePresence;
  const dateAnimation = {
    initial: { opacity: 0.55, scale: 0.992 },
    animate: { opacity: 1, scale: 1 },
    transition: {
      duration: isLightMotion ? 0.12 : 0.16,
      ease: [0.33, 1, 0.68, 1] as [number, number, number, number],
    },
  };

  function renderDateLabel(): ReactElement {
    if (motion) {
      return (
        <motion.p
          key={displayDateKey}
          initial={dateAnimation.initial}
          animate={dateAnimation.animate}
          transition={dateAnimation.transition}
          className="min-h-[3.2rem] md:min-h-[3.8rem] text-[clamp(1.25rem,2.6vw,2.5rem)] text-md-tertiary font-bold tracking-[-0.02em]"
        >
          {displayDateLabel}
        </motion.p>
      );
    }

    return (
      <p className="min-h-[3.2rem] md:min-h-[3.8rem] text-[clamp(1.25rem,2.6vw,2.5rem)] text-md-tertiary font-bold tracking-[-0.02em]">
        {displayDateLabel}
      </p>
    );
  }

  function renderEmptyState(): ReactElement {
    const wrapperClassName = 'flex flex-col items-center justify-center py-40 text-center';

    const content = (
      <>
        <div className="w-24 h-24 mb-8 bg-md-surface border border-white/5 rounded-full flex items-center justify-center text-md-on-surface-variant/30 shadow-inner">
          <Search className="w-10 h-10" />
        </div>
        <h3 className="text-2xl font-black text-md-on-surface-variant">Ничего не найдено</h3>
        <p className="text-md-on-surface-variant/60 mt-2 font-medium">
          Попробуйте другую дату или проверьте запрос
        </p>
      </>
    );

    if (motion) {
      return (
        <motion.div
          key="empty"
          initial={isLightMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={isLightMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
          transition={{ duration: isLightMotion ? 0.14 : 0.2, ease: [0.22, 1, 0.36, 1] }}
          className={wrapperClassName}
        >
          {content}
        </motion.div>
      );
    }

    return <div className={wrapperClassName}>{content}</div>;
  }

  function renderStaticGroups(): ReactElement {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {filteredGroups.map((group) => (
          <ScheduleCard
            key={group.group}
            group={group.group}
            hasChanges={group.has_changes}
            schedule={group.schedule}
          />
        ))}
      </div>
    );
  }

  function renderAnimatedGroups(): ReactElement {
    if (!motion || !AnimatePresence) {
      return renderStaticGroups();
    }

    const Motion = motion;
    const Presence = AnimatePresence;
    const containerTransition = {
      duration: isLightMotion ? 0.14 : 0.2,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    };

    function renderGroupCard(group: GroupSchedule): ReactElement {
      if (isSearching) {
        return (
          <Motion.div
            key={group.group}
            layout={shouldUseLayoutTransitions}
            initial={false}
            transition={{
              layout: {
                duration: isLightMotion ? 0.12 : 0.18,
                ease: [0.22, 1, 0.36, 1],
              },
            }}
          >
            <ScheduleCard
              group={group.group}
              hasChanges={group.has_changes}
              schedule={group.schedule}
            />
          </Motion.div>
        );
      }

      return (
        <Motion.div
          key={group.group}
          layout={shouldUseLayoutTransitions}
          initial={isLightMotion ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={isLightMotion ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.99 }}
          transition={{ duration: isLightMotion ? 0.12 : 0.18, ease: [0.22, 1, 0.36, 1] }}
        >
          <ScheduleCard
            group={group.group}
            hasChanges={group.has_changes}
            schedule={group.schedule}
          />
        </Motion.div>
      );
    }

    return (
      <Motion.div
        key="results"
        initial={isLightMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={isLightMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
        transition={containerTransition}
        className="grid grid-cols-1 lg:grid-cols-2 gap-8"
      >
        <Presence initial={false} mode={shouldUseLayoutTransitions ? 'popLayout' : 'sync'}>
          {filteredGroups.map((group) => renderGroupCard(group))}
        </Presence>
      </Motion.div>
    );
  }

  function renderResultsGrid(): ReactElement {
    if (filteredGroups.length === 0) {
      return renderEmptyState();
    }

    if (motion && AnimatePresence) {
      return renderAnimatedGroups();
    }

    return renderStaticGroups();
  }

  function renderScheduleBody(): ReactElement {
    const hasScheduleSnapshot = dayData !== null;

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
      <div className="relative min-h-[400px] md:min-h-[520px] overflow-visible">
        <div
          className={clsx(
            'absolute inset-x-0 top-0 z-30 flex min-h-[400px] md:min-h-[520px] flex-col items-center justify-center py-40 gap-6',
            scheduleSwapAnimationEnabled && 'transition-all duration-300',
            loading
              ? 'opacity-100 translate-y-0 pointer-events-auto delay-150'
              : clsx(
                  'opacity-0 pointer-events-none',
                  scheduleSwapAnimationEnabled && 'translate-y-4'
                )
          )}
        >
          <SyncLoadingIndicator />
        </div>

        <div
          className={clsx(
            'w-full relative',
            scheduleSwapAnimationEnabled && 'transition-all duration-300',
            loading
              ? clsx(
                  'opacity-0 pointer-events-none',
                  scheduleSwapAnimationEnabled && '-translate-y-4'
                )
              : clsx('opacity-100', scheduleSwapAnimationEnabled && 'translate-y-0 delay-150')
          )}
        >
          {hasScheduleSnapshot ? renderResultsGrid() : null}
        </div>
      </div>
    );
  }

  function renderCalendarPlaceholder(): ReactElement {
    const placeholderWeekDays = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
    const placeholderDays = Array.from({ length: 42 });

    return (
      <div className="bg-md-surface border border-white/5 rounded-[32px] p-4 sm:p-6 w-full max-w-[500px] shadow-2xl backdrop-blur-md overflow-hidden flex flex-col min-h-[420px] md:min-h-[520px]">
        <div className="flex items-center justify-between mb-6">
          <div className="w-10 h-10 rounded-xl border border-white/10 bg-white/[0.02]" />
          <div className="h-6 w-[160px] rounded-lg bg-white/[0.04]" />
          <div className="w-10 h-10 rounded-xl border border-white/10 bg-white/[0.02]" />
        </div>

        <div className="grid grid-cols-7 mb-2">
          {placeholderWeekDays.map((day) => (
            <div
              key={day}
              className="text-center text-[10px] font-black text-md-on-surface-variant py-2"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="relative w-full mb-4 md:mb-6 flex-1 min-h-[280px] md:min-h-[380px]">
          <div className="absolute inset-0 grid grid-cols-7 gap-1 content-start">
            {placeholderDays.map((_, index) => (
              <div
                key={index}
                className="aspect-square rounded-xl border border-white/5 bg-white/[0.02]"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  function renderSchedulePlaceholder(): ReactElement {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-[32px] border border-white/5 bg-md-surface px-6 py-8 shadow-[0_22px_40px_rgba(0,0,0,0.35)]"
      >
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-md-primary animate-spin" />
          <span className="sr-only">Загрузка расписания...</span>
          <div className="h-5 w-48 rounded-lg bg-white/[0.04] animate-pulse" />
        </div>
        <div className="mt-6 grid gap-3">
          <div className="h-4 w-full max-w-[720px] rounded bg-white/[0.03] animate-pulse" />
          <div className="h-4 w-full max-w-[640px] rounded bg-white/[0.03] animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <>
      {isHydrated ? <CursorGlow /> : null}
      {isHydrated ? <ScrollProgress /> : null}

      <main className="container mx-auto px-6 max-w-[1240px] relative z-10">
        <section className="min-h-screen flex flex-col md:flex-row items-center justify-between gap-16 pt-[140px] md:pt-[120px] pb-20">
          <div className="flex-1 min-w-[300px] max-w-[650px] flex flex-col md:items-start items-center text-center md:text-left">
            <div className="flex flex-wrap justify-center md:justify-start gap-3 mb-8">
              <div className="inline-flex items-center gap-2 px-5 py-2 bg-md-primary/5 border border-md-primary/15 rounded-full font-bold text-[0.85rem] text-md-primary backdrop-blur-md transition-all duration-500 hover:bg-md-primary/10">
                <Sparkles className="w-3.5 h-3.5 fill-md-primary/20" /> Поиск по группам
              </div>
              <div className="inline-flex items-center gap-2 px-5 py-2 bg-md-primary/5 border border-md-primary/15 rounded-full font-bold text-[0.85rem] text-md-primary backdrop-blur-md transition-all duration-500 hover:bg-md-primary/10">
                <Zap className="w-3.5 h-3.5 fill-md-primary/20" /> Поиск по преподавателям
              </div>
            </div>

            <h1 className="text-[clamp(3.5rem,8vw,6.5rem)] leading-[1.0] font-extrabold tracking-[-0.05em] mb-6 text-md-on-surface">
              <span className="sr-only">Расписание занятий ОПЭК</span>
              <span aria-hidden="true">ОПЭК</span>
            </h1>

            <p className="text-[clamp(1.1rem,2vw,1.3rem)] text-md-on-surface-variant mb-12 leading-[1.6] max-w-[500px]">
              Удобное расписание занятий с актуальными изменениями секунда в секунду для студентов и
              преподавателей.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-6">
              <a
                href="#schedule"
                className="group relative inline-flex items-center justify-center gap-3 h-[64px] px-10 rounded-[32px] font-black text-[1.1rem] bg-md-primary text-md-bg shadow-[0_8px_24px_rgba(208,188,255,0.15)] transition-all duration-[600ms] ease-spring hover:-translate-y-[4px] hover:rounded-[16px_48px_16px_48px] hover:shadow-[0_16px_40px_rgba(208,188,255,0.4)] active:scale-[0.98]"
              >
                <span className="relative z-10 transition-transform duration-300 group-hover:-translate-x-1">
                  Смотреть расписание
                </span>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="relative z-10 transition-all duration-300 group-hover:translate-x-1"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </a>
            </div>
          </div>

          <div className="flex-1 flex justify-center items-center min-w-[300px] min-h-[420px] md:min-h-[520px]">
            {isHydrated ? (
              <Calendar
                selectedDate={selectedDate}
                onChange={setSelectedDate}
                onSelectionStart={handleDateSelectionStart}
                changeDates={changeDates}
              />
            ) : (
              renderCalendarPlaceholder()
            )}
          </div>
        </section>

        <section id="schedule" className="py-24 scroll-mt-[100px] min-h-screen">
          <div className="flex flex-col md:flex-row md:flex-wrap lg:flex-nowrap md:items-end justify-between gap-8 mb-20">
            <div className="flex flex-col gap-4 min-w-0">
              <div className="flex items-center gap-3">
                <h2 className="text-[clamp(2.5rem,5vw,4.5rem)] font-black tracking-[-0.04em] text-md-on-surface leading-none">
                  Расписание
                </h2>
                {isOffline ? <DemoModeBadge /> : null}
              </div>
              {isHydrated ? renderDateLabel() : null}
            </div>

            {isHydrated ? (
              <div className="relative w-full max-w-[400px]">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-md-on-surface-variant/40" />
                <input
                  type="text"
                  placeholder="Группа, предмет, преподаватель..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="w-full h-16 bg-md-surface border border-white/5 rounded-2xl pl-14 pr-6 text-md-on-surface font-bold placeholder:text-md-on-surface-variant/30 focus:border-md-primary/40 focus:ring-4 focus:ring-md-primary/5 transition-all outline-none"
                />
              </div>
            ) : (
              <div className="w-full max-w-[400px]">
                <div className="h-16 rounded-2xl border border-white/5 bg-white/[0.02] animate-pulse" />
                <span className="sr-only">Загрузка поиска...</span>
              </div>
            )}
          </div>

          {isHydrated ? renderScheduleBody() : renderSchedulePlaceholder()}
        </section>

        <Footer />
      </main>
    </>
  );
}
