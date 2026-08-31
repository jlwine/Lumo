'use client';

import {
  ChangeEvent,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  ArrowLeft,
  Cake,
  Camera,
  Heart,
  Save,
  UserRound,
  X,
} from 'lucide-react';

import {
  useRouter,
} from 'next/navigation';

import { apiRequest } from '@/lib/api';

import {
  getAccessToken,
  removeAccessToken,
} from '@/lib/auth';

import type {
  User,
} from '@/types/auth';

export default function ProfileSettingsPage() {
  const router =
    useRouter();

  const fileInputRef =
    useRef<HTMLInputElement>(
      null,
    );

  const [
    user,
    setUser,
  ] =
    useState<User | null>(
      null,
    );

  const [
    displayName,
    setDisplayName,
  ] =
    useState('');

  const [
    nickname,
    setNickname,
  ] =
    useState('');

  const [
    birthDate,
    setBirthDate,
  ] =
    useState('');

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(true);

  const [
    isSaving,
    setIsSaving,
  ] =
    useState(false);

  const [
    isUploadingAvatar,
    setIsUploadingAvatar,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );

  const [
    success,
    setSuccess,
  ] =
    useState<string | null>(
      null,
    );

  useEffect(() => {
    let cancelled =
      false;

    async function loadUser() {
      const token =
        getAccessToken();

      if (!token) {
        router.replace(
          '/login',
        );

        return;
      }

      try {
        const result =
          await apiRequest<User>(
            '/auth/me',
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            },
          );

        if (cancelled) {
          return;
        }

        setUser(result);

        setDisplayName(
          result.displayName ??
            '',
        );

        setNickname(
          result.nickname,
        );

        setBirthDate(
          result.birthDate
            ? toDateInputValue(
                result.birthDate,
              )
            : '',
        );
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (
          error instanceof Error
        ) {
          setError(
            error.message,
          );
        } else {
          setError(
            'Не удалось загрузить профиль',
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadUser();

    return () => {
      cancelled = true;
    };
  }, [router]);

  /*
   * Сохраняем имя,
   * никнейм и дату рождения.
   */
  async function saveProfile() {
    const token =
      getAccessToken();

    if (!token) {
      removeAccessToken();
      router.replace(
        '/login',
      );

      return;
    }

    if (
      nickname
        .trim()
        .length < 3
    ) {
      setError(
        'Никнейм должен содержать минимум 3 символа',
      );

      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);

      const result =
        await apiRequest<User>(
          '/users/me',
          {
            method: 'PATCH',

            headers: {
              Authorization:
                `Bearer ${token}`,
            },

            body:
              JSON.stringify({
                displayName:
                  displayName.trim(),

                nickname:
                  nickname
                    .trim()
                    .toLowerCase(),

                ...(birthDate
                  ? {
                      birthDate,
                    }
                  : {}),
              }),
          },
        );

      setUser(result);

      setDisplayName(
        result.displayName ??
          '',
      );

      setNickname(
        result.nickname,
      );

      setBirthDate(
        result.birthDate
          ? toDateInputValue(
              result.birthDate,
            )
          : '',
      );

      setSuccess(
        'Профиль сохранён',
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
          'Не удалось сохранить профиль',
        );
      }
    } finally {
      setIsSaving(false);
    }
  }

  /*
   * Загружаем новый аватар.
   */
  async function handleAvatarChange(
    event:
      ChangeEvent<HTMLInputElement>,
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    if (
      !allowedTypes.includes(
        file.type,
      )
    ) {
      setError(
        'Выберите изображение JPG, PNG или WEBP',
      );

      event.target.value =
        '';

      return;
    }

    if (
      file.size >
      5 * 1024 * 1024
    ) {
      setError(
        'Размер изображения не должен превышать 5 МБ',
      );

      event.target.value =
        '';

      return;
    }

    const token =
      getAccessToken();

    if (!token) {
      removeAccessToken();
      router.replace(
        '/login',
      );

      return;
    }

    try {
      setIsUploadingAvatar(
        true,
      );

      setError(null);
      setSuccess(null);

      const formData =
        new FormData();

      formData.append(
        'avatar',
        file,
      );

      const result =
        await apiRequest<User>(
          '/users/me/avatar',
          {
            method: 'POST',

            headers: {
              Authorization:
                `Bearer ${token}`,
            },

            body:
              formData,
          },
        );

      setUser(result);

      setSuccess(
        'Аватар обновлён',
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
          'Не удалось загрузить аватар',
        );
      }
    } finally {
      setIsUploadingAvatar(
        false,
      );

      event.target.value =
        '';
    }
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fffaf8]">
        <Heart
          size={36}
          className="animate-pulse text-[#d98a92]"
        />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fffaf8] p-5">

        <div className="text-center">

          <p className="text-[#755f5b]">
            {error ??
              'Не удалось открыть профиль'}
          </p>

          <button
            type="button"
            onClick={() =>
              router.push(
                '/home',
              )
            }
            className="mt-5 rounded-2xl bg-[#df8e94] px-6 py-3 font-medium text-white transition-all hover:bg-[#d57a82] active:scale-[0.97]"
          >
            На главную
          </button>

        </div>

      </main>
    );
  }

  const name =
    displayName.trim() ||
    nickname ||
    user.nickname;

  const initial =
    name
      .charAt(0)
      .toUpperCase();

  const today =
    new Date()
      .toISOString()
      .slice(0, 10);

  return (
    <main className="min-h-screen bg-[#fffaf8] px-5 py-8">

      <div className="mx-auto max-w-4xl">

        <button
          type="button"
          onClick={() =>
            router.back()
          }
          className="mb-6 flex items-center gap-2 rounded-xl border border-transparent px-3 py-2 text-sm font-medium text-[#876f6a] transition-all duration-150 hover:border-[#efd8d4] hover:bg-[#fff0ed] hover:text-[#c36f77] hover:shadow-sm active:scale-[0.96] active:bg-[#f8dfdd]"
        >
          <ArrowLeft
            size={18}
          />

          Назад
        </button>

        <header className="mb-8">

          <p className="text-sm font-medium text-[#c8757c]">
            Настройки
          </p>

          <h1 className="mt-1 text-3xl font-semibold text-[#554442]">
            Ваш профиль
          </h1>

          <p className="mt-3 max-w-xl text-[#98837e]">
            Здесь можно изменить
            информацию, которую видят
            другие пользователи.
          </p>

        </header>

        {error && (
          <div className="mb-6 flex items-start justify-between gap-4 rounded-2xl border border-[#efc9cc] bg-[#fff1f1] px-5 py-4 text-sm text-[#a95057]">

            <span>
              {error}
            </span>

            <button
              type="button"
              onClick={() =>
                setError(null)
              }
              className="rounded-lg p-1 transition hover:bg-[#f8dddd]"
            >
              <X size={16} />
            </button>

          </div>
        )}

        {success && (
          <div className="mb-6 rounded-2xl border border-[#dce8d3] bg-[#f5faef] px-5 py-4 text-sm text-[#647557]">
            {success}
          </div>
        )}

        <section className="overflow-hidden rounded-[32px] border border-[#eeddda] bg-white shadow-[0_20px_70px_rgba(91,65,59,0.07)]">

          <div className="h-36 bg-gradient-to-r from-[#f6dce0] via-[#f4e4eb] to-[#e7e0f3]" />

          <div className="px-7 pb-8 md:px-10">

            {/* Аватар */}
            <div className="-mt-14 flex flex-col gap-5 sm:flex-row sm:items-end">

              <div className="relative">

                {user.avatarUrl ? (
                  <div
                    role="img"
                    aria-label={
                      `Аватар ${name}`
                    }
                    className="h-28 w-28 rounded-full border-[6px] border-white bg-cover bg-center shadow-sm"
                    style={{
                      backgroundImage:
                        `url("${user.avatarUrl}")`,
                    }}
                  />
                ) : (
                  <div className="flex h-28 w-28 items-center justify-center rounded-full border-[6px] border-white bg-[#eadfcf] text-4xl font-semibold text-[#795f52] shadow-sm">
                    {initial || (
                      <UserRound
                        size={34}
                      />
                    )}
                  </div>
                )}

                <button
                  type="button"
                  disabled={
                    isUploadingAvatar
                  }
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                  title="Изменить аватар"
                  className="absolute bottom-1 right-1 flex h-10 w-10 items-center justify-center rounded-full border-4 border-white bg-[#df8e94] text-white shadow-md transition-all duration-150 hover:bg-[#cf747c] hover:shadow-lg active:scale-[0.92] disabled:opacity-50"
                >
                  <Camera
                    size={17}
                  />
                </button>

                <input
                  ref={
                    fileInputRef
                  }
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={
                    handleAvatarChange
                  }
                  className="hidden"
                />

              </div>

              <div className="pb-1">

                <h2 className="text-2xl font-semibold text-[#554442]">
                  {name}
                </h2>

                <p className="mt-1 text-sm text-[#a08b85]">
                  @{nickname}
                </p>

                <button
                  type="button"
                  disabled={
                    isUploadingAvatar
                  }
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                  className="mt-3 rounded-xl px-3 py-2 text-sm font-medium text-[#b96b72] transition-all hover:bg-[#fff0ef] active:scale-[0.97]"
                >
                  {isUploadingAvatar
                    ? 'Загружаем...'
                    : 'Изменить фотографию'}
                </button>

                <p className="mt-1 text-xs text-[#b09b95]">
                  JPG, PNG или WEBP,
                  до 5 МБ
                </p>

              </div>

            </div>

            {/* Поля */}
            <div className="mt-9 grid gap-6">

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
                  maxLength={50}
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
                  placeholder="Как вас называть?"
                  className="w-full rounded-2xl border border-[#eadbd7] bg-[#fffdfc] px-4 py-3.5 text-[#554442] outline-none transition focus:border-[#df9ca1] focus:ring-4 focus:ring-[#f7e3e5]"
                />

              </div>

              <div>

                <label
                  htmlFor="nickname"
                  className="mb-2 block text-sm font-medium text-[#665451]"
                >
                  Никнейм
                </label>

                <div className="flex rounded-2xl border border-[#eadbd7] bg-[#fffdfc] transition focus-within:border-[#df9ca1] focus-within:ring-4 focus-within:ring-[#f7e3e5]">

                  <span className="flex items-center pl-4 text-[#b29c96]">
                    @
                  </span>

                  <input
                    id="nickname"
                    type="text"
                    minLength={3}
                    maxLength={30}
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
                    className="min-w-0 flex-1 bg-transparent px-2 py-3.5 text-[#554442] outline-none"
                  />

                </div>

                <p className="mt-2 text-xs text-[#a9948e]">
                  Только латинские
                  буквы, цифры и
                  нижнее подчёркивание.
                </p>

              </div>

              <div>

                <label
                  htmlFor="birthDate"
                  className="mb-2 block text-sm font-medium text-[#665451]"
                >
                  Дата рождения
                </label>

                <div className="relative">

                  <Cake
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#c09292]"
                  />

                  <input
                    id="birthDate"
                    type="date"
                    max={today}
                    value={
                      birthDate
                    }
                    onChange={(
                      event,
                    ) =>
                      setBirthDate(
                        event.target
                          .value,
                      )
                    }
                    className="w-full rounded-2xl border border-[#eadbd7] bg-[#fffdfc] py-3.5 pl-11 pr-4 text-[#554442] outline-none transition focus:border-[#df9ca1] focus:ring-4 focus:ring-[#f7e3e5]"
                  />

                </div>

              </div>

              <div className="border-t border-[#f1e5e1] pt-6">

                <button
                  type="button"
                  disabled={
                    isSaving
                  }
                  onClick={() =>
                    void saveProfile()
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#df8e94] px-6 py-3.5 font-medium text-white shadow-sm transition-all duration-150 hover:bg-[#d37b83] hover:shadow-md active:scale-[0.98] active:bg-[#c66d75] disabled:pointer-events-none disabled:opacity-50 sm:w-auto"
                >
                  <Save
                    size={18}
                  />

                  {isSaving
                    ? 'Сохраняем...'
                    : 'Сохранить изменения'}
                </button>

              </div>

            </div>

          </div>

        </section>

      </div>

    </main>
  );
}

function toDateInputValue(
  value: string,
) {
  return new Date(value)
    .toISOString()
    .slice(0, 10);
}