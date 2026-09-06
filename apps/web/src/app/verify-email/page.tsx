'use client';

import {
  useEffect,
  useState,
} from 'react';

import Link from 'next/link';

import {
  CheckCircle2,
  Mail,
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

import {
  getAccessToken,
} from '@/lib/auth';

import type {
  AuthActionResponse,
} from '@/types/auth';

type VerificationState =
  | 'loading'
  | 'sent'
  | 'success'
  | 'error';

export default function VerifyEmailPage() {
  useLanguageVersion();

  const [
    state,
    setState,
  ] =
    useState<VerificationState>(
      'loading',
    );

  const [
    email,
    setEmail,
  ] =
    useState('');

  const [
    isAuthorized,
    setIsAuthorized,
  ] =
    useState(false);

  const [
    isResending,
    setIsResending,
  ] =
    useState(false);

  const [
    resendSuccess,
    setResendSuccess,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );

  useEffect(() => {
    let cancelled =
      false;

    async function initialize() {
      const params =
        new URLSearchParams(
          window.location.search,
        );

      const token =
        params
          .get(
            'token',
          )
          ?.trim() ||
        null;

      const emailValue =
        params
          .get(
            'email',
          )
          ?.trim() ||
        '';

      const sent =
        params.get(
          'sent',
        ) ===
        '1';

      const verified =
        params.get(
          'verified',
        ) ===
        '1';

      setEmail(
        emailValue,
      );

      setIsAuthorized(
        Boolean(
          getAccessToken(),
        ),
      );

      if (verified) {
        setState(
          'success',
        );

        return;
      }

      if (token) {
        try {
          await apiRequest<AuthActionResponse>(
            '/auth/verify-email',
            {
              method:
                'POST',

              body:
                JSON.stringify({
                  token,
                }),
            },
          );

          if (cancelled) {
            return;
          }

          setState(
            'success',
          );

          /*
           * После успешного подтверждения
           * удаляем одноразовый токен из URL.
           */
          window.history.replaceState(
            null,
            '',
            '/verify-email?verified=1',
          );
        } catch (error) {
          if (cancelled) {
            return;
          }

          setError(
            error instanceof Error
              ? error.message
              : tr(
                  'Не удалось подтвердить email',
                ),
          );

          setState(
            'error',
          );
        }

        return;
      }

      if (sent) {
        setState(
          'sent',
        );

        return;
      }

      setState(
        'error',
      );
    }

    void initialize();

    return () => {
      cancelled =
        true;
    };
  }, []);

  async function handleResend() {
    const accessToken =
      getAccessToken();

    if (!accessToken) {
      return;
    }

    setError(
      null,
    );

    setResendSuccess(
      false,
    );

    setIsResending(
      true,
    );

    try {
      await apiRequest<AuthActionResponse>(
        '/auth/resend-verification-email',
        {
          method:
            'POST',

          headers: {
            Authorization:
              `Bearer ${accessToken}`,
          },
        },
      );

      setResendSuccess(
        true,
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : tr(
              'Не удалось отправить письмо повторно',
            ),
      );
    } finally {
      setIsResending(
        false,
      );
    }
  }

  if (
    state ===
    'loading'
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--background)]">

        <LumoMark
          size={48}
          className="animate-pulse"
        />

      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-8">

      <div className="w-full max-w-[580px] rounded-[32px] border border-[var(--border)] bg-[var(--surface)] p-8 shadow-[0_30px_100px_rgba(115,75,70,0.10)] sm:p-10">

        <div className="mb-9">

          <LumoBrand
            markSize={46}
            showTagline
            wordmarkClassName="text-[30px]"
          />

        </div>

        {state ===
        'success' ? (
          <>

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">

              <CheckCircle2
                size={28}
              />

            </div>

            <h1 className="mt-6 text-3xl font-semibold text-[var(--text-primary)]">
              {tr(
                'Email подтверждён',
              )}
            </h1>

            <p className="mt-3 leading-7 text-[var(--text-secondary)]">
              {tr(
                'Email успешно подтверждён. Теперь все функции аккаунта доступны.',
              )}
            </p>

            <Link
              href={
                isAuthorized
                  ? '/home'
                  : '/login'
              }
              className="mt-8 block w-full rounded-2xl bg-[var(--accent)] px-5 py-3.5 text-center font-medium text-white transition-all duration-200 hover:-translate-y-[1px] hover:brightness-105 active:translate-y-0 active:scale-[0.98]"
            >
              {isAuthorized
                ? tr(
                    'Перейти в Lumo',
                  )
                : tr(
                    'Вернуться ко входу',
                  )}
            </Link>

          </>
        ) : state ===
          'sent' ? (
          <>

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">

              <Mail
                size={27}
              />

            </div>

            <h1 className="mt-6 text-3xl font-semibold text-[var(--text-primary)]">
              {tr(
                'Проверьте почту',
              )}
            </h1>

            <p className="mt-3 leading-7 text-[var(--text-secondary)]">

              {email
                ? tr(
                    'Мы отправили ссылку для подтверждения на {email}.',
                    {
                      email,
                    },
                  )
                : tr(
                    'Мы отправили ссылку для подтверждения email.',
                  )}

            </p>

            <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
              {tr(
                'Перейдите по ссылке в письме, чтобы подтвердить адрес.',
              )}
            </p>

            {resendSuccess && (
              <div className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--text-secondary)]">
                {tr(
                  'Письмо отправлено повторно',
                )}
              </div>
            )}

            {error && (
              <div className="mt-5 rounded-2xl border border-[#efc9cc] bg-[var(--accent-soft)] px-4 py-3 text-sm text-[#c46973]">
                {error}
              </div>
            )}

            <div className="mt-8 flex flex-col gap-3">

              {isAuthorized && (
                <button
                  type="button"
                  onClick={
                    handleResend
                  }
                  disabled={
                    isResending
                  }
                  className="w-full cursor-pointer rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-5 py-3.5 font-medium text-[var(--text-primary)] transition-all duration-200 hover:-translate-y-[1px] hover:border-[var(--accent)] active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isResending
                    ? tr(
                        'Отправляем повторно...',
                      )
                    : tr(
                        'Отправить письмо ещё раз',
                      )}
                </button>
              )}

              <Link
                href={
                  isAuthorized
                    ? '/home'
                    : '/login'
                }
                className="w-full rounded-2xl bg-[var(--accent)] px-5 py-3.5 text-center font-medium text-white transition-all duration-200 hover:-translate-y-[1px] hover:brightness-105 active:translate-y-0 active:scale-[0.98]"
              >
                {isAuthorized
                  ? tr(
                      'Перейти в Lumo',
                    )
                  : tr(
                      'Вернуться ко входу',
                    )}
              </Link>

            </div>

          </>
        ) : (
          <>

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">

              <Mail
                size={27}
              />

            </div>

            <h1 className="mt-6 text-3xl font-semibold text-[var(--text-primary)]">
              {tr(
                'Не удалось подтвердить email',
              )}
            </h1>

            <p className="mt-3 leading-7 text-[var(--text-secondary)]">
              {error ??
                tr(
                  'Ссылка недействительна или устарела',
                )}
            </p>

            <Link
              href={
                isAuthorized
                  ? '/home'
                  : '/login'
              }
              className="mt-8 block w-full rounded-2xl bg-[var(--accent)] px-5 py-3.5 text-center font-medium text-white transition-all duration-200 hover:brightness-105"
            >
              {isAuthorized
                ? tr(
                    'Перейти в Lumo',
                  )
                : tr(
                    'Вернуться ко входу',
                  )}
            </Link>

          </>
        )}

      </div>

    </main>
  );
}