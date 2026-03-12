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

import { buildTeacherPath, formatTeacherName, normalizeTeacherName } from '../utils/teachers.ts';
import { routeDateToLabel } from '../utils/dateRoute.ts';

export type OpenGraphType = 'website' | 'article';
export type MetaAttribute = 'name' | 'property';

export type PageMeta = {
  title: string;
  description: string;
  path?: string;
  imagePath?: string;
  type?: OpenGraphType;
  robots?: string;
};

export type ResolvedPageMeta = {
  title: string;
  description: string;
  robots: string;
  canonicalUrl: string;
  imageUrl: string;
  ogType: OpenGraphType;
};

export type ResolvedMetaTag = {
  attribute: MetaAttribute;
  key: string;
  content: string;
};

export type ResolvedLinkTag = {
  rel: 'canonical';
  href: string;
};

export const DEFAULT_SITE_URL = 'https://opec.sharkhost.space';
export const DEFAULT_IMAGE_PATH = '/tab_logo_1024.png';
export const DEFAULT_OG_TYPE: OpenGraphType = 'website';
export const DEFAULT_ROBOTS =
  'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1';

export const HOME_PAGE_META: PageMeta = {
  title: 'Расписание занятий ОПЭК — удобный поиск по группам и преподавателям',
  description:
    'Актуальное расписание занятий Омского промышленно-экономического колледжа ОПЭК: быстрый и удобный поиск по группам, преподавателям и предметам.',
  path: '/',
};

export const TEACHERS_PAGE_META: PageMeta = {
  title: 'Преподаватели ОПЭК — поиск расписания преподавателей',
  description:
    'Преподаватели Омского промышленно-экономического колледжа ОПЭК: актуальное расписание занятий, поиск по преподавателям и архив по датам.',
  path: '/teachers',
};

export function getTeachersPageMetaByDate(date: string): PageMeta {
  const dateLabel = routeDateToLabel(date);

  return {
    title: `Преподаватели ОПЭК на ${dateLabel} — архив расписания`,
    description:
      `Преподаватели Омского промышленно-экономического колледжа ОПЭК: архив расписания на ${dateLabel}. ` +
      'Архивная страница расписания.',
    path: `/teachers/${date}`,
    robots: 'noindex,follow',
  };
}

export const ABOUT_PAGE_META: PageMeta = {
  title: 'О проекте ОПЭК — сервис расписания занятий',
  description: 'Информация о проекте расписания Омского промышленно-экономического колледжа ОПЭК, команде разработки и полезных ссылках.',
  path: '/about',
};

export function getTeacherPageMeta(teacherName: string): PageMeta {
  const normalizedTeacherName = normalizeTeacherName(teacherName);

  if (!normalizedTeacherName) {
    return TEACHERS_PAGE_META;
  }

  const displayName = formatTeacherName(normalizedTeacherName) || normalizedTeacherName;
  const displayNameSentence = /[.!?…]$/.test(displayName) ? displayName : `${displayName}.`;

  return {
    title: `${displayName} — преподаватель ОПЭК — расписание занятий`,
    description:
      `Расписание преподавателя Омского промышленно-экономического колледжа ОПЭК: ${displayNameSentence} ` +
      'Группы и пары на текущий учебный день.',
    path: buildTeacherPath(normalizedTeacherName),
  };
}

export function getTeacherPageMetaByDate(teacherName: string, date: string): PageMeta {
  const normalizedTeacherName = normalizeTeacherName(teacherName);
  const dateLabel = routeDateToLabel(date);

  if (!normalizedTeacherName) {
    return getTeachersPageMetaByDate(date);
  }

  const displayName = formatTeacherName(normalizedTeacherName) || normalizedTeacherName;
  const displayNameSentence = /[.!?…]$/.test(displayName) ? displayName : `${displayName}.`;

  return {
    title: `${displayName} — расписание на ${dateLabel} — архив ОПЭК`,
    description:
      `Расписание преподавателя Омского промышленно-экономического колледжа ОПЭК: ${displayNameSentence} ` +
      `Дата: ${dateLabel}. Архивная страница.`,
    path: `/teachers/${date}/${encodeURIComponent(normalizedTeacherName)}`,
    robots: 'noindex,follow',
  };
}

export function getNotFoundPageMeta(path: string): PageMeta {
  return {
    title: `ОПЭК — 404 — ${path}`,
    description: `Страница ${path} не найдена. Здесь абсолютно ничего нет, кроме этого текста.`,
    path,
    robots: 'noindex, nofollow',
  };
}

export function normalizeSiteUrl(value?: string): string {
  if (!value) {
    return DEFAULT_SITE_URL;
  }

  return value.endsWith('/') ? value.slice(0, -1) : value;
}

export function buildAbsoluteUrl(siteUrl: string, urlPath: string): string {
  if (!urlPath) {
    return siteUrl;
  }

  if (urlPath === '/') {
    return `${siteUrl}/`;
  }

  return urlPath.startsWith('/') ? `${siteUrl}${urlPath}` : `${siteUrl}/${urlPath}`;
}

export function resolvePageMeta(meta: PageMeta, siteUrl = DEFAULT_SITE_URL): ResolvedPageMeta {
  const normalizedSiteUrl = normalizeSiteUrl(siteUrl);
  const currentPath = meta.path ?? '/';

  return {
    title: meta.title,
    description: meta.description,
    robots: meta.robots ?? DEFAULT_ROBOTS,
    canonicalUrl: buildAbsoluteUrl(normalizedSiteUrl, currentPath),
    imageUrl: buildAbsoluteUrl(normalizedSiteUrl, meta.imagePath ?? DEFAULT_IMAGE_PATH),
    ogType: meta.type ?? DEFAULT_OG_TYPE,
  };
}

export function getResolvedMetaTags(meta: ResolvedPageMeta): ResolvedMetaTag[] {
  return [
    { attribute: 'name', key: 'description', content: meta.description },
    { attribute: 'name', key: 'robots', content: meta.robots },
    { attribute: 'name', key: 'twitter:card', content: 'summary_large_image' },
    { attribute: 'name', key: 'twitter:title', content: meta.title },
    { attribute: 'name', key: 'twitter:description', content: meta.description },
    { attribute: 'name', key: 'twitter:image', content: meta.imageUrl },
    { attribute: 'property', key: 'og:title', content: meta.title },
    { attribute: 'property', key: 'og:description', content: meta.description },
    { attribute: 'property', key: 'og:type', content: meta.ogType },
    { attribute: 'property', key: 'og:url', content: meta.canonicalUrl },
    { attribute: 'property', key: 'og:image', content: meta.imageUrl },
  ];
}

export function getResolvedLinkTags(meta: ResolvedPageMeta): ResolvedLinkTag[] {
  return [{ rel: 'canonical', href: meta.canonicalUrl }];
}
