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
import { useParams } from 'react-router-dom';

import { isDateRouteSegment } from '../utils/dateRoute.ts';
import { TeacherSchedulePage } from './TeacherSchedule.tsx';
import { Teachers } from './Teachers.tsx';

export function TeachersRouteResolver(): ReactElement {
  const { routeParam = '' } = useParams();

  if (isDateRouteSegment(routeParam)) {
    return <Teachers forcedDate={routeParam} />;
  }

  return <TeacherSchedulePage forcedTeacherSlug={routeParam} />;
}
