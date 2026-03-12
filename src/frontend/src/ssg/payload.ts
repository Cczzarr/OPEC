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

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { buildTeacherPath, normalizeTeacherName } from '../utils/teachers.ts';

export type PairsAvailability = 'unknown' | 'ready' | 'unavailable';

export type SsgRoute = {
  routePath: string;
  outputFile: string;
};

type StaticLessonEntry = {
  full?: { teacher?: string };
  sub1?: { teacher?: string };
  sub2?: { teacher?: string };
};

type StaticSchedulePayload = {
  groups?: Record<string, Record<string, Record<string, StaticLessonEntry>>>;
};

function toOutputFile(routePath: string): string {
  if (routePath === '/') {
    return 'index.html';
  }

  return `${routePath.replace(/^\/+/, '').replace(/\/+$/, '')}/index.html`;
}

function collectTeacherNamesFromStaticSchedule(): string[] {
  const staticSchedulePath = path.resolve(process.cwd(), '../backend/data/static_schedule.json');
  if (!existsSync(staticSchedulePath)) {
    return [];
  }

  try {
    const rawFile = readFileSync(staticSchedulePath, 'utf8');
    const payload = JSON.parse(rawFile) as StaticSchedulePayload;
    const teacherNames = new Set<string>();

    for (const days of Object.values(payload.groups ?? {})) {
      for (const lessons of Object.values(days ?? {})) {
        for (const lesson of Object.values(lessons ?? {})) {
          for (const info of [lesson.full, lesson.sub1, lesson.sub2]) {
            const teacherName = normalizeTeacherName(info?.teacher ?? '');
            if (teacherName) {
              teacherNames.add(teacherName);
            }
          }
        }
      }
    }

    return Array.from(teacherNames).sort((a, b) => a.localeCompare(b, 'ru'));
  } catch {
    return [];
  }
}

const STATIC_ROUTES: SsgRoute[] = [
  { routePath: '/', outputFile: 'index.html' },
  { routePath: '/teachers', outputFile: 'teachers/index.html' },
  { routePath: '/about', outputFile: 'about/index.html' },
];

export const SSG_TEACHERS: string[] = collectTeacherNamesFromStaticSchedule();

const STATIC_TEACHER_ROUTES = SSG_TEACHERS.map((teacherName) => {
  const routePath = buildTeacherPath(teacherName);
  return {
    routePath,
    outputFile: toOutputFile(routePath),
  };
});

export const SSG_ROUTES: SsgRoute[] = [...STATIC_ROUTES, ...STATIC_TEACHER_ROUTES];
