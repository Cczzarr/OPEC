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

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        md: {
          bg: '#0F0D13',
          surface: '#1D1B20',
          primary: '#D0BCFF',
          tertiary: '#EFB8C8',
          'primary-container': '#4F378B',
          'on-surface': '#E6E0E9',
          'on-surface-variant': '#CAC4D0',
          secondary: '#CCC2DC',
          'secondary-container': '#4A4458',
        },
        brand: {
          sbp: '#9D84FF',
        }
      },
      fontFamily: {
        main: ['Manrope', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.2, 0.8, 0.2, 1)',
        'emphasized': 'cubic-bezier(0.2, 0, 0, 1)',
      },
      animation: {
        'blob-morph': 'blob-morph 6s ease-in-out infinite alternate',
        'spin-blob': 'spin-blob 20s linear infinite',
        'wave-slide': 'wave-slide 22s linear infinite',
        'ripple': 'ripple 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards',
      },
      keyframes: {
        'ripple': {
          'to': { transform: 'scale(4)', opacity: '0' },
        },
        'blob-morph': {
          '0%': { borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' },
          '25%': { borderRadius: '40% 60% 70% 30% / 50% 60% 30% 60%' },
          '50%': { borderRadius: '70% 30% 50% 50% / 30% 30% 70% 70%' },
          '75%': { borderRadius: '30% 70% 40% 60% / 60% 40% 60% 40%' },
          '100%': { borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' },
        },
        'spin-blob': {
          'from': { transform: 'rotate(0deg)' },
          'to': { transform: 'rotate(360deg)' },
        },
        'wave-slide': {
          '0%': { transform: 'translateX(0) scaleY(1)' },
          '50%': { transform: 'translateX(-25%) scaleY(1.05)' },
          '100%': { transform: 'translateX(-50%) scaleY(1)' },
        }
      }
    },
  },
  plugins: [],
}
