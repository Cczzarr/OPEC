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

export interface SubgroupInfo {
  subject: string;
  teacher: string;
  room: string;
}

export interface Lesson {
  number: number;
  type: 'single' | 'subgroups' | 'cancelled';
  subject?: string;
  teacher?: string;
  room?: string;
  sub1?: SubgroupInfo | null;
  sub2?: SubgroupInfo | null;
  sub1_changed?: boolean;
  sub2_changed?: boolean;
  sub1_cancelled?: boolean;
  sub2_cancelled?: boolean;
  is_change: boolean;
}

export interface GroupSchedule {
  group: string;
  has_changes: boolean;
  schedule: Lesson[];
}

export interface DayScheduleResponse {
  date: string;
  day_of_week: number;
  has_data: boolean;
  groups: GroupSchedule[];
}

export interface TeacherScheduleLesson {
  group: string;
  number: number;
  subject: string;
  teacher: string;
  room: string;
  subgroup?: number | null;
  is_change: boolean;
}

export interface TeacherDayScheduleResponse {
  teacher_query: string;
  date: string;
  day_of_week: number;
  has_data: boolean;
  lessons: TeacherScheduleLesson[];
  updated?: {
    pdf: number;
    excel: number;
  };
}

export interface AvailableDatesResponse {
  dates: string[];
}

export interface AvailableGroupsResponse {
  groups: string[];
  total: number;
}

export interface AvailableTeachersResponse {
  teachers: string[];
  total: number;
}
