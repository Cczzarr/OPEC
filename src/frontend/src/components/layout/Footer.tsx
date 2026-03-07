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

export function Footer(): ReactElement {
  return (
    <footer className="py-20 text-center border-t border-white/5 flex flex-col gap-4">
      <p className="text-md-on-surface-variant/40 font-bold text-sm tracking-widest uppercase">
        Developed with caffeine and cats &copy; 2026 Czar & Shark
      </p>
      <p className="text-md-on-surface-variant/20 font-bold text-xs tracking-widest uppercase">
        no cookies. no tracking. no ads. no &quot;ПР&quot;.
      </p>
    </footer>
  );
}
