'use client';

import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  ArrowLeft,
  CalendarDays,
  Heart,
  UserRound,
} from 'lucide-react';

import {
  useParams,
  useRouter,
} from 'next/navigation';

import { apiRequest } from '@/lib/api';

import {
  getAccessToken,
  removeAccessToken,
} from '@/lib/auth';

import type {
  PublicUserProfile,
} from '@/types/user-profile';

export default function ProfilePage() {
  const router = useRouter();

  const params = useParams<{
    nickname: string;
  }>();

  const nickname = params.nickname;

  const [profile, setProfile] =
    useState<PublicUserProfile | null>(
      null,
    );

  const [isLoading, setIsLoading] =
    useState(true);

  const [isInviting, setIsInviting] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  /*
   * Функция только получает профиль пользователя.
   * React-state здесь не изменяется.
   */
  const fetchProfile = useCallback(
    async () => {
      const token = getAccessToken();

      if (!token) {
        router.replace('/login');

        return null;
      }

      return apiRequest<PublicUserProfile>(
        `/users/${encodeURIComponent(
          nickname,
        )}`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        },
      );
    },
    [
      nickname,
      router,
    ],
  );

  /*
   * Загружаем профиль при открытии страницы
   * или изменении никнейма в URL.
   */
  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        const result =
          await fetchProfile();

        if (
          !cancelled &&
          result
        ) {
          setProfile(result);
          setError(null);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (
          error instanceof Error
        ) {
          setError(error.message);
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

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [fetchProfile]);

  /*
   * Отправка приглашения
   * пользователю в отношения.
   */
  async function handleInvite() {
    const token =
      getAccessToken();

    if (!token) {
      removeAccessToken();
      router.replace('/login');

      return;
    }

    try {
      setIsInviting(true);
      setError(null);

      await apiRequest(
        `/relationships/invitations/${encodeURIComponent(
          nickname,
        )}`,
        {
          method: 'POST',

          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        },
      );

      /*
       * После отправки приглашения
       * заново получаем профиль,
       * чтобы интерфейс сразу показал
       * новый статус приглашения.
       */
      const updatedProfile =
        await fetchProfile();

      if (updatedProfile) {
        setProfile(
          updatedProfile,
        );
      }
    } catch (error) {
      if (
        error instanceof Error
      ) {
        setError(error.message);
      } else {
        setError(
          'Не удалось отправить приглашение',
        );
      }
    } finally {
      setIsInviting(false);
    }
  }

  /*
   * Экран загрузки.
   */
  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fffaf8]">
        <Heart
          className="animate-pulse text-[#d98a92]"
          size={34}
        />
      </main>
    );
  }

  /*
   * Если профиль получить не удалось.
   */
  if (!profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fffaf8] p-6">

        <div className="text-center">

          <p className="text-[#755f5b]">
            {error ??
              'Пользователь не найден'}
          </p>

          <button
            type="button"
            onClick={() =>
              router.push('/home')
            }
            className="mt-5 rounded-xl bg-[#df8e94] px-5 py-3 text-white transition hover:bg-[#d77c83]"
          >
            На главную
          </button>

        </div>

      </main>
    );
  }

  const name =
    profile.displayName ??
    profile.nickname;

  const initial =
    name
      .charAt(0)
      .toUpperCase();

  const partner =
    profile.relationship.partner;

  return (
    <main className="min-h-screen bg-[#fffaf8] px-5 py-8">

      <div className="mx-auto max-w-5xl">

        {/* Кнопка назад */}
        <button
          type="button"
          onClick={() =>
            router.back()
          }
          className="mb-6 flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-[#876f6a] transition hover:bg-[#fff0ed]"
        >
          <ArrowLeft
            size={18}
          />

          Назад
        </button>

        {/* Основная карточка профиля */}
        <section className="overflow-hidden rounded-[32px] border border-[#eeddda] bg-white shadow-[0_20px_70px_rgba(91,65,59,0.07)]">

          {/* Обложка */}
          <div className="h-40 bg-gradient-to-r from-[#f6dce0] via-[#f4e4eb] to-[#e7e0f3]" />

          <div className="px-7 pb-8 md:px-10">

            <div className="-mt-14 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">

              <div>

                {/* Аватар */}
                {profile.avatarUrl ? (
                  <div
                    role="img"
                    aria-label={
                      `Аватар пользователя ${name}`
                    }
                    className="h-28 w-28 rounded-full border-[6px] border-white bg-cover bg-center shadow-sm"
                    style={{
                      backgroundImage:
                        `url("${profile.avatarUrl}")`,
                    }}
                  />
                ) : (
                  <div className="flex h-28 w-28 items-center justify-center rounded-full border-[6px] border-white bg-[#eadfcf] text-4xl font-semibold text-[#795f52] shadow-sm">
                    {initial}
                  </div>
                )}

                {/* Имя */}
                <div className="mt-5">

                  <h1 className="text-3xl font-semibold text-[#554442]">
                    {name}
                  </h1>

                  <p className="mt-1 text-[#a08b85]">
                    @{profile.nickname}
                  </p>

                </div>

              </div>

              {/* Действие с профилем */}
              <ProfileAction
                profile={profile}
                isInviting={
                  isInviting
                }
                onInvite={
                  handleInvite
                }
              />

            </div>

            {/* Ошибка */}
            {error && (
              <div className="mt-6 rounded-2xl border border-[#f1c9cc] bg-[#fff2f2] px-5 py-4 text-sm text-[#a84e55]">
                {error}
              </div>
            )}

            {/* Информация */}
            <div className="mt-8 grid gap-5 md:grid-cols-2">

              {/* Отношения */}
              <div className="rounded-[24px] border border-[#eee0dc] bg-[#fffaf8] p-6">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fae3e5] text-[#c6747b]">
                    <Heart
                      size={20}
                    />
                  </div>

                  <h2 className="font-semibold text-[#554442]">
                    Отношения
                  </h2>

                </div>

                {profile.relationship.status ===
                  'ACTIVE' &&
                partner ? (
                  <div className="mt-5">

                    <p className="text-sm text-[#9b8580]">
                      В отношениях с
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          `/profile/${partner.nickname}`,
                        )
                      }
                      className="mt-2 text-lg font-semibold text-[#c36f77] transition hover:underline"
                    >
                      {partner.displayName ??
                        partner.nickname}
                    </button>

                    {profile
                      .relationship
                      .startedAt && (
                      <p className="mt-3 text-sm text-[#99847f]">
                        с{' '}
                        {formatDate(
                          profile
                            .relationship
                            .startedAt,
                        )}
                      </p>
                    )}

                  </div>
                ) : (
                  <p className="mt-5 text-[#8f7974]">
                    Сейчас не состоит
                    в отношениях.
                  </p>
                )}

              </div>

              {/* Дата регистрации */}
              <div className="rounded-[24px] border border-[#eee0dc] bg-[#fffaf8] p-6">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eee8f5] text-[#83759a]">
                    <CalendarDays
                      size={20}
                    />
                  </div>

                  <h2 className="font-semibold text-[#554442]">
                    В приложении
                  </h2>

                </div>

                <p className="mt-5 text-sm text-[#9b8580]">
                  Зарегистрирован
                </p>

                <p className="mt-2 font-medium text-[#65514d]">
                  {formatDate(
                    profile.createdAt,
                  )}
                </p>

              </div>

            </div>

          </div>

        </section>

      </div>

    </main>
  );
}

/*
 * Кнопка или статус действия
 * относительно открытого пользователя.
 */
function ProfileAction({
  profile,
  isInviting,
  onInvite,
}: {
  profile: PublicUserProfile;
  isInviting: boolean;
  onInvite: () => void;
}) {
  if (
    profile.actions.canInvite
  ) {
    return (
      <button
        type="button"
        disabled={isInviting}
        onClick={onInvite}
        className="flex items-center justify-center gap-2 rounded-2xl bg-[#df8e94] px-6 py-3 font-medium text-white transition hover:bg-[#d77c83] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Heart
          size={18}
        />

        {isInviting
          ? 'Отправляем...'
          : 'Пригласить в отношения'}
      </button>
    );
  }

  /*
   * Текущий пользователь уже
   * отправил приглашение.
   */
  if (
    profile.invitation
      ?.direction === 'SENT'
  ) {
    return (
      <div className="rounded-2xl bg-[#fff0ef] px-5 py-3 text-sm font-medium text-[#b76870]">
        ♡ Приглашение отправлено
      </div>
    );
  }

  /*
   * Открытый пользователь уже
   * отправил приглашение текущему.
   */
  if (
    profile.invitation
      ?.direction === 'RECEIVED'
  ) {
    return (
      <div className="rounded-2xl bg-[#eee8f5] px-5 py-3 text-sm font-medium text-[#786a90]">
        Вам отправлено приглашение
      </div>
    );
  }

  const messages = {
    SELF:
      'Это ваш профиль',

    CURRENT_USER_IN_RELATIONSHIP:
      'Вы уже состоите в отношениях',

    USER_IN_RELATIONSHIP:
      'Пользователь уже состоит в отношениях',

    INVITATION_ALREADY_EXISTS:
      'Между вами уже есть приглашение',
  };

  const reason =
    profile.actions
      .inviteUnavailableReason;

  return (
    <div className="flex items-center gap-2 rounded-2xl border border-[#eadbd7] bg-white px-5 py-3 text-sm text-[#8c7772]">

      <UserRound
        size={17}
      />

      {reason
        ? messages[reason]
        : 'Приглашение недоступно'}

    </div>
  );
}

/*
 * Форматирование даты
 * в привычный русский вид.
 */
function formatDate(
  value: string,
) {
  return new Intl.DateTimeFormat(
    'ru-RU',
    {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    },
  ).format(
    new Date(value),
  );
}