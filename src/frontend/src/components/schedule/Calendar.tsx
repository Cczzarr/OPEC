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
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { ru } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, ReactElement } from 'react';

type MotionModule = typeof import('framer-motion');

type CalendarDayProps = {
  day: Date;
  isSelected: boolean;
  isCurrentMonth: boolean;
  isToday: boolean;
  hasChanges: boolean;
  isSunday: boolean;
  isTouchDevice: boolean;
  motionModule: MotionModule | null;
  onClick: (day: Date) => void;
};

type CalendarProps = {
  selectedDate: Date;
  onChange: (date: Date) => void;
  onSelectionStart?: (date: Date) => void;
  changeDates: Set<string>;
};

const COMMIT_DELAY_MS = 420;
const CALENDAR_GRID_GAP_PX = 4;
const WEEK_DAYS = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];

type MotionVariants = {
  enter: (direction: number) => { x: number; opacity: number; filter: string };
  center: { x: number; opacity: number; filter: string };
  exit: (direction: number) => { x: number; opacity: number; filter: string };
};

function renderSelectedBlob(
  isSelected: boolean,
  motionModule: MotionModule | null,
  isTouchDevice: boolean
): ReactElement | null {
  if (!isSelected) {
    return null;
  }

  const motion = motionModule?.motion;
  const blobClasses = 'absolute inset-0 z-0 flex items-center justify-center';
  const blobScaleClasses = clsx(
    'w-full h-full',
    isTouchDevice ? 'scale-[1.04]' : 'scale-110'
  );
  const innerBlobClasses = clsx(
    'w-full h-full mini-blob',
    !isTouchDevice && 'animate-blob-morph [animation-duration:5s]'
  );

  if (!motion) {
    return (
      <div className={blobClasses}>
        <div className={blobScaleClasses}>
          <div className={innerBlobClasses} />
        </div>
      </div>
    );
  }

  return (
    <div className={blobClasses}>
      <div className={blobScaleClasses}>
        <motion.div
          initial={false}
          layoutId="selected-blob"
          transition={
            isTouchDevice
              ? { duration: 0.28, ease: [0.22, 1, 0.36, 1] }
              : { type: 'spring', stiffness: 260, damping: 26, mass: 0.9 }
          }
          className="w-full h-full"
        >
          <div className={innerBlobClasses} />
        </motion.div>
      </div>
    </div>
  );
}

function CalendarDayBase({
  day,
  isSelected,
  isCurrentMonth,
  isToday,
  hasChanges,
  isSunday,
  isTouchDevice,
  motionModule,
  onClick,
}: CalendarDayProps): ReactElement {
  const isDisabled = !isCurrentMonth || isSunday;

  function handleClick(): void {
    if (isDisabled) {
      return;
    }

    onClick(day);
  }

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      className={clsx(
        'group relative aspect-square flex items-center justify-center text-sm font-bold',
        !isCurrentMonth &&
          'opacity-10 pointer-events-none cursor-default !font-normal',
        isSunday && isCurrentMonth &&
          'opacity-30 pointer-events-none cursor-default',
        isSelected
          ? 'text-md-bg'
          : 'text-md-on-surface hover:bg-white/5 rounded-xl transition-colors duration-200',
        hasChanges && !isSelected && 'text-red-400'
      )}
    >
      {!isSelected && !isTouchDevice && (
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="mini-blob animate-blob-morph [animation-duration:3s]" />
        </div>
      )}

      {renderSelectedBlob(isSelected, motionModule, isTouchDevice)}

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
            : 'text-md-on-surface group-hover:text-md-bg',
          isToday && !isSelected && 'text-md-primary font-black'
        )}
      >
        {format(day, 'd')}
      </span>
    </button>
  );
}

function areCalendarDayPropsEqual(prev: CalendarDayProps, next: CalendarDayProps): boolean {
  return (
    prev.isSelected === next.isSelected &&
    prev.isCurrentMonth === next.isCurrentMonth &&
    prev.isToday === next.isToday &&
    prev.hasChanges === next.hasChanges &&
    prev.isSunday === next.isSunday &&
    prev.isTouchDevice === next.isTouchDevice &&
    Boolean(prev.motionModule) === Boolean(next.motionModule) &&
    prev.day.getTime() === next.day.getTime()
  );
}

const CalendarDay = memo(CalendarDayBase, areCalendarDayPropsEqual);

function subscribeToMediaQuery(query: string, onChange: (matches: boolean) => void): () => void {
  const mediaQueryList = window.matchMedia(query);

  function handleChange(event: MediaQueryListEvent): void {
    onChange(event.matches);
  }

  mediaQueryList.addEventListener('change', handleChange);

  return () => {
    mediaQueryList.removeEventListener('change', handleChange);
  };
}

function getEnterVariant(direction: number): { x: number; opacity: number; filter: string } {
  return {
    x: direction > 0 ? 20 : -20,
    opacity: 0,
    filter: 'blur(4px)',
  };
}

function getExitVariant(direction: number): { x: number; opacity: number; filter: string } {
  return {
    x: direction < 0 ? 20 : -20,
    opacity: 0,
    filter: 'blur(4px)',
  };
}

export function Calendar({
  selectedDate,
  onChange,
  onSelectionStart,
  changeDates,
}: CalendarProps): ReactElement {
  const [viewDate, setViewDate] = useState(selectedDate);
  const [visualSelectedDate, setVisualSelectedDate] = useState(selectedDate);
  const [direction, setDirection] = useState(0);
  const [isTouchDevice, setIsTouchDevice] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(pointer: coarse)').matches : false
  );
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false
  );
  const [motionModule, setMotionModule] = useState<MotionModule | null>(null);
  const today = useMemo(() => {
    const initialToday = new Date();
    initialToday.setHours(0, 0, 0, 0);
    return initialToday;
  }, []);
  const commitTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setVisualSelectedDate(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    return () => {
      if (commitTimeoutRef.current !== null) {
        window.clearTimeout(commitTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    return subscribeToMediaQuery('(pointer: coarse)', setIsTouchDevice);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    return subscribeToMediaQuery('(prefers-reduced-motion: reduce)', setPrefersReducedMotion);
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

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(viewDate), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(viewDate), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [viewDate]);
  const numWeeks = days.length / 7;

  const useCalendarPopLayout = !isTouchDevice && !prefersReducedMotion;
  const motion = motionModule?.motion;
  const AnimatePresence = motionModule?.AnimatePresence;

  function changeMonth(dir: number): void {
    setDirection(dir);
    setViewDate(dir > 0 ? addMonths(viewDate, 1) : subMonths(viewDate, 1));
  }

  function handleDateClick(day: Date): void {
    onSelectionStart?.(day);
    setVisualSelectedDate(day);

    if (commitTimeoutRef.current !== null) {
      window.clearTimeout(commitTimeoutRef.current);
    }

    commitTimeoutRef.current = window.setTimeout(() => {
      onChange(day);
      commitTimeoutRef.current = null;
    }, COMMIT_DELAY_MS);
  }

  const variants: MotionVariants = {
    enter: getEnterVariant,
    center: {
      x: 0,
      opacity: 1,
      filter: 'blur(0px)',
    },
    exit: getExitVariant,
  };

  const dayNodes = days.map((day) => {
    const dayKey = format(day, 'yyyy-MM-dd');
    return (
      <CalendarDay
        key={dayKey}
        day={day}
        isSelected={isSameDay(day, visualSelectedDate)}
        isCurrentMonth={isSameMonth(day, viewDate)}
        isToday={isSameDay(day, today)}
        hasChanges={changeDates.has(dayKey)}
        isSunday={day.getDay() === 0}
        isTouchDevice={isTouchDevice}
        motionModule={motionModule}
        onClick={handleDateClick}
      />
    );
  });

  const calendarHeightStyle = {
    '--calendar-weeks': `${numWeeks}`,
    height: `calc(((100cqi - ${CALENDAR_GRID_GAP_PX * 6}px) / 7) * var(--calendar-weeks) + ${CALENDAR_GRID_GAP_PX}px * (var(--calendar-weeks) - 1))`,
  } as CSSProperties;

  return (
    <div className="bg-md-surface border border-white/5 rounded-[32px] p-4 sm:p-6 w-full max-w-[500px] shadow-2xl backdrop-blur-md overflow-hidden flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => changeMonth(-1)}
          className="w-10 h-10 flex items-center justify-center rounded-xl border border-white/10 hover:bg-white/5 transition-colors text-md-on-surface shrink-0"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="relative w-full h-6 flex justify-center items-center overflow-hidden">
          {motion && AnimatePresence ? (
            <AnimatePresence
              mode={useCalendarPopLayout ? 'popLayout' : 'sync'}
              custom={direction}
              initial={false}
            >
              <motion.h3
                key={viewDate.toString()}
                custom={direction}
                variants={variants}
                initial={direction === 0 ? false : 'enter'}
                animate="center"
                exit="exit"
                transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
                className="absolute font-main font-extrabold text-[1.1rem] text-md-on-surface uppercase tracking-wider whitespace-nowrap"
              >
                {format(viewDate, 'LLLL yyyy', { locale: ru })}
              </motion.h3>
            </AnimatePresence>
          ) : (
            <h3 className="absolute font-main font-extrabold text-[1.1rem] text-md-on-surface uppercase tracking-wider whitespace-nowrap">
              {format(viewDate, 'LLLL yyyy', { locale: ru })}
            </h3>
          )}
        </div>

        <button
          onClick={() => changeMonth(1)}
          className="w-10 h-10 flex items-center justify-center rounded-xl border border-white/10 hover:bg-white/5 transition-colors text-md-on-surface shrink-0"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-2">
        {WEEK_DAYS.map((day) => (
          <div
            key={day}
            className="text-center text-[10px] font-black text-md-on-surface-variant py-2"
          >
            {day}
          </div>
        ))}
      </div>

      <div
        className="relative w-full overflow-visible mb-4 md:mb-6 [container-type:inline-size]"
        style={{ paddingBottom: 'clamp(6px, 2vw, 16px)' }}
      >
        {motion && AnimatePresence ? (
          <motion.div
            initial={false}
            animate={{ ['--calendar-weeks' as const]: numWeeks } as { '--calendar-weeks': number }}
            transition={{ duration: 0.42, ease: [0.2, 0, 0, 1] }}
            className="relative w-full overflow-visible"
            style={calendarHeightStyle}
          >
            <AnimatePresence
              mode={useCalendarPopLayout ? 'popLayout' : 'sync'}
              custom={direction}
              initial={false}
            >
              <motion.div
                key={viewDate.toString()}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
                className="absolute inset-0 grid grid-cols-7 gap-1 content-start"
              >
                {dayNodes}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="relative w-full overflow-visible" style={calendarHeightStyle}>
            <div className="absolute inset-0 grid grid-cols-7 gap-1 content-start">{dayNodes}</div>
          </div>
        )}
      </div>
    </div>
  );
}
