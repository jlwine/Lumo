'use client';

import {
  getIntlLocale,
  tr,
} from '@/i18n/core';

import {
  useLanguageVersion,
} from '@/i18n/use-language';

import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  ArrowLeft,
  Cake,
  CalendarDays,
  Heart,
  Pencil,
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
  User,
} from '@/types/auth';

import type {
  PublicUserProfile,
} from '@/types/user-profile';

export default function ProfilePage() {
  useLanguageVersion();

  const router =
    useRouter();

  const params =
    useParams<{
      nickname: string;
    }>();

  const nickname =
    params.nickname;

  const [
    profile,
    setProfile,
  ] =
    useState<PublicUserProfile | null>(
      null,
    );

  const [
    currentUser,
    setCurrentUser,
  ] =
    useState<User | null>(
      null,
    );

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(true);

  const [
    isInviting,
    setIsInviting,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );

  const fetchPageData =
    useCallback(
      async () => {
        const token =
          getAccessToken();

        if (!token) {
          router.replace(
            '/login',
          );

          return null;
        }

        const [
          profileResult,
          currentUserResult,
        ] =
          await Promise.all([
            apiRequest<PublicUserProfile>(
              `/users/${encodeURIComponent(
                nickname,
              )}`,
              {
                headers: {
                  Authorization:
                    `Bearer ${token}`,
                },
              },
            ),

            apiRequest<User>(
              '/auth/me',
              {
                headers: {
                  Authorization:
                    `Bearer ${token}`,
                },
              },
            ),
          ]);

        return {
          profile:
            profileResult,

          currentUser:
            currentUserResult,
        };
      },
      [
        nickname,
        router,
      ],
    );

  useEffect(() => {
    let cancelled =
      false;

    async function loadPage() {
      try {
        const result =
          await fetchPageData();

        if (
          cancelled ||
          !result
        ) {
          return;
        }

        setProfile(
          result.profile,
        );

        setCurrentUser(
          result.currentUser,
        );

        setError(null);
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
            tr('Не удалось загрузить профиль'),
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadPage();

    return () => {
      cancelled = true;
    };
  }, [fetchPageData]);

  async function handleInvite() {
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

      const updatedData =
        await fetchPageData();

      if (updatedData) {
        setProfile(
          updatedData.profile,
        );

        setCurrentUser(
          updatedData.currentUser,
        );
      }
    } catch (error) {
      if (
        error instanceof Error
      ) {
        setError(
          error.message,
        );
      } else {
        setError(
          tr('Не удалось отправить приглашение'),
        );
      }
    } finally {
      setIsInviting(false);
    }
  }

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

  if (!profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fffaf8] p-6">

        <div className="text-center">

          <p className="text-[#755f5b]">
            {error ??
              tr('Пользователь не найден')}
          </p>

          <button
            type="button"
            onClick={() =>
              router.push(
                '/home',
              )
            }
            className="mt-5 rounded-xl bg-[#df8e94] px-5 py-3 text-white transition-all hover:bg-[#d77c83] active:scale-[0.97]"
          >{tr('На главную')}</button>

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
    profile.relationship
      .partner;

  const isOwnProfile =
    currentUser?.id ===
    profile.id;

  return (
    <main className="min-h-screen bg-[#fffaf8] px-5 py-8">

      <div className="mx-auto max-w-5xl">

        <button
          type="button"
          onClick={() =>
            router.back()
          }
          className="mb-6 flex items-center gap-2 rounded-xl border border-transparent px-3 py-2 text-sm font-medium text-[#876f6a] transition-all duration-150 hover:border-[#efd8d4] hover:bg-[#fff0ed] hover:text-[#c36f77] active:scale-[0.96]"
        >
          <ArrowLeft
            size={18}
          />{tr('Назад')}</button>

        <section className="overflow-hidden rounded-[32px] border border-[#eeddda] bg-white shadow-[0_20px_70px_rgba(91,65,59,0.07)]">

          <div className="h-40 bg-gradient-to-r from-[#f6dce0] via-[#f4e4eb] to-[#e7e0f3]" />

          <div className="px-7 pb-8 md:px-10">

            <div className="-mt-14 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">

              <div>

                {profile.avatarUrl ? (
                  <div
                    role="img"
                    aria-label={
                      tr('Аватар пользователя {name}', { name })
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

                <div className="mt-5">

                  <h1 className="text-3xl font-semibold text-[#554442]">
                    {name}
                  </h1>

                  <p className="mt-1 text-[#a08b85]">
                    @{profile.nickname}
                  </p>

                </div>

              </div>

              {isOwnProfile ? (
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      '/settings/profile',
                    )
                  }
                  className="flex items-center justify-center gap-2 rounded-2xl border border-[#e5ceca] bg-white px-6 py-3 font-medium text-[#806964] shadow-sm transition-all duration-150 hover:border-[#dc9298] hover:bg-[#fff0ef] hover:text-[#bd666e] hover:shadow-md active:scale-[0.97] active:bg-[#f9dfe1]"
                >
                  <Pencil
                    size={17}
                  />{tr('Редактировать профиль')}</button>
              ) : (
                <ProfileAction
                  profile={
                    profile
                  }
                  isInviting={
                    isInviting
                  }
                  onInvite={
                    handleInvite
                  }
                />
              )}

            </div>

            {error && (
              <div className="mt-6 rounded-2xl border border-[#f1c9cc] bg-[#fff2f2] px-5 py-4 text-sm text-[#a84e55]">
                {error}
              </div>
            )}

            <div className="mt-8 grid gap-5 md:grid-cols-2">

              {/* Отношения */}
              <div className="rounded-[24px] border border-[#eee0dc] bg-[#fffaf8] p-6">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fae3e5] text-[#c6747b]">
                    <Heart
                      size={20}
                    />
                  </div>

                  <h2 className="font-semibold text-[#554442]">{tr('Отношения')}</h2>

                </div>

                {profile.relationship
                  .status ===
                  'ACTIVE' &&
                partner ? (
                  <div className="mt-5">

                    <p className="text-sm text-[#9b8580]">{tr('В отношениях с')}</p>

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
                        {tr('с {date}', {
                          date: formatDate(
                            profile.relationship.startedAt,
                          ),
                        })}
                      </p>
                    )}

                  </div>
                ) : (
                  <p className="mt-5 text-[#8f7974]">{tr('Сейчас не состоит в отношениях.')}</p>
                )}

              </div>

              {/* Информация */}
              <div className="rounded-[24px] border border-[#eee0dc] bg-[#fffaf8] p-6">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eee8f5] text-[#83759a]">
                    <UserRound
                      size={20}
                    />
                  </div>

                  <h2 className="font-semibold text-[#554442]">{tr('О пользователе')}</h2>

                </div>

                <div className="mt-5">

                  <div className="flex items-start gap-3">

                    <Cake
                      size={18}
                      className="mt-0.5 shrink-0 text-[#c07b82]"
                    />

                    <div>

                      <p className="text-sm text-[#9b8580]">{tr('День рождения')}</p>

                      <p className="mt-1 font-medium text-[#65514d]">
                        {profile.birthDate
                          ? formatDate(
                              profile.birthDate,
                            )
                          : tr('Не указан')}
                      </p>

                    </div>

                  </div>

                  <div className="mt-5 flex items-start gap-3">

                    <CalendarDays
                      size={18}
                      className="mt-0.5 shrink-0 text-[#83759a]"
                    />

                    <div>

                      <p className="text-sm text-[#9b8580]">{tr('В приложении с')}</p>

                      <p className="mt-1 font-medium text-[#65514d]">
                        {formatDate(
                          profile.createdAt,
                        )}
                      </p>

                    </div>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </section>

      </div>

    </main>
  );
}

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
        disabled={
          isInviting
        }
        onClick={
          onInvite
        }
        className="flex items-center justify-center gap-2 rounded-2xl bg-[#df8e94] px-6 py-3 font-medium text-white transition-all hover:bg-[#d77c83] active:scale-[0.97] disabled:opacity-60"
      >
        <Heart
          size={18}
        />

        {isInviting
          ? tr('Отправляем...')
          : tr('Пригласить в отношения')}
      </button>
    );
  }

  if (
    profile.invitation
      ?.direction ===
    'SENT'
  ) {
    return (
      <div className="rounded-2xl bg-[#fff0ef] px-5 py-3 text-sm font-medium text-[#b76870]">{tr('♡ Приглашение отправлено')}</div>
    );
  }

  if (
    profile.invitation
      ?.direction ===
    'RECEIVED'
  ) {
    return (
      <div className="rounded-2xl bg-[#eee8f5] px-5 py-3 text-sm font-medium text-[#786a90]">{tr('Вам отправлено приглашение')}</div>
    );
  }

  const messages = {
    SELF:
      tr('Это ваш профиль'),

    CURRENT_USER_IN_RELATIONSHIP:
      tr('Вы уже состоите в отношениях'),

    USER_IN_RELATIONSHIP:
      tr('Пользователь уже состоит в отношениях'),

    INVITATION_ALREADY_EXISTS:
      tr('Между вами уже есть приглашение'),
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
        : tr('Приглашение недоступно')}

    </div>
  );
}

function formatDate(
  value: string,
) {
  return new Intl.DateTimeFormat(
    getIntlLocale(),
    {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    },
  ).format(
    new Date(value),
  );
}