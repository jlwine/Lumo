'use client';

import {
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  LumoBrand,
  LumoMark,
} from '@/components/lumo-brand';

import {
  getIntlLocale,
  tr,
} from '@/i18n/core';

import {
  useLanguageVersion,
} from '@/i18n/use-language';

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

import {
  apiRequest,
} from '@/lib/api';

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
  DayBoardTodayResponse,
} from '@/types/day-board';

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
  /*
   * Подписываем главную страницу
   * на изменение языка.
   */
  useLanguageVersion();

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
    dayBoard,
    setDayBoard,
  ] =
    useState<DayBoardTodayResponse | null>(
      null,
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

        /*
         * Загружаем сегодняшнюю
         * доску дня.
         */
        if (
          relationshipData.relationship
        ) {
          try {
            const today =
              toLocalDateValue(
                new Date(),
              );

            const dayBoardData =
              await apiRequest<
                DayBoardTodayResponse
              >(
                `/day-board/today?date=${encodeURIComponent(
                  today,
                )}`,
                {
                  headers: {
                    Authorization:
                      `Bearer ${token}`,
                  },
                },
              );

            if (!cancelled) {
              setDayBoard(
                dayBoardData,
              );
            }
          } catch {
            if (!cancelled) {
              setDayBoard(
                null,
              );
            }
          }
        } else if (!cancelled) {
          setDayBoard(
            null,
          );
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        setError(
          error instanceof Error
            ? error.message
            : tr(
                'Не удалось загрузить данные',
              ),
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
    tr(
      'Пользователь',
    );

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

        <LumoMark
          size={46}
          className="animate-pulse"
        />

      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fffaf7]">

        <p className="text-[#927d78]">
          {error ??
            tr(
              'Не удалось открыть страницу',
            )}
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
                aria-label="Lumo"
                className="rounded-2xl px-1 py-1 text-left transition-all duration-200 hover:opacity-80 active:scale-[0.98]"
              >

                <LumoBrand
                  markSize={46}
                  showTagline
                  wordmarkClassName="text-[27px]"
                />

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
                label={tr(
                  'Главная',
                )}
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
                label={tr(
                  'Календарь',
                )}
                badge={
                  !relationship
                    ? tr(
                        'нужна пара',
                      )
                    : undefined
                }
                onClick={
                  relationship
                    ? () =>
                        router.push(
                          '/calendar',
                        )
                    : undefined
                }
              />

              <SidebarItem
                icon={
                  <Gift
                    size={18}
                  />
                }
                label={tr(
                  'Вишлисты',
                )}
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
                label={tr(
                  'Карта',
                )}
                badge={tr(
                  'скоро',
                )}
              />

              <SidebarItem
                icon={
                  <Images
                    size={18}
                  />
                }
                label={tr(
                  'Доска дня',
                )}
                badge={
                  !relationship
                    ? tr(
                        'нужна пара',
                      )
                    : undefined
                }
                onClick={
                  relationship
                    ? () =>
                        router.push(
                          '/day-board',
                        )
                    : undefined
                }
              />

              <SidebarItem
                icon={
                  <Settings
                    size={18}
                  />
                }
                label={tr(
                  'Настройки',
                )}
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
                      onOpenInvitations={() =>
                        router.push(
                          '/invitations',
                        )
                      }
                    />
                  )}

                    <DaysTogetherCard
                      relationship={
                        relationship
                      }
                    />

                </section>

                <section className="mt-6 grid gap-5 md:grid-cols-2 2xl:grid-cols-[0.85fr_1.3fr_1fr_1fr]">

                  <CalendarDashboardCard
                    events={
                      previewEvents
                    }
                    locked={
                      !relationship
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

                  <DayBoardDashboardCard
                    dayBoard={
                      dayBoard
                    }
                    locked={
                      !relationship
                    }
                    onOpen={() =>
                      router.push(
                        '/day-board',
                      )
                    }
                  />

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
            {tr(
              'Ваше общее пространство',
            )}
          </p>

          <p className="mt-3 text-lg text-[#907b75]">
            {tr(
              'Планы, желания и моменты, которые вы создаёте вместе.',
            )}
          </p>

          <button
            type="button"
            onClick={
              onPartnerClick
            }
            className="mt-5 cursor-pointer rounded-2xl border border-[#e7d3cf] bg-white/70 px-5 py-2.5 text-sm font-medium text-[#765f5b] shadow-sm backdrop-blur transition-all duration-200 hover:-translate-y-[1px] hover:border-[#dfb5b5] hover:bg-white/90 hover:text-[#bd656e] hover:shadow-md active:translate-y-0 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#df8e94]/40"
          >
            {tr(
              'Профиль партнёра',
            )}
          </button>

        </div>

      </div>

    </article>
  );
}

function SingleHero({
  userName,
  onOpenInvitations,
}: {
  userName: string;
  onOpenInvitations: () => void;
}) {
  return (
    <article
      className="relative min-h-[245px] overflow-hidden rounded-[28px] border border-[var(--border)] px-10 py-8"
      style={{
        background:
          'linear-gradient(135deg, var(--accent-soft) 0%, var(--surface-soft) 55%, var(--lavender-soft) 100%)',
      }}
    >

      <Sparkles
        size={18}
        className="absolute right-10 top-8 text-[#d8a96a]"
      />

      <div className="flex h-full max-w-[720px] flex-col justify-center">

        <p className="text-sm font-medium text-[var(--accent)]">
          {tr(
            'Ваше пространство',
          )}
        </p>

        <h1 className="mt-3 text-3xl font-semibold text-[var(--text-primary)]">
          {tr(
            'Привет, {name} ♡',
            {
              name:
                userName,
            },
          )}
        </h1>

        <p className="mt-4 max-w-xl text-base leading-7 text-[var(--text-secondary)]">
          {tr(
            'Пока здесь только вы. Найдите партнёра по никнейму через поиск сверху или проверьте приглашения.',
          )}
        </p>

        <button
          type="button"
          onClick={
            onOpenInvitations
          }
          className="mt-6 w-fit cursor-pointer rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 py-2.5 text-sm font-medium text-[var(--text-primary)] shadow-sm transition-all duration-200 hover:-translate-y-[1px] hover:border-[var(--accent)] hover:text-[var(--accent)] hover:shadow-md active:translate-y-0 active:scale-[0.97]"
        >
          {tr(
            'Открыть приглашения',
          )}
        </button>

      </div>

    </article>
  );
}

function DaysTogetherCard({
  relationship,
}: {
  relationship: Relationship | null;
}) {
  if (!relationship) {
    return (
      <article className="relative flex min-h-[245px] flex-col overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6">

        <Heart
          size={21}
          className="absolute right-5 top-5 text-[var(--accent)]"
        />

        <div className="flex flex-1 flex-col justify-center">

          <p className="text-base font-medium text-[var(--text-primary)]">
            {tr(
              'Пара не создана',
            )}
          </p>

          <p className="mt-2 max-w-[190px] text-xs leading-5 text-[var(--text-muted)]">
            {tr(
              'После создания пары здесь появится количество дней вместе.',
            )}
          </p>

        </div>

        <Leaf
          size={38}
          className="absolute bottom-7 right-6 text-[#afb28d]"
        />

      </article>
    );
  }

  return (
    <article className="relative overflow-hidden rounded-[28px] border border-[#eeded9] bg-[#fffdfb] p-6">

      <Heart
        size={21}
        className="absolute right-5 top-5 text-[#df939b]"
      />

      <p className="text-sm text-[#75615c]">
        {tr(
          'Дней вместе',
        )}
      </p>

      <p className="mt-4 font-serif text-[54px] leading-none text-[#574642]">
        {relationship.daysTogether}
      </p>

      <p className="mt-1 text-sm text-[#d2767f]">
        {pluralizeDays(
          relationship.daysTogether,
        )}
      </p>

      <p className="mt-4 text-xs text-[#9f8a84]">
        {tr(
          'с {date}',
          {
            date:
              formatLongDate(
                relationship.startedAt,
              ),
          },
        )}
      </p>

      <Leaf
        size={40}
        className="absolute bottom-10 right-6 text-[#afb28d]"
      />

    </article>
  );
}

function CalendarDashboardCard({
  events,
  locked,
  onOpen,
}: {
  events: CalendarEvent[];
  locked: boolean;
  onOpen: () => void;
}) {
  if (locked) {
    return (
      <article className="flex min-h-[390px] flex-col rounded-[24px] border border-[#eee0db] bg-white p-5">

        <CardHeader
          icon={
            <CalendarDays
              size={19}
            />
          }
          title={tr(
            'Календарь',
          )}
          badge={tr(
            'нужна пара',
          )}
        />

        <div className="flex flex-1 flex-col items-center justify-center px-5 text-center">

          <CalendarDays
            size={30}
            className="text-[#c6b3b1]"
          />

          <p className="mt-4 text-sm font-medium text-[#75615c]">
            {tr(
              'Календарь недоступен',
            )}
          </p>

          <p className="mt-2 max-w-[210px] text-xs leading-5 text-[#a18d87]">
            {tr(
              'Общий календарь появится после создания пары.',
            )}
          </p>

        </div>

      </article>
    );
  }

  return (
    <article className="flex min-h-[390px] flex-col rounded-[24px] border border-[#eee0db] bg-white p-5">

      <CardHeader
        icon={
          <CalendarDays
            size={19}
          />
        }
        title={tr(
          'Календарь',
        )}
        action={tr(
          'Открыть',
        )}
        onAction={
          onOpen
        }
      />

      <p className="mt-5 text-xs text-[#8d7973]">
        {tr(
          'Ближайшие события',
        )}
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
                    ? tr(
                        'Весь день',
                      )
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
        className="group mt-auto flex cursor-pointer items-center gap-1 self-start rounded-xl px-2 py-2 text-xs font-medium text-[#d1767e] transition-all duration-200 hover:bg-[#fff0ef] hover:px-3 hover:text-[#ba6069] active:scale-[0.97]"
      >

        {tr(
          'Смотреть все события →',
        )
          .replace(
            '→',
            '',
          )
          .trim()}

        <span className="transition-transform duration-200 group-hover:translate-x-1">
          →
        </span>

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
        title={tr(
          'Вишлисты',
        )}
        action={tr(
          'Смотреть всё',
        )}
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
              {tr(
                'Желаний пока нет',
              )}
            </p>

          </div>
        )}

      </div>

      <button
        type="button"
        onClick={
          onOpen
        }
        className="group mt-auto flex cursor-pointer items-center gap-1 self-end rounded-xl px-2 py-2 text-xs font-medium text-[#d1767e] transition-all duration-200 hover:bg-[#fff0ef] hover:px-3 hover:text-[#ba6069] active:scale-[0.97]"
      >

        {tr(
          'Перейти к вишлистам →',
        )
          .replace(
            '→',
            '',
          )
          .trim()}

        <span className="transition-transform duration-200 group-hover:translate-x-1">
          →
        </span>

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
        title={tr(
          'Карта',
        )}
        badge={tr(
          'скоро',
        )}
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

function DayBoardDashboardCard({
  dayBoard,
  locked,
  onOpen,
}: {
  dayBoard: DayBoardTodayResponse | null;
  locked: boolean;
  onOpen: () => void;
}) {
  if (locked) {
    return (
      <article className="flex min-h-[390px] flex-col rounded-[24px] border border-[#eee0db] bg-white p-5">

        <CardHeader
          icon={
            <Images
              size={19}
            />
          }
          title={tr(
            'Доска дня',
          )}
          badge={tr(
            'нужна пара',
          )}
        />

        <div className="flex flex-1 flex-col items-center justify-center px-5 text-center">

          <Images
            size={30}
            className="text-[#c7b2bd]"
          />

          <p className="mt-4 text-sm font-medium text-[#75615c]">
            {tr(
              'Доска дня недоступна',
            )}
          </p>

          <p className="mt-2 max-w-[210px] text-xs leading-5 text-[#a18d87]">
            {tr(
              'Доска дня появится после создания пары.',
            )}
          </p>

        </div>

      </article>
    );
  }

  const entries = [
    {
      label:
        dayBoard?.me.displayName ??
        dayBoard?.me.nickname ??
        tr(
          'Вы',
        ),

      entry:
        dayBoard?.mine ??
        null,
    },
    {
      label:
        dayBoard?.partnerUser.displayName ??
        dayBoard?.partnerUser.nickname ??
        tr(
          'Партнёр',
        ),

      entry:
        dayBoard?.partner ??
        null,
    },
  ];

  return (
    <article className="flex min-h-[390px] flex-col rounded-[24px] border border-[#eee0db] bg-white p-5">

      <CardHeader
        icon={
          <Images
            size={19}
          />
        }
        title={tr(
          'Доска дня',
        )}
        action={tr(
          'Открыть',
        )}
        onAction={
          onOpen
        }
      />

      <p className="mt-5 text-xs text-[#8d7973]">
        {tr(
          'Сегодняшние моменты',
        )}
      </p>

      <div className="mt-4 grid flex-1 grid-cols-2 gap-3">

        {entries.map(
          ({
            label,
            entry,
          }) => (
            <button
              key={
                label
              }
              type="button"
              onClick={
                onOpen
              }
              className="group relative min-h-[235px] overflow-hidden rounded-[16px] border border-[#eee0db] bg-[#fffaf8] text-left transition hover:border-[#e3c8c6] hover:shadow-sm"
            >

              {entry ? (
                <>

                  <div
                    role="img"
                    aria-label={tr(
                      'Фото дня: {name}',
                      {
                        name:
                          label,
                      },
                    )}
                    className="absolute inset-0 bg-cover bg-center transition duration-300 group-hover:scale-[1.03]"
                    style={{
                      backgroundImage:
                        `url("${entry.thumbnailUrl}")`,
                    }}
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-[#403231]/70 via-transparent to-transparent" />

                  <div className="absolute inset-x-0 bottom-0 p-3 text-white">

                    <p className="text-[11px] font-medium text-white/80">
                      {label}
                    </p>

                    {entry.caption ? (
                      <p className="mt-1 line-clamp-2 text-xs leading-4">
                        {entry.caption}
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-white/75">
                        {tr(
                          'Фото сегодня',
                        )}
                      </p>
                    )}

                  </div>

                </>
              ) : (
                <div className="flex h-full min-h-[235px] flex-col items-center justify-center px-3 text-center">

                  <Images
                    size={26}
                    className="text-[#c7b2bd]"
                  />

                  <p className="mt-3 text-xs font-medium text-[#806b70]">
                    {label}
                  </p>

                  <p className="mt-1 text-[10px] leading-4 text-[#aa9599]">
                    {tr(
                      'Фото пока нет',
                    )}
                  </p>

                </div>
              )}

            </button>
          ),
        )}

      </div>

      <button
        type="button"
        onClick={
          onOpen
        }
        className="group mt-4 flex cursor-pointer items-center justify-center gap-1 rounded-xl px-3 py-2 text-xs font-medium text-[#d1767e] transition-all duration-200 hover:bg-[#fff0ef] hover:text-[#bb626a] hover:shadow-sm active:scale-[0.97]"
      >

        {tr(
          'Открыть доску дня',
        )}

        <ChevronRight
          size={13}
          className="transition-transform duration-200 group-hover:translate-x-1"
        />

      </button>

    </article>
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
        label={tr(
          'Планов впереди',
        )}
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
        label={tr(
          'Общих желаний',
        )}
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
            className="cursor-pointer rounded-full bg-[#fff0ef] px-3 py-1.5 text-[10px] font-medium text-[#cd747c] shadow-sm transition-all duration-200 hover:-translate-y-[1px] hover:bg-[#f9dcde] hover:text-[#b95e68] hover:shadow-md active:translate-y-0 active:scale-[0.95] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#df8e94]/40"
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
  const isClickable =
    Boolean(
      onClick,
    );

  return (
    <button
      type="button"
      disabled={
        !isClickable
      }
      onClick={
        onClick
      }
      className={[
        'group mb-2 flex w-full items-center gap-3 rounded-[14px] px-4 py-3 text-left text-sm transition-all duration-200',

        isClickable
          ? 'cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#df8e94]/40'
          : 'cursor-default',

        active
          ? [
              'bg-[#fde9e8] text-[#cb7079]',

              'dark:!bg-[#55373b] dark:!text-[#f29ca6]',

              isClickable
                ? [
                    'hover:bg-[#f9dcde] hover:text-[#bf626d]',
                    'hover:shadow-[0_5px_16px_rgba(126,76,79,0.08)]',

                    'dark:hover:!bg-[#5d3b40]',
                    'dark:hover:!text-[#ffabb4]',
                    'dark:hover:shadow-[0_6px_18px_rgba(0,0,0,0.18)]',
                  ].join(
                    ' ',
                  )
                : '',
            ].join(
              ' ',
            )
          : [
              'text-[#76625d]',

              'dark:!text-[#d7c7c4]',

              isClickable
                ? [
                    'hover:bg-[#fff0ef]',
                    'hover:text-[#c66f78]',

                    'dark:hover:!bg-[#55373b]',
                    'dark:hover:!text-[#f29ca6]',

                    'hover:shadow-[0_5px_16px_rgba(126,76,79,0.07)]',
                    'dark:hover:shadow-[0_6px_18px_rgba(0,0,0,0.18)]',
                  ].join(
                    ' ',
                  )
                : [
                    'opacity-80',
                    'dark:!text-[#998987]',
                  ].join(
                    ' ',
                  ),
            ].join(
              ' ',
            ),
      ].join(
        ' ',
      )}
    >

      <span className="shrink-0 transition-transform duration-200 group-hover:scale-105">
        {icon}
      </span>

      <span className="flex-1">
        {label}
      </span>

      {badge && (
        <span className="rounded-full bg-[#f4ece8] px-2 py-1 text-[9px] dark:!bg-[#443538] dark:!text-[#cdbab7]">
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
        aria-label={tr(
          'Аватар {name}',
          {
            name,
          },
        )}
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
      return tr(
        'Неплохо бы',
      );

    case 2:
      return tr(
        'Хочу',
      );

    case 3:
      return tr(
        'Очень хочу',
      );

    case 4:
      return tr(
        'Очень сильно хочу',
      );

    case 5:
      return tr(
        'Мечтаю',
      );

    default:
      return tr(
        'Очень хочу',
      );
  }
}

function formatCurrentDate() {
  const value =
    new Intl.DateTimeFormat(
      getIntlLocale(),
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

  return (
    value.charAt(0).toUpperCase() +
    value.slice(1)
  );
}

function formatLongDate(
  value: string,
) {
  return new Intl.DateTimeFormat(
    getIntlLocale(),
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
    getIntlLocale(),
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
    .replaceAll(
      '.',
      '',
    )
    .toUpperCase();
}

function formatEventTime(
  event: CalendarEvent,
) {
  return new Intl.DateTimeFormat(
    getIntlLocale(),
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
    getIntlLocale(),
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

function toLocalDateValue(
  value: Date,
) {
  const year =
    value.getFullYear();

  const month =
    String(
      value.getMonth() + 1,
    ).padStart(
      2,
      '0',
    );

  const day =
    String(
      value.getDate(),
    ).padStart(
      2,
      '0',
    );

  return `${year}-${month}-${day}`;
}

function pluralizeDays(
  count: number,
) {
  /*
   * Для английского достаточно
   * единственного и множественного числа.
   */
  if (
    getIntlLocale() ===
    'en-US'
  ) {
    return count === 1
      ? tr(
          'день',
        )
      : tr(
          'дней',
        );
  }

  /*
   * Русское склонение.
   */
  const mod10 =
    count % 10;

  const mod100 =
    count % 100;

  if (
    mod10 === 1 &&
    mod100 !== 11
  ) {
    return tr(
      'день',
    );
  }

  if (
    mod10 >= 2 &&
    mod10 <= 4 &&
    (
      mod100 < 12 ||
      mod100 > 14
    )
  ) {
    return tr(
      'дня',
    );
  }

  return tr(
    'дней',
  );
}