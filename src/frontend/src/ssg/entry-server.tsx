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

import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { AppShell } from '../app/AppShell.tsx';
import {
  ABOUT_PAGE_META,
  getTeacherPageMetaByDate,
  getTeachersPageMetaByDate,
  getTeacherPageMeta,
  HOME_PAGE_META,
  resolvePageMeta,
  TEACHERS_PAGE_META,
  type PageMeta,
  type ResolvedPageMeta,
} from '../seo/pageMeta.ts';
import { createPageMetaStore } from '../seo/pageMetaStore.ts';
import { PageMetaProvider } from '../seo/pageMetaStore.tsx';
import { SsgPayloadContext } from './SsgPayloadContext.tsx';
import { isDateRouteSegment } from '../utils/dateRoute.ts';
import { decodeTeacherSlug } from '../utils/teachers.ts';
import { SSG_TEACHERS } from './payload.ts';

export { SSG_ROUTES, SSG_TEACHERS } from './payload.ts';
export { getResolvedLinkTags, getResolvedMetaTags } from '../seo/pageMeta.ts';

export type RenderedRoute = {
  appHtml: string;
  meta: ResolvedPageMeta;
};

function getFallbackPageMeta(routePath: string): PageMeta {
  if (routePath.startsWith('/teachers/')) {
    const tail = routePath.slice('/teachers/'.length);
    const chunks = tail.split('/').filter((chunk) => chunk.length > 0);

    if (chunks.length === 1) {
      if (isDateRouteSegment(chunks[0])) {
        return getTeachersPageMetaByDate(chunks[0]);
      }

      return getTeacherPageMeta(decodeTeacherSlug(chunks[0]));
    }

    if (chunks.length >= 2 && isDateRouteSegment(chunks[0])) {
      return getTeacherPageMetaByDate(decodeTeacherSlug(chunks[1]), chunks[0]);
    }
  }

  switch (routePath) {
    case '/teachers': {
      return TEACHERS_PAGE_META;
    }
    case '/about': {
      return ABOUT_PAGE_META;
    }
    default: {
      return HOME_PAGE_META;
    }
  }
}

export function renderRoute(routePath: string): RenderedRoute {
  const metaStore = createPageMetaStore();

  const appHtml = renderToString(
    <StrictMode>
      <PageMetaProvider value={metaStore}>
        <SsgPayloadContext.Provider value={{ teachers: SSG_TEACHERS }}>
          <MemoryRouter initialEntries={[routePath]}>
            <AppShell />
          </MemoryRouter>
        </SsgPayloadContext.Provider>
      </PageMetaProvider>
    </StrictMode>
  );

  const pageMeta = metaStore.getMeta() ?? getFallbackPageMeta(routePath);

  return {
    appHtml,
    meta: resolvePageMeta(pageMeta, import.meta.env.VITE_SITE_URL),
  };
}
