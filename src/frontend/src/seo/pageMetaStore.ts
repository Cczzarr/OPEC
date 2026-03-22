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

import { createContext, useContext } from 'react';
import type { PageMeta } from './pageMeta.ts';

export type PageMetaStore = {
  setMeta: (meta: PageMeta) => void;
};

export type PageMetaStoreSnapshot = PageMetaStore & {
  getMeta: () => PageMeta | null;
};

export const PageMetaContext = createContext<PageMetaStore | null>(null);

export function createPageMetaStore(): PageMetaStoreSnapshot {
  let currentMeta: PageMeta | null = null;

  return {
    setMeta(meta) {
      currentMeta = meta;
    },
    getMeta() {
      return currentMeta;
    },
  };
}

export function usePageMetaStore(): PageMetaStore | null {
  return useContext(PageMetaContext);
}

