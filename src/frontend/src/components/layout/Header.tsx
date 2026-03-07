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
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import type { MouseEvent, ReactElement, ReactNode } from 'react';

import { Ripple } from '../ui/Ripple.tsx';

type NavLinkProps = {
  href: string;
  children: ReactNode;
};

const SCROLL_THRESHOLD_PX = 20;

function NavLink({ href, children }: NavLinkProps): ReactElement {
  return (
    <Link
      to={href}
      className="relative overflow-hidden text-md-on-surface-variant font-bold text-[0.95rem] px-5 py-2.5 rounded-full transition-colors duration-400 ease-spring hover:text-md-on-surface group"
    >
      <Ripple />
      <span className="relative z-10 flex items-center gap-2">{children}</span>
      <div className="absolute inset-0 bg-white/5 rounded-full opacity-0 scale-75 translate-y-2 transition-all duration-400 ease-spring group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0 -z-0" />
    </Link>
  );
}

export function Header(): ReactElement {
  const [scrolled, setScrolled] = useState(() =>
    typeof window !== 'undefined' ? window.scrollY > SCROLL_THRESHOLD_PX : false
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    function handleScroll(): void {
      setScrolled(window.scrollY > SCROLL_THRESHOLD_PX);
    }

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  function toggleMenu(): void {
    setMobileMenuOpen((prev) => !prev);
  }

  function scrollPageToTop(behavior: ScrollBehavior): void {
    const options: ScrollToOptions = { top: 0, left: 0, behavior };
    window.scrollTo(options);
    document.documentElement.scrollTo(options);
    document.body.scrollTo(options);
  }

  function handleHomeClick(event: MouseEvent<HTMLAnchorElement>): void {
    if (mobileMenuOpen) {
      setMobileMenuOpen(false);
    }

    if (location.pathname !== '/') {
      return;
    }

    event.preventDefault();

    if (location.hash) {
      navigate('/', { replace: true });
    }

    scrollPageToTop('smooth');
  }

  return (
    <>
      <header
        className={clsx(
          'fixed left-1/2 -translate-x-1/2 w-[calc(100%-32px)] md:w-[calc(100%-48px)] max-w-[1192px] z-[100] flex items-center justify-between',
          'rounded-full p-2 transition-all duration-500 cubic-bezier(0.2,0.8,0.2,1)',
          scrolled
            ? 'top-4 bg-[#1d1b20]/85 shadow-[0_16px_40px_rgba(0,0,0,0.5)] border border-white/10 backdrop-blur-xl'
            : 'top-6 bg-[#1d1b20]/40 border border-white/5 backdrop-blur-xl'
        )}
      >
        <Link
          to="/"
          onClick={handleHomeClick}
          className="group relative overflow-hidden flex items-center gap-3 font-extrabold text-[1.2rem] text-md-on-surface no-underline rounded-full pr-4 pl-1 py-1 transition-colors duration-400 hover:bg-white/5"
        >
          <Ripple />
          <img
            src="/tab_logo_84.png"
            alt="ОПЭК"
            className="w-[42px] h-[42px] object-cover rounded-full logo-hover-effect"
            style={{ borderRadius: '50%' }}
          />
          <span className="relative z-10">ОПЭК</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 pr-2">
          <NavLink href="/teachers">Преподаватели</NavLink>
          <NavLink href="/about">О нас</NavLink>
        </nav>

        <button
          onClick={toggleMenu}
          className="relative overflow-hidden md:hidden flex flex-col items-center justify-center gap-[5px] w-12 h-12 rounded-full hover:bg-white/10 transition-colors mr-1"
        >
          <Ripple />
          <span
            className={clsx(
              'w-6 h-[2px] bg-md-on-surface rounded-full transition-all duration-300',
              mobileMenuOpen ? 'rotate-45 translate-y-[7px]' : ''
            )}
          />
          <span
            className={clsx(
              'w-6 h-[2px] bg-md-on-surface rounded-full transition-all duration-300',
              mobileMenuOpen ? 'opacity-0' : ''
            )}
          />
          <span
            className={clsx(
              'w-6 h-[2px] bg-md-on-surface rounded-full transition-all duration-300',
              mobileMenuOpen ? '-rotate-45 -translate-y-[7px]' : ''
            )}
          />
        </button>
      </header>

      <div
        className={clsx(
          'fixed inset-0 bg-md-bg/95 backdrop-blur-2xl z-[90] flex flex-col items-center justify-center gap-6 transition-all duration-500 ease-spring',
          mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
      >
        <Link
          to="/teachers"
          onClick={toggleMenu}
          className="text-2xl font-bold text-md-on-surface hover:text-md-primary transition-colors"
        >
          Преподаватели
        </Link>
        <Link
          to="/about"
          onClick={toggleMenu}
          className="text-2xl font-bold text-md-on-surface hover:text-md-primary transition-colors"
        >
          О нас
        </Link>
      </div>
    </>
  );
}
