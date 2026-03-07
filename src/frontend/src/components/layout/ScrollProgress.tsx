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

import { useEffect, useRef } from 'react';
import type { ReactElement } from 'react';

export function ScrollProgress(): ReactElement {
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let rafId: number | null = null;

    function updateProgress(): void {
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolledPercentage = height > 0 ? (winScroll / height) * 100 : 0;

      if (progressBarRef.current) {
        progressBarRef.current.style.width = `${scrolledPercentage}%`;
      }

      rafId = null;
    }

    function handleScroll(): void {
      if (rafId !== null) {
        return;
      }

      rafId = window.requestAnimationFrame(updateProgress);
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 w-full h-1 bg-white/5 z-[1001] pointer-events-none">
      <div
        ref={progressBarRef}
        className="h-full bg-gradient-to-r from-md-primary to-md-tertiary rounded-r-sm shadow-[0_0_12px_var(--md-primary)] transition-all duration-150 ease-out will-change-[width]"
        style={{ width: '0%' }}
      />
    </div>
  );
}
