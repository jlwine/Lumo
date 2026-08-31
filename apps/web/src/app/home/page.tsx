'use client';

import {
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  CalendarDays,
  ChevronRight,
  Clock3,
  Gift,
  Heart,
  Images,
  LogOut,
  MapPin,
  Settings,
  Settings2,
} from 'lucide-react';

import {
  useRouter,
} from 'next/navigation';

import {
  InvitationsButton,
} from '@/components/invitations-button';

import {
  UserSearch,
} from '@/components/user-search';

import { apiRequest } from '@/lib/api';

import {
  getAccessToken,
  removeAccessToken,
} from '@/lib/auth';

import type {
  User,
} from '@/types/auth';

import type {
  CalendarEvent,
} from '@/types/calendar';

import type {
  Relationship,
  RelationshipResponse,
} from '@/types/relationship';

export default function HomePage() {
  const router =
    useRouter();

  const [
    user,
    setUser,
  ] =
    useState<User | null>(
      null,
    );

  const [
    relationship,
    setRelationship,
  ] =
    useState<Relationship | null>(
      null,
    );

  const [
    upcomingEvents,
    setUpcomingEvents,
  ] =
    useState<CalendarEvent[]>(
      [],
    );

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(true);

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

    async function loadHome() {
      const token =
        getAccessToken();

      if (!token) {
        router.replace(
          '/login',
        );

        return;
      }

      try {
        const [
          currentUser,
          relationshipData,
        ] =
          await Promise.all([
            apiRequest<User>(
              '/auth/me',
              {
                headers: {
                  Authorization:
                    `Bearer ${token}`,
                },
              },
            ),

            apiRequest<RelationshipResponse>(
              '/relationships/me',
              {
                headers: {
                  Authorization:
                    `Bearer ${token}`,
                },
              },
            ),
          ]);

        if (cancelled) {
          return;
        }

        setUser(
          currentUser,
        );

        setRelationship(
          relationshipData.relationship,
        );

        if (
          relationshipData.relationship
        ) {
          const from =
            new Date();

          const to =
            new Date();

          to.setDate(
            to.getDate() + 30,
          );

          try {
            const events =
              await apiRequest<
                CalendarEvent[]
              >(
                `/calendar?from=${encodeURIComponent(
                  from.toISOString(),
                )}&to=${encodeURIComponent(
                  to.toISOString(),
                )}`,
                {
                  headers: {
                    Authorization:
                      `Bearer ${token}`,
                  },
                },
              );

            if (!cancelled) {
              setUpcomingEvents(
                events,
              );
            }
          } catch {
            if (!cancelled) {
              setUpcomingEvents(
                [],
              );
            }
          }
        } else {
          setUpcomingEvents(
            [],
          );
        }
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
            'Не удалось загрузить данные',
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

    void loadHome();

    return () => {
      cancelled = true;
    };
  }, [router]);

  function handleLogout() {
    removeAccessToken();

    router.replace(
      '/login',
    );
  }

  const userName =
    user?.displayName ??
    user?.nickname ??
    'Пользователь';

  const partner =
    relationship?.partner ??
    null;

  const partnerName =
    partner?.displayName ??
    partner?.nickname ??
    null;

  const previewEvents =
    useMemo(
      () =>
        upcomingEvents.slice(
          0,
          4,
        ),
      [upcomingEvents],
    );

  const firstUpcomingEvent =
    upcomingEvents[0] ??
    null;

  const moreEventsCount =
    upcomingEvents.length > 1
      ? upcomingEvents.length - 1
      : 0;

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fffaf8]">

        <div className="text-center">

          <Heart
            size={38}
            className="mx-auto animate-pulse text-[#d98a92]"
          />

          <p className="mt-4 text-sm text-[#9c8681]">
            Загружаем ваше пространство...
          </p>

        </div>

      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fffaf8] p-5">

        <section className="w-full max-w-md rounded-[28px] border border-[#eedfdb] bg-white p-8 text-center">

          <Heart
            size={32}
            className="mx-auto text-[#d98a92]"
          />

          <h1 className="mt-5 text-2xl font-semibold text-[#554442]">
            Не удалось открыть
            пространство
          </h1>

          <p className="mt-3 text-sm leading-6 text-[#927d78]">
            {error ??
              'Попробуйте войти ещё раз.'}
          </p>

          <button
            type="button"
            onClick={() => {
              removeAccessToken();

              router.replace(
                '/login',
              );
            }}
            className="mt-6 rounded-2xl bg-[#df8e94] px-6 py-3 font-medium text-white transition-all hover:bg-[#d57a82] active:scale-[0.97]"
          >
            Войти снова
          </button>

        </section>

      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fffaf8]">

      <div className="flex min-h-screen">

        <aside className="hidden w-[245px] shrink-0 border-r border-[#efe2de] bg-[#fffdfc] lg:flex lg:flex-col">

          <div className="px-6 py-6">

            <button
              type="button"
              onClick={() =>
                router.push(
                  '/home',
                )
              }
              className="flex items-center gap-3"
            >

              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f7dfe2] text-[#cb727b]">
                <Heart
                  size={20}
                  fill="currentColor"
                />
              </div>

              <div className="text-left">

                <p className="text-lg font-semibold text-[#554442]">
                  Вдвоём
                </p>

                <p className="mt-0.5 text-xs text-[#ab9690]">
                  пространство для двоих
                </p>

              </div>

            </button>

          </div>

          <nav className="px-3">

            <SidebarItem
              icon={
                <Heart
                  size={18}
                />
              }
              label="Главная"
              active
              onClick={() =>
                router.push(
                  '/home',
                )
              }
            />

            <SidebarItem
              icon={
                <CalendarDays
                  size={18}
                />
              }
              label="Календарь"
              onClick={() =>
                router.push(
                  '/calendar',
                )
              }
            />

            <SidebarItem
              icon={
                <Gift
                  size={18}
                />
              }
              label="Вишлисты"
              badge="скоро"
            />

            <SidebarItem
              icon={
                <MapPin
                  size={18}
                />
              }
              label="Карта"
              badge="скоро"
            />

            <SidebarItem
              icon={
                <Images
                  size={18}
                />
              }
              label="Доска дня"
              badge="скоро"
            />

          </nav>

          <div className="mt-auto border-t border-[#f1e6e3] p-4">

            {relationship && (
              <SidebarItem
                icon={
                  <Heart
                    size={18}
                  />
                }
                label="Наши отношения"
                onClick={() =>
                  router.push(
                    '/settings/relationship',
                  )
                }
              />
            )}

            <div className="mt-4 flex items-center gap-3 rounded-2xl p-2">

              <Avatar
                name={
                  userName
                }
                avatarUrl={
                  user.avatarUrl
                }
                size="medium"
              />

              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/profile/${user.nickname}`,
                  )
                }
                className="min-w-0 flex-1 text-left"
              >

                <p className="truncate text-sm font-medium text-[#5a4744]">
                  {userName}
                </p>

                <p className="truncate text-xs text-[#a28d87]">
                  @{user.nickname}
                </p>

              </button>

              <button
                type="button"
                title="Выйти"
                onClick={
                  handleLogout
                }
                className="flex h-9 w-9 items-center justify-center rounded-xl text-[#9c8680] transition hover:bg-[#fff0ef] hover:text-[#c36f77] active:scale-[0.94]"
              >
                <LogOut
                  size={17}
                />
              </button>

            </div>

          </div>

        </aside>

        <div className="min-w-0 flex-1">

          <header className="sticky top-0 z-30 border-b border-[#f0e4e0] bg-[#fffaf8]/90 px-5 py-4 backdrop-blur-xl md:px-8">

            <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4">

              <div className="hidden w-full max-w-md md:block">
                <UserSearch />
              </div>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    '/home',
                  )
                }
                className="flex items-center gap-2 md:hidden"
              >
                <Heart
                  size={20}
                  className="text-[#c66f77]"
                  fill="currentColor"
                />

                <span className="font-semibold text-[#554442]">
                  Вдвоём
                </span>
              </button>

              <div className="ml-auto flex items-center gap-2">

                <InvitationsButton />

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/profile/${user.nickname}`,
                    )
                  }
                  className="hidden items-center gap-3 rounded-2xl px-2 py-1.5 transition hover:bg-[#fff0ed] active:scale-[0.98] sm:flex"
                >

                  <Avatar
                    name={
                      userName
                    }
                    avatarUrl={
                      user.avatarUrl
                    }
                    size="small"
                  />

                  <div className="max-w-[170px] text-left">

                    <p className="truncate text-sm font-medium text-[#5f4c48]">
                      {userName}
                    </p>

                    <p className="truncate text-xs text-[#a38e88]">
                      @{user.nickname}
                    </p>

                  </div>

                </button>

                <button
                  type="button"
                  title="Настройки профиля"
                  onClick={() =>
                    router.push(
                      '/settings/profile',
                    )
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-[#927c77] transition hover:bg-[#fff0ef] hover:text-[#c66f77] active:scale-[0.92]"
                >
                  <Settings
                    size={18}
                  />
                </button>

              </div>

            </div>

          </header>

          <div className="px-5 py-7 md:px-8 md:py-8">

            <div className="mx-auto max-w-[1440px]">

              <div className="mb-6 md:hidden">
                <UserSearch />
              </div>

              {error && (
                <div className="mb-6 rounded-2xl border border-[#efc9cc] bg-[#fff1f1] px-5 py-4 text-sm text-[#a95057]">
                  {error}
                </div>
              )}

              {relationship &&
              partner &&
              partnerName ? (
                <CoupleHero
                  user={
                    user
                  }
                  userName={
                    userName
                  }
                  relationship={
                    relationship
                  }
                  partnerName={
                    partnerName
                  }
                  onPartnerClick={() =>
                    router.push(
                      `/profile/${partner.nickname}`,
                    )
                  }
                  onSettingsClick={() =>
                    router.push(
                      '/settings/relationship',
                    )
                  }
                />
              ) : (
                <SingleHero
                  userName={
                    userName
                  }
                  onInvitationsClick={() =>
                    router.push(
                      '/invitations',
                    )
                  }
                />
              )}

              <section className="mt-7 grid gap-5 xl:grid-cols-3">

                <PlansPreviewCard
                  events={
                    previewEvents
                  }
                  onOpenCalendar={() =>
                    router.push(
                      '/calendar',
                    )
                  }
                />

                <EmptyWishlistPreview />

                <EmptyDayBoardPreview />

              </section>

              <section className="mt-6 grid gap-5 xl:grid-cols-[1.45fr_0.65fr]">

                <UpcomingPlansCard
                  relationshipExists={
                    Boolean(
                      relationship,
                    )
                  }
                  firstUpcomingEvent={
                    firstUpcomingEvent
                  }
                  moreEventsCount={
                    moreEventsCount
                  }
                  onOpenCalendar={() =>
                    router.push(
                      '/calendar',
                    )
                  }
                  onEditEvent={(
                    eventId,
                  ) =>
                    router.push(
                      `/calendar?edit=${encodeURIComponent(
                        eventId,
                      )}`,
                    )
                  }
                />

                <RelationshipSummaryCard
                  relationship={
                    relationship
                  }
                  userName={
                    userName
                  }
                  partnerName={
                    partnerName
                  }
                  onOpenSettings={() =>
                    router.push(
                      '/settings/relationship',
                    )
                  }
                />

              </section>

            </div>

          </div>

        </div>

      </div>

    </main>
  );
}

function CoupleHero({
  user,
  userName,
  relationship,
  partnerName,
  onPartnerClick,
  onSettingsClick,
}: {
  user: User;
  userName: string;
  relationship: Relationship;
  partnerName: string;
  onPartnerClick: () => void;
  onSettingsClick: () => void;
}) {
  return (
    <section className="relative overflow-hidden rounded-[32px] border border-[#ecdeda] bg-gradient-to-br from-[#fff1ef] via-[#fdf6f3] to-[#f1ebf7] p-7 shadow-[0_20px_70px_rgba(91,65,59,0.06)] md:p-9">

      <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-white/40 blur-3xl" />

      <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">

        <div>

          <div className="flex items-center gap-2 text-sm font-medium text-[#c06f77]">

            <Heart
              size={15}
              fill="currentColor"
            />

            Ваше общее пространство

          </div>

          <h1 className="mt-4 max-w-2xl text-3xl font-semibold leading-tight text-[#554442] md:text-[34px]">
            Добро пожаловать,
            {' '}
            {userName}
            {' ♡'}
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#917b75] md:text-base">
            Здесь будут храниться
            ваши планы, желания,
            фотографии и маленькие
            моменты, которые важны
            только вам двоим.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">

            <button
              type="button"
              onClick={
                onPartnerClick
              }
              className="rounded-2xl bg-[#dc8b92] px-5 py-3 text-sm font-medium text-white transition-all hover:bg-[#d17a82] active:scale-[0.97]"
            >
              Профиль партнёра
            </button>

            <button
              type="button"
              onClick={
                onSettingsClick
              }
              className="flex items-center gap-2 rounded-2xl border border-[#e5ceca] bg-white/70 px-5 py-3 text-sm font-medium text-[#806964] shadow-sm transition-all hover:border-[#dc9298] hover:bg-[#fff0ef] hover:text-[#bd666e] active:scale-[0.97]"
            >
              <Settings2
                size={17}
              />

              Настройки отношений
            </button>

          </div>

        </div>

        <div className="flex flex-col items-center">

          <div className="flex items-center">

            <Avatar
              name={
                userName
              }
              avatarUrl={
                user.avatarUrl
              }
              size="hero"
            />

            <div className="-mx-2 z-10 flex h-11 w-11 items-center justify-center rounded-full border-4 border-[#fbf1f1] bg-white text-[#d47b83] shadow-sm">

              <Heart
                size={18}
                fill="currentColor"
              />

            </div>

            <Avatar
              name={
                partnerName
              }
              avatarUrl={
                relationship
                  .partner
                  .avatarUrl
              }
              size="hero"
            />

          </div>

          <p className="mt-4 text-sm text-[#9d8781]">
            Вместе уже
          </p>

          <p className="mt-1 text-4xl font-semibold text-[#c36f77]">
            {
              relationship
                .daysTogether
            }
          </p>

          <p className="text-sm text-[#9d8781]">
            дней
          </p>

          <p className="mt-3 text-xs text-[#ab9791]">
            с{' '}
            {formatLongDate(
              relationship
                .startedAt,
            )}
          </p>

        </div>

      </div>

    </section>
  );
}

function SingleHero({
  userName,
  onInvitationsClick,
}: {
  userName: string;
  onInvitationsClick: () => void;
}) {
  return (
    <section className="rounded-[32px] border border-[#ecdeda] bg-gradient-to-br from-[#fff1ef] via-[#fdf6f3] to-[#f1ebf7] p-7 md:p-9">

      <div className="max-w-2xl">

        <div className="flex items-center gap-2 text-sm font-medium text-[#c06f77]">

          <Heart
            size={15}
          />

          Вдвоём

        </div>

        <h1 className="mt-4 text-3xl font-semibold text-[#554442] md:text-[34px]">
          Привет,
          {' '}
          {userName}
          {' ♡'}
        </h1>

        <p className="mt-3 leading-7 text-[#917b75]">
          Сейчас у вас нет активных
          отношений. Найдите человека
          по никнейму или проверьте
          входящие приглашения.
        </p>

        <button
          type="button"
          onClick={
            onInvitationsClick
          }
          className="mt-6 flex items-center gap-2 rounded-2xl bg-[#dc8b92] px-5 py-3 text-sm font-medium text-white transition-all hover:bg-[#d17a82] active:scale-[0.97]"
        >
          Проверить приглашения

          <ChevronRight
            size={17}
          />
        </button>

      </div>

    </section>
  );
}

function PlansPreviewCard({
  events,
  onOpenCalendar,
}: {
  events: CalendarEvent[];
  onOpenCalendar: () => void;
}) {
  return (
    <article className="rounded-[28px] border border-[#eee0dc] bg-white p-5 shadow-[0_10px_30px_rgba(91,65,59,0.03)]">

      <div className="flex items-center gap-3">

        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#efe8f7] text-[#8d7ca4]">
          <CalendarDays
            size={20}
          />
        </div>

        <h2 className="text-xl font-semibold text-[#554442]">
          Планы на 30 дней
        </h2>

      </div>

      <div className="mt-5 space-y-3">

        {events.length > 0 ? (
          events.map(
            (event) => (
              <button
                key={
                  event.id
                }
                type="button"
                onClick={
                  onOpenCalendar
                }
                className="flex w-full items-center gap-4 rounded-[18px] border border-[#f0e2de] bg-[#fffaf9] px-4 py-3 text-left transition-all hover:border-[#e5c9c5] hover:bg-[#fff3f1] hover:shadow-sm active:scale-[0.99]"
              >

                <div className="flex w-[34px] shrink-0 flex-col items-center text-[#d47c84]">

                  <span className="text-[11px] font-medium uppercase leading-none">
                    {formatWeekdayShort(
                      event.startsAt,
                    )}
                  </span>

                  <span className="mt-1 text-2xl font-semibold leading-none">
                    {formatDayNumber(
                      event.startsAt,
                    )}
                  </span>

                </div>

                <div className="min-w-0 flex-1">

                  <p className="truncate font-medium text-[#594844]">
                    {event.title}
                  </p>

                  <div className="mt-1 flex items-center gap-1.5 text-sm text-[#a18d87]">

                    <Clock3
                      size={14}
                    />

                    <span>
                      {event.allDay
                        ? 'Весь день'
                        : formatEventTime(
                            event,
                          )}
                    </span>

                  </div>

                </div>

                <ChevronRight
                  size={16}
                  className="shrink-0 text-[#baa49e]"
                />

              </button>
            ),
          )
        ) : (
          <div className="rounded-[20px] border border-dashed border-[#ebdbd7] bg-[#fffaf9] px-5 py-10 text-center">

            <CalendarDays
              size={25}
              className="mx-auto text-[#d2aaa7]"
            />

            <p className="mt-4 font-medium text-[#7c6660]">
              Пока нет планов
            </p>

            <p className="mt-2 text-sm text-[#a18c86]">
              События на ближайшие
              30 дней появятся здесь.
            </p>

          </div>
        )}

      </div>

      <button
        type="button"
        onClick={
          onOpenCalendar
        }
        className="mt-5 flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-medium text-[#d07e85] transition hover:bg-[#fff0ef] hover:text-[#be6770] active:scale-[0.98]"
      >
        Открыть календарь

        <ChevronRight
          size={15}
        />
      </button>

    </article>
  );
}

function EmptyWishlistPreview() {
  return (
    <article className="rounded-[28px] border border-[#eee0dc] bg-white p-5 shadow-[0_10px_30px_rgba(91,65,59,0.03)]">

      <div className="flex items-center gap-3">

        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#efe8f7] text-[#8d7ca4]">
          <Gift
            size={20}
          />
        </div>

        <h2 className="text-xl font-semibold text-[#554442]">
          Вишлист
        </h2>

      </div>

      <div className="mt-5 flex min-h-[250px] items-center justify-center rounded-[20px] border border-dashed border-[#e8dfe8] bg-[#fdfafd] px-6 text-center">

        <div>

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eee7f4] text-[#8b7b9d]">
            <Gift
              size={25}
            />
          </div>

          <p className="mt-4 font-medium text-[#705e6f]">
            Вишлист пока пуст
          </p>

          <p className="mx-auto mt-2 max-w-[260px] text-sm leading-6 text-[#a393a2]">
            Когда здесь появятся
            желания, часть из них
            будет отображаться
            на главной.
          </p>

          <span className="mt-4 inline-block rounded-full bg-[#f2ebf5] px-3 py-1.5 text-xs font-medium text-[#9e8ba9]">
            Раздел скоро появится
          </span>

        </div>

      </div>

    </article>
  );
}

function EmptyDayBoardPreview() {
  return (
    <article className="rounded-[28px] border border-[#eee0dc] bg-white p-5 shadow-[0_10px_30px_rgba(91,65,59,0.03)]">

      <div className="flex items-center gap-3">

        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f8eadc] text-[#bb8a67]">
          <Images
            size={20}
          />
        </div>

        <h2 className="text-xl font-semibold text-[#554442]">
          Доска дня
        </h2>

      </div>

      <div className="mt-5 flex min-h-[250px] items-center justify-center rounded-[20px] border border-dashed border-[#eadfd6] bg-[#fffaf6] px-6 text-center">

        <div>

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f8eadc] text-[#b98764]">
            <Images
              size={25}
            />
          </div>

          <p className="mt-4 font-medium text-[#755f51]">
            Здесь пока тихо
          </p>

          <p className="mx-auto mt-2 max-w-[260px] text-sm leading-6 text-[#a18d80]">
            Ваши фотографии
            и маленькие моменты
            появятся здесь после
            запуска доски дня.
          </p>

          <span className="mt-4 inline-block rounded-full bg-[#f8eee5] px-3 py-1.5 text-xs font-medium text-[#ad8b72]">
            Раздел скоро появится
          </span>

        </div>

      </div>

    </article>
  );
}

function UpcomingPlansCard({
  relationshipExists,
  firstUpcomingEvent,
  moreEventsCount,
  onOpenCalendar,
  onEditEvent,
}: {
  relationshipExists: boolean;
  firstUpcomingEvent: CalendarEvent | null;
  moreEventsCount: number;
  onOpenCalendar: () => void;
  onEditEvent: (
    eventId: string,
  ) => void;
}) {
  return (
    <article className="rounded-[28px] border border-[#eee0dc] bg-white p-5 shadow-[0_10px_30px_rgba(91,65,59,0.03)] md:p-6">

      <div className="flex items-center justify-between gap-4">

        <div className="flex items-center gap-3">

          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f8eadc] text-[#aa7a59]">
            <CalendarDays
              size={20}
            />
          </div>

          <h2 className="text-xl font-semibold text-[#554442]">
            Ближайшие планы
          </h2>

        </div>

        <button
          type="button"
          onClick={
            onOpenCalendar
          }
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-[#d07e85] transition hover:bg-[#fff0ef] hover:text-[#be6770] active:scale-[0.98]"
        >
          Открыть календарь

          <ChevronRight
            size={15}
          />
        </button>

      </div>

      {!relationshipExists ? (
        <div className="mt-6 rounded-[22px] border border-dashed border-[#eadbd7] bg-[#fffaf9] px-5 py-10 text-center">

          <p className="font-medium text-[#765f5a]">
            Календарь станет общим
            после создания пары
          </p>

          <p className="mt-2 text-sm leading-6 text-[#a08b85]">
            После создания отношений
            здесь появятся ваши планы.
          </p>

        </div>
      ) : firstUpcomingEvent ? (
        <>
          <div className="mt-6 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">

            <button
              type="button"
              onClick={
                onOpenCalendar
              }
              className="rounded-[20px] border border-[#f0e2de] bg-[#fffaf9] p-4 text-left transition-all hover:border-[#e4c7c3] hover:bg-[#fff3f1] hover:shadow-sm active:scale-[0.99]"
            >

              <div className="flex items-start gap-4">

                <div className="flex h-[62px] w-[62px] shrink-0 flex-col items-center justify-center rounded-[18px] bg-[#fae3e5] text-[#bc6b72]">

                  <span className="text-[10px] font-medium uppercase leading-none">
                    {formatMonthUpper(
                      firstUpcomingEvent
                        .startsAt,
                    )}
                  </span>

                  <span className="mt-1 text-3xl font-semibold leading-none">
                    {formatDayNumber(
                      firstUpcomingEvent
                        .startsAt,
                    )}
                  </span>

                </div>

                <div className="min-w-0">

                  <p className="text-lg font-semibold text-[#5b4946]">
                    {
                      firstUpcomingEvent
                        .title
                    }
                  </p>

                  <p className="mt-2 text-sm text-[#a18c86]">
                    {firstUpcomingEvent
                      .allDay
                      ? 'Весь день'
                      : formatEventTime(
                          firstUpcomingEvent,
                        )}
                    {' • '}
                    {formatWeekdayFull(
                      firstUpcomingEvent
                        .startsAt,
                    )}
                  </p>

                  {firstUpcomingEvent
                    .location && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-[#a18c86]">

                      <MapPin
                        size={14}
                      />

                      <span className="truncate">
                        {
                          firstUpcomingEvent
                            .location
                        }
                      </span>

                    </div>
                  )}

                </div>

              </div>

            </button>

            {/* Нажатие на заметку сразу
                открывает редактирование события. */}
            <button
              type="button"
              onClick={() =>
                onEditEvent(
                  firstUpcomingEvent.id,
                )
              }
              className="group rounded-[20px] border border-[#f0e2de] bg-[#fffaf9] p-4 text-left transition-all hover:border-[#dfbdb9] hover:bg-[#fff3f1] hover:shadow-sm active:scale-[0.99]"
            >

              <div className="flex items-start justify-between gap-3">

                <div>

                  <p className="text-sm font-medium text-[#9f8c86]">
                    Заметка
                  </p>

                  <p className="mt-1 text-xs text-[#b8a39d]">
                    Нажмите, чтобы
                    отредактировать
                  </p>

                </div>

                <ChevronRight
                  size={17}
                  className="mt-1 text-[#b9a39d] transition group-hover:translate-x-0.5 group-hover:text-[#c97880]"
                />

              </div>

              {firstUpcomingEvent
                .description
                ?.trim() ? (
                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[#685451]">
                  {
                    firstUpcomingEvent
                      .description
                  }
                </p>
              ) : (
                <p className="mt-3 text-sm leading-7 text-[#a28e88]">
                  К этому событию пока
                  не добавлена заметка.
                  Нажмите, чтобы добавить.
                </p>
              )}

            </button>

          </div>

          <button
            type="button"
            onClick={
              onOpenCalendar
            }
            className="mt-4 flex w-full items-center justify-between rounded-[18px] border border-[#f1e5e1] bg-[#fffdfc] px-4 py-3 text-left transition-all hover:border-[#e4c7c3] hover:bg-[#fff5f3] active:scale-[0.995]"
          >

            <div className="flex items-center gap-3">

              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f0d9dc] text-xs font-semibold text-[#b76c74]">
                ♡
              </div>

              <p className="text-sm text-[#715d58]">

                {moreEventsCount > 0
                  ? `Ещё ${moreEventsCount} ${pluralizeEvents(
                      moreEventsCount,
                    )} в ближайшие 30 дней`
                  : 'Это единственное событие на ближайшие 30 дней'}

              </p>

            </div>

            <ChevronRight
              size={18}
              className="text-[#b9a39d]"
            />

          </button>
        </>
      ) : (
        <div className="mt-6 rounded-[22px] border border-dashed border-[#eadbd7] bg-[#fffaf9] px-5 py-10 text-center">

          <p className="font-medium text-[#765f5a]">
            На ближайшие 30 дней
            планов пока нет
          </p>

          <p className="mt-2 text-sm leading-6 text-[#a08b85]">
            Создайте первое событие
            в вашем общем календаре.
          </p>

          <button
            type="button"
            onClick={
              onOpenCalendar
            }
            className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[#df8e94] px-5 py-3 text-sm font-medium text-white transition-all hover:bg-[#d37b83] active:scale-[0.97]"
          >
            <CalendarDays
              size={17}
            />

            Добавить событие
          </button>

        </div>
      )}

    </article>
  );
}

function RelationshipSummaryCard({
  relationship,
  userName,
  partnerName,
  onOpenSettings,
}: {
  relationship: Relationship | null;
  userName: string;
  partnerName: string | null;
  onOpenSettings: () => void;
}) {
  return (
    <article className="rounded-[28px] border border-[#eee0dc] bg-white p-5 shadow-[0_10px_30px_rgba(91,65,59,0.03)] md:p-6">

      <div className="flex items-center gap-3">

        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f9e2e4] text-[#c06e76]">
          <Heart
            size={20}
          />
        </div>

        <h2 className="text-xl font-semibold text-[#554442]">
          Наши отношения
        </h2>

      </div>

      {relationship &&
      partnerName ? (
        <>
          <p className="mt-5 text-4xl font-semibold leading-none text-[#d0727a]">
            {
              relationship
                .daysTogether
            }
          </p>

          <p className="mt-2 text-sm text-[#907c76]">
            дней вместе
          </p>

          <div className="mt-6 border-t border-[#f2e7e3] pt-5">

            <p className="font-semibold text-[#554442]">
              {userName}
              {' ♡ '}
              {partnerName}
            </p>

            <p className="mt-4 text-sm text-[#aa958f]">
              Наша дата
            </p>

            <p className="mt-1 font-medium text-[#6a5754]">
              {formatLongDate(
                relationship
                  .startedAt,
              )}
            </p>

          </div>

          <div className="mt-6 rounded-[20px] bg-[#fff8f6] px-5 py-5 text-center">

            <p className="leading-7 text-[#6e5955]">
              Любовь — это когда
              каждый день выбираешь
              друг друга снова.
            </p>

          </div>

          <button
            type="button"
            onClick={
              onOpenSettings
            }
            className="mt-5 flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-[#c36f77] transition hover:bg-[#fff0ef] active:scale-[0.97]"
          >
            <Settings2
              size={16}
            />

            Настройки отношений
          </button>
        </>
      ) : (
        <div className="mt-6 rounded-[22px] border border-dashed border-[#eadbd7] bg-[#fffaf9] px-5 py-10 text-center">

          <p className="font-medium text-[#765f5a]">
            Здесь появится история
            ваших отношений
          </p>

        </div>
      )}

    </article>
  );
}

function SidebarItem({
  icon,
  label,
  active = false,
  badge,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  active?: boolean;
  badge?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      disabled={
        !onClick
      }
      className={[
        'mb-1 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm transition-all',

        active
          ? 'bg-[#fff0ef] font-medium text-[#c36f77]'
          : 'text-[#846f69]',

        onClick
          ? 'hover:bg-[#fff5f2] hover:text-[#c36f77] active:scale-[0.98]'
          : 'cursor-default',
      ].join(
        ' ',
      )}
    >

      <span
        className={
          active
            ? 'text-[#c36f77]'
            : 'text-[#a08b85]'
        }
      >
        {icon}
      </span>

      <span className="flex-1">
        {label}
      </span>

      {badge && (
        <span className="rounded-full bg-[#f5ece9] px-2 py-1 text-[10px] font-medium text-[#b09a94]">
          {badge}
        </span>
      )}

    </button>
  );
}

function Avatar({
  name,
  avatarUrl,
  size,
}: {
  name: string;
  avatarUrl: string | null;
  size:
    | 'small'
    | 'medium'
    | 'hero';
}) {
  const initial =
    name
      .charAt(0)
      .toUpperCase();

  const sizeClasses =
    size === 'hero'
      ? 'h-20 w-20 text-2xl'
      : size === 'medium'
        ? 'h-11 w-11 text-base'
        : 'h-9 w-9 text-sm';

  if (avatarUrl) {
    return (
      <div
        role="img"
        aria-label={
          `Аватар ${name}`
        }
        className={`${sizeClasses} shrink-0 rounded-full bg-cover bg-center shadow-sm`}
        style={{
          backgroundImage:
            `url("${avatarUrl}")`,
        }}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses} flex shrink-0 items-center justify-center rounded-full bg-[#f4dfe0] font-semibold text-[#b66870] shadow-sm`}
    >
      {initial}
    </div>
  );
}

function formatLongDate(
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

function formatMonthUpper(
  value: string,
) {
  return new Intl.DateTimeFormat(
    'ru-RU',
    {
      month: 'short',
    },
  )
    .format(
      new Date(value),
    )
    .replace(
      '.',
      '',
    )
    .toUpperCase();
}

function formatDayNumber(
  value: string,
) {
  return String(
    new Date(
      value,
    ).getDate(),
  );
}

function formatWeekdayShort(
  value: string,
) {
  return new Intl.DateTimeFormat(
    'ru-RU',
    {
      weekday: 'short',
    },
  )
    .format(
      new Date(value),
    )
    .replace(
      '.',
      '',
    )
    .toUpperCase();
}

function formatWeekdayFull(
  value: string,
) {
  return new Intl.DateTimeFormat(
    'ru-RU',
    {
      weekday: 'long',
    },
  ).format(
    new Date(value),
  );
}

function formatEventTime(
  event: CalendarEvent,
) {
  const start =
    new Intl.DateTimeFormat(
      'ru-RU',
      {
        hour: '2-digit',
        minute: '2-digit',
      },
    ).format(
      new Date(
        event.startsAt,
      ),
    );

  if (!event.endsAt) {
    return start;
  }

  const end =
    new Intl.DateTimeFormat(
      'ru-RU',
      {
        hour: '2-digit',
        minute: '2-digit',
      },
    ).format(
      new Date(
        event.endsAt,
      ),
    );

  return `${start}–${end}`;
}

function pluralizeEvents(
  count: number,
) {
  const mod10 =
    count % 10;

  const mod100 =
    count % 100;

  if (
    mod10 === 1 &&
    mod100 !== 11
  ) {
    return 'событие';
  }

  if (
    mod10 >= 2 &&
    mod10 <= 4 &&
    (
      mod100 < 12 ||
      mod100 > 14
    )
  ) {
    return 'события';
  }

  return 'событий';
}