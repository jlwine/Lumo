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
  RegisterResponse,
} from '@/types/auth';

export default function RegisterPage() {
  useLanguageVersion();

  const router =
    useRouter();

  const [
    displayName,
    setDisplayName,
  ] =
    useState('');

  const [
    email,
    setEmail,
  ] =
    useState('');

  const [
    nickname,
    setNickname,
  ] =
    useState('');

  const [
    password,
    setPassword,
  ] =
    useState('');

  const [
    confirmPassword,
    setConfirmPassword,
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

    if (
      password !==
      confirmPassword
    ) {
      setError(
        tr(
          'Пароли не совпадают',
        ),
      );

      return;
    }

    setIsLoading(
      true,
    );

    try {
      await apiRequest<RegisterResponse>(
        '/auth/register',
        {
          method:
            'POST',

          body:
            JSON.stringify({
              email:
                email
                  .trim()
                  .toLowerCase(),

              nickname:
                nickname
                  .trim()
                  .toLowerCase(),

              password,

              displayName:
                displayName
                  .trim() ||
                undefined,
            }),
        },
      );

      /*
       * После регистрации сразу
       * выполняем вход, чтобы пользователь
       * не вводил данные повторно.
       */
      const loginResponse =
        await apiRequest<LoginResponse>(
          '/auth/login',
          {
            method:
              'POST',

            body:
              JSON.stringify({
                login:
                  nickname
                    .trim()
                    .toLowerCase(),

                password,
              }),
          },
        );

      saveAccessToken(
        loginResponse.accessToken,
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
            'Не удалось зарегистрироваться',
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

        {/*
         * Левая брендовая часть.
         *
         * Цвета строятся через переменные темы,
         * поэтому отдельные dark:-классы
         * здесь больше не нужны.
         */}
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
                'Создайте ваше пространство для двоих.',
              )}

            </h1>

            <p className="mt-6 max-w-md text-lg leading-8 text-[var(--text-secondary)]">

              {tr(
                'Зарегистрируйтесь, найдите вторую половинку по уникальному никнейму и начните собирать ваши общие моменты.',
              )}

            </p>

          </div>

          <div className="relative rounded-[28px] border border-[var(--border-soft)] bg-[var(--surface-soft)] p-6 backdrop-blur">

            <div className="flex items-center gap-4">

              <LumoMark
                size={38}
              />

              <p className="text-sm leading-6 text-[var(--text-secondary)]">

                {tr(
                  '♡ Один аккаунт. Одно общее пространство. Только для вас двоих.',
                ).replace(
                  '♡ ',
                  '',
                )}

              </p>

            </div>

          </div>

        </section>

        {/*
         * Правая часть с регистрацией.
         */}
        <section className="flex w-full items-center justify-center bg-[var(--surface)] px-6 py-10 lg:w-1/2 lg:px-16">

          <div className="w-full max-w-md">

            <div className="mb-8 lg:hidden">

              <LumoBrand
                markSize={46}
                showTagline
                wordmarkClassName="text-[30px]"
              />

            </div>

            <div className="mb-7">

              <p className="mb-2 text-sm font-medium text-[var(--accent)]">

                {tr(
                  'Начнём знакомство ♡',
                )}

              </p>

              <h2 className="text-4xl font-semibold text-[var(--text-primary)]">

                {tr(
                  'Регистрация',
                )}

              </h2>

              <p className="mt-3 text-[var(--text-muted)]">

                {tr(
                  'Создайте ваше пространство для двоих.',
                )}

              </p>

            </div>

            <form
              onSubmit={
                handleSubmit
              }
              className="space-y-4"
            >

              {/*
               * Имя.
               */}
              <div>

                <label
                  htmlFor="displayName"
                  className="mb-2 block text-sm font-medium text-[var(--text-secondary)]"
                >

                  {tr(
                    'Имя',
                  )}

                </label>

                <input
                  id="displayName"
                  type="text"
                  value={
                    displayName
                  }
                  onChange={(
                    event,
                  ) =>
                    setDisplayName(
                      event.target
                        .value,
                    )
                  }
                  placeholder={
                    tr(
                      'Александр',
                    )
                  }
                  autoComplete="name"
                  maxLength={
                    50
                  }
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3.5 text-[var(--text-primary)] outline-none transition-all duration-200 placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)]"
                />

              </div>

              {/*
               * Email.
               */}
              <div>

                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-[var(--text-secondary)]"
                >
                  Email
                </label>

                <input
                  id="email"
                  type="email"
                  value={
                    email
                  }
                  onChange={(
                    event,
                  ) =>
                    setEmail(
                      event.target
                        .value,
                    )
                  }
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  maxLength={
                    254
                  }
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3.5 text-[var(--text-primary)] outline-none transition-all duration-200 placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)]"
                />

              </div>

              {/*
               * Никнейм.
               *
               * Здесь сохраняем увеличенный
               * отступ слева, потому что
               * внутри поля находится @.
               */}
              <div>

                <label
                  htmlFor="nickname"
                  className="mb-2 block text-sm font-medium text-[var(--text-secondary)]"
                >

                  {tr(
                    'Уникальный никнейм',
                  )}

                </label>

                <div className="relative">

                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                    @
                  </span>

                  <input
                    id="nickname"
                    type="text"
                    value={
                      nickname
                    }
                    onChange={(
                      event,
                    ) =>
                      setNickname(
                        event.target
                          .value
                          .toLowerCase(),
                      )
                    }
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={
                      false
                    }
                    required
                    minLength={
                      3
                    }
                    maxLength={
                      30
                    }
                    className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] py-3.5 pl-9 pr-4 text-[var(--text-primary)] outline-none transition-all duration-200 placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)]"
                  />

                </div>

                <p className="mt-1.5 text-xs text-[var(--text-muted)]">

                  {tr(
                    'Латинские буквы, цифры и _',
                  )}

                </p>

              </div>

              {/*
               * Пароль.
               */}
              <div>

                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-[var(--text-secondary)]"
                >

                  {tr(
                    'Пароль',
                  )}

                </label>

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
                      event.target
                        .value,
                    )
                  }
                  placeholder={
                    tr(
                      'Минимум 8 символов',
                    )
                  }
                  autoComplete="new-password"
                  required
                  minLength={
                    8
                  }
                  maxLength={
                    72
                  }
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3.5 text-[var(--text-primary)] outline-none transition-all duration-200 placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)]"
                />

              </div>

              {/*
               * Повтор пароля.
               */}
              <div>

                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-medium text-[var(--text-secondary)]"
                >

                  {tr(
                    'Повторите пароль',
                  )}

                </label>

                <input
                  id="confirmPassword"
                  type="password"
                  value={
                    confirmPassword
                  }
                  onChange={(
                    event,
                  ) =>
                    setConfirmPassword(
                      event.target
                        .value,
                    )
                  }
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                  minLength={
                    8
                  }
                  maxLength={
                    72
                  }
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
                className="mt-2 w-full cursor-pointer rounded-2xl bg-[var(--accent)] px-5 py-3.5 font-medium text-white shadow-sm transition-all duration-200 hover:-translate-y-[1px] hover:brightness-105 hover:shadow-md active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >

                {isLoading
                  ? tr(
                      'Создаём аккаунт...',
                    )
                  : tr(
                      'Создать аккаунт',
                    )}

              </button>

            </form>

            <div className="mt-7 text-center text-sm text-[var(--text-muted)]">

              {tr(
                'Уже есть аккаунт?',
              )}
              {' '}

              <Link
                href="/login"
                className="font-medium text-[var(--accent)] transition hover:brightness-110 hover:underline"
              >

                {tr(
                  'Войти',
                )}

              </Link>

            </div>

          </div>

        </section>

      </div>

    </main>
  );
}