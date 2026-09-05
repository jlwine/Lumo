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
  Gift,
  Heart,
  Images,
  Leaf,
  LogOut,
  MapPin,
  Settings,
  Sparkles,
  Star,
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

import type {
  WishlistItem,
  WishlistOwner,
  WishlistsResponse,
} from '@/types/wishlist';

type WishlistPreviewEntry = {
  item: WishlistItem;
  wishlistTitle: string;
  owner: WishlistOwner;
};

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
    wishlists,
    setWishlists,
  ] =
    useState<WishlistsResponse>({
      mine: [],
      partner: [],
    });

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

          from.setHours(
            0,
            0,
            0,
            0,
          );

          const to =
            new Date(
              from,
            );

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
        }

        try {
          const wishlistData =
            await apiRequest<
              WishlistsResponse
            >(
              '/wishlists',
              {
                headers: {
                  Authorization:
                    `Bearer ${token}`,
                },
              },
            );

          if (!cancelled) {
            setWishlists(
              wishlistData,
            );
          }
        } catch {
          if (!cancelled) {
            setWishlists({
              mine: [],
              partner: [],
            });
          }
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        setError(
          error instanceof Error
            ? error.message
            : 'Не удалось загрузить данные',
        );
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
  }, [
    router,
  ]);

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
          3,
        ),
      [
        upcomingEvents,
      ],
    );

  /*
   * Для главной сначала показываем
   * самые желанные вещи.
   *
   * При одинаковом приоритете
   * более новая будет выше.
   */
  const wishlistPreview =
    useMemo<
      WishlistPreviewEntry[]
    >(
      () => {
        const allWishlists = [
          ...wishlists.partner,
          ...wishlists.mine,
        ];

        return allWishlists
          .flatMap(
            (
              wishlist,
            ) =>
              wishlist.items.map(
                (
                  item,
                ) => ({
                  item,

                  wishlistTitle:
                    wishlist.title,

                  owner:
                    wishlist.owner,
                }),
              ),
          )
          .sort(
            (
              first,
              second,
            ) => {
              if (
                second.item.priority !==
                first.item.priority
              ) {
                return (
                  second.item.priority -
                  first.item.priority
                );
              }

              return (
                new Date(
                  second.item.createdAt,
                ).getTime() -
                new Date(
                  first.item.createdAt,
                ).getTime()
              );
            },
          )
          .slice(
            0,
            3,
          );
      },
      [
        wishlists,
      ],
    );

  const wishlistCount =
    useMemo(
      () =>
        [
          ...wishlists.mine,
          ...wishlists.partner,
        ].reduce(
          (
            total,
            wishlist,
          ) =>
            total +
            wishlist.items.length,
          0,
        ),
      [
        wishlists,
      ],
    );

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fffaf7]">

        <Heart
          size={38}
          fill="currentColor"
          className="animate-pulse text-[#df8993]"
        />

      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fffaf7]">

        <p className="text-[#927d78]">
          {error ??
            'Не удалось открыть страницу'}
        </p>

      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#fffaf7]">

      {/*
       * Интерфейс увеличен до 125%.
       *
       * 80vh × 1.25 = 100vh.
       *
       * Благодаря этому zoom больше
       * не создаёт лишние 25% высоты
       * страницы внизу.
       */}
      <div className="min-h-[80vh] w-full [zoom:1.25]">

        <div className="flex min-h-[80vh]">

          <aside className="hidden w-[260px] shrink-0 border-r border-[#efe2dc] bg-[#fffdf9] lg:flex lg:flex-col">

            <div className="px-7 py-7">

              <button
                type="button"
                onClick={() =>
                  router.push(
                    '/home',
                  )
                }
                className="flex items-center gap-3"
              >

                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#eabdc2] text-[#dc7d87]">
                  <Heart
                    size={24}
                  />
                </div>

                <div className="text-left">

                  <p className="text-[24px] font-medium text-[#554442]">
                    Вдвоём
                  </p>

                  <p className="text-[10px] text-[#b29e98]">
                    пространство для двоих
                  </p>

                </div>

              </button>

            </div>

            <nav className="px-5">

              <SidebarItem
                icon={
                  <Heart
                    size={18}
                    fill="currentColor"
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
                onClick={() =>
                  router.push(
                    '/wishlists',
                  )
                }
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

              <SidebarItem
                icon={
                  <Settings
                    size={18}
                  />
                }
                label="Настройки"
                onClick={() =>
                  router.push(
                    '/settings/profile',
                  )
                }
              />

            </nav>

            <div className="mt-auto px-7 pb-8">

              <div className="relative h-[140px]">

                <Leaf
                  size={55}
                  className="absolute bottom-6 left-6 -rotate-[30deg] text-[#c5b6cf]"
                />

                <div className="absolute bottom-0 right-7 h-[62px] w-[76px] rounded-b-[24px] rounded-t-[12px] bg-[#f6cfd2]">

                  <Heart
                    size={22}
                    fill="currentColor"
                    className="absolute left-1/2 top-5 -translate-x-1/2 text-white"
                  />

                </div>

              </div>

            </div>

          </aside>

          <div className="min-w-0 flex-1">

            <header className="sticky top-0 z-30 border-b border-[#f0e5e0] bg-[#fffaf7]/95 px-6 py-4 backdrop-blur-xl">

              {/*
               * Рабочая ширина 1360px.
               */}
              <div className="mx-auto flex w-full max-w-[1360px] items-center gap-5">

                <div className="hidden min-w-[185px] items-center gap-2 text-sm text-[#846f69] xl:flex">

                  <CalendarDays
                    size={18}
                  />

                  {formatCurrentDate()}

                </div>

                <div className="w-full max-w-[500px]">
                  <UserSearch />
                </div>

                <div className="ml-auto flex items-center gap-2">

                  <InvitationsButton />

                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        `/profile/${user.nickname}`,
                      )
                    }
                    className="group hidden items-center gap-3 rounded-2xl px-3 py-2 transition hover:bg-[#fff0ec] sm:flex"
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

                    <div className="text-left">

                      <p className="text-sm font-medium text-[#584642] group-hover:text-[#c16b74]">
                        {userName}
                      </p>

                      <p className="text-xs text-[#a18d87] group-hover:text-[#c88489]">
                        @{user.nickname}
                      </p>

                    </div>

                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        '/settings/profile',
                      )
                    }
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-[#9c8882] hover:bg-[#fff0ed]"
                  >
                    <Settings
                      size={17}
                    />
                  </button>

                  <button
                    type="button"
                    onClick={
                      handleLogout
                    }
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-[#9c8882] hover:bg-[#fff0f0]"
                  >
                    <LogOut
                      size={17}
                    />
                  </button>

                </div>

              </div>

            </header>

            <div className="px-6 py-7">

              <div className="mx-auto w-full max-w-[1360px]">

                {error && (
                  <div className="mb-5 rounded-2xl border border-[#efc9cc] bg-[#fff1f1] p-4 text-sm text-[#a95057]">
                    {error}
                  </div>
                )}

                <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_255px]">

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
                    />
                  ) : (
                    <SingleHero
                      userName={
                        userName
                      }
                    />
                  )}

                  <DaysTogetherCard
                    relationship={
                      relationship
                    }
                  />

                </section>

                {/*
                 * Вишлист специально
                 * шире календаря.
                 */}
                <section className="mt-6 grid gap-5 md:grid-cols-2 2xl:grid-cols-[0.85fr_1.3fr_1fr_1fr]">

                  <CalendarDashboardCard
                    events={
                      previewEvents
                    }
                    onOpen={() =>
                      router.push(
                        '/calendar',
                      )
                    }
                  />

                  <WishlistDashboardCard
                    entries={
                      wishlistPreview
                    }
                    onOpen={() =>
                      router.push(
                        '/wishlists',
                      )
                    }
                  />

                  <MapDashboardCard />

                  <DayBoardDashboardCard />

                </section>

                <DashboardStats
                  eventCount={
                    upcomingEvents.length
                  }
                  wishlistCount={
                    wishlistCount
                  }
                />

              </div>

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
}: {
  user: User;
  userName: string;
  relationship: Relationship;
  partnerName: string;
  onPartnerClick: () => void;
}) {
  return (
    <article className="relative min-h-[245px] overflow-hidden rounded-[28px] border border-[#eeded9] bg-gradient-to-r from-[#fff0ec] via-[#fff4ee] to-[#f2eaf8] px-10 py-7">

      <Sparkles
        size={18}
        className="absolute right-12 top-8 text-[#e7bd7c]"
      />

      <div className="flex h-full items-center gap-8">

        <div className="flex shrink-0 items-center">

          <Avatar
            name={
              userName
            }
            avatarUrl={
              user.avatarUrl
            }
            size="large"
          />

          <div className="-mx-3 z-10 flex h-11 w-11 items-center justify-center rounded-full border-4 border-white bg-[#df818b] text-white">

            <Heart
              size={17}
              fill="currentColor"
            />

          </div>

          <button
            type="button"
            onClick={
              onPartnerClick
            }
          >
            <Avatar
              name={
                partnerName
              }
              avatarUrl={
                relationship.partner
                  .avatarUrl
              }
              size="large"
            />
          </button>

        </div>

        <div>

          <p className="text-sm text-[#ba737b]">
            Ваше общее пространство
          </p>

          <h1 className="mt-3 text-[32px] font-medium text-[#594844]">
            Добро пожаловать,
            вы вдвоём! 💕
          </h1>

          <p className="mt-3 text-base text-[#907b75]">
            Ваши планы рядом,
            даже когда вы далеко.
          </p>

          <button
            type="button"
            onClick={
              onPartnerClick
            }
            className="mt-5 rounded-2xl border border-[#e7d3cf] bg-white/70 px-5 py-2.5 text-sm text-[#765f5b]"
          >
            ♡ Профиль партнёра
          </button>

        </div>

      </div>

    </article>
  );
}

function SingleHero({
  userName,
}: {
  userName: string;
}) {
  return (
    <article className="min-h-[245px] rounded-[28px] border border-[#eeded9] bg-[#fff2ef] p-8">

      <h1 className="text-3xl text-[#594844]">
        Привет, {userName} ♡
      </h1>

    </article>
  );
}

function DaysTogetherCard({
  relationship,
}: {
  relationship: Relationship | null;
}) {
  return (
    <article className="relative overflow-hidden rounded-[28px] border border-[#eeded9] bg-[#fffdfb] p-6">

      <Heart
        size={21}
        className="absolute right-5 top-5 text-[#df939b]"
      />

      <p className="text-sm text-[#75615c]">
        Дней вместе
      </p>

      {relationship && (
        <>

          <p className="mt-4 font-serif text-[54px] leading-none text-[#574642]">
            {relationship.daysTogether}
          </p>

          <p className="mt-1 text-sm text-[#d2767f]">
            {pluralizeDays(
              relationship.daysTogether,
            )}
          </p>

          <p className="mt-4 text-xs text-[#9f8a84]">
            с{' '}
            {formatLongDate(
              relationship.startedAt,
            )}
          </p>

          <Leaf
            size={40}
            className="absolute bottom-10 right-6 text-[#afb28d]"
          />

        </>
      )}

    </article>
  );
}

function CalendarDashboardCard({
  events,
  onOpen,
}: {
  events: CalendarEvent[];
  onOpen: () => void;
}) {
  return (
    <article className="flex min-h-[390px] flex-col rounded-[24px] border border-[#eee0db] bg-white p-5">

      <CardHeader
        icon={
          <CalendarDays
            size={19}
          />
        }
        title="Календарь"
        action="Открыть"
        onAction={
          onOpen
        }
      />

      <p className="mt-5 text-xs text-[#8d7973]">
        Ближайшие события
      </p>

      <div className="mt-3 space-y-2">

        {events.map(
          (
            event,
          ) => (
            <button
              key={
                event.id
              }
              type="button"
              onClick={
                onOpen
              }
              className="flex w-full items-center gap-3 rounded-[16px] bg-[#fffaf8] px-3 py-3 text-left"
            >

              <div className="w-10 text-center">

                <p className="text-[10px] text-[#d57780]">
                  {formatMonthShort(
                    event.startsAt,
                  )}
                </p>

                <p className="text-xl font-semibold text-[#cb6c76]">
                  {formatDayNumber(
                    event.startsAt,
                  )}
                </p>

              </div>

              <div className="min-w-0 flex-1">

                <p className="truncate text-sm font-medium text-[#654f4a]">
                  {event.title}
                </p>

                <p className="text-xs text-[#a08b85]">
                  {event.allDay
                    ? 'Весь день'
                    : formatEventTime(
                        event,
                      )}
                </p>

              </div>

            </button>
          ),
        )}

      </div>

      <button
        type="button"
        onClick={
          onOpen
        }
        className="mt-auto pt-5 text-xs text-[#d1767e]"
      >
        Смотреть все события →
      </button>

    </article>
  );
}

function WishlistDashboardCard({
  entries,
  onOpen,
}: {
  entries: WishlistPreviewEntry[];
  onOpen: () => void;
}) {
  return (
    <article className="flex min-h-[390px] flex-col rounded-[24px] border border-[#eee0db] bg-white p-5">

      <CardHeader
        icon={
          <Heart
            size={19}
          />
        }
        title="Вишлисты"
        action="Смотреть всё"
        onAction={
          onOpen
        }
      />

      <div className="mt-5 space-y-3">

        {entries.length >
        0 ? (
          entries.map(
            (
              entry,
            ) => {
              const ownerName =
                entry.owner
                  .displayName ??
                entry.owner
                  .nickname;

              return (
                <button
                  key={
                    entry.item.id
                  }
                  type="button"
                  onClick={
                    onOpen
                  }
                  className="flex w-full items-center gap-3 rounded-[16px] p-2 text-left transition hover:bg-[#fff8f6]"
                >

                  {entry.item.imageUrl ? (
                    <div
                      role="img"
                      aria-label={
                        entry.item.title
                      }
                      className="h-[62px] w-[62px] shrink-0 rounded-[13px] border border-[#f0e5e1] bg-white bg-contain bg-center bg-no-repeat"
                      style={{
                        backgroundImage:
                          `url("${entry.item.imageUrl}")`,
                      }}
                    />
                  ) : (
                    <div className="flex h-[62px] w-[62px] shrink-0 items-center justify-center rounded-[13px] bg-[#f5edf7]">

                      <Gift
                        size={23}
                        className="text-[#a895b4]"
                      />

                    </div>
                  )}

                  <div className="min-w-0 flex-1">

                    <div className="flex items-start justify-between gap-3">

                      <p className="truncate text-sm font-medium text-[#67514d]">
                        {entry.item.title}
                      </p>

                      {entry.item.price !==
                        null && (
                        <span className="shrink-0 text-xs font-medium text-[#8e7898]">
                          {formatPrice(
                            entry.item.price,
                          )}
                        </span>
                      )}

                    </div>

                    <p className="mt-1 truncate text-[11px] text-[#a18b86]">
                      {ownerName}
                      {' · '}
                      {entry.wishlistTitle}
                    </p>

                    <div className="mt-2 flex items-center gap-2">

                      <div className="flex gap-0.5">

                        {[
                          1,
                          2,
                          3,
                          4,
                          5,
                        ].map(
                          (
                            value,
                          ) => (
                            <Heart
                              key={
                                value
                              }
                              size={12}
                              fill={
                                value <=
                                  entry.item
                                    .priority
                                  ? 'currentColor'
                                  : 'none'
                              }
                              className={
                                value <=
                                  entry.item
                                    .priority
                                  ? 'text-[#dc7d87]'
                                  : 'text-[#ded1d3]'
                              }
                            />
                          ),
                        )}

                      </div>

                      <span className="text-[10px] font-medium text-[#b16b73]">
                        {getPriorityLabel(
                          entry.item.priority,
                        )}
                      </span>

                    </div>

                  </div>

                  <ChevronRight
                    size={14}
                    className="shrink-0 text-[#c3aaa5]"
                  />

                </button>
              );
            },
          )
        ) : (
          <div className="flex min-h-[230px] items-center justify-center">

            <p className="text-sm text-[#9f8c97]">
              Желаний пока нет
            </p>

          </div>
        )}

      </div>

      <button
        type="button"
        onClick={
          onOpen
        }
        className="mt-auto pt-5 text-xs text-[#d1767e]"
      >
        Перейти к вишлистам →
      </button>

    </article>
  );
}

function MapDashboardCard() {
  return (
    <article className="flex min-h-[390px] flex-col rounded-[24px] border border-[#eee0db] bg-white p-5">

      <CardHeader
        icon={
          <MapPin
            size={19}
          />
        }
        title="Карта"
        badge="скоро"
      />

      <div className="relative mt-5 flex-1 overflow-hidden rounded-[18px] bg-[#e8eee2]">

        <div
          className="absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              'linear-gradient(35deg, transparent 46%, rgba(255,255,255,.8) 47%, rgba(255,255,255,.8) 51%, transparent 52%)',

            backgroundSize:
              '75px 65px',
          }}
        />

        <div className="absolute left-[25%] top-[25%] flex h-12 w-12 items-center justify-center rounded-full border-4 border-white bg-[#e8b9a5] text-white">
          <Heart
            size={18}
            fill="currentColor"
          />
        </div>

        <div className="absolute bottom-[23%] right-[20%] flex h-12 w-12 items-center justify-center rounded-full border-4 border-white bg-[#e8b9a5] text-white">
          <Heart
            size={18}
            fill="currentColor"
          />
        </div>

      </div>

    </article>
  );
}

function DayBoardDashboardCard() {
  return (
    <article className="flex min-h-[390px] flex-col rounded-[24px] border border-[#eee0db] bg-white p-5">

      <CardHeader
        icon={
          <Images
            size={19}
          />
        }
        title="Доска дня"
        badge="скоро"
      />

      <p className="mt-5 text-xs text-[#8d7973]">
        Наши моменты
      </p>

      <div className="mt-4 grid flex-1 grid-cols-2 gap-3">

        <PhotoPlaceholder />

        <PhotoPlaceholder />

        <div className="rounded-[12px] bg-[#f6c5cc] p-4">

          <p className="font-serif text-sm text-[#805c60]">
            Ты моё
            <br />
            любимое
            <br />
            место ♡
          </p>

        </div>

        <PhotoPlaceholder />

      </div>

    </article>
  );
}

function PhotoPlaceholder() {
  return (
    <div className="flex min-h-[90px] items-center justify-center rounded-[12px] bg-gradient-to-br from-[#efd9c6] to-[#969c8b]">

      <Heart
        size={22}
        fill="currentColor"
        className="text-white/70"
      />

    </div>
  );
}

function DashboardStats({
  eventCount,
  wishlistCount,
}: {
  eventCount: number;
  wishlistCount: number;
}) {
  return (
    <section className="mt-6 grid overflow-hidden rounded-[24px] border border-[#eee0db] bg-white sm:grid-cols-2">

      <StatItem
        icon={
          <Star
            size={28}
            fill="currentColor"
            className="text-[#a993bb]"
          />
        }
        value={
          eventCount
        }
        label="Планов впереди"
      />

      <StatItem
        icon={
          <Heart
            size={28}
            fill="currentColor"
            className="text-[#de8790]"
          />
        }
        value={
          wishlistCount
        }
        label="Общих желаний"
        border
      />

    </section>
  );
}

function StatItem({
  icon,
  value,
  label,
  border = false,
}: {
  icon: ReactNode;
  value: number;
  label: string;
  border?: boolean;
}) {
  return (
    <div
      className={[
        'flex min-h-[105px] items-center justify-center gap-5',

        border
          ? 'border-l border-[#f1e5e1]'
          : '',
      ].join(
        ' ',
      )}
    >

      {icon}

      <div>

        <p className="font-serif text-4xl text-[#594744]">
          {value}
        </p>

        <p className="text-xs text-[#9e8983]">
          {label}
        </p>

      </div>

    </div>
  );
}

function CardHeader({
  icon,
  title,
  action,
  badge,
  onAction,
}: {
  icon: ReactNode;
  title: string;
  action?: string;
  badge?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex items-center gap-3">

      <span className="text-[#b19a94]">
        {icon}
      </span>

      <h2 className="font-serif text-[18px] text-[#62504c]">
        {title}
      </h2>

      <div className="ml-auto">

        {action &&
        onAction ? (
          <button
            type="button"
            onClick={
              onAction
            }
            className="rounded-full bg-[#fff0ef] px-3 py-1.5 text-[10px] text-[#cd747c]"
          >
            {action}
          </button>
        ) : badge ? (
          <span className="rounded-full bg-[#f6eeea] px-3 py-1.5 text-[10px] text-[#aa948e]">
            {badge}
          </span>
        ) : null}

      </div>

    </div>
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
      disabled={
        !onClick
      }
      onClick={
        onClick
      }
      className={[
        'mb-2 flex w-full items-center gap-3 rounded-[14px] px-4 py-3 text-left text-sm',

        active
          ? 'bg-[#fde9e8] text-[#cb7079]'
          : 'text-[#76625d]',
      ].join(
        ' ',
      )}
    >

      {icon}

      <span className="flex-1">
        {label}
      </span>

      {badge && (
        <span className="rounded-full bg-[#f4ece8] px-2 py-1 text-[9px]">
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
    | 'large';
}) {
  const sizeClass =
    size ===
    'large'
      ? 'h-[86px] w-[86px]'
      : 'h-9 w-9';

  if (avatarUrl) {
    return (
      <div
        role="img"
        aria-label={
          `Аватар ${name}`
        }
        className={`${sizeClass} shrink-0 rounded-full bg-cover bg-center`}
        style={{
          backgroundImage:
            `url("${avatarUrl}")`,
        }}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} flex items-center justify-center rounded-full bg-[#f3dfe0]`}
    >
      {name
        .charAt(0)
        .toUpperCase()}
    </div>
  );
}

function getPriorityLabel(
  priority: number,
) {
  switch (priority) {
    case 1:
      return 'Неплохо бы';

    case 2:
      return 'Хочу';

    case 3:
      return 'Очень хочу';

    case 4:
      return 'Очень сильно хочу';

    case 5:
      return 'Мечтаю';

    default:
      return 'Очень хочу';
  }
}

function formatCurrentDate() {
  return new Intl.DateTimeFormat(
    'ru-RU',
    {
      weekday:
        'long',

      day:
        'numeric',

      month:
        'long',

      year:
        'numeric',
    },
  ).format(
    new Date(),
  );
}

function formatLongDate(
  value: string,
) {
  return new Intl.DateTimeFormat(
    'ru-RU',
    {
      day:
        'numeric',

      month:
        'long',

      year:
        'numeric',
    },
  ).format(
    new Date(
      value,
    ),
  );
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

function formatMonthShort(
  value: string,
) {
  return new Intl.DateTimeFormat(
    'ru-RU',
    {
      month:
        'short',
    },
  )
    .format(
      new Date(
        value,
      ),
    )
    .replace(
      '.',
      '',
    )
    .toUpperCase();
}

function formatEventTime(
  event: CalendarEvent,
) {
  return new Intl.DateTimeFormat(
    'ru-RU',
    {
      hour:
        '2-digit',

      minute:
        '2-digit',
    },
  ).format(
    new Date(
      event.startsAt,
    ),
  );
}

function formatPrice(
  value: number,
) {
  return new Intl.NumberFormat(
    'ru-RU',
    {
      style:
        'currency',

      currency:
        'RUB',

      maximumFractionDigits:
        0,
    },
  ).format(
    value,
  );
}

function pluralizeDays(
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
    return 'день';
  }

  if (
    mod10 >= 2 &&
    mod10 <= 4 &&
    (
      mod100 < 12 ||
      mod100 > 14
    )
  ) {
    return 'дня';
  }

  return 'дней';
}