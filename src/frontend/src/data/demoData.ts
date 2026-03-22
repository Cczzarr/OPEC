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

import type { DayScheduleResponse, TeacherDayScheduleResponse, TeacherScheduleLesson } from '../types/api.ts';
import { normalizeTeacherName } from '../utils/teachers.ts';

export type DemoTeacher = {
  name: string;
  pairsToday: number;
};

export const DEMO_TEACHERS: DemoTeacher[] = [
  { name: 'Иванов И.И.', pairsToday: 3 },
  { name: 'Петров П.П.', pairsToday: 2 },
  { name: 'Сидорова А.А.', pairsToday: 4 },
  { name: 'Кузнецов Д.В.', pairsToday: 1 },
];

function getDayOfWeek(date: Date): number {
  const jsDay = date.getDay();
  return jsDay === 0 ? 7 : jsDay;
}

export function createDemoDaySchedule(dateStr: string): DayScheduleResponse {
  const date = new Date(`${dateStr}T00:00:00`);
  const dayOfWeek = Number.isNaN(date.getTime()) ? 1 : getDayOfWeek(date);

  return {
    date: dateStr,
    day_of_week: dayOfWeek,
    has_data: true,
    groups: [
      {
        group: 'ДЕМО-ГРУППА',
        has_changes: false,
        schedule: [
          {
            number: 1,
            type: 'single',
            subject: 'Математика',
            teacher: 'Иванов И.И.',
            room: '101',
            is_change: false,
          },
          {
            number: 2,
            type: 'single',
            subject: 'Информатика',
            teacher: 'Петров П.П.',
            room: '202',
            is_change: false,
          },
          {
            number: 3,
            type: 'cancelled',
            is_change: true,
          },
          {
            number: 4,
            type: 'subgroups',
            sub1: { subject: 'Английский', teacher: 'Сидорова А.А.', room: '305' },
            sub2: { subject: 'Английский', teacher: 'Кузнецов Д.В.', room: '306' },
            is_change: false,
          },
        ],
      },
    ],
  };
}

export function createDemoTeacherSchedule(
  teacherName: string,
  dateStr: string
): TeacherDayScheduleResponse {
  const daySchedule = createDemoDaySchedule(dateStr);
  const normalizedTeacherName = normalizeTeacherName(teacherName);
  const lessons: TeacherScheduleLesson[] = [];

  function matchesTeacher(candidate?: string): boolean {
    return normalizeTeacherName(candidate ?? '') === normalizedTeacherName;
  }

  for (const groupSchedule of daySchedule.groups) {
    for (const lesson of groupSchedule.schedule) {
      if (lesson.type === 'single' && matchesTeacher(lesson.teacher)) {
        lessons.push({
          group: groupSchedule.group,
          number: lesson.number,
          subject: lesson.subject ?? '',
          teacher: lesson.teacher ?? '',
          room: lesson.room ?? '',
          subgroup: null,
          is_change: lesson.is_change,
        });
      }

      if (lesson.type === 'subgroups') {
        if (lesson.sub1 && matchesTeacher(lesson.sub1.teacher)) {
          lessons.push({
            group: groupSchedule.group,
            number: lesson.number,
            subject: lesson.sub1.subject ?? '',
            teacher: lesson.sub1.teacher ?? '',
            room: lesson.sub1.room ?? '',
            subgroup: 1,
            is_change: lesson.sub1_changed ?? lesson.is_change,
          });
        }

        if (lesson.sub2 && matchesTeacher(lesson.sub2.teacher)) {
          lessons.push({
            group: groupSchedule.group,
            number: lesson.number,
            subject: lesson.sub2.subject ?? '',
            teacher: lesson.sub2.teacher ?? '',
            room: lesson.sub2.room ?? '',
            subgroup: 2,
            is_change: lesson.sub2_changed ?? lesson.is_change,
          });
        }
      }
    }
  }

  lessons.sort((a, b) => a.number - b.number || a.group.localeCompare(b.group, 'ru'));

  return {
    teacher_query: teacherName,
    date: daySchedule.date,
    day_of_week: daySchedule.day_of_week,
    has_data: daySchedule.has_data,
    lessons,
  };
}
