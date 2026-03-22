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
import { Route, Routes } from 'react-router-dom';
import App from '../App.tsx';
import { BackgroundBlobs } from '../components/layout/BackgroundBlobs.tsx';
import { Header } from '../components/layout/Header.tsx';
import { ScrollToTop } from '../components/layout/ScrollToTop.tsx';
import { useHydrated } from '../hooks/useHydrated.ts';
import { About } from '../pages/About.tsx';
import { NotFound } from '../pages/NotFound.tsx';
import { TeacherSchedulePage } from '../pages/TeacherSchedule.tsx';
import { Teachers } from '../pages/Teachers.tsx';
import { TeachersRouteResolver } from '../pages/TeachersRouteResolver.tsx';

type AppShellProps = {
  enableScrollToTop?: boolean;
};

export function AppShell({
  enableScrollToTop = false,
}: AppShellProps): ReactElement {
  const isHydrated = useHydrated();

  return (
    <>
      {isHydrated ? <BackgroundBlobs /> : null}
      {enableScrollToTop ? <ScrollToTop /> : null}
      <Header />
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/teachers" element={<Teachers />} />
        <Route path="/teachers/:date/:teacherSlug" element={<TeacherSchedulePage />} />
        <Route path="/teachers/:routeParam" element={<TeachersRouteResolver />} />
        <Route path="/about" element={<About />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
