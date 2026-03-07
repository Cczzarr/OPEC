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

type OpenGraphType = 'website' | 'article';

type PageMeta = {
  title: string;
  description: string;
  path?: string;
  imagePath?: string;
  type?: OpenGraphType;
  robots?: string;
};

type MetaAttribute = 'name' | 'property';

const DEFAULT_SITE_URL = 'https://opec.sharkhost.space';
const DEFAULT_IMAGE_PATH = '/tab_logo_1024.png';
const DEFAULT_OG_TYPE: OpenGraphType = 'website';

function normalizeSiteUrl(value?: string): string {
  if (!value) {
    return DEFAULT_SITE_URL;
  }

  return value.endsWith('/') ? value.slice(0, -1) : value;
}

function buildAbsoluteUrl(siteUrl: string, urlPath: string): string {
  if (!urlPath) {
    return siteUrl;
  }

  return urlPath.startsWith('/') ? `${siteUrl}${urlPath}` : `${siteUrl}/${urlPath}`;
}

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

function setCanonicalLink(url: string): void {
  const existingCanonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (existingCanonical) {
    existingCanonical.setAttribute('href', url);
    return;
  }

  const canonicalLink = document.createElement('link');
  canonicalLink.setAttribute('rel', 'canonical');
  canonicalLink.setAttribute('href', url);
  document.head.append(canonicalLink);
}

export function usePageMeta({
  title,
  description,
  path,
  imagePath = DEFAULT_IMAGE_PATH,
  type = DEFAULT_OG_TYPE,
  robots,
}: PageMeta): void {
  useEffect(() => {
    const siteUrl = normalizeSiteUrl(import.meta.env.VITE_SITE_URL);
    const currentPath = path || window.location.pathname;
    const canonicalUrl = buildAbsoluteUrl(siteUrl, currentPath);
    const imageUrl = buildAbsoluteUrl(siteUrl, imagePath);

    document.title = title;
    setMetaTag('name', 'description', description);

    if (robots) {
      setMetaTag('name', 'robots', robots);
    }

    setCanonicalLink(canonicalUrl);

    setMetaTag('property', 'og:title', title);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:type', type);
    setMetaTag('property', 'og:url', canonicalUrl);
    setMetaTag('property', 'og:image', imageUrl);
  }, [description, imagePath, path, robots, title, type]);
}
