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
import type { ReactElement, ReactNode } from 'react';

export type StatusPanelProps = {
  icon: ReactNode;
  iconWrapperClassName: string;
  title: string;
  message: string;
  buttonLabel: string;
  onAction?: () => void;
};

export function StatusPanel({
  icon,
  iconWrapperClassName,
  title,
  message,
  buttonLabel,
  onAction,
}: StatusPanelProps): ReactElement {
  return (
    <div className="flex flex-col items-center justify-center py-40 text-center">
      <div
        className={clsx(
          'w-24 h-24 mb-8 rounded-full flex items-center justify-center shadow-lg',
          iconWrapperClassName
        )}
      >
        {icon}
      </div>
      <h3 className="text-3xl font-black text-md-on-surface tracking-tight">{title}</h3>
      <p className="text-md-on-surface-variant/70 mt-4 font-bold text-lg max-w-[440px] leading-relaxed">
        {message}
      </p>
      <button
        onClick={onAction ?? (() => window.location.reload())}
        className="mt-10 px-8 py-4 bg-md-surface border border-white/10 rounded-2xl font-black text-md-on-surface hover:bg-md-primary hover:text-md-bg transition-all active:scale-95"
      >
        {buttonLabel}
      </button>
    </div>
  );
}

