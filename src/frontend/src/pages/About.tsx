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
import { ArrowUpRight } from 'lucide-react';
import type { CSSProperties, MouseEvent, ReactElement } from 'react';
import { BackgroundBlobs } from '../components/layout/BackgroundBlobs.tsx';
import { CursorGlow } from '../components/layout/CursorGlow.tsx';
import { Footer } from '../components/layout/Footer.tsx';
import { Header } from '../components/layout/Header.tsx';
import { ScrollProgress } from '../components/layout/ScrollProgress.tsx';
import { Ripple } from '../components/ui/Ripple.tsx';
import { usePageMeta } from '../hooks/usePageMeta.ts';

type DeveloperCard = {
  name: string;
  nameParts?: {
    left: string;
    core: string;
    right: string;
    code?: string;
  };
  role: string;
  summary: string;
  initials: string;
  accent: string;
  accentSecondary: string;
  badge: string;
  profileUrl: string;
  avatarUrl: string;
};

const DEVELOPERS: DeveloperCard[] = [
  {
    name: '×[Shark]× </>',
    nameParts: {
      left: '×[',
      core: 'Shark',
      right: ']×',
      code: '</>',
    },
    role: 'Frontend / UI',
    summary: 'Чем больше девушку ты любишь, тем больше лучше мы чем чем',
    initials: 'A',
    accent: '#D0BCFF',
    accentSecondary: '#9D84FF',
    badge: 'UI/UX',
    profileUrl: 'https://t.me/now_shark',
    avatarUrl: '/avatars/now_shark.jpg',
  },
  {
    name: 'Czar',
    role: 'Backend / API',
    summary: 'Чем гуще лес if else if else',
    initials: 'B',
    accent: '#EFB8C8',
    accentSecondary: '#7C66FF',
    badge: 'Core',
    profileUrl: 'https://t.me/Cczzar',
    avatarUrl: '/avatars/czar.jpg',
  },
];

const LINKS = [
  {
    href: 'https://t.me/opec55',
    title: 'Телеграм канал',
    value: 't.me/opec55',
    icon: (
      <svg
        viewBox="0 0 496 512"
        aria-hidden="true"
        className="about-link-icon-svg"
        fill="currentColor"
      >
        <path d="M248 8C111 8 0 119 0 256s111 248 248 248 248-111 248-248S385 8 248 8zm121.8 171.8-40.7 192.1c-3.1 14.6-11.1 18.2-22.5 11.3l-62.2-45.9-30 28.9c-3.3 3.3-6.1 6.1-12.5 6.1l4.4-62.6 114-103.2c5-4.4-1.1-6.9-7.7-2.5l-140.9 88.7-60.7-19c-13.2-4.1-13.5-13.2 2.8-19.6l237.2-91.4c11-4.1 20.6 2.7 17.8 17.1z" />
      </svg>
    ),
    variant: 'telegram',
  },
  {
    href: 'https://github.com/Cczzarr/OPEC',
    title: 'Исходный код',
    value: 'github.com/Cczzarr/OPEC',
    icon: (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="w-7 h-7"
        fill="currentColor"
      >
        <path d="M12 .5C5.73.5.5 5.74.5 12.02c0 5.1 3.29 9.43 7.86 10.96.58.1.79-.25.79-.56v-2.18c-3.2.7-3.88-1.55-3.88-1.55-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.2 1.77 1.2 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.72-1.55-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.19-3.1-.12-.3-.52-1.52.11-3.16 0 0 .97-.31 3.18 1.18a11.06 11.06 0 0 1 5.79 0c2.21-1.49 3.18-1.18 3.18-1.18.63 1.64.23 2.86.11 3.16.74.81 1.19 1.84 1.19 3.1 0 4.43-2.69 5.41-5.25 5.69.41.35.77 1.05.77 2.12v3.14c0 .31.21.67.8.56A11.52 11.52 0 0 0 23.5 12C23.5 5.74 18.27.5 12 .5z" />
      </svg>
    ),
    variant: 'github',
  },
];

type AvatarStyle = CSSProperties & {
  '--avatar-accent': string;
  '--avatar-accent-2': string;
};

function getDeveloperAvatarStyle(developer: DeveloperCard): AvatarStyle {
  return {
    '--avatar-accent': developer.accent,
    '--avatar-accent-2': developer.accentSecondary,
  };
}

function handleMouseMove(event: MouseEvent<HTMLElement>): void {
  const target = event.currentTarget;
  const rect = target.getBoundingClientRect();
  target.style.setProperty('--mouse-x', `${event.clientX - rect.left}px`);
  target.style.setProperty('--mouse-y', `${event.clientY - rect.top}px`);
}

function renderDeveloperName(developer: DeveloperCard): ReactElement | string {
  const { nameParts } = developer;
  if (!nameParts) {
    return developer.name;
  }

  const { left, core, right, code } = nameParts;
  return (
    <span className="about-name-styled">
      <span className="about-name-symbol">{left}</span>
      <span>{core}</span>
      <span className="about-name-symbol">{right}</span>
      {code && (
        <span className="about-name-code">{code}</span>
      )}
    </span>
  );
}

export function About(): ReactElement {
  usePageMeta({
    title: 'О нас — ОПЭК',
    description:
      'Команда проекта ОПЭК: кто разрабатывает сервис расписания, роли участников и ссылки на официальные ресурсы.',
    path: '/about',
  });

  return (
    <>
      <ScrollProgress />
      <CursorGlow />
      <BackgroundBlobs />
      <Header />

      <main className="container mx-auto px-6 max-w-[1200px] relative z-10 pt-32">
        <section className="flex flex-col items-center text-center">
          <h1 className="text-[clamp(2.6rem,4.8vw,4.2rem)] font-black tracking-[-0.04em] text-md-on-surface">
            Разработчики
          </h1>
          <p className="mt-4 text-lg text-md-on-surface-variant/80 max-w-[520px]">
            Те, кто делает расписание быстрым и удобным.
          </p>
        </section>

        <section className="mt-12 grid gap-6 md:grid-cols-2">
          {DEVELOPERS.map((developer) => (
            <article
              key={`${developer.name}-${developer.role}`}
              className="about-tile group"
              onMouseMove={handleMouseMove}
            >
              <div
                className="about-avatar"
                style={getDeveloperAvatarStyle(developer)}
              >
                <div className="about-avatar-media">
                  <img
                    src={developer.avatarUrl}
                    alt="ОПЭК"
                    className="about-avatar-image"
                    loading="lazy"
                    decoding="async"
                    width={92}
                    height={92}
                  />
                </div>
              </div>
              <div className="about-tile-content">
                <div className="about-tile-header">
                  <div>
                    <h3 className="about-tile-title">{renderDeveloperName(developer)}</h3>
                    <p className="about-tile-role">{developer.role}</p>
                  </div>
                  <span className="about-badge">{developer.badge}</span>
                </div>
                <p className="about-tile-summary">{developer.summary}</p>
                <div className="about-tile-footer">
                  <a
                    className="about-tile-link"
                    href={developer.profileUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Открыть профиль
                    <ArrowUpRight className="about-profile-arrow" />
                  </a>
                </div>
              </div>
            </article>
          ))}
        </section>

        <section className="mt-20 flex flex-col items-center">
          <h2 className="text-[clamp(2.6rem,4.8vw,4.2rem)] font-black tracking-[-0.04em] text-md-on-surface text-center">
            Ссылки проекта
          </h2>
          <p className="mt-4 text-lg text-md-on-surface-variant/80 max-w-[520px] text-center">
            Ссылки на ресурсы связанные с проектом.
          </p>
          <div className="mt-12 grid gap-6 md:grid-cols-2 w-full">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className={clsx('about-link group', link.variant === 'github' && 'about-link--github')}
                onMouseMove={handleMouseMove}
              >
                <Ripple />
                <div className="about-link-icon">{link.icon}</div>
                <div className="about-link-text">
                  <strong>{link.title}</strong>
                  <span>{link.value}</span>
                </div>
                <ArrowUpRight className="about-link-arrow" />
              </a>
            ))}
          </div>
        </section>

        <div className="mt-24">
          <Footer />
        </div>
      </main>
    </>
  );
}
