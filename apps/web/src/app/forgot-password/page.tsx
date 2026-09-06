'use client';

import {
  useState,
  type FormEvent,
} from 'react';

import Link from 'next/link';

import {
  Mail,
} from 'lucide-react';

import {
  LumoBrand,
} from '@/components/lumo-brand';

import {
  tr,
} from '@/i18n/core';

import {
  useLanguageVersion,
} from '@/i18n/use-language';

import {
  apiRequest,
} from '@/lib/api';

import type {
  AuthActionResponse,
} from '@/types/auth';

export default function ForgotPasswordPage() {
  useLanguageVersion();

  const [
    email,
    setEmail,
  ] =
    useState('');

  const [
    submittedEmail,
    setSubmittedEmail,
  ] =
    useState('');

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(false);

  const [
    isSent,
    setIsSent,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );

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

    const normalizedEmail =
      email
        .trim()
        .toLowerCase();

    try {
      await apiRequest<AuthActionResponse>(
        '/auth/forgot-password',
        {
          method:
            'POST',

          body:
            JSON.stringify({
              email:
                normalizedEmail,
            }),
        },
      );

      setSubmittedEmail(
        normalizedEmail,
      );

      setIsSent(
        true,
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
            'Не удалось отправить ссылку восстановления',
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
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-8">

      <div className="w-full max-w-[560px] rounded-[32px] border border-[var(--border)] bg-[var(--surface)] p-8 shadow-[0_30px_100px_rgba(115,75,70,0.10)] sm:p-10">

        <div className="mb-9">

          <LumoBrand
            markSize={46}
            showTagline
            wordmarkClassName="text-[30px]"
          />

        </div>

        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">

          <Mail
            size={25}
          />

        </div>

        {isSent ? (
          <>

            <h1 className="mt-6 text-3xl font-semibold text-[var(--text-primary)]">
              {tr(
                'Проверьте почту',
              )}
            </h1>

            <p className="mt-3 leading-7 text-[var(--text-secondary)]">
              {tr(
                'Если аккаунт с таким email существует, мы отправили ссылку для восстановления пароля.',
              )}
            </p>

            {submittedEmail && (
              <div className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--text-secondary)]">
                {submittedEmail}
              </div>
            )}

            <div className="mt-8 flex flex-col gap-3">

              <button
                type="button"
                onClick={() =>
                  setIsSent(
                    false,
                  )
                }
                className="w-full cursor-pointer rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-5 py-3.5 font-medium text-[var(--text-primary)] transition-all duration-200 hover:-translate-y-[1px] hover:border-[var(--accent)] active:translate-y-0 active:scale-[0.98]"
              >
                {tr(
                  'Отправить ещё раз',
                )}
              </button>

              <Link
                href="/login"
                className="w-full rounded-2xl bg-[var(--accent)] px-5 py-3.5 text-center font-medium text-white transition-all duration-200 hover:-translate-y-[1px] hover:brightness-105 active:translate-y-0 active:scale-[0.98]"
              >
                {tr(
                  'Вернуться ко входу',
                )}
              </Link>

            </div>

          </>
        ) : (
          <>

            <h1 className="mt-6 text-3xl font-semibold text-[var(--text-primary)]">
              {tr(
                'Восстановление пароля',
              )}
            </h1>

            <p className="mt-3 leading-7 text-[var(--text-secondary)]">
              {tr(
                'Введите email, указанный при регистрации. Мы отправим ссылку для создания нового пароля.',
              )}
            </p>

            <form
              onSubmit={
                handleSubmit
              }
              className="mt-8"
            >

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
                    event.target.value,
                  )
                }
                placeholder="you@example.com"
                autoComplete="email"
                required
                className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3.5 text-[var(--text-primary)] outline-none transition-all duration-200 placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)]"
              />

              {error && (
                <div className="mt-4 rounded-2xl border border-[#efc9cc] bg-[var(--accent-soft)] px-4 py-3 text-sm text-[#c46973]">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={
                  isLoading
                }
                className="mt-5 w-full cursor-pointer rounded-2xl bg-[var(--accent)] px-5 py-3.5 font-medium text-white transition-all duration-200 hover:-translate-y-[1px] hover:brightness-105 hover:shadow-md active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading
                  ? tr(
                      'Отправляем ссылку...',
                    )
                  : tr(
                      'Отправить ссылку',
                    )}
              </button>

            </form>

            <div className="mt-7 text-center">

              <Link
                href="/login"
                className="text-sm font-medium text-[var(--accent)] hover:underline"
              >
                {tr(
                  'Вернуться ко входу',
                )}
              </Link>

            </div>

          </>
        )}

      </div>

    </main>
  );
}