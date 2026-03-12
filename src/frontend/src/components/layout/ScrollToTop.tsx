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

import { useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;
const INSTANT_SCROLL_CLASS = 'route-change-no-smooth';

function scrollToTop(behavior: ScrollBehavior): void {
  const options: ScrollToOptions = { top: 0, left: 0, behavior };
  window.scrollTo(options);
  document.documentElement.scrollTo(options);
  document.body.scrollTo(options);
}

function setInstantScrollMode(enabled: boolean): void {
  document.documentElement.classList.toggle(INSTANT_SCROLL_CLASS, enabled);
  document.body.classList.toggle(INSTANT_SCROLL_CLASS, enabled);
}

export function ScrollToTop(): null {
  const { pathname, search, hash, state } = useLocation();
  const previousLocationRef = useRef({ pathname, search, hash });

  useEffect(() => {
    if (typeof window === 'undefined' || !('scrollRestoration' in window.history)) {
      return;
    }

    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';

    return () => {
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, []);

  useIsomorphicLayoutEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const previousLocation = previousLocationRef.current;
    previousLocationRef.current = { pathname, search, hash };

    const routeChanged =
      previousLocation.pathname !== pathname || previousLocation.search !== search;

    if (!routeChanged || hash) {
      return;
    }

    const shouldPreserveScroll =
      typeof state === 'object' &&
      state !== null &&
      'preserveScroll' in state &&
      (state as { preserveScroll?: boolean }).preserveScroll === true;

    if (shouldPreserveScroll) {
      return;
    }

    setInstantScrollMode(true);
    scrollToTop('auto');

    let secondFrameId = 0;
    const firstFrameId = window.requestAnimationFrame(() => {
      secondFrameId = window.requestAnimationFrame(() => {
        setInstantScrollMode(false);
      });
    });

    return () => {
      window.cancelAnimationFrame(firstFrameId);
      window.cancelAnimationFrame(secondFrameId);
      setInstantScrollMode(false);
    };
  }, [pathname, search, hash]);

  return null;
}
