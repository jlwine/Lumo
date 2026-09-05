'use client';

import {
  Moon,
  Sun,
} from 'lucide-react';

import {
  tr,
} from '@/i18n/core';

import {
  useLanguageVersion,
} from '@/i18n/use-language';

const STORAGE_KEY =
  'vdvoem_theme';

export function ThemeToggle() {
  useLanguageVersion();

  function toggleTheme() {
    const root =
      document.documentElement;

    const isDark =
      root.classList.contains(
        'dark',
      );

    const nextTheme =
      isDark
        ? 'light'
        : 'dark';

    if (
      nextTheme ===
      'dark'
    ) {
      root.classList.add(
        'dark',
      );
    } else {
      root.classList.remove(
        'dark',
      );
    }

    root.dataset.theme =
      nextTheme;

    localStorage.setItem(
      STORAGE_KEY,
      nextTheme,
    );
  }

  return (
    <button
      type="button"
      onClick={
        toggleTheme
      }
      title={tr('Переключить тему')}
      aria-label={tr('Переключить тему')}
      className="group fixed bottom-5 right-5 z-[500] flex h-12 w-12 items-center justify-center rounded-full border border-[#eadbd7] bg-white/90 text-[#806a65] shadow-[0_12px_40px_rgba(73,48,45,0.16)] backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-[#dca9ad] hover:bg-[#fff4f2] hover:text-[#c36f77] hover:shadow-[0_16px_45px_rgba(73,48,45,0.22)] active:scale-[0.94] dark:border-[#4b3c40] dark:bg-[#2a2325]/95 dark:text-[#e4b9c0] dark:shadow-[0_14px_45px_rgba(0,0,0,0.30)] dark:hover:border-[#73565d] dark:hover:bg-[#382b2e] dark:hover:text-[#f1c4ca]"
    >

      {/*
       * Луна отображается
       * только в светлой теме.
       */}
      <Moon
        size={20}
        className="absolute rotate-0 scale-100 opacity-100 transition-all duration-300 dark:rotate-90 dark:scale-75 dark:opacity-0"
      />

      {/*
       * Солнце отображается
       * только в тёмной теме.
       */}
      <Sun
        size={20}
        className="absolute -rotate-90 scale-75 opacity-0 transition-all duration-300 dark:rotate-0 dark:scale-100 dark:opacity-100"
      />

    </button>
  );
}