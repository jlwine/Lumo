import type {
  Metadata,
} from 'next';

import {
  Geist,
  Geist_Mono,
} from 'next/font/google';

import Script from 'next/script';

import {
  LanguageToggle,
} from '../components/language-toggle';

import {
  ThemeToggle,
} from '../components/theme-toggle';

import './globals.css';

const geistSans =
  Geist({
    variable:
      '--font-geist-sans',

    subsets: [
      'latin',
    ],
  });

const geistMono =
  Geist_Mono({
    variable:
      '--font-geist-mono',

    subsets: [
      'latin',
    ],
  });

export const metadata:
  Metadata = {
    title: {
      default:
        'Lumo',

      template:
        '%s · Lumo',
    },

    description:
      'Lumo — ваше пространство для двоих',

    applicationName:
      'Lumo',

    icons: {
      icon:
        '/icon.svg',

      shortcut:
        '/icon.svg',
    },
  };

/*
 * Начальные пользовательские настройки.
 *
 * В localStorage пока сохраняем старые ключи vdvoem_*.
 * Это сделано намеренно, чтобы после ребрендинга
 * у существующих пользователей не сбросились
 * выбранные язык и тема.
 *
 * Позже можно сделать бесшовную миграцию
 * на ключи lumo_*.
 */
const preferencesScript = `
(function () {
  var root = document.documentElement;

  try {
    var savedTheme =
      localStorage.getItem(
        'vdvoem_theme'
      );

    var shouldUseDark =
      savedTheme === 'dark' ||
      (
        !savedTheme &&
        window.matchMedia &&
        window.matchMedia(
          '(prefers-color-scheme: dark)'
        ).matches
      );

    if (shouldUseDark) {
      root.classList.add(
        'dark'
      );

      root.dataset.theme =
        'dark';
    } else {
      root.classList.remove(
        'dark'
      );

      root.dataset.theme =
        'light';
    }
  } catch (error) {
    root.dataset.theme =
      'light';
  }

  try {
    var savedLanguage =
      localStorage.getItem(
        'vdvoem_language'
      );

    var browserLanguage =
      navigator.languages &&
      navigator.languages.length > 0
        ? navigator.languages[0]
        : navigator.language || 'ru';

    var language =
      savedLanguage === 'en' ||
      savedLanguage === 'ru'
        ? savedLanguage
        : browserLanguage
            .toLowerCase()
            .startsWith('en')
          ? 'en'
          : 'ru';

    root.dataset.locale =
      language;

    root.lang =
      language;
  } catch (error) {
    root.dataset.locale =
      'ru';

    root.lang =
      'ru';
  }
})();
`;

export default function RootLayout({
  children,
}: LayoutProps<'/'>) {
  return (
    <html
      lang="ru"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >

      <body className="flex min-h-full flex-col">

        <Script
          id="lumo-preferences"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html:
              preferencesScript,
          }}
        />

        {children}

        <LanguageToggle />
        <ThemeToggle />

      </body>

    </html>
  );
}