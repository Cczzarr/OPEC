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

import { Loader2 } from 'lucide-react';
import type { ReactElement } from 'react';

type SyncLoadingIndicatorProps = {
  label?: string;
  iconClassName?: string;
  textClassName?: string;
};

export function SyncLoadingIndicator({
  label = 'Синхронизация данных...',
  iconClassName = 'w-12 h-12 text-md-primary animate-spin',
  textClassName = 'text-md-on-surface-variant font-bold animate-pulse text-lg',
}: SyncLoadingIndicatorProps): ReactElement {
  return (
    <>
      <Loader2 className={iconClassName} />
      <span className={textClassName}>{label}</span>
    </>
  );
}

