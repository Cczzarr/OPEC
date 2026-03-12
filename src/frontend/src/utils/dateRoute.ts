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

const DATE_SEGMENT_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isDateRouteSegment(value: string): boolean {
  const match = DATE_SEGMENT_REGEX.exec(value);
  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const utcDate = new Date(Date.UTC(year, month - 1, day));
  return (
    utcDate.getUTCFullYear() === year &&
    utcDate.getUTCMonth() + 1 === month &&
    utcDate.getUTCDate() === day
  );
}

export function routeDateToLabel(value: string): string {
  const match = DATE_SEGMENT_REGEX.exec(value);
  if (!match) {
    return value;
  }

  return `${match[3]}.${match[2]}.${match[1]}`;
}

export function routeDateToLocalDate(value: string): Date | null {
  if (!isDateRouteSegment(value)) {
    return null;
  }

  return new Date(`${value}T00:00:00`);
}
