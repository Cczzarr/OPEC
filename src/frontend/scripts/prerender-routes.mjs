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

import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HEAD_END_TAG = '</head>';
const BODY_END_TAG = '</body>';
const TITLE_TAG_REGEX = /<title>[\s\S]*?<\/title>/i;
const ROOT_DIV_REGEX = /<div id="root"><\/div>/i;

const CURRENT_FILE_PATH = fileURLToPath(import.meta.url);
const SCRIPTS_DIR = path.dirname(CURRENT_FILE_PATH);
const PROJECT_DIR = path.resolve(SCRIPTS_DIR, '..');
const DIST_DIR = path.join(PROJECT_DIR, 'dist');
const SSR_BUNDLE_DIR = path.join(PROJECT_DIR, '.ssg-temp');
const CLIENT_TEMPLATE_PATH = path.join(DIST_DIR, 'index.html');

function escapeHtmlAttribute(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function insertBeforeHeadEnd(html, tag) {
  return html.replace(HEAD_END_TAG, `${tag}\n  </head>`);
}

function insertBeforeBodyEnd(html, tag) {
  return html.replace(BODY_END_TAG, `${tag}\n  </body>`);
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
  const regex = new RegExp(`<meta\\s+[^>]*name=["']${name}["'][^>]*>`, 'i');
  return upsertByRegex(html, regex, tag);
}

function upsertMetaByProperty(html, property, content) {
  const escapedContent = escapeHtmlAttribute(content);
  const tag = `  <meta property="${property}" content="${escapedContent}" />`;
  const regex = new RegExp(`<meta\\s+[^>]*property=["']${property}["'][^>]*>`, 'i');
  return upsertByRegex(html, regex, tag);
}

function upsertLinkByRel(html, rel, href) {
  const escapedHref = escapeHtmlAttribute(href);
  const tag = `  <link rel="${rel}" href="${escapedHref}" />`;
  const regex = new RegExp(`<link\\s+[^>]*rel=["']${rel}["'][^>]*>`, 'i');
  return upsertByRegex(html, regex, tag);
}

function injectAppHtml(html, appHtml) {
  const rootMarkup = `<div id="root">${appHtml}</div>`;
  if (!ROOT_DIV_REGEX.test(html)) {
    throw new Error('Root container not found in client template.');
  }

  return html.replace(ROOT_DIV_REGEX, rootMarkup);
}

function applyHeadMeta(html, title, metaTags, linkTags) {
  let nextHtml = replaceTitleTag(html, title);

  for (const tag of metaTags) {
    nextHtml =
      tag.attribute === 'name'
        ? upsertMetaByName(nextHtml, tag.key, tag.content)
        : upsertMetaByProperty(nextHtml, tag.key, tag.content);
  }

  for (const link of linkTags) {
    nextHtml = upsertLinkByRel(nextHtml, link.rel, link.href);
  }

  return nextHtml;
}

async function main() {
  const buildTimestamp = new Date().toISOString();

  const clientTemplate = await readFile(CLIENT_TEMPLATE_PATH, 'utf8');
  const ssrEntryName = (await readdir(SSR_BUNDLE_DIR)).find((fileName) =>
    /^entry-server\.(js|mjs|cjs)$/.test(fileName)
  );

  if (!ssrEntryName) {
    throw new Error('SSR entry bundle not found in .ssg-temp.');
  }

  const ssrEntryPath = path.join(SSR_BUNDLE_DIR, ssrEntryName);
  const ssrModule = await import(pathToFileURL(ssrEntryPath).href);
  const getResolvedMetaTags = ssrModule.getResolvedMetaTags;
  const getResolvedLinkTags = ssrModule.getResolvedLinkTags;
  const routes = ssrModule.SSG_ROUTES;
  const teachersList = Array.isArray(ssrModule.SSG_TEACHERS)
    ? ssrModule.SSG_TEACHERS.filter((value) => typeof value === 'string')
    : [];

  if (typeof getResolvedMetaTags !== 'function' || typeof getResolvedLinkTags !== 'function') {
    throw new Error('Resolved page meta helpers are not available in the SSR bundle.');
  }

  if (teachersList.length > 0) {
    const json = JSON.stringify(teachersList, null, 2);
    await writeFile(path.join(DIST_DIR, 'teachers.json'), `${json}\n`, 'utf8');
  }

  for (const route of routes) {
    const renderedRoute = ssrModule.renderRoute(route.routePath, buildTimestamp);
    const routeOutputPath = path.join(DIST_DIR, route.outputFile);
    const routeOutputDir = path.dirname(routeOutputPath);

    let routeHtml = clientTemplate;
    routeHtml = applyHeadMeta(
      routeHtml,
      renderedRoute.meta.title,
      getResolvedMetaTags(renderedRoute.meta),
      getResolvedLinkTags(renderedRoute.meta)
    );
    routeHtml = injectAppHtml(routeHtml, renderedRoute.appHtml);

    if (route.routePath === '/teachers' && teachersList.length > 0) {
      // Keep prerender markup and hydration in sync: the client reads this during initial hydration.
      const json = JSON.stringify(teachersList).replaceAll('<', '\\u003c');
      routeHtml = insertBeforeBodyEnd(routeHtml, `  <script>window.__SSG_TEACHERS__=${json};</script>`);
    }

    if (!routeHtml.includes(BODY_END_TAG)) {
      throw new Error(`Missing ${BODY_END_TAG} in client template.`);
    }

    await mkdir(routeOutputDir, { recursive: true });
    await writeFile(routeOutputPath, routeHtml, 'utf8');
  }

  await rm(SSR_BUNDLE_DIR, { recursive: true, force: true });
}

main().catch(async (error) => {
  console.error('[prerender-routes] Failed:', error);

  await rm(SSR_BUNDLE_DIR, { recursive: true, force: true }).catch(() => {});

  process.exitCode = 1;
});
