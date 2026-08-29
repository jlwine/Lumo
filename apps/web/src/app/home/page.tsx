'use client';

import {
  useEffect,
  useState,
} from 'react';

import { useRouter } from 'next/navigation';

import { apiRequest } from '@/lib/api';

import {
  getAccessToken,
  removeAccessToken,
} from '@/lib/auth';

import type { User } from '@/types/auth';

export default function HomePage() {
  const router = useRouter();

  const [user, setUser] =
    useState<User | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  useEffect(() => {
    async function loadUser() {
      const token = getAccessToken();

      if (!token) {
        router.replace('/login');
        return;
      }

      try {
        const currentUser =
          await apiRequest<User>(
            '/auth/me',
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );

        setUser(currentUser);
      } catch {
        removeAccessToken();
        router.replace('/login');
      } finally {
        setIsLoading(false);
      }
    }

    void loadUser();
  }, [router]);

  function handleLogout() {
    removeAccessToken();
    router.replace('/login');
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fffaf8]">
        <p className="text-[#806c69]">
          Загружаем ваше пространство...
        </p>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#fffaf8] p-8">
      <div className="mx-auto max-w-6xl">

        <header className="flex items-center justify-between rounded-[28px] border border-[#f0e1dd] bg-white px-8 py-5 shadow-sm">

          <div className="text-2xl font-semibold text-[#574543]">
            ♡ Вдвоём
          </div>

          <div className="flex items-center gap-5">

            <div className="text-right">
              <p className="font-medium text-[#554442]">
                {user.displayName ??
                  user.nickname}
              </p>

              <p className="text-sm text-[#a18d88]">
                @{user.nickname}
              </p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl border border-[#eadbd7] px-4 py-2 text-sm text-[#806c69] transition hover:bg-[#fff3f2]"
            >
              Выйти
            </button>

          </div>
        </header>

        <section className="mt-8 rounded-[32px] bg-gradient-to-r from-[#f8dfe2] via-[#f7e8ed] to-[#e9e2f4] p-10">

          <p className="text-sm font-medium text-[#c46f77]">
            Ваше пространство ♡
          </p>

          <h1 className="mt-2 text-4xl font-semibold text-[#554442]">
            Добро пожаловать,{' '}
            {user.displayName ??
              user.nickname}!
          </h1>

          <p className="mt-4 max-w-xl text-[#806c69]">
            Здесь скоро появятся ваши
            совместные события,
            вишлисты, фотографии и
            другие маленькие моменты.
          </p>

        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-[24px] border border-[#f0e1dd] bg-white p-6">
            <div className="text-2xl">
              📅
            </div>

            <h2 className="mt-4 font-semibold text-[#554442]">
              Календарь
            </h2>

            <p className="mt-2 text-sm text-[#96827e]">
              Совместные планы и события
            </p>
          </div>

          <div className="rounded-[24px] border border-[#f0e1dd] bg-white p-6">
            <div className="text-2xl">
              ♡
            </div>

            <h2 className="mt-4 font-semibold text-[#554442]">
              Вишлисты
            </h2>

            <p className="mt-2 text-sm text-[#96827e]">
              Желания и идеи подарков
            </p>
          </div>

          <div className="rounded-[24px] border border-[#f0e1dd] bg-white p-6">
            <div className="text-2xl">
              📍
            </div>

            <h2 className="mt-4 font-semibold text-[#554442]">
              Карта
            </h2>

            <p className="mt-2 text-sm text-[#96827e]">
              Будьте рядом даже на расстоянии
            </p>
          </div>

          <div className="rounded-[24px] border border-[#f0e1dd] bg-white p-6">
            <div className="text-2xl">
              📷
            </div>

            <h2 className="mt-4 font-semibold text-[#554442]">
              Доска дня
            </h2>

            <p className="mt-2 text-sm text-[#96827e]">
              Делитесь моментами дня
            </p>
          </div>

        </section>
      </div>
    </main>
  );
}