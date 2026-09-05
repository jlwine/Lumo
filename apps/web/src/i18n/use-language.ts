'use client';

import {
  useSyncExternalStore,
} from 'react';

import {
  getCurrentLocale,
  initializeCurrentLocale,
  LANGUAGE_CHANGE_EVENT,
} from './core';

function subscribe(
  callback: () => void,
) {
  window.addEventListener(
    LANGUAGE_CHANGE_EVENT,
    callback,
  );

  /*
   * Инициализируем сохранённый язык только после гидрации.
   *
   * На сервере и во время самого первого клиентского рендера
   * snapshot всегда русский. Поэтому HTML совпадает.
   * После подключения подписки читаем localStorage/data-locale
   * и, если нужен английский, делаем обычный клиентский ререндер.
   */
  queueMicrotask(() => {
    initializeCurrentLocale();
  });

  return () => {
    window.removeEventListener(
      LANGUAGE_CHANGE_EVENT,
      callback,
    );
  };
}

export function useLanguageVersion() {
  return useSyncExternalStore(
    subscribe,
    getCurrentLocale,
    () => 'ru',
  );
}
