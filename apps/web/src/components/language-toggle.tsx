'use client';

import {
  Languages,
} from 'lucide-react';

import {
  getCurrentLocale,
  setCurrentLocale,
  tr,
} from '@/i18n/core';

import {
  useLanguageVersion,
} from '@/i18n/use-language';

export function LanguageToggle() {
  useLanguageVersion();

  const locale =
    getCurrentLocale();

  const nextLocale =
    locale === 'ru'
      ? 'en'
      : 'ru';

  return (
    <button
      type="button"
      onClick={() =>
        setCurrentLocale(
          nextLocale,
        )
      }
      title={
        locale === 'ru'
          ? 'Switch to English'
          : 'Переключить на русский'
      }
      aria-label={
        locale === 'ru'
          ? 'Switch to English'
          : 'Переключить на русский'
      }
      className="group fixed bottom-5 right-[76px] z-[500] flex h-12 min-w-12 items-center justify-center gap-1.5 rounded-full border border-[#eadbd7] bg-white/90 px-3 text-[#806a65] shadow-[0_12px_40px_rgba(73,48,45,0.16)] backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-[#dca9ad] hover:bg-[#fff4f2] hover:text-[#c36f77] hover:shadow-[0_16px_45px_rgba(73,48,45,0.22)] active:scale-[0.94] dark:border-[#4b3c40] dark:bg-[#2a2325]/95 dark:text-[#e4b9c0] dark:shadow-[0_14px_45px_rgba(0,0,0,0.30)] dark:hover:border-[#73565d] dark:hover:bg-[#382b2e] dark:hover:text-[#f1c4ca]"
    >
      <Languages
        size={18}
      />

      <span className="text-[11px] font-semibold uppercase tracking-wide">
        {locale}
      </span>
    </button>
  );
}
