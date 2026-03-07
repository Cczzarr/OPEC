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

import type { ReactElement } from 'react';
import { useRipple } from '../../hooks/useRipple.ts';

export function Ripple(): ReactElement {
  const { ripples, createRipple } = useRipple();

  return (
    <div 
      className="absolute inset-0 pointer-events-none overflow-hidden" 
      onMouseDown={createRipple}
    >
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute bg-current opacity-20 rounded-full animate-ripple"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
          }}
        />
      ))}
    </div>
  );
}
