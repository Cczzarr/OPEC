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

import { Construction } from 'lucide-react';
import type { ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { CursorGlow } from '../components/layout/CursorGlow.tsx';
import { Footer } from '../components/layout/Footer.tsx';
import { Header } from '../components/layout/Header.tsx';
import { ScrollProgress } from '../components/layout/ScrollProgress.tsx';
import { usePageMeta } from '../hooks/usePageMeta.ts';

interface UnderConstructionProps {
  title: string;
}

export function UnderConstruction({ title }: UnderConstructionProps): ReactElement {
  usePageMeta({
    title: `ОПЭК — ${title}`,
    description: `Раздел «${title}» временно находится в разработке. Скоро здесь появится новый контент проекта для расписания Омского промышленно-экономического колледжа ОПЭК.`,
  });

  return (
    <>
      <ScrollProgress />
      <CursorGlow />
      <Header />

      <main className="container mx-auto px-6 max-w-[1240px] relative z-10 min-h-[100dvh] flex flex-col pt-[calc(env(safe-area-inset-top)+6.5rem)] md:pt-32">
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 mb-8 bg-md-primary/10 rounded-full flex items-center justify-center text-md-primary">
            <Construction className="w-10 h-10" />
          </div>
          <h1 className="text-[clamp(2.5rem,5vw,4.5rem)] font-black tracking-[-0.04em] text-md-on-surface leading-tight mb-4">
            {title}
          </h1>
          <p className="text-xl text-md-on-surface-variant max-w-md">
            Эта страница всё ещё находится в разработке. Загляните сюда чуть позже!
          </p>

          <Link
            to="/"
            className="mt-12 px-8 py-3 rounded-full font-bold text-md-on-surface border border-white/10 transition-colors hover:bg-white/5"
          >
            Вернуться на главную
          </Link>
        </div>
        <div className="mt-24">
          <Footer />
        </div>
      </main>
    </>
  );
}
