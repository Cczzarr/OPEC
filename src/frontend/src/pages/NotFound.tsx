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
import { useLocation } from 'react-router-dom';
import { CursorGlow } from '../components/layout/CursorGlow.tsx';
import { Footer } from '../components/layout/Footer.tsx';
import { ScrollProgress } from '../components/layout/ScrollProgress.tsx';
import { usePageMeta } from '../hooks/usePageMeta.ts';
import { getNotFoundPageMeta } from '../seo/pageMeta.ts';

export function NotFound(): ReactElement {
  const location = useLocation();
  const currentPath = location.pathname;
  usePageMeta(getNotFoundPageMeta(currentPath));

  return (
    <>
      <ScrollProgress />
      <CursorGlow />

      <main className="container mx-auto px-6 max-w-[1240px] relative z-10 min-h-[100dvh] flex flex-col pt-[calc(env(safe-area-inset-top)+6.5rem)] md:pt-32">
        <div className="flex-1 flex flex-col items-center justify-center text-center mb-[56px] mt-20 md:mt-24">
          <h1 className="text-[clamp(3.8rem,8vw,7rem)] font-black tracking-[-0.05em] text-md-on-surface leading-none mt-3">
            404
          </h1>
          <p className="text-md-on-surface-variant/70 font-semibold tracking-[0.28em] text-sm mt-4">
            ОШИБКА
          </p>
          <p className="text-[clamp(1.2rem,2.5vw,1.6rem)] text-md-on-surface-variant max-w-xl mt-5 md:max-w-none md:whitespace-nowrap">
            Здесь абсолютно ничего нет, кроме этого текста.
          </p>
        </div>
        <Footer />
      </main>
    </>
  );
}
