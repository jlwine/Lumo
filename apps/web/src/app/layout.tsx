import type {
  Metadata,
} from 'next';

import {
  Geist,
  Geist_Mono,
} from 'next/font/google';

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
    title:
      'Вдвоём',

    description:
      'Общее пространство для двоих',
  };

/*
 * Этот скрипт выполняется
 * до загрузки React.
 *
 * Поэтому при обновлении страницы
 * браузер сразу применяет нужную тему
 * и не показывает белую вспышку.
 */
const themeScript = `
(function () {
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

    var root =
      document.documentElement;

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
    document.documentElement.dataset.theme =
      'light';
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

      <head>

        <script
          dangerouslySetInnerHTML={{
            __html:
              themeScript,
          }}
        />

      </head>

      <body className="flex min-h-full flex-col">

        {children}

        <ThemeToggle />

      </body>

    </html>
  );
}