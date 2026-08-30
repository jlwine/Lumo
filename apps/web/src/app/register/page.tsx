'use client';

import {
  useState,
  type FormEvent,
} from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { apiRequest } from '@/lib/api';
import { saveAccessToken } from '@/lib/auth';

import type {
  LoginResponse,
  RegisterResponse,
} from '@/types/auth';

export default function RegisterPage() {
  const router = useRouter();

  const [displayName, setDisplayName] =
    useState('');

  const [email, setEmail] =
    useState('');

  const [nickname, setNickname] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState('');

  const [error, setError] =
    useState<string | null>(null);

  const [isLoading, setIsLoading] =
    useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError(null);

    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    setIsLoading(true);

    try {
      await apiRequest<RegisterResponse>(
        '/auth/register',
        {
          method: 'POST',

          body: JSON.stringify({
            email,
            nickname,
            password,

            displayName:
              displayName.trim() || undefined,
          }),
        },
      );

      // После регистрации сразу выполняем вход,
      // чтобы пользователь не вводил данные повторно.
      const loginResponse =
        await apiRequest<LoginResponse>(
          '/auth/login',
          {
            method: 'POST',

            body: JSON.stringify({
              login: nickname,
              password,
            }),
          },
        );

      saveAccessToken(
        loginResponse.accessToken,
      );

      router.push('/home');
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError(
          'Не удалось зарегистрироваться',
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

              <span className="text-3xl font-semibold text-[#574543]">
                Вдвоём
              </span>
            </div>

            <h1 className="max-w-lg text-5xl font-semibold leading-tight text-[#554442]">
              Создайте ваше
              пространство для двоих.
            </h1>

            <p className="mt-6 max-w-md text-lg leading-8 text-[#806c69]">
              Зарегистрируйтесь,
              найдите вторую половинку
              по уникальному никнейму и
              начните собирать ваши
              общие моменты.
            </p>
          </div>

          <div className="rounded-[28px] bg-white/55 p-6 backdrop-blur">
            <p className="text-sm text-[#806c69]">
              ♡ Один аккаунт.
              Одно общее пространство.
              Только для вас двоих.
            </p>
          </div>

        </section>

        <section className="flex w-full items-center justify-center px-6 py-10 lg:w-1/2 lg:px-16">

          <div className="w-full max-w-md">

            <div className="mb-8 lg:hidden">
              <span className="text-3xl font-semibold text-[#574543]">
                ♡ Вдвоём
              </span>
            </div>

            <div className="mb-7">
              <p className="mb-2 text-sm font-medium text-[#d17d83]">
                Начнём знакомство ♡
              </p>

              <h2 className="text-4xl font-semibold text-[#4f403e]">
                Регистрация
              </h2>

              <p className="mt-3 text-[#96827e]">
                Создайте аккаунт,
                чтобы присоединиться
                к «Вдвоём».
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-4"
            >

              <div>
                <label
                  htmlFor="displayName"
                  className="mb-2 block text-sm font-medium text-[#665451]"
                >
                  Имя
                </label>

                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(event) =>
                    setDisplayName(
                      event.target.value,
                    )
                  }
                  placeholder="Александр"
                  autoComplete="name"
                  className="w-full rounded-2xl border border-[#eadbd7] bg-[#fffdfc] px-4 py-3.5 text-[#4f403e] outline-none transition placeholder:text-[#c3b3af] focus:border-[#df9ca1] focus:ring-4 focus:ring-[#f7e3e5]"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-[#665451]"
                >
                  Email
                </label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(
                      event.target.value,
                    )
                  }
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  className="w-full rounded-2xl border border-[#eadbd7] bg-[#fffdfc] px-4 py-3.5 text-[#4f403e] outline-none transition placeholder:text-[#c3b3af] focus:border-[#df9ca1] focus:ring-4 focus:ring-[#f7e3e5]"
                />
              </div>

              <div>
                <label
                  htmlFor="nickname"
                  className="mb-2 block text-sm font-medium text-[#665451]"
                >
                  Уникальный никнейм
                </label>

                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#b69e99]">
                    @
                  </span>

                  <input
                    id="nickname"
                    type="text"
                    value={nickname}
                    onChange={(event) =>
                      setNickname(
                        event.target.value,
                      )
                    }
                    autoComplete="username"
                    required
                    minLength={3}
                    maxLength={30}
                    className="w-full rounded-2xl border border-[#eadbd7] bg-[#fffdfc] py-3.5 pl-9 pr-4 text-[#4f403e] outline-none transition placeholder:text-[#c3b3af] focus:border-[#df9ca1] focus:ring-4 focus:ring-[#f7e3e5]"
                  />
                </div>

                <p className="mt-1.5 text-xs text-[#ae9994]">
                  Латинские буквы,
                  цифры и _
                </p>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-[#665451]"
                >
                  Пароль
                </label>

                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value,
                    )
                  }
                  placeholder="Минимум 8 символов"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  className="w-full rounded-2xl border border-[#eadbd7] bg-[#fffdfc] px-4 py-3.5 text-[#4f403e] outline-none transition placeholder:text-[#c3b3af] focus:border-[#df9ca1] focus:ring-4 focus:ring-[#f7e3e5]"
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-medium text-[#665451]"
                >
                  Повторите пароль
                </label>

                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(
                      event.target.value,
                    )
                  }
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                  minLength={8}
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
                className="mt-2 w-full rounded-2xl bg-[#df8e94] px-5 py-3.5 font-medium text-white shadow-sm transition hover:bg-[#d77c83] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading
                  ? 'Создаём аккаунт...'
                  : 'Создать аккаунт'}
              </button>

            </form>

            <div className="mt-7 text-center text-sm text-[#998681]">
              Уже есть аккаунт?{' '}

              <Link
                href="/login"
                className="font-medium text-[#d17d83] hover:underline"
              >
                Войти
              </Link>
            </div>

          </div>
        </section>
      </div>
    </main>
  );
}