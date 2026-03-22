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

import { createContext, useContext } from 'react';

export type SsgPayload = {
  teachers: string[];
};

export const SsgPayloadContext = createContext<SsgPayload>({ teachers: [] });

export function useSsgPayload(): SsgPayload {
  return useContext(SsgPayloadContext);
}

