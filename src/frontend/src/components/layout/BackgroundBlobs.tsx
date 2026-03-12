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

import clsx from 'clsx';
import type { ReactElement } from 'react';

type BackgroundBlobsProps = {
  isPerformanceMode?: boolean;
};

export function BackgroundBlobs({
  isPerformanceMode = false,
}: BackgroundBlobsProps): ReactElement {
  return (
    <>
      <div className="fixed inset-0 -z-30 overflow-hidden pointer-events-none">
        <div
          className={clsx(
            'absolute -top-[10%] -left-[10%] w-[55vw] h-[55vw] bg-md-primary pointer-events-none rounded-full will-change-transform mix-blend-screen transition-all duration-1000',
            isPerformanceMode
              ? 'opacity-[0.03] blur-[40px]'
              : 'opacity-0 [@media(pointer:fine)]:opacity-20 [@media(pointer:fine)]:filter [@media(pointer:fine)]:blur-[80px] [@media(pointer:fine)]:animate-blob-morph [@media(pointer:fine)]:[animation-duration:15s] [@media(pointer:fine)]:[animation-delay:0s]'
          )}
        />
        <div
          className={clsx(
            'absolute -bottom-[20%] -right-[10%] w-[65vw] h-[65vw] bg-md-tertiary pointer-events-none rounded-full will-change-transform mix-blend-screen transition-all duration-1000',
            isPerformanceMode
              ? 'opacity-[0.03] blur-[40px]'
              : 'opacity-0 [@media(pointer:fine)]:opacity-20 [@media(pointer:fine)]:filter [@media(pointer:fine)]:blur-[80px] [@media(pointer:fine)]:opacity-20 [@media(pointer:fine)]:animate-blob-morph [@media(pointer:fine)]:[animation-duration:22s] [@media(pointer:fine)]:[animation-delay:-3s]'
          )}
        />
      </div>

      <div
        className={clsx(
          'fixed bottom-0 left-0 w-full h-[45vh] -z-20 pointer-events-none overflow-hidden transition-opacity duration-1000',
          isPerformanceMode ? 'opacity-20' : 'opacity-50'
        )}
      >
        <div
          className={clsx(
            'absolute bottom-0 left-0 w-[200%] h-full bg-repeat-x bg-[position:0_bottom] bg-[size:50%_100%] z-30',
            !isPerformanceMode && '[@media(pointer:fine)]:animate-wave-slide'
          )}
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 100' preserveAspectRatio='none'%3E%3Cpath d='M0,50 C200,100 200,0 400,50 C600,100 600,0 800,50 L800,100 L0,100 Z' fill='rgba(208, 188, 255, 0.05)'/%3E%3C/svg%3E\")",
          }}
        />
        {!isPerformanceMode && (
          <div
            className="absolute bottom-0 left-0 w-[200%] h-full bg-repeat-x bg-[position:0_bottom] bg-[size:50%_100%] z-20 transform scale-y-[1.4] translate-y-[10px] [@media(pointer:fine)]:animate-wave-slide [@media(pointer:fine)]:[animation-duration:28s] [@media(pointer:fine)]:[animation-direction:reverse]"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 100' preserveAspectRatio='none'%3E%3Cpath d='M0,50 C200,0 200,100 400,50 C600,0 600,100 800,50 L800,100 L0,100 Z' fill='rgba(239, 184, 200, 0.04)'/%3E%3C/svg%3E\")",
            }}
          />
        )}
      </div>
    </>
  );
}
