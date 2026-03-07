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

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_SITE_URL = 'https://opec.sharkhost.space';
const DEFAULT_IMAGE_PATH = '/tab_logo_1024.png';
const DEFAULT_ROBOTS = 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1';

const HEAD_END_TAG = '</head>';
const TITLE_TAG_REGEX = /<title>[\s\S]*?<\/title>/i;

const ROUTE_META = [
  {
    routePath: '/',
    outputFile: 'index.html',
    title: 'ОПЭК — Расписание занятий',
    description:
      'Актуальное расписание занятий Омского промышленно-экономического колледжа ОПЭК: быстрый и удобный поиск по группам, преподавателям и предметам.',
  },
  {
    routePath: '/about',
    outputFile: 'about/index.html',
    title: 'ОПЭК — О нас',
    description:
      'Команда проекта расписания Омского промышленно-экономического колледжа (ОПЭК): разработчики удобного сервиса и ссылки на ресурсы.',
  },
];

function escapeHtmlAttribute(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeSiteUrl(value) {
  if (!value) {
    return DEFAULT_SITE_URL;
  }

  return value.endsWith('/') ? value.slice(0, -1) : value;
}

function makeAbsoluteUrl(siteUrl, routePath) {
  if (routePath === '/') {
    return `${siteUrl}/`;
  }

  return `${siteUrl}${routePath}`;
}

function makeImageUrl(siteUrl) {
  return `${siteUrl}${DEFAULT_IMAGE_PATH}`;
}

function insertBeforeHeadEnd(html, tag) {
  return html.replace(HEAD_END_TAG, `${tag}\n  </head>`);
}

function upsertByRegex(html, regex, tag) {
  if (regex.test(html)) {
    return html.replace(regex, tag);
  }

  return insertBeforeHeadEnd(html, tag);
}

function replaceTitleTag(html, title) {
  const escapedTitle = escapeHtmlAttribute(title);
  const titleTag = `<title>${escapedTitle}</title>`;

  if (TITLE_TAG_REGEX.test(html)) {
    return html.replace(TITLE_TAG_REGEX, titleTag);
  }

  return insertBeforeHeadEnd(html, `  ${titleTag}`);
}

function upsertMetaByName(html, name, content) {
  const escapedContent = escapeHtmlAttribute(content);
  const tag = `  <meta name="${name}" content="${escapedContent}" />`;
  const regex = new RegExp(`<meta\\s+[^>]*name=["']${escapeRegExp(name)}["'][^>]*>`, 'i');
  return upsertByRegex(html, regex, tag);
}

function upsertMetaByProperty(html, property, content) {
  const escapedContent = escapeHtmlAttribute(content);
  const tag = `  <meta property="${property}" content="${escapedContent}" />`;
  const regex = new RegExp(
    `<meta\\s+[^>]*property=["']${escapeRegExp(property)}["'][^>]*>`,
    'i'
  );
  return upsertByRegex(html, regex, tag);
}

function upsertLinkByRel(html, rel, href) {
  const escapedHref = escapeHtmlAttribute(href);
  const tag = `  <link rel="${rel}" href="${escapedHref}" />`;
  const regex = new RegExp(`<link\\s+[^>]*rel=["']${escapeRegExp(rel)}["'][^>]*>`, 'i');
  return upsertByRegex(html, regex, tag);
}

function upsertRuAlternateLink(html, href) {
  const escapedHref = escapeHtmlAttribute(href);
  const tag = `  <link rel="alternate" hreflang="ru" href="${escapedHref}" />`;
  const regex =
    /<link\s+[^>]*rel=["']alternate["'][^>]*hreflang=["']ru["'][^>]*>|<link\s+[^>]*hreflang=["']ru["'][^>]*rel=["']alternate["'][^>]*>/i;
  return upsertByRegex(html, regex, tag);
}

function applyRouteMeta(html, siteUrl, routeMeta) {
  const canonicalUrl = makeAbsoluteUrl(siteUrl, routeMeta.routePath);
  const imageUrl = makeImageUrl(siteUrl);

  let nextHtml = html;
  nextHtml = replaceTitleTag(nextHtml, routeMeta.title);
  nextHtml = upsertMetaByName(nextHtml, 'description', routeMeta.description);
  nextHtml = upsertMetaByName(nextHtml, 'robots', DEFAULT_ROBOTS);
  nextHtml = upsertLinkByRel(nextHtml, 'canonical', canonicalUrl);
  nextHtml = upsertRuAlternateLink(nextHtml, canonicalUrl);

  nextHtml = upsertMetaByProperty(nextHtml, 'og:title', routeMeta.title);
  nextHtml = upsertMetaByProperty(nextHtml, 'og:description', routeMeta.description);
  nextHtml = upsertMetaByProperty(nextHtml, 'og:type', 'website');
  nextHtml = upsertMetaByProperty(nextHtml, 'og:url', canonicalUrl);
  nextHtml = upsertMetaByProperty(nextHtml, 'og:image', imageUrl);

  return nextHtml;
}

async function main() {
  const currentFilePath = fileURLToPath(import.meta.url);
  const currentDir = path.dirname(currentFilePath);
  const distDir = path.resolve(currentDir, '../dist');
  const indexHtmlPath = path.join(distDir, 'index.html');
  const siteUrl = normalizeSiteUrl(process.env.VITE_SITE_URL);
  const sourceHtml = await readFile(indexHtmlPath, 'utf8');

  for (const routeMeta of ROUTE_META) {
    const outputHtmlPath = path.join(distDir, routeMeta.outputFile);
    const outputDir = path.dirname(outputHtmlPath);
    await mkdir(outputDir, { recursive: true });
    const routeHtml = applyRouteMeta(sourceHtml, siteUrl, routeMeta);
    await writeFile(outputHtmlPath, routeHtml, 'utf8');
  }
}

main().catch((error) => {
  console.error('[prerender-routes] Failed:', error);
  process.exitCode = 1;
});
