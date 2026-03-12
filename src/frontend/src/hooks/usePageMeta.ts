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

import { useEffect } from 'react';
import {
  getResolvedLinkTags,
  getResolvedMetaTags,
  resolvePageMeta,
  type MetaAttribute,
  type PageMeta,
} from '../seo/pageMeta.ts';
import { usePageMetaStore } from '../seo/pageMetaStore.ts';

function getOrCreateMetaTag(attribute: MetaAttribute, value: string): HTMLMetaElement {
  const selector = `meta[${attribute}="${value}"]`;
  const existing = document.head.querySelector<HTMLMetaElement>(selector);
  if (existing) {
    return existing;
  }

  const meta = document.createElement('meta');
  meta.setAttribute(attribute, value);
  document.head.append(meta);
  return meta;
}

function setMetaTag(attribute: MetaAttribute, value: string, content: string): void {
  const meta = getOrCreateMetaTag(attribute, value);
  meta.setAttribute('content', content);
}

function setLinkTag(rel: string, href: string): void {
  const existingLink = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (existingLink) {
    existingLink.setAttribute('href', href);
    return;
  }

  const link = document.createElement('link');
  link.setAttribute('rel', rel);
  link.setAttribute('href', href);
  document.head.append(link);
}

export function usePageMeta(pageMeta: PageMeta): void {
  const pageMetaStore = usePageMetaStore();

  if (pageMetaStore) {
    pageMetaStore.setMeta(pageMeta);
  }

  useEffect(() => {
    const resolvedMeta = resolvePageMeta(pageMeta, import.meta.env.VITE_SITE_URL);

    document.title = resolvedMeta.title;

    for (const tag of getResolvedMetaTags(resolvedMeta)) {
      setMetaTag(tag.attribute, tag.key, tag.content);
    }

    for (const link of getResolvedLinkTags(resolvedMeta)) {
      setLinkTag(link.rel, link.href);
    }
  }, [pageMeta]);
}
