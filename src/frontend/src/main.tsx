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

import { lazy, StrictMode, Suspense } from 'react';
import type { ComponentType } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './index.css';
import { ScrollToTop } from './components/layout/ScrollToTop.tsx';

type NoProps = Record<string, never>;
type LazyComponent<Props = NoProps> = Promise<{ default: ComponentType<Props> }>;
type UnderConstructionProps = { title: string };

function loadApp(): LazyComponent {
  return import('./App.tsx');
}

function loadUnderConstruction(): LazyComponent<UnderConstructionProps> {
  return import('./pages/UnderConstruction.tsx').then((m) => ({
    default: m.UnderConstruction,
  }));
}

function loadAbout(): LazyComponent {
  return import('./pages/About.tsx').then((m) => ({
    default: m.About,
  }));
}

const App = lazy(loadApp);
const UnderConstruction = lazy(loadUnderConstruction);
const About = lazy(loadAbout);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ScrollToTop />
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/teachers" element={<UnderConstruction title="Преподаватели" />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </StrictMode>,
);
