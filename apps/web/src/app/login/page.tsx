'use client';

import {
  getIntlLocale,
  tr,
} from '@/i18n/core';

import {
  useLanguageVersion,
} from '@/i18n/use-language';

import {
  useState,
  type FormEvent,
} from 'react';

import { useRouter } from 'next/navigation';

import { apiRequest } from '@/lib/api';
import { saveAccessToken } from '@/lib/auth';

import type { LoginResponse } from '@/types/auth';

export default function LoginPage() {
  useLanguageVersion();

  const router = useRouter();

  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState<string | null>(
    null,
  );

  const [isLoading, setIsLoading] =
    useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError(null);
    setIsLoading(true);

    try {
      const response =
        await apiRequest<LoginResponse>(
          '/auth/login',
          {
            method: 'POST',

            body: JSON.stringify({
              login,
              password,
            }),
          },
        );

      saveAccessToken(
        response.accessToken,
      );

      router.push('/home');
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError(
          tr('Не удалось выполнить вход'),
        );
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fffaf8] px-4 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-[32px] border border-[#f0e1dd] bg-white shadow-[0_30px_100px_rgba(115,75,70,0.10)]">

        <section className="hidden w-1/2 flex-col justify-between bg-gradient-to-br from-[#f8dfe2] via-[#f7e8ed] to-[#e8e1f5] p-12 lg:flex">
          <div>
            <div className="mb-16 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/70 text-2xl">
                ♡
              </div>

              <span className="text-3xl font-semibold text-[#574543]">{tr('Вдвоём')}</span>
            </div>

            <h1 className="max-w-lg text-5xl font-semibold leading-tight text-[#554442]">{tr('Ваши планы рядом, даже когда вы далеко.')}</h1>

            <p className="mt-6 max-w-md text-lg leading-8 text-[#806c69]">{tr('Совместный календарь, желания, фотографии и маленькие моменты, которые принадлежат только вам двоим.')}</p>
          </div>

          <div className="rounded-[28px] bg-white/55 p-6 backdrop-blur">
            <p className="text-sm text-[#806c69]">{tr('♡ Здесь будет ваше общее пространство')}</p>
          </div>
        </section>

        <section className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2 lg:px-16">
          <div className="w-full max-w-md">

            <div className="mb-10 lg:hidden">
              <span className="text-3xl font-semibold text-[#574543]">
                {tr('♡ Вдвоём')}
              </span>
            </div>

            <div className="mb-8">
              <p className="mb-2 text-sm font-medium text-[#d17d83]">{tr('С возвращением ♡')}</p>

              <h2 className="text-4xl font-semibold text-[#4f403e]">{tr('Войти')}</h2>

              <p className="mt-3 text-[#96827e]">{tr('Введите email или никнейм, чтобы продолжить.')}</p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              <div>
                <label
                  htmlFor="login"
                  className="mb-2 block text-sm font-medium text-[#665451]"
                >{tr('Email или никнейм')}</label>

                <input
                  id="login"
                  type="text"
                  value={login}
                  onChange={(event) =>
                    setLogin(
                      event.target.value,
                    )
                  }
                  placeholder="chervy4k"
                  autoComplete="username"
                  required
                  className="w-full rounded-2xl border border-[#eadbd7] bg-[#fffdfc] px-4 py-3.5 text-[#4f403e] outline-none transition placeholder:text-[#c3b3af] focus:border-[#df9ca1] focus:ring-4 focus:ring-[#f7e3e5]"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-[#665451]"
                >{tr('Пароль')}</label>

                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value,
                    )
                  }
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full rounded-2xl border border-[#eadbd7] bg-[#fffdfc] px-4 py-3.5 text-[#4f403e] outline-none transition placeholder:text-[#c3b3af] focus:border-[#df9ca1] focus:ring-4 focus:ring-[#f7e3e5]"
                />
              </div>

              {error && (
                <div className="rounded-2xl border border-[#f3cccc] bg-[#fff2f2] px-4 py-3 text-sm text-[#a94c52]">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-2xl bg-[#df8e94] px-5 py-3.5 font-medium text-white shadow-sm transition hover:bg-[#d77c83] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading
                  ? tr('Входим...')
                  : tr('Войти')}
              </button>
            </form>

            <div className="mt-8 text-center text-sm text-[#998681]">
              {tr('Ещё нет аккаунта?')}{' '}

              <a
                href="/register"
                className="font-medium text-[#d17d83] hover:underline"
              >{tr('Зарегистрироваться')}</a>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}