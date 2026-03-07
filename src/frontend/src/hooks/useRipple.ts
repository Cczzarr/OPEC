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

import { useLayoutEffect, useState } from 'react';
import type { MouseEvent } from 'react';

type Ripple = {
  x: number;
  y: number;
  size: number;
  id: number;
};

type UseRippleResult = {
  ripples: Ripple[];
  createRipple: (event: MouseEvent<HTMLElement>) => void;
};

export function useRipple(): UseRippleResult {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  function createRipple(event: MouseEvent<HTMLElement>): void {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    const newRipple = { x, y, size, id: Date.now() };
    setRipples((prev) => [...prev, newRipple]);
  }

  useLayoutEffect(() => {
    if (ripples.length === 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      setRipples((prev) => prev.slice(1));
    }, 800);

    return () => window.clearTimeout(timer);
  }, [ripples]);

  return { ripples, createRipple };
}
