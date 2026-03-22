/*
 * OPEC Schedule
 * Copyright (c) 2026 Cczzarr, qqsharki4
 * All Rights Reserved.
 *
 * Authors:
 * - GitHub: Cczzarr   | Telegram: t.me/cczzar
 * - GitHub: qqsharki4 | Telegram: t.me/now_shark
 *
 * This source code is published for viewing and reference only.
 * Copying, modification, redistribution, reuse, or deployment of this code,
 * in whole or in part, without explicit permission from the authors is prohibited.
 */

import clsx from 'clsx';
import type { ReactElement } from 'react';

export const DEFAULT_DEMO_MODE_MESSAGE =
  'Сервис временно недоступен. Показаны примеры данных для демонстрации интерфейса.';

type DemoModeBadgeProps = {
  className?: string;
  message?: string;
  label?: string;
};

export function DemoModeBadge({
  className,
  message = DEFAULT_DEMO_MODE_MESSAGE,
  label = 'Demo Mode',
}: DemoModeBadgeProps): ReactElement {
  return (
    <div className={clsx('group inline-flex shrink-0', className)}>
      <div className="relative">
        <div className="px-3 py-1 bg-md-tertiary/10 border border-md-tertiary/20 rounded-full text-md-tertiary text-[10px] font-black uppercase tracking-widest animate-pulse cursor-help">
          {label}
        </div>
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 p-3 bg-md-surface/95 backdrop-blur-xl border border-white/10 rounded-2xl opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 z-50 shadow-2xl shadow-black/50">
          <p className="text-sm text-md-on-surface-variant leading-relaxed text-center font-medium">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}
