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

import { useEffect, useRef, useSyncExternalStore } from 'react';
import type { ReactElement } from 'react';

type CursorGlowProps = {
  isEnabled?: boolean;
};

const POINTER_COARSE_QUERY = '(pointer: coarse)';

function subscribePointerCoarse(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const mediaQueryList = window.matchMedia(POINTER_COARSE_QUERY);

  function handleChange(): void {
    onStoreChange();
  }

  mediaQueryList.addEventListener('change', handleChange);
  return () => mediaQueryList.removeEventListener('change', handleChange);
}

function getPointerCoarseSnapshot(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.matchMedia(POINTER_COARSE_QUERY).matches;
}

function getPointerCoarseServerSnapshot(): boolean {
  return false;
}

export function CursorGlow({
  isEnabled = true,
}: CursorGlowProps): ReactElement | null {
  const isTouchDevice = useSyncExternalStore(
    subscribePointerCoarse,
    getPointerCoarseSnapshot,
    getPointerCoarseServerSnapshot
  );
  const glowRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isEnabled || isTouchDevice || typeof window === 'undefined') {
      return;
    }

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let currentX = window.innerWidth / 2;
    let currentY = window.innerHeight / 2;
    let rafId: number;

    function onMouseMove(event: MouseEvent): void {
      targetX = event.clientX;
      targetY = event.clientY;
    }

    function animate(): void {
      currentX += (targetX - currentX) * 0.1;
      currentY += (targetY - currentY) * 0.1;

      if (glowRef.current) {
        glowRef.current.style.transform = `translate(calc(-50% + ${currentX}px), calc(-50% + ${currentY}px))`;
      }

      rafId = requestAnimationFrame(animate);
    }

    window.addEventListener('mousemove', onMouseMove);
    animate();

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, [isEnabled, isTouchDevice]);

  if (isTouchDevice || !isEnabled) {
    return null;
  }

  return (
    <div
      ref={glowRef}
      className="fixed top-0 left-0 w-[500px] h-[500px] rounded-full pointer-events-none -z-10 mix-blend-screen will-change-transform"
      style={{
        background: 'radial-gradient(circle, rgba(208, 188, 255, 0.12) 0%, transparent 60%)',
        transform: 'translate(-50%, -50%)',
      }}
    />
  );
}
