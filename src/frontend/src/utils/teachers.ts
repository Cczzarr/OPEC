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

export function normalizeTeacherName(rawName: string): string {
  return rawName.replace(/\s+/g, ' ').trim();
}

function extractInitials(tokens: string[]): string {
  const letters: string[] = [];

  for (const token of tokens) {
    if (letters.length >= 2) {
      break;
    }

    const cleaned = token.replace(/[^A-Za-zА-Яа-яЁё.]/g, '');
    if (!cleaned) {
      continue;
    }

    if (cleaned.includes('.')) {
      const compact = cleaned.replace(/\./g, '');
      for (const char of compact) {
        if (letters.length >= 2) {
          break;
        }
        letters.push(char.toUpperCase());
      }
      continue;
    }

    letters.push(cleaned.charAt(0).toUpperCase());
  }

  return letters.map((letter) => `${letter}.`).join('');
}

export function formatTeacherName(rawName: string): string {
  const normalized = normalizeTeacherName(rawName);
  if (!normalized) {
    return rawName;
  }

  const tokens = normalized.split(' ');
  const surname = tokens[0].replace(/^[^A-Za-zА-Яа-яЁё-]+|[^A-Za-zА-Яа-яЁё-]+$/g, '');
  if (!surname) {
    return normalized;
  }

  const initials = extractInitials(tokens.slice(1));
  if (!initials) {
    return surname;
  }

  return `${surname} ${initials}`;
}

export function buildTeacherSlug(rawName: string): string {
  return encodeURIComponent(normalizeTeacherName(rawName));
}

export function decodeTeacherSlug(rawSlug: string): string {
  if (!rawSlug) {
    return '';
  }

  try {
    return normalizeTeacherName(decodeURIComponent(rawSlug));
  } catch {
    return normalizeTeacherName(rawSlug);
  }
}

export function buildTeacherPath(rawName: string): string {
  const slug = buildTeacherSlug(rawName);
  return slug ? `/teachers/${slug}` : '/teachers';
}

export function buildTeacherPathByDate(rawName: string, date: string): string {
  const slug = buildTeacherSlug(rawName);
  if (!slug) {
    return `/teachers/${date}`;
  }

  return `/teachers/${date}/${slug}`;
}
