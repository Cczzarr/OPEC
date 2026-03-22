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

import type { TeacherScheduleLesson } from '../../types/api.ts';
import { Ripple } from '../ui/Ripple.tsx';

type TeacherScheduleCardProps = {
  teacherName: string;
  hasChanges: boolean;
  lessons: TeacherScheduleLesson[];
  emptyTitle?: string;
  emptyMessage?: string;
};

function formatLessonMeta(group: string, subgroup?: number | null, room?: string): string {
  const parts = [group];

  if (typeof subgroup === 'number' && subgroup >= 1) {
    parts.push(`ПГ${subgroup}`);
  }

  if (room) {
    parts.push(room);
  }

  return parts.join(' · ');
}

export function TeacherScheduleCard({
  teacherName,
  hasChanges,
  lessons,
  emptyTitle = 'На эту дату занятий нет',
  emptyMessage = 'Когда у преподавателя появятся пары, они отобразятся в этой карточке.',
}: TeacherScheduleCardProps): ReactElement {
  return (
    <div
      className={clsx(
        'relative transform-gpu translate-y-0 bg-md-surface border border-white/5 rounded-[32px] p-8 flex flex-col h-full cursor-default isolate shadow-[0_22px_40px_rgba(0,0,0,0.35)] [will-change:transform]',
        hasChanges && 'border-red-500/20'
      )}
    >
      <div className="absolute inset-0 rounded-[inherit] overflow-hidden pointer-events-none">
        <Ripple />
      </div>

      <div className="relative z-10 pointer-events-none flex flex-col grow">
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/5 gap-4">
          <h2 className="font-main font-black text-[1.6rem] text-md-on-surface tracking-tight break-words">
            {teacherName}
          </h2>
          {hasChanges && (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-red-500/10 text-red-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-500/20 shrink-0">
              <Zap className="w-3 h-3 fill-current" /> Замены
            </span>
          )}
        </div>

        {lessons.length > 0 ? (
          <div className="flex flex-col gap-4">
            {lessons.map((lesson, index) => (
              <div
                key={`${lesson.group}-${lesson.number}-${lesson.subgroup ?? 0}-${index}`}
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

                <div className="flex flex-col gap-1 min-w-0">
                  {lesson.is_change && (
                    <span className="text-[10px] font-black text-red-400 uppercase tracking-wider mb-1">
                      ⚡ Замена
                    </span>
                  )}
                  <p className="text-sm font-semibold leading-relaxed text-md-on-surface break-words">
                    {lesson.subject || '—'}
                  </p>
                  <p className="text-xs text-md-on-surface-variant break-words">
                    {formatLessonMeta(lesson.group, lesson.subgroup, lesson.room)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex grow items-center justify-center rounded-[28px] bg-white/[0.02] px-6 py-16 text-center">
            <div className="max-w-[420px]">
              <p className="text-xl font-black text-md-on-surface">{emptyTitle}</p>
              <p className="mt-3 text-md-on-surface-variant/75 leading-relaxed">{emptyMessage}</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
