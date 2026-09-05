'use client';

import {
  tr,
} from '@/i18n/core';

import {
  useLanguageVersion,
} from '@/i18n/use-language';

import {
  type ChangeEvent,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  ArrowLeft,
  Cake,
  Camera,
  Eye,
  EyeOff,
  Heart,
  ImagePlus,
  KeyRound,
  Mail,
  Minus,
  Plus,
  Save,
  ShieldCheck,
  UserRound,
  X,
} from 'lucide-react';

import {
  useRouter,
} from 'next/navigation';

import Cropper, {
  type Area,
} from 'react-easy-crop';

import {
  apiRequest,
} from '@/lib/api';

import {
  getAccessToken,
  removeAccessToken,
} from '@/lib/auth';

import {
  getCroppedAvatar,
} from '@/lib/crop-image';

import type {
  User,
} from '@/types/auth';

type CropPosition = {
  x: number;
  y: number;
};

export default function ProfileSettingsPage() {
  useLanguageVersion();

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

  /*
   * Данные аккаунта
   * и безопасности.
   */
  const [
    email,
    setEmail,
  ] =
    useState('');

  const [
    emailCurrentPassword,
    setEmailCurrentPassword,
  ] =
    useState('');

  const [
    currentPassword,
    setCurrentPassword,
  ] =
    useState('');

  const [
    newPassword,
    setNewPassword,
  ] =
    useState('');

  const [
    confirmNewPassword,
    setConfirmNewPassword,
  ] =
    useState('');

  const [
    isSavingEmail,
    setIsSavingEmail,
  ] =
    useState(false);

  const [
    isSavingPassword,
    setIsSavingPassword,
  ] =
    useState(false);

  const [
    showEmailPassword,
    setShowEmailPassword,
  ] =
    useState(false);

  const [
    showCurrentPassword,
    setShowCurrentPassword,
  ] =
    useState(false);

  const [
    showNewPassword,
    setShowNewPassword,
  ] =
    useState(false);

  const [
    showConfirmNewPassword,
    setShowConfirmNewPassword,
  ] =
    useState(false);

  const [
    accountError,
    setAccountError,
  ] =
    useState<string | null>(
      null,
    );

  const [
    accountSuccess,
    setAccountSuccess,
  ] =
    useState<string | null>(
      null,
    );

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

  /*
   * Состояние редактора аватара.
   */
  const [
    cropImageUrl,
    setCropImageUrl,
  ] =
    useState<string | null>(
      null,
    );

  const [
    crop,
    setCrop,
  ] =
    useState<CropPosition>({
      x: 0,
      y: 0,
    });

  const [
    zoom,
    setZoom,
  ] =
    useState(1);

  const [
    croppedAreaPixels,
    setCroppedAreaPixels,
  ] =
    useState<Area | null>(
      null,
    );

  /*
   * Получение данных
   * текущего пользователя.
   */
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

        setEmail(
          result.email,
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
            tr(
              'Не удалось загрузить профиль',
            ),
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(
            false,
          );
        }
      }
    }

    void loadUser();

    return () => {
      cancelled =
        true;
    };
  }, [
    router,
  ]);

  /*
   * Сохраняем основные
   * данные профиля.
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

    const normalizedNickname =
      nickname
        .trim()
        .toLowerCase();

    if (
      normalizedNickname.length <
      3
    ) {
      setError(
        tr(
          'Никнейм должен содержать минимум 3 символа',
        ),
      );

      return;
    }

    try {
      setIsSaving(
        true,
      );

      setError(
        null,
      );

      setSuccess(
        null,
      );

      const result =
        await apiRequest<User>(
          '/users/me',
          {
            method:
              'PATCH',

            headers: {
              Authorization:
                `Bearer ${token}`,
            },

            body:
              JSON.stringify({
                displayName:
                  displayName.trim(),

                nickname:
                  normalizedNickname,

                ...(birthDate
                  ? {
                      birthDate,
                    }
                  : {}),
              }),
          },
        );

      setUser(
        result,
      );

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
        tr(
          'Профиль сохранён',
        ),
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
            'Не удалось сохранить профиль',
          ),
        );
      }
    } finally {
      setIsSaving(
        false,
      );
    }
  }

  /*
   * Изменение электронной почты.
   *
   * Для подтверждения просим
   * текущий пароль пользователя.
   */
  async function saveEmail() {
    const token =
      getAccessToken();

    if (!token) {
      removeAccessToken();

      router.replace(
        '/login',
      );

      return;
    }

    const normalizedEmail =
      email
        .trim()
        .toLowerCase();

    const emailLooksValid =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        normalizedEmail,
      );

    if (
      !emailLooksValid
    ) {
      setAccountError(
        tr(
          'Введите корректный email',
        ),
      );

      setAccountSuccess(
        null,
      );

      return;
    }

    if (
      !emailCurrentPassword
    ) {
      setAccountError(
        tr(
          'Введите текущий пароль',
        ),
      );

      setAccountSuccess(
        null,
      );

      return;
    }

    try {
      setIsSavingEmail(
        true,
      );

      setAccountError(
        null,
      );

      setAccountSuccess(
        null,
      );

      const result =
        await apiRequest<User>(
          '/users/me/email',
          {
            method:
              'PATCH',

            headers: {
              Authorization:
                `Bearer ${token}`,
            },

            body:
              JSON.stringify({
                email:
                  normalizedEmail,

                currentPassword:
                  emailCurrentPassword,
              }),
          },
        );

      setUser(
        result,
      );

      setEmail(
        result.email,
      );

      setEmailCurrentPassword(
        '',
      );

      setShowEmailPassword(
        false,
      );

      setAccountSuccess(
        tr(
          'Email сохранён',
        ),
      );
    } catch (error) {
      if (
        error instanceof Error
      ) {
        setAccountError(
          error.message,
        );
      } else {
        setAccountError(
          tr(
            'Не удалось изменить email',
          ),
        );
      }
    } finally {
      setIsSavingEmail(
        false,
      );
    }
  }

  /*
   * Изменение пароля.
   */
  async function savePassword() {
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
      !currentPassword
    ) {
      setAccountError(
        tr(
          'Введите текущий пароль',
        ),
      );

      setAccountSuccess(
        null,
      );

      return;
    }

    if (
      newPassword.length <
      8
    ) {
      setAccountError(
        tr(
          'Новый пароль должен содержать минимум 8 символов',
        ),
      );

      setAccountSuccess(
        null,
      );

      return;
    }

    if (
      newPassword.length >
      72
    ) {
      setAccountError(
        tr(
          'Пароль не должен быть длиннее 72 символов',
        ),
      );

      setAccountSuccess(
        null,
      );

      return;
    }

    if (
      newPassword ===
      currentPassword
    ) {
      setAccountError(
        tr(
          'Новый пароль должен отличаться от текущего',
        ),
      );

      setAccountSuccess(
        null,
      );

      return;
    }

    if (
      newPassword !==
      confirmNewPassword
    ) {
      setAccountError(
        tr(
          'Новые пароли не совпадают',
        ),
      );

      setAccountSuccess(
        null,
      );

      return;
    }

    try {
      setIsSavingPassword(
        true,
      );

      setAccountError(
        null,
      );

      setAccountSuccess(
        null,
      );

      await apiRequest<{
        success: boolean;
      }>(
        '/users/me/password',
        {
          method:
            'PATCH',

          headers: {
            Authorization:
              `Bearer ${token}`,
          },

          body:
            JSON.stringify({
              currentPassword,
              newPassword,
            }),
        },
      );

      setCurrentPassword(
        '',
      );

      setNewPassword(
        '',
      );

      setConfirmNewPassword(
        '',
      );

      setShowCurrentPassword(
        false,
      );

      setShowNewPassword(
        false,
      );

      setShowConfirmNewPassword(
        false,
      );

      setAccountSuccess(
        tr(
          'Пароль изменён',
        ),
      );
    } catch (error) {
      if (
        error instanceof Error
      ) {
        setAccountError(
          error.message,
        );
      } else {
        setAccountError(
          tr(
            'Не удалось изменить пароль',
          ),
        );
      }
    } finally {
      setIsSavingPassword(
        false,
      );
    }
  }

  /*
   * Пользователь выбирает
   * исходную фотографию.
   *
   * На сервер она пока
   * НЕ отправляется.
   */
  function handleAvatarFileChange(
    event:
      ChangeEvent<HTMLInputElement>,
  ) {
    const file =
      event.target
        .files?.[0];

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
        tr(
          'Выберите изображение JPG, PNG или WEBP',
        ),
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
        tr(
          'Размер изображения не должен превышать 5 МБ',
        ),
      );

      event.target.value =
        '';

      return;
    }

    /*
     * Если до этого редактор
     * уже использовался,
     * освобождаем старый URL.
     */
    if (
      cropImageUrl
    ) {
      URL.revokeObjectURL(
        cropImageUrl,
      );
    }

    const imageUrl =
      URL.createObjectURL(
        file,
      );

    setCropImageUrl(
      imageUrl,
    );

    setCrop({
      x: 0,
      y: 0,
    });

    setZoom(
      1,
    );

    setCroppedAreaPixels(
      null,
    );

    setError(
      null,
    );

    setSuccess(
      null,
    );

    /*
     * Позволяет потом выбрать
     * тот же самый файл повторно.
     */
    event.target.value =
      '';
  }

  /*
   * react-easy-crop сообщает
   * координаты выбранного участка.
   */
  function handleCropComplete(
    _croppedArea:
      Area,

    croppedPixels:
      Area,
  ) {
    setCroppedAreaPixels(
      croppedPixels,
    );
  }

  /*
   * Закрываем редактор.
   */
  function closeCropEditor() {
    if (
      cropImageUrl
    ) {
      URL.revokeObjectURL(
        cropImageUrl,
      );
    }

    setCropImageUrl(
      null,
    );

    setCroppedAreaPixels(
      null,
    );

    setCrop({
      x: 0,
      y: 0,
    });

    setZoom(
      1,
    );
  }

  /*
   * Физически обрезаем изображение
   * и только после этого отправляем
   * полученный аватар на backend.
   */
  async function saveCroppedAvatar() {
    if (
      !cropImageUrl ||
      !croppedAreaPixels
    ) {
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

      setError(
        null,
      );

      setSuccess(
        null,
      );

      const avatarBlob =
        await getCroppedAvatar(
          cropImageUrl,
          croppedAreaPixels,
        );

      const avatarFile =
        new File(
          [
            avatarBlob,
          ],
          'avatar.jpg',
          {
            type:
              'image/jpeg',
          },
        );

      const formData =
        new FormData();

      formData.append(
        'avatar',
        avatarFile,
      );

      const result =
        await apiRequest<User>(
          '/users/me/avatar',
          {
            method:
              'POST',

            headers: {
              Authorization:
                `Bearer ${token}`,
            },

            body:
              formData,
          },
        );

      setUser(
        result,
      );

      setSuccess(
        tr(
          'Аватар обновлён',
        ),
      );

      closeCropEditor();
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
            'Не удалось сохранить аватар',
          ),
        );
      }
    } finally {
      setIsUploadingAvatar(
        false,
      );
    }
  }

  if (
    isLoading
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fffaf8]">

        <Heart
          size={36}
          className="animate-pulse text-[#d98a92]"
        />

      </main>
    );
  }

  if (
    !user
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fffaf8] p-5">

        <div className="text-center">

          <p className="text-[#755f5b]">

            {error ??
              tr(
                'Не удалось открыть профиль',
              )}

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
            {tr(
              'На главную',
            )}
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
      .charAt(
        0,
      )
      .toUpperCase();

  const today =
    new Date()
      .toISOString()
      .slice(
        0,
        10,
      );

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

          {tr(
            'Назад',
          )}
        </button>

        <header className="mb-8">

          <p className="text-sm font-medium text-[#c8757c]">
            {tr(
              'Настройки',
            )}
          </p>

          <h1 className="mt-1 text-3xl font-semibold text-[#554442]">
            {tr(
              'Ваш профиль',
            )}
          </h1>

          <p className="mt-3 max-w-xl text-[#98837e]">
            {tr(
              'Здесь можно изменить информацию, которую видят другие пользователи.',
            )}
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
                setError(
                  null,
                )
              }
              className="rounded-lg p-1 transition hover:bg-[#f8dddd]"
            >
              <X
                size={16}
              />
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
                      tr(
                        'Аватар {name}',
                        {
                          name,
                        },
                      )
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
                  title={
                    tr(
                      'Изменить аватар',
                    )
                  }
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
                    handleAvatarFileChange
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
                  className="mt-3 flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-[#b96b72] transition-all hover:bg-[#fff0ef] active:scale-[0.97]"
                >
                  <ImagePlus
                    size={16}
                  />

                  {tr(
                    'Изменить фотографию',
                  )}
                </button>

                <p className="mt-1 text-xs text-[#b09b95]">
                  {tr(
                    'JPG, PNG или WEBP, до 5 МБ',
                  )}
                </p>

              </div>

            </div>

            {/* Поля профиля */}
            <div className="mt-9 grid gap-6">

              <div>

                <label
                  htmlFor="displayName"
                  className="mb-2 block text-sm font-medium text-[#665451]"
                >
                  {tr(
                    'Имя',
                  )}
                </label>

                <input
                  id="displayName"
                  type="text"
                  maxLength={
                    50
                  }
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
                      'Как вас называть?',
                    )
                  }
                  className="w-full rounded-2xl border border-[#eadbd7] bg-[#fffdfc] px-4 py-3.5 text-[#554442] outline-none transition focus:border-[#df9ca1] focus:ring-4 focus:ring-[#f7e3e5]"
                />

              </div>

              <div>

                <label
                  htmlFor="nickname"
                  className="mb-2 block text-sm font-medium text-[#665451]"
                >
                  {tr(
                    'Никнейм',
                  )}
                </label>

                <div className="flex rounded-2xl border border-[#eadbd7] bg-[#fffdfc] transition focus-within:border-[#df9ca1] focus-within:ring-4 focus-within:ring-[#f7e3e5]">

                  <span className="flex items-center pl-4 text-[#b29c96]">
                    @
                  </span>

                  <input
                    id="nickname"
                    type="text"
                    minLength={
                      3
                    }
                    maxLength={
                      30
                    }
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
                  {tr(
                    'Только латинские буквы, цифры и нижнее подчёркивание.',
                  )}
                </p>

              </div>

              <div>

                <label
                  htmlFor="birthDate"
                  className="mb-2 block text-sm font-medium text-[#665451]"
                >
                  {tr(
                    'Дата рождения',
                  )}
                </label>

                <div className="relative">

                  <Cake
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#c09292]"
                  />

                  <input
                    id="birthDate"
                    type="date"
                    max={
                      today
                    }
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
                    ? tr(
                        'Сохраняем...',
                      )
                    : tr(
                        'Сохранить изменения',
                      )}
                </button>

              </div>

            </div>

          </div>

        </section>

        {/* Аккаунт и безопасность */}
        <section className="mt-7 overflow-hidden rounded-[32px] border border-[#eeddda] bg-white shadow-[0_20px_70px_rgba(91,65,59,0.07)]">

          <div className="border-b border-[#f1e5e1] px-7 py-7 md:px-10">

            <div className="flex items-start gap-4">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#fde9e8] text-[#c8757c]">
                <ShieldCheck
                  size={21}
                />
              </div>

              <div>

                <p className="text-sm font-medium text-[#c8757c]">
                  {tr(
                    'Безопасность',
                  )}
                </p>

                <h2 className="mt-1 text-2xl font-semibold text-[#554442]">
                  {tr(
                    'Аккаунт и безопасность',
                  )}
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#98837e]">
                  {tr(
                    'Управляйте электронной почтой и паролем вашего аккаунта.',
                  )}
                </p>

              </div>

            </div>

          </div>

          <div className="px-7 py-7 md:px-10 md:py-9">

            {accountError && (
              <div className="mb-6 flex items-start justify-between gap-4 rounded-2xl border border-[#efc9cc] bg-[#fff1f1] px-5 py-4 text-sm text-[#a95057]">

                <span>
                  {accountError}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setAccountError(
                      null,
                    )
                  }
                  title={
                    tr(
                      'Закрыть',
                    )
                  }
                  className="rounded-lg p-1 transition hover:bg-[#f8dddd]"
                >
                  <X
                    size={16}
                  />
                </button>

              </div>
            )}

            {accountSuccess && (
              <div className="mb-6 rounded-2xl border border-[#eee0db] bg-[#edf3e8] px-5 py-4 text-sm text-[#75615c]">
                {accountSuccess}
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-2">

              {/* Электронная почта */}
              <div className="rounded-[26px] border border-[#eee0db] bg-[#fffaf9] p-5 md:p-6">

                <div className="flex items-start gap-3">

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#fde9e8] text-[#c8757c]">
                    <Mail
                      size={19}
                    />
                  </div>

                  <div>

                    <h3 className="font-semibold text-[#554442]">
                      {tr(
                        'Электронная почта',
                      )}
                    </h3>

                    <p className="mt-1 text-sm leading-5 text-[#98837e]">
                      {tr(
                        'Она используется для входа в аккаунт.',
                      )}
                    </p>

                  </div>

                </div>

                <div className="mt-6 grid gap-5">

                  <div>

                    <label
                      htmlFor="accountEmail"
                      className="mb-2 block text-sm font-medium text-[#665451]"
                    >
                      {tr(
                        'Email',
                      )}
                    </label>

                    <input
                      id="accountEmail"
                      type="email"
                      autoComplete="email"
                      maxLength={
                        254
                      }
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
                      placeholder="name@example.com"
                      className="w-full rounded-2xl border border-[#eadbd7] bg-[#fffdfc] px-4 py-3.5 text-[#554442] outline-none transition focus:border-[#df9ca1] focus:ring-4 focus:ring-[#f7e3e5]"
                    />

                  </div>

                  <PasswordField
                    id="emailCurrentPassword"
                    label={
                      tr(
                        'Текущий пароль',
                      )
                    }
                    value={
                      emailCurrentPassword
                    }
                    shown={
                      showEmailPassword
                    }
                    autoComplete="current-password"
                    onChange={
                      setEmailCurrentPassword
                    }
                    onToggle={() =>
                      setShowEmailPassword(
                        (
                          value,
                        ) =>
                          !value,
                      )
                    }
                  />

                  <p className="-mt-2 text-xs leading-5 text-[#a9948e]">
                    {tr(
                      'Для изменения почты подтвердите действие текущим паролем.',
                    )}
                  </p>

                  <button
                    type="button"
                    disabled={
                      isSavingEmail
                    }
                    onClick={() =>
                      void saveEmail()
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#df8e94] px-5 py-3.5 font-medium text-white shadow-sm transition-all duration-150 hover:bg-[#d37b83] hover:shadow-md active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
                  >
                    <Mail
                      size={17}
                    />

                    {isSavingEmail
                      ? tr(
                          'Сохраняем...',
                        )
                      : tr(
                          'Сохранить email',
                        )}
                  </button>

                </div>

              </div>

              {/* Пароль */}
              <div className="rounded-[26px] border border-[#eee0db] bg-[#fffaf9] p-5 md:p-6">

                <div className="flex items-start gap-3">

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#f2eaf8] text-[#9a7eae]">
                    <KeyRound
                      size={19}
                    />
                  </div>

                  <div>

                    <h3 className="font-semibold text-[#554442]">
                      {tr(
                        'Смена пароля',
                      )}
                    </h3>

                    <p className="mt-1 text-sm leading-5 text-[#98837e]">
                      {tr(
                        'Используйте новый пароль не короче 8 символов.',
                      )}
                    </p>

                  </div>

                </div>

                <div className="mt-6 grid gap-5">

                  <PasswordField
                    id="currentPassword"
                    label={
                      tr(
                        'Текущий пароль',
                      )
                    }
                    value={
                      currentPassword
                    }
                    shown={
                      showCurrentPassword
                    }
                    autoComplete="current-password"
                    onChange={
                      setCurrentPassword
                    }
                    onToggle={() =>
                      setShowCurrentPassword(
                        (
                          value,
                        ) =>
                          !value,
                      )
                    }
                  />

                  <PasswordField
                    id="newPassword"
                    label={
                      tr(
                        'Новый пароль',
                      )
                    }
                    value={
                      newPassword
                    }
                    shown={
                      showNewPassword
                    }
                    autoComplete="new-password"
                    onChange={
                      setNewPassword
                    }
                    onToggle={() =>
                      setShowNewPassword(
                        (
                          value,
                        ) =>
                          !value,
                      )
                    }
                  />

                  <PasswordField
                    id="confirmNewPassword"
                    label={
                      tr(
                        'Повторите новый пароль',
                      )
                    }
                    value={
                      confirmNewPassword
                    }
                    shown={
                      showConfirmNewPassword
                    }
                    autoComplete="new-password"
                    onChange={
                      setConfirmNewPassword
                    }
                    onToggle={() =>
                      setShowConfirmNewPassword(
                        (
                          value,
                        ) =>
                          !value,
                      )
                    }
                  />

                  <button
                    type="button"
                    disabled={
                      isSavingPassword
                    }
                    onClick={() =>
                      void savePassword()
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#df8e94] px-5 py-3.5 font-medium text-white shadow-sm transition-all duration-150 hover:bg-[#d37b83] hover:shadow-md active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
                  >
                    <KeyRound
                      size={17}
                    />

                    {isSavingPassword
                      ? tr(
                          'Сохраняем...',
                        )
                      : tr(
                          'Изменить пароль',
                        )}
                  </button>

                </div>

              </div>

            </div>

          </div>

        </section>

      </div>

      {/* Редактор миниатюры */}
      {cropImageUrl && (
        <AvatarCropDialog
          imageUrl={
            cropImageUrl
          }
          crop={
            crop
          }
          zoom={
            zoom
          }
          isSaving={
            isUploadingAvatar
          }
          onCropChange={
            setCrop
          }
          onZoomChange={
            setZoom
          }
          onCropComplete={
            handleCropComplete
          }
          onCancel={
            closeCropEditor
          }
          onSave={() =>
            void saveCroppedAvatar()
          }
        />
      )}

    </main>
  );
}

function PasswordField({
  id,
  label,
  value,
  shown,
  autoComplete,
  onChange,
  onToggle,
}: {
  id: string;

  label: string;

  value: string;

  shown: boolean;

  autoComplete:
    | 'current-password'
    | 'new-password';

  onChange: (
    value: string,
  ) => void;

  onToggle: () => void;
}) {
  return (
    <div>

      <label
        htmlFor={
          id
        }
        className="mb-2 block text-sm font-medium text-[#665451]"
      >
        {label}
      </label>

      <div className="relative">

        <input
          id={
            id
          }
          type={
            shown
              ? 'text'
              : 'password'
          }
          autoComplete={
            autoComplete
          }
          value={
            value
          }
          onChange={(
            event,
          ) =>
            onChange(
              event.target
                .value,
            )
          }
          className="w-full rounded-2xl border border-[#eadbd7] bg-[#fffdfc] py-3.5 pl-4 pr-12 text-[#554442] outline-none transition focus:border-[#df9ca1] focus:ring-4 focus:ring-[#f7e3e5]"
        />

        <button
          type="button"
          onClick={
            onToggle
          }
          title={
            shown
              ? tr(
                  'Скрыть пароль',
                )
              : tr(
                  'Показать пароль',
                )
          }
          aria-label={
            shown
              ? tr(
                  'Скрыть пароль',
                )
              : tr(
                  'Показать пароль',
                )
          }
          className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-[#a18d87] transition-all hover:bg-[#fff0ef] hover:text-[#c36f77] active:scale-[0.94]"
        >

          {shown ? (
            <EyeOff
              size={17}
            />
          ) : (
            <Eye
              size={17}
            />
          )}

        </button>

      </div>

    </div>
  );
}

function AvatarCropDialog({
  imageUrl,
  crop,
  zoom,
  isSaving,
  onCropChange,
  onZoomChange,
  onCropComplete,
  onCancel,
  onSave,
}: {
  imageUrl: string;

  crop:
    CropPosition;

  zoom: number;

  isSaving: boolean;

  onCropChange: (
    value:
      CropPosition,
  ) => void;

  onZoomChange: (
    value: number,
  ) => void;

  onCropComplete: (
    croppedArea:
      Area,

    croppedAreaPixels:
      Area,
  ) => void;

  onCancel: () => void;

  onSave: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#493c3b]/40 p-5 backdrop-blur-sm">

      <div className="w-full max-w-lg overflow-hidden rounded-[30px] border border-[#eadbd7] bg-white shadow-[0_30px_100px_rgba(73,48,45,0.24)]">

        {/* Заголовок */}
        <div className="flex items-start justify-between gap-4 px-6 pb-5 pt-6">

          <div>

            <p className="text-sm font-medium text-[#c8757c]">
              {tr(
                'Фотография профиля',
              )}
            </p>

            <h2 className="mt-1 text-2xl font-semibold text-[#554442]">
              {tr(
                'Выберите миниатюру',
              )}
            </h2>

            <p className="mt-2 text-sm text-[#927d78]">
              {tr(
                'Перемещайте фотографию, чтобы выбрать область, которая будет видна в аватаре.',
              )}
            </p>

          </div>

          <button
            type="button"
            disabled={
              isSaving
            }
            onClick={
              onCancel
            }
            title={
              tr(
                'Закрыть',
              )
            }
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[#947f79] transition-all hover:bg-[#fff0ef] hover:text-[#c36f77] active:scale-[0.94] disabled:opacity-50"
          >
            <X
              size={20}
            />
          </button>

        </div>

        {/* Область кадрирования */}
        <div className="relative h-[420px] w-full bg-[#2e2928]">

          <Cropper
            image={
              imageUrl
            }
            crop={
              crop
            }
            zoom={
              zoom
            }
            aspect={
              1
            }
            cropShape="round"
            showGrid={
              false
            }
            objectFit="contain"
            onCropChange={
              onCropChange
            }
            onZoomChange={
              onZoomChange
            }
            onCropComplete={
              onCropComplete
            }
          />

        </div>

        {/* Масштаб */}
        <div className="px-6 py-5">

          <div className="flex items-center gap-4">

            <Minus
              size={18}
              className="shrink-0 text-[#a28b85]"
            />

            <input
              type="range"
              min={
                1
              }
              max={
                3
              }
              step={
                0.01
              }
              value={
                zoom
              }
              onChange={(
                event,
              ) =>
                onZoomChange(
                  Number(
                    event.target
                      .value,
                  ),
                )
              }
              aria-label={
                tr(
                  'Масштаб фотографии',
                )
              }
              className="w-full accent-[#d68189]"
            />

            <Plus
              size={18}
              className="shrink-0 text-[#a28b85]"
            />

          </div>

          <p className="mt-3 text-center text-xs text-[#a7928c]">
            {tr(
              'Перетаскивайте фотографию мышкой и используйте ползунок для изменения масштаба.',
            )}
          </p>

        </div>

        {/* Кнопки */}
        <div className="flex flex-col-reverse gap-3 border-t border-[#f0e3df] px-6 py-5 sm:flex-row">

          <button
            type="button"
            disabled={
              isSaving
            }
            onClick={
              onCancel
            }
            className="flex-1 rounded-2xl border border-[#e7d8d4] px-5 py-3 font-medium text-[#79635f] transition-all hover:border-[#dbc2bd] hover:bg-[#fff3f0] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50"
          >
            {tr(
              'Отмена',
            )}
          </button>

          <button
            type="button"
            disabled={
              isSaving
            }
            onClick={
              onSave
            }
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#df8e94] px-5 py-3 font-medium text-white shadow-sm transition-all hover:bg-[#d17a82] hover:shadow-md active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50"
          >
            <Camera
              size={18}
            />

            {isSaving
              ? tr(
                  'Сохраняем...',
                )
              : tr(
                  'Сохранить фото',
                )}
          </button>

        </div>

      </div>

    </div>
  );
}

function toDateInputValue(
  value: string,
) {
  return new Date(
    value,
  )
    .toISOString()
    .slice(
      0,
      10,
    );
}