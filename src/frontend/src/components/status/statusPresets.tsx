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

import { Loader2, Zap } from 'lucide-react';
import type { ReactNode } from 'react';

import type { StatusPanelProps } from './StatusPanel.tsx';

export type StatusKind = 'rate_limited' | 'timeout' | 'sync_error';

export type StatusPreset = Pick<
  StatusPanelProps,
  'icon' | 'iconWrapperClassName' | 'title' | 'message' | 'buttonLabel'
>;

function preset(
  icon: ReactNode,
  iconWrapperClassName: string,
  title: string,
  message: string,
  buttonLabel: string
): StatusPreset {
  return { icon, iconWrapperClassName, title, message, buttonLabel };
}

export function getStatusPreset(kind: StatusKind): StatusPreset {
  switch (kind) {
    case 'rate_limited':
      return preset(
        <Zap className="w-10 h-10 animate-pulse" />,
        'bg-md-error/10 border border-md-error/20 text-md-error shadow-md-error/5',
        'Слишком много запросов',
        'Похоже, вы отправляете запросы слишком часто. Пожалуйста, подождите минуту перед следующей попыткой.',
        'Попробовать снова'
      );
    case 'timeout':
      return preset(
        <Loader2 className="w-10 h-10 animate-spin-slow" />,
        'bg-md-tertiary/10 border border-md-tertiary/20 text-md-tertiary shadow-md-tertiary/5',
        'Ожидание истекло',
        'Время ожидания синхронизации истекло. Проверьте соединение и попробуйте еще раз.',
        'Повторить попытку'
      );
    case 'sync_error':
    default:
      return preset(
        <Zap className="w-10 h-10 rotate-180" />,
        'bg-md-error/10 border border-md-error/20 text-md-error shadow-md-error/5',
        'Ошибка синхронизации',
        'Произошла ошибка при попытке синхронизации данных. Пожалуйста, обновите страницу или попробуйте позже.',
        'Обновить страницу'
      );
  }
}
