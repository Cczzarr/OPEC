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
import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import type { ComponentType, ReactElement, ReactNode } from 'react';

import { Footer } from './components/layout/Footer.tsx';
import { Header } from './components/layout/Header.tsx';
import { Calendar } from './components/schedule/Calendar.tsx';
import { ScheduleCard } from './components/schedule/ScheduleCard.tsx';
import { usePageMeta } from './hooks/usePageMeta.ts';
import type { DayScheduleResponse, GroupSchedule } from './types/api.ts';

type MotionModule = typeof import('framer-motion');
type LazyComponent = Promise<{ default: ComponentType }>;

type StatusPanelProps = {
  icon: ReactNode;
  iconWrapperClassName: string;
  title: string;
  message: string;
  buttonLabel: string;
};

const MOCK_GROUPS: GroupSchedule[] = [
  {
    group: 'ИСП-221',
    has_changes: true,
    schedule: [
      {
        number: 1,
        type: 'single',
        subject: 'Основы алгоритмизации',
        teacher: 'Иванов И.И.',
        room: '301',
        is_change: false,
      },
      {
        number: 2,
        type: 'subgroups',
        sub1: {
          subject: 'Иностранный язык',
          teacher: 'Петрова А.С.',
          room: '415',
        },
        sub2: null,
        sub1_changed: true,
        sub2_changed: false,
        sub2_cancelled: true,
        is_change: true,
      },
      {
        number: 3,
        type: 'single',
        subject: 'Физическая культура',
        teacher: 'Сидоров П.П.',
        room: 'с/з',
        is_change: false,
      },
      {
        number: 4,
        type: 'single',
        subject: 'Математический анализ',
        teacher: 'Козлов В.В.',
        room: '210',
        is_change: false,
      },
    ],
  },
  {
    group: 'БД-221',
    has_changes: false,
    schedule: [
      {
        number: 1,
        type: 'single',
        subject: 'Архитектура БД',
        teacher: 'Семёнов К.Л.',
        room: '542',
        is_change: false,
      },
      {
        number: 2,
        type: 'single',
        subject: 'История России',
        teacher: 'Морозова Т.А.',
        room: '203',
        is_change: false,
      },
      {
        number: 3,
        type: 'subgroups',
        sub1: {
          subject: 'Лаб. работа',
          teacher: 'Панкрац Д.А.',
          room: '544',
        },
        sub2: null,
        is_change: false,
      },
    ],
  },
  {
    group: 'ИСП-332',
    has_changes: true,
    schedule: [
      { number: 1, type: 'cancelled', is_change: true },
      {
        number: 2,
        type: 'single',
        subject: 'Проектирование интерфейсов',
        teacher: 'Тоцкая И.В.',
        room: '226',
        is_change: true,
      },
    ],
  },
];

const DATE_FORMAT = 'yyyy-MM-dd';

function getApiUrl(): string {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && !envUrl.includes('localhost')) {
    return envUrl;
  }
  return `http://${window.location.hostname}:8000/api/v1`;
}

function capitalizeFirst(text: string): string {
  if (!text) {
    return text;
  }
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function StatusPanel({
  icon,
  iconWrapperClassName,
  title,
  message,
  buttonLabel,
}: StatusPanelProps): ReactElement {
  return (
    <div className="flex flex-col items-center justify-center py-40 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div
        className={clsx(
          'w-24 h-24 mb-8 rounded-full flex items-center justify-center shadow-lg',
          iconWrapperClassName
        )}
      >
        {icon}
      </div>
      <h3 className="text-3xl font-black text-md-on-surface tracking-tight">{title}</h3>
      <p className="text-md-on-surface-variant/70 mt-4 font-bold text-lg max-w-[400px] leading-relaxed">
        {message}
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-10 px-8 py-4 bg-md-surface border border-white/10 rounded-2xl font-black text-md-on-surface hover:bg-md-primary hover:text-md-bg transition-all active:scale-95"
      >
        {buttonLabel}
      </button>
    </div>
  );
}

const API_BASE_URL = getApiUrl();

function loadBackgroundBlobs(): LazyComponent {
  return import('./components/layout/BackgroundBlobs.tsx').then((m) => ({
    default: m.BackgroundBlobs,
  }));
}

function loadCursorGlow(): LazyComponent {
  return import('./components/layout/CursorGlow.tsx').then((m) => ({
    default: m.CursorGlow,
  }));
}

function loadScrollProgress(): LazyComponent {
  return import('./components/layout/ScrollProgress.tsx').then((m) => ({
    default: m.ScrollProgress,
  }));
}

const BackgroundBlobs = lazy(loadBackgroundBlobs);
const CursorGlow = lazy(loadCursorGlow);
const ScrollProgress = lazy(loadScrollProgress);

export default function App(): ReactElement {
  usePageMeta({
    title: 'ОПЭК — Расписание занятий',
    description:
      'Актуальное расписание занятий Омского промышленно-экономического колледжа ОПЭК: быстрый поиск по группам, преподавателям и предметам.',
    path: '/',
  });

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [previewDate, setPreviewDate] = useState<Date | null>(null);
  const [changeDates] = useState<Set<string>>(new Set());
  const [dayData, setDayData] = useState<DayScheduleResponse | null>(null);
  const [loading, setLoading] = useState(false);
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
        setDayData(data);
        setLoading(false);
      })
      .catch((err) => {
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
          setDayData({
            date: dateStr,
            day_of_week: 1,
            has_data: true,
            groups: MOCK_GROUPS,
          });
          setLoading(false);
          setIsOffline(true);
        }, 800);
      });
  }, [selectedDate]);

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
  const shouldUseLayoutTransitions = !isLightMotion && filteredGroups.length <= 16;
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

  function renderEmptyState(animated: boolean): ReactElement {
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

    if (animated && motion) {
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
          <div key={group.group}>
            <ScheduleCard
              group={group.group}
              hasChanges={group.has_changes}
              schedule={group.schedule}
            />
          </div>
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
      return renderEmptyState(Boolean(motion));
    }

    if (motion && AnimatePresence) {
      return renderAnimatedGroups();
    }

    return renderStaticGroups();
  }

  function renderScheduleBody(): ReactElement {
    if (isRateLimited) {
      return (
        <StatusPanel
          icon={<Zap className="w-10 h-10 animate-pulse" />}
          iconWrapperClassName="bg-md-error/10 border border-md-error/20 text-md-error shadow-md-error/5"
          title="Слишком много запросов"
          message="Похоже, вы обновляете страницу слишком часто. Пожалуйста, подождите минуту перед следующей попыткой."
          buttonLabel="Попробовать снова"
        />
      );
    }

    if (isTimeout) {
      return (
        <StatusPanel
          icon={<Loader2 className="w-10 h-10 animate-spin-slow" />}
          iconWrapperClassName="bg-md-tertiary/10 border border-md-tertiary/20 text-md-tertiary shadow-md-tertiary/5"
          title="Ожидание истекло"
          message="Время ожидания синхронизации истекло. Проверьте соединение и попробуйте еще раз."
          buttonLabel="Повторить попытку"
        />
      );
    }

    if (isGeneralError) {
      return (
        <StatusPanel
          icon={<Zap className="w-10 h-10 rotate-180" />}
          iconWrapperClassName="bg-md-error/10 border border-md-error/20 text-md-error shadow-md-error/5"
          title="Ошибка синхронизации"
          message="Произошла ошибка при попытке синхронизации данных. Пожалуйста, обновите страницу."
          buttonLabel="Обновить страницу"
        />
      );
    }

    return (
      <div
        className={clsx('relative min-h-[400px]', loading ? 'overflow-hidden' : 'overflow-visible')}
      >
        <div
          className={clsx(
            'absolute inset-0 z-20 flex flex-col items-center justify-center py-40 gap-6 transition-all duration-300',
            loading
              ? 'opacity-100 translate-y-0 pointer-events-auto delay-150'
              : 'opacity-0 translate-y-4 pointer-events-none'
          )}
        >
          <Loader2 className="w-12 h-12 text-md-primary animate-spin" />
          <span className="text-md-on-surface-variant font-bold animate-pulse text-lg">
            Синхронизация данных...
          </span>
        </div>

        <div
          className={clsx(
            'transition-all duration-300 w-full',
            loading
              ? 'opacity-0 -translate-y-4 pointer-events-none'
              : 'opacity-100 translate-y-0 relative delay-150'
          )}
          style={{ position: loading ? 'absolute' : 'relative' }}
        >
          {renderResultsGrid()}
        </div>
      </div>
    );
  }

  return (
    <>
      <Suspense fallback={null}>
        <CursorGlow />
      </Suspense>
      <Suspense fallback={null}>
        <BackgroundBlobs />
      </Suspense>
      <Suspense fallback={null}>
        <ScrollProgress />
      </Suspense>
      <Header />

      <main className="container mx-auto px-6 max-w-[1240px] relative z-10">
        <section className="min-h-screen flex flex-col md:flex-row items-center justify-between gap-16 pt-[140px] md:pt-[120px] pb-20">
          <div className="flex-1 min-w-[300px] max-w-[650px] flex flex-col md:items-start items-center text-center md:text-left">
            <div className="flex flex-wrap justify-center md:justify-start gap-3 mb-8">
              <div className="inline-flex items-center gap-2 px-5 py-2 bg-md-primary/5 border border-md-primary/15 rounded-full font-bold text-[0.85rem] text-md-primary backdrop-blur-md transition-all duration-500 hover:bg-md-primary/10">
                <Sparkles className="w-3.5 h-3.5 fill-md-primary/20" /> Always Up-to-Date
              </div>
              <div className="inline-flex items-center gap-2 px-5 py-2 bg-md-primary/5 border border-md-primary/15 rounded-full font-bold text-[0.85rem] text-md-primary backdrop-blur-md transition-all duration-500 hover:bg-md-primary/10">
                <Zap className="w-3.5 h-3.5 fill-md-primary/20" /> 24/7 Stability
              </div>
            </div>

            <h1 className="text-[clamp(3.5rem,8vw,6.5rem)] leading-[1.0] font-extrabold tracking-[-0.05em] mb-6 text-md-on-surface">
              ОПЭК
            </h1>

            <p className="text-[clamp(1.1rem,2vw,1.3rem)] text-md-on-surface-variant mb-12 leading-[1.6] max-w-[500px]">
              Расписание занятий с актуальными изменениями секунда в секунду для студентов и преподавателей.
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

          <div className="flex-1 flex justify-center items-center min-w-[300px]">
            <Calendar
              selectedDate={selectedDate}
              onChange={setSelectedDate}
              onSelectionStart={handleDateSelectionStart}
              changeDates={changeDates}
            />
          </div>
        </section>

        <section id="schedule" className="py-24 scroll-mt-[100px] min-h-screen">
          <div className="flex flex-col md:flex-row md:flex-wrap lg:flex-nowrap md:items-end justify-between gap-8 mb-20">
            <div className="flex flex-col gap-4 min-w-0">
              <div className="flex items-center gap-3">
                <h2 className="text-[clamp(2.5rem,5vw,4.5rem)] font-black tracking-[-0.04em] text-md-on-surface leading-none">
                  Расписание
                </h2>
                {isOffline && (
                  <div className="group relative">
                    <div className="px-3 py-1 bg-md-tertiary/10 border border-md-tertiary/20 rounded-full text-md-tertiary text-[10px] font-black uppercase tracking-widest animate-pulse cursor-help">
                      Demo Mode
                    </div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 p-3 bg-md-surface/95 backdrop-blur-xl border border-white/10 rounded-2xl opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 z-50 shadow-2xl shadow-black/50">
                      <p className="text-sm text-md-on-surface-variant leading-relaxed text-center font-medium">
                        Сервис временно недоступен. Показаны примеры данных для демонстрации интерфейса.
                      </p>
                    </div>
                  </div>
                )}
              </div>
              {renderDateLabel()}
            </div>

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
          </div>

          {renderScheduleBody()}
        </section>

        <Footer />
      </main>
    </>
  );
}
