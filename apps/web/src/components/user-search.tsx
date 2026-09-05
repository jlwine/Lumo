'use client';

import {
  useEffect,
  useState,
} from 'react';

import {
  Search,
  UserRound,
} from 'lucide-react';

import { useRouter } from 'next/navigation';

import { tr } from '@/i18n/core';
import { useLanguageVersion } from '@/i18n/use-language';

import { apiRequest } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';

import type {
  SearchUser,
} from '@/types/user-profile';

export function UserSearch() {
  useLanguageVersion();

  const router = useRouter();

  const [query, setQuery] =
    useState('');

  const [users, setUsers] =
    useState<SearchUser[]>([]);

  const [isLoading, setIsLoading] =
    useState(false);

  const [isOpen, setIsOpen] =
    useState(false);

  useEffect(() => {
    const normalizedQuery =
      query.trim();

    // Если введено меньше двух символов,
    // запрос к серверу вообще не выполняем.
    if (normalizedQuery.length < 2) {
      return;
    }

    // Небольшая задержка, чтобы не отправлять
    // запрос после каждого нажатия клавиши.
    const timeout = setTimeout(
      async () => {
        const token =
          getAccessToken();

        if (!token) {
          return;
        }

        try {
          setIsLoading(true);

          const result =
            await apiRequest<SearchUser[]>(
              `/users/search?query=${encodeURIComponent(
                normalizedQuery,
              )}`,
              {
                headers: {
                  Authorization:
                    `Bearer ${token}`,
                },
              },
            );

          setUsers(result);
          setIsOpen(true);
        } catch {
          setUsers([]);
          setIsOpen(true);
        } finally {
          setIsLoading(false);
        }
      },
      300,
    );

    return () => {
      clearTimeout(timeout);
    };
  }, [query]);

  function handleQueryChange(
    value: string,
  ) {
    setQuery(value);

    // Очищаем результаты в обработчике события,
    // а не напрямую внутри useEffect.
    if (value.trim().length < 2) {
      setUsers([]);
      setIsOpen(false);
      setIsLoading(false);
    }
  }

  function openProfile(
    nickname: string,
  ) {
    setIsOpen(false);
    setQuery('');
    setUsers([]);

    router.push(
      `/profile/${nickname}`,
    );
  }

  return (
    <div className="relative w-full max-w-md">

      <div className="flex items-center gap-3 rounded-2xl border border-[#eee1dd] bg-white px-4 py-3">

        <Search
          size={18}
          className="shrink-0 text-[#b5a19c]"
        />

        <input
          type="text"
          value={query}
          onChange={(event) =>
            handleQueryChange(
              event.target.value,
            )
          }
          onFocus={() => {
            if (
              query.trim().length >= 2
            ) {
              setIsOpen(true);
            }
          }}
          onBlur={() => {
            // Даём кнопке результата успеть
            // обработать клик перед закрытием списка.
            setTimeout(() => {
              setIsOpen(false);
            }, 150);
          }}
          placeholder={tr('Найти человека по никнейму...')}
          className="min-w-0 flex-1 bg-transparent text-sm text-[#554442] outline-none placeholder:text-[#b5a19c]"
        />

      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-2xl border border-[#eee1dd] bg-white shadow-[0_18px_50px_rgba(88,61,56,0.14)]">

          {isLoading && (
            <div className="px-5 py-4 text-sm text-[#9b8782]">
              {tr('Ищем...')}
            </div>
          )}

          {!isLoading &&
            users.length === 0 && (
              <div className="px-5 py-4 text-sm text-[#9b8782]">
                {tr('Никого не нашли')}
              </div>
            )}

          {!isLoading &&
            users.map((user) => {
              const name =
                user.displayName ??
                user.nickname;

              const initial =
                name
                  .charAt(0)
                  .toUpperCase();

              return (
                <button
                  key={user.id}
                  type="button"
                  onMouseDown={(
                    event,
                  ) => {
                    // Не даём input потерять фокус
                    // до обработки перехода.
                    event.preventDefault();
                  }}
                  onClick={() =>
                    openProfile(
                      user.nickname,
                    )
                  }
                  className="flex w-full items-center gap-3 border-b border-[#f5ece9] px-4 py-3 text-left transition last:border-b-0 hover:bg-[#fff7f5]"
                >

                  {user.avatarUrl ? (
                    <div
                      role="img"
                      aria-label={
                        tr('Аватар пользователя {name}', { name })
                      }
                      className="h-10 w-10 shrink-0 rounded-full bg-cover bg-center"
                      style={{
                        backgroundImage:
                          `url("${user.avatarUrl}")`,
                      }}
                    />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f8e0e2] font-medium text-[#b96c73]">

                      {initial ? (
                        initial
                      ) : (
                        <UserRound
                          size={18}
                        />
                      )}

                    </div>
                  )}

                  <div className="min-w-0">

                    <p className="truncate text-sm font-medium text-[#554442]">
                      {name}
                    </p>

                    <p className="truncate text-xs text-[#a28e89]">
                      @{user.nickname}
                    </p>

                  </div>

                </button>
              );
            })}

        </div>
      )}

    </div>
  );
}