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
import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import { AppShell } from './app/AppShell.tsx';
import { PageMetaProvider } from './seo/pageMetaStore.tsx';
import { SsgPayloadContext } from './ssg/SsgPayloadContext.tsx';

declare global {
  interface Window {
    __SSG_TEACHERS__?: unknown;
  }
}

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found.');
}

const app = (
  <StrictMode>
    <PageMetaProvider>
      <SsgPayloadContext.Provider
        value={{
          teachers: Array.isArray(window.__SSG_TEACHERS__)
            ? window.__SSG_TEACHERS__.filter((value): value is string => typeof value === 'string')
            : [],
        }}
      >
        <BrowserRouter>
          <AppShell enableScrollToTop />
        </BrowserRouter>
      </SsgPayloadContext.Provider>
    </PageMetaProvider>
  </StrictMode>
);

function normalizePathname(pathname: string): string {
  if (!pathname) {
    return '/';
  }

  const normalized = pathname.replace(/\/+$/, '');
  return normalized.length > 0 ? normalized : '/';
}

function getCanonicalPathname(): string | null {
  const canonicalLink = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  const canonicalHref = canonicalLink?.getAttribute('href');
  if (!canonicalHref) {
    return null;
  }

  try {
    const canonicalUrl = new URL(canonicalHref, window.location.origin);
    return normalizePathname(canonicalUrl.pathname);
  } catch {
    return null;
  }
}

const hasServerMarkup = rootElement.hasChildNodes();
const currentPathname = normalizePathname(window.location.pathname);
const canonicalPathname = getCanonicalPathname();
const canHydrate = hasServerMarkup && canonicalPathname === currentPathname;

if (canHydrate) {
  hydrateRoot(rootElement, app);
} else {
  if (hasServerMarkup) {
    rootElement.innerHTML = '';
  }
  createRoot(rootElement).render(app);
}
