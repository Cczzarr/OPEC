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
import { Zap } from 'lucide-react';
import type { ReactElement } from 'react';
import type { Lesson, SubgroupInfo } from '../../types/api.ts';
import { Ripple } from '../ui/Ripple.tsx';

interface ScheduleCardProps {
  group: string;
  hasChanges: boolean;
  schedule: Lesson[];
}

interface LessonInfoProps {
  subject?: string;
  teacher?: string;
  room?: string;
}

interface SubgroupItemProps {
  info?: SubgroupInfo | null;
  changed?: boolean;
  cancelled?: boolean;
  label: string;
}

function formatLessonMeta(teacher?: string, room?: string): string | null {
  const parts: string[] = [];
  if (teacher) {
    parts.push(teacher);
  }
  if (room) {
    parts.push(room);
  }

  return parts.length ? parts.join(' · ') : null;
}

export function ScheduleCard({ group, hasChanges, schedule }: ScheduleCardProps): ReactElement {
  return (
    <div
      className={clsx(
        'group schedule-card relative transform-gpu translate-y-0 bg-md-surface border border-white/5 rounded-[32px] p-8 flex flex-col h-full cursor-default isolate shadow-[0_22px_40px_rgba(0,0,0,0.35)] [will-change:transform]',
        hasChanges ? 'schedule-card--changes' : 'schedule-card--normal',
        'transition-[transform,border-color,border-radius] duration-[600ms] ease-spring hover:-translate-y-2',
        hasChanges
          ? 'border-red-500/20 hover:border-red-500/40 hover:rounded-[16px_48px_16px_48px]'
          : 'hover:border-md-primary/25 hover:rounded-[48px_16px_48px_16px]'
      )}
    >
      <div className="absolute inset-0 rounded-[inherit] overflow-hidden pointer-events-none">
        <Ripple />
      </div>
      <div className="relative z-10 pointer-events-none flex flex-col grow">
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/5">
          <h3 className="font-main font-black text-[1.6rem] text-md-on-surface tracking-tight uppercase tracking-[-0.02em]">
            {group}
          </h3>
          {hasChanges && (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-red-500/10 text-red-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-500/20">
              <Zap className="w-3 h-3 fill-current" /> Замены
            </span>
          )}
        </div>

        <div className="flex flex-col gap-4">
          {schedule.map((lesson) => (
            <div
              key={lesson.number}
              className={clsx(
                'flex gap-4 p-4 rounded-2xl transition-colors duration-300 items-center',
                lesson.is_change
                  ? 'bg-red-500/5 ring-1 ring-inset ring-red-500/10'
                  : 'bg-white/[0.02]'
              )}
            >
              <div
                className={clsx(
                  'w-10 h-10 flex items-center justify-center rounded-xl font-main font-black text-sm shrink-0',
                  lesson.is_change
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-white/10 text-md-on-surface-variant'
                )}
              >
                {lesson.number}
              </div>

              <div className="grow min-w-0">{renderLessonContent(lesson)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function renderLessonContent(lesson: Lesson): ReactElement {
  switch (lesson.type) {
    case 'cancelled':
      return (
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-black text-red-400 uppercase tracking-wider mb-1">⚡ Замена</span>
          <p className="text-sm font-bold text-red-400 line-through opacity-60">ОТМЕНЕНО</p>
        </div>
      );
    case 'subgroups':
      return (
        <div className="flex flex-col gap-3">
          <SubgroupItem
            info={lesson.sub1}
            changed={lesson.sub1_changed}
            cancelled={lesson.sub1_cancelled}
            label="ПГ1"
          />
          <SubgroupItem
            info={lesson.sub2}
            changed={lesson.sub2_changed}
            cancelled={lesson.sub2_cancelled}
            label="ПГ2"
          />
        </div>
      );
    case 'single':
    default:
      return (
        <div className="flex flex-col gap-1">
          {lesson.is_change && (
            <span className="text-[10px] font-black text-red-400 uppercase tracking-wider mb-1">
              ⚡ Замена
            </span>
          )}
          <LessonInfo subject={lesson.subject} teacher={lesson.teacher} room={lesson.room} />
        </div>
      );
  }
}

function LessonInfo({ subject, teacher, room }: LessonInfoProps): ReactElement {
  const meta = formatLessonMeta(teacher, room);

  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <p className="text-sm font-semibold leading-relaxed text-md-on-surface break-words">
        {subject || '—'}
      </p>
      {meta && <p className="text-xs text-md-on-surface-variant break-words">{meta}</p>}
    </div>
  );
}

function SubgroupItem({
  info,
  changed = false,
  cancelled = false,
  label,
}: SubgroupItemProps): ReactElement {
  const isEmpty = !info;
  const hasAlert = changed || cancelled;

  let content: ReactElement;
  if (cancelled) {
    content = <span className="text-xs font-bold text-red-400">ОТМЕНЕНО</span>;
  } else if (isEmpty) {
    content = <span className="text-xs font-medium text-md-on-surface">—</span>;
  } else {
    const meta = formatLessonMeta(info.teacher, info.room);
    content = (
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-xs font-medium leading-relaxed text-md-on-surface break-words">
          {info.subject || '—'}
        </span>
        {meta && <span className="text-[10px] text-md-on-surface-variant break-words">{meta}</span>}
      </div>
    );
  }

  return (
    <div className={clsx('flex items-start gap-3', isEmpty && !cancelled && 'opacity-30')}>
      <span
        className={clsx(
          'px-2 py-0.5 rounded-md text-[9px] font-black uppercase shrink-0 mt-1',
          hasAlert ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-md-on-surface-variant'
        )}
      >
        {hasAlert ? '⚡ ' : ''}
        {label}
      </span>
      {content}
    </div>
  );
}
