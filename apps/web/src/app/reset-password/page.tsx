'use client';

import {
  Suspense,
  useState,
  type FormEvent,
} from 'react';

import Link from 'next/link';

import {
  useSearchParams,
} from 'next/navigation';

import {
  CheckCircle2,
  KeyRound,
} from 'lucide-react';

import {
  LumoBrand,
  LumoMark,
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

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <ResetPasswordLoading />
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  useLanguageVersion();

  const searchParams =
    useSearchParams();

  /*
   * Берём token напрямую из URL.
   *
   * Отдельный state и useEffect
   * для этого больше не нужны.
   */
  const token =
    searchParams
      .get(
        'token',
      )
      ?.trim() ||
    null;

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
    isLoading,
    setIsLoading,
  ] =
    useState(false);

  const [
    isSuccess,
    setIsSuccess,
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

    if (!token) {
      setError(
        tr(
          'Ссылка недействительна или устарела',
        ),
      );

      return;
    }

    if (
      password.length <
      8
    ) {
      setError(
        tr(
          'Новый пароль должен содержать минимум 8 символов',
        ),
      );

      return;
    }

    if (
      password.length >
      72
    ) {
      setError(
        tr(
          'Пароль не должен быть длиннее 72 символов',
        ),
      );

      return;
    }

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
      await apiRequest<AuthActionResponse>(
        '/auth/reset-password',
        {
          method:
            'POST',

          body:
            JSON.stringify({
              token,
              password,
            }),
        },
      );

      setIsSuccess(
        true,
      );

      /*
       * После успешного использования
       * убираем секретный token
       * из адресной строки.
       */
      window.history.replaceState(
        null,
        '',
        '/reset-password?success=1',
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
            'Не удалось изменить пароль',
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

        {isSuccess ? (
          <SuccessState />
        ) : !token ? (
          <InvalidTokenState />
        ) : (
          <>

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">

              <KeyRound
                size={25}
              />

            </div>

            <h1 className="mt-6 text-3xl font-semibold text-[var(--text-primary)]">

              {tr(
                'Новый пароль',
              )}

            </h1>

            <p className="mt-3 leading-7 text-[var(--text-secondary)]">

              {tr(
                'Придумайте новый пароль для вашего аккаунта.',
              )}

            </p>

            <form
              onSubmit={
                handleSubmit
              }
              className="mt-8 space-y-5"
            >

              <div>

                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-[var(--text-secondary)]"
                >

                  {tr(
                    'Новый пароль',
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
                      event.target.value,
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

              <div>

                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-medium text-[var(--text-secondary)]"
                >

                  {tr(
                    'Повторите новый пароль',
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
                      event.target.value,
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
                className="w-full cursor-pointer rounded-2xl bg-[var(--accent)] px-5 py-3.5 font-medium text-white transition-all duration-200 hover:-translate-y-[1px] hover:brightness-105 hover:shadow-md active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >

                {isLoading
                  ? tr(
                      'Сохраняем пароль...',
                    )
                  : tr(
                      'Сохранить новый пароль',
                    )}

              </button>

            </form>

          </>
        )}

      </div>

    </main>
  );
}

function SuccessState() {
  return (
    <>

      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">

        <CheckCircle2
          size={27}
        />

      </div>

      <h1 className="mt-6 text-3xl font-semibold text-[var(--text-primary)]">

        {tr(
          'Пароль успешно изменён',
        )}

      </h1>

      <p className="mt-3 leading-7 text-[var(--text-secondary)]">

        {tr(
          'Теперь можно войти в Lumo с новым паролем.',
        )}

      </p>

      <Link
        href="/login"
        className="mt-8 block w-full rounded-2xl bg-[var(--accent)] px-5 py-3.5 text-center font-medium text-white transition-all duration-200 hover:-translate-y-[1px] hover:brightness-105 active:translate-y-0 active:scale-[0.98]"
      >

        {tr(
          'Вернуться ко входу',
        )}

      </Link>

    </>
  );
}

function InvalidTokenState() {
  return (
    <>

      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">

        <KeyRound
          size={25}
        />

      </div>

      <h1 className="mt-6 text-3xl font-semibold text-[var(--text-primary)]">

        {tr(
          'Ссылка недействительна или устарела',
        )}

      </h1>

      <p className="mt-3 leading-7 text-[var(--text-secondary)]">

        {tr(
          'Запросите новую ссылку для восстановления пароля.',
        )}

      </p>

      <Link
        href="/forgot-password"
        className="mt-8 block w-full rounded-2xl bg-[var(--accent)] px-5 py-3.5 text-center font-medium text-white transition-all duration-200 hover:-translate-y-[1px] hover:brightness-105 active:translate-y-0 active:scale-[0.98]"
      >

        {tr(
          'Запросить новую ссылку',
        )}

      </Link>

    </>
  );
}

function ResetPasswordLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)]">

      <LumoMark
        size={48}
        className="animate-pulse"
      />

    </main>
  );
}