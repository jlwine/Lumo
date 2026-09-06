'use client';

import {
  tr,
} from '@/i18n/core';

import {
  useLanguageVersion,
} from '@/i18n/use-language';

import {
  useState,
  type FormEvent,
} from 'react';

import Link from 'next/link';

import {
  useRouter,
} from 'next/navigation';

import {
  LumoBrand,
  LumoMark,
} from '@/components/lumo-brand';

import {
  apiRequest,
} from '@/lib/api';

import {
  saveAccessToken,
} from '@/lib/auth';

import type {
  LoginResponse,
} from '@/types/auth';

export default function LoginPage() {
  useLanguageVersion();

  const router =
    useRouter();

  const [
    login,
    setLogin,
  ] =
    useState('');

  const [
    password,
    setPassword,
  ] =
    useState('');

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(false);

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError(
      null,
    );

    setIsLoading(
      true,
    );

    try {
      const response =
        await apiRequest<LoginResponse>(
          '/auth/login',
          {
            method:
              'POST',

            body:
              JSON.stringify({
                login,
                password,
              }),
          },
        );

      saveAccessToken(
        response.accessToken,
      );

      router.push(
        '/home',
      );
    } catch (error) {
      if (
        error instanceof Error
      ) {
        setError(
          error.message,
        );
      } else {
        setError(
          tr(
            'Не удалось выполнить вход',
          ),
        );
      }
    } finally {
      setIsLoading(
        false,
      );
    }
  }

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-8">

      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-[32px] border border-[var(--border)] bg-[var(--surface)] shadow-[0_30px_100px_rgba(115,75,70,0.10)]">

        <section
          className="relative hidden w-1/2 flex-col justify-between overflow-hidden p-12 lg:flex"
          style={{
            background:
              'linear-gradient(135deg, var(--accent-soft) 0%, var(--surface-soft) 48%, var(--lavender-soft) 100%)',
          }}
        >

          <div className="pointer-events-none absolute -right-24 -top-24 h-[320px] w-[320px] rounded-full bg-white/20 blur-3xl" />

          <div className="relative">

            <div className="mb-16">

              <LumoBrand
                markSize={54}
                showTagline
                wordmarkClassName="text-[34px]"
              />

            </div>

            <h1 className="max-w-lg text-5xl font-semibold leading-tight text-[var(--text-primary)]">

              {tr(
                'Ваши планы рядом, даже когда вы далеко.',
              )}

            </h1>

            <p className="mt-6 max-w-md text-lg leading-8 text-[var(--text-secondary)]">

              {tr(
                'Совместный календарь, желания, фотографии и маленькие моменты, которые принадлежат только вам двоим.',
              )}

            </p>

          </div>

          <div className="relative rounded-[28px] border border-[var(--border-soft)] bg-[var(--surface)]/60 p-6 backdrop-blur">

            <div className="flex items-center gap-4">

              <LumoMark
                size={38}
              />

              <p className="text-sm text-[var(--text-secondary)]">

                {tr(
                  '♡ Здесь будет ваше общее пространство',
                ).replace(
                  '♡ ',
                  '',
                )}

              </p>

            </div>

          </div>

        </section>

        <section className="flex w-full items-center justify-center bg-[var(--surface)] px-6 py-12 lg:w-1/2 lg:px-16">

          <div className="w-full max-w-md">

            <div className="mb-10 lg:hidden">

              <LumoBrand
                markSize={46}
                showTagline
                wordmarkClassName="text-[30px]"
              />

            </div>

            <div className="mb-8">

              <p className="mb-2 text-sm font-medium text-[var(--accent)]">

                {tr(
                  'С возвращением ♡',
                )}

              </p>

              <h2 className="text-4xl font-semibold text-[var(--text-primary)]">

                {tr(
                  'Войти',
                )}

              </h2>

              <p className="mt-3 text-[var(--text-muted)]">

                {tr(
                  'Введите email или никнейм, чтобы продолжить.',
                )}

              </p>

            </div>

            <form
              onSubmit={
                handleSubmit
              }
              className="space-y-5"
            >

              <div>

                <label
                  htmlFor="login"
                  className="mb-2 block text-sm font-medium text-[var(--text-secondary)]"
                >
                  {tr(
                    'Email или никнейм',
                  )}
                </label>

                <input
                  id="login"
                  type="text"
                  value={
                    login
                  }
                  onChange={(
                    event,
                  ) =>
                    setLogin(
                      event.target.value,
                    )
                  }
                  placeholder="chervy4k"
                  autoComplete="username"
                  required
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3.5 text-[var(--text-primary)] outline-none transition-all duration-200 placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)]"
                />

              </div>

              <div>

                <div className="mb-2 flex items-center justify-between gap-4">

                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-[var(--text-secondary)]"
                  >
                    {tr(
                      'Пароль',
                    )}
                  </label>

                  <Link
                    href="/forgot-password"
                    className="text-xs font-medium text-[var(--accent)] transition hover:brightness-110 hover:underline"
                  >
                    {tr(
                      'Забыли пароль?',
                    )}
                  </Link>

                </div>

                <input
                  id="password"
                  type="password"
                  value={
                    password
                  }
                  onChange={(
                    event,
                  ) =>
                    setPassword(
                      event.target.value,
                    )
                  }
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3.5 text-[var(--text-primary)] outline-none transition-all duration-200 placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)]"
                />

              </div>

              {error && (
                <div className="rounded-2xl border border-[#efc9cc] bg-[var(--accent-soft)] px-4 py-3 text-sm text-[#c46973]">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={
                  isLoading
                }
                className="w-full cursor-pointer rounded-2xl bg-[var(--accent)] px-5 py-3.5 font-medium text-white shadow-sm transition-all duration-200 hover:-translate-y-[1px] hover:brightness-105 hover:shadow-md active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >

                {isLoading
                  ? tr(
                      'Входим...',
                    )
                  : tr(
                      'Войти',
                    )}

              </button>

            </form>

            <div className="mt-8 text-center text-sm text-[var(--text-muted)]">

              {tr(
                'Ещё нет аккаунта?',
              )}
              {' '}

              <Link
                href="/register"
                className="font-medium text-[var(--accent)] transition hover:brightness-110 hover:underline"
              >
                {tr(
                  'Зарегистрироваться',
                )}
              </Link>

            </div>

          </div>

        </section>

      </div>

    </main>
  );
}