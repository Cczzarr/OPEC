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

import { useEffect, useRef, useState } from 'react';
import type { ReactElement } from 'react';

type CursorGlowProps = {
  isEnabled?: boolean;
};

export function CursorGlow({
  isEnabled = true,
}: CursorGlowProps): ReactElement | null {
  const [isTouchDevice, setIsTouchDevice] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(pointer: coarse)').matches : false
  );
  const glowRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isEnabled || typeof window === 'undefined') {
      return;
    }

    const touchQuery = window.matchMedia('(pointer: coarse)');
    function handlePointerChange(event: MediaQueryListEvent): void {
      setIsTouchDevice(event.matches);
    }

    touchQuery.addEventListener('change', handlePointerChange);

    if (isTouchDevice) {
      return () => touchQuery.removeEventListener('change', handlePointerChange);
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
      touchQuery.removeEventListener('change', handlePointerChange);
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
