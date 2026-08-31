'use client';

import {
  useEffect,
  useState,
} from 'react';

import {
  CalendarDays,
  ChevronRight,
  Gift,
  Heart,
  Images,
  LogOut,
  MapPin,
  Settings,
  Settings2,
  Sparkles,
} from 'lucide-react';

import { useRouter } from 'next/navigation';

import { InvitationsButton } from '@/components/invitations-button';
import { UserSearch } from '@/components/user-search';

import { apiRequest } from '@/lib/api';

import {
  getAccessToken,
  removeAccessToken,
} from '@/lib/auth';

import type {
  User,
} from '@/types/auth';

import type {
  Relationship,
  RelationshipResponse,
} from '@/types/relationship';

export default function HomePage() {
  const router = useRouter();

  const [user, setUser] =
    useState<User | null>(null);

  const [
    relationship,
    setRelationship,
  ] =
    useState<Relationship | null>(
      null,
    );

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );

  /*
   * Загружаем текущего пользователя
   * и его активные отношения.
   */
  useEffect(() => {
    let cancelled = false;

    async function loadHome() {
      const token =
        getAccessToken();

      if (!token) {
        router.replace('/login');
        return;
      }

      try {
        const [
          currentUser,
          relationshipData,
        ] = await Promise.all([
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

        setUser(currentUser);

        setRelationship(
          relationshipData.relationship,
        );
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
            'Не удалось загрузить данные',
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadHome();

    return () => {
      cancelled = true;
    };
  }, [router]);

  /*
   * Выход из аккаунта.
   */
  function handleLogout() {
    removeAccessToken();

    router.replace('/login');
  }

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
            ваше пространство
          </h1>

          <p className="mt-3 text-sm leading-6 text-[#927d78]">
            {error ??
              'Попробуйте войти в аккаунт ещё раз.'}
          </p>

          <button
            type="button"
            onClick={() => {
              removeAccessToken();

              router.replace(
                '/login',
              );
            }}
            className="mt-6 rounded-2xl bg-[#df8e94] px-6 py-3 font-medium text-white transition hover:bg-[#d57a82]"
          >
            Войти снова
          </button>

        </section>

      </main>
    );
  }

  const userName =
    user.displayName ??
    user.nickname;

  const partner =
    relationship?.partner ??
    null;

  const partnerName =
    partner?.displayName ??
    partner?.nickname ??
    null;

  return (
    <main className="min-h-screen bg-[#fffaf8]">

      <div className="flex min-h-screen">

        {/* Боковая панель */}
        <aside className="hidden w-[250px] shrink-0 border-r border-[#efe2de] bg-[#fffdfc] lg:flex lg:flex-col">

          {/* Логотип */}
          <div className="px-6 py-7">

            <button
              type="button"
              onClick={() =>
                router.push('/home')
              }
              className="flex items-center gap-3"
            >

              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f8dfe2] text-[#c46e77]">
                <Heart
                  size={21}
                  fill="currentColor"
                />
              </div>

              <div className="text-left">

                <p className="text-lg font-semibold text-[#554442]">
                  Вдвоём
                </p>

                <p className="text-xs text-[#ad9892]">
                  пространство для двоих
                </p>

              </div>

            </button>

          </div>

          {/* Навигация */}
          <nav className="flex-1 px-4">

            <SidebarItem
              icon={
                <Sparkles size={19} />
              }
              label="Главная"
              active
              onClick={() =>
                router.push('/home')
              }
            />

            <SidebarItem
              icon={
                <CalendarDays
                  size={19}
                />
              }
              label="Календарь"
              badge="скоро"
            />

            <SidebarItem
              icon={
                <Gift size={19} />
              }
              label="Вишлисты"
              badge="скоро"
            />

            <SidebarItem
              icon={
                <MapPin size={19} />
              }
              label="Карта"
              badge="скоро"
            />

            <SidebarItem
              icon={
                <Images size={19} />
              }
              label="Доска дня"
              badge="скоро"
            />

          </nav>

          {/* Нижняя часть меню */}
          <div className="border-t border-[#f0e4e0] p-4">

            {relationship && (
              <SidebarItem
                icon={
                  <Heart size={19} />
                }
                label="Наши отношения"
                onClick={() =>
                  router.push(
                    '/settings/relationship',
                  )
                }
              />
            )}

            <SidebarItem
              icon={
                <Settings size={19} />
              }
              label="Настройки"
              badge="скоро"
            />

          </div>

        </aside>

        {/* Основная часть */}
        <div className="min-w-0 flex-1">

          {/* Верхняя панель */}
          <header className="sticky top-0 z-40 border-b border-[#f0e3df] bg-[#fffaf8]/90 px-5 py-4 backdrop-blur-xl md:px-8">

            <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-5">

              {/* Поиск */}
              <div className="hidden w-full max-w-md md:block">
                <UserSearch />
              </div>

              {/* Мобильный логотип */}
              <button
                type="button"
                onClick={() =>
                  router.push('/home')
                }
                className="flex items-center gap-2 md:hidden"
              >
                <Heart
                  size={22}
                  className="text-[#c66f77]"
                  fill="currentColor"
                />

                <span className="font-semibold text-[#554442]">
                  Вдвоём
                </span>
              </button>

              {/* Пользователь */}
              <div className="ml-auto flex items-center gap-2">

                <InvitationsButton />

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/profile/${user.nickname}`,
                    )
                  }
                  className="hidden items-center gap-3 rounded-2xl px-2 py-1.5 transition hover:bg-[#fff0ed] sm:flex"
                >

                  <Avatar
                    name={userName}
                    avatarUrl={
                      user.avatarUrl
                    }
                    size="small"
                  />

                  <div className="max-w-[160px] text-left">

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
                  title="Выйти"
                  onClick={
                    handleLogout
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-[#927c77] transition hover:bg-[#fff0ef] hover:text-[#c66f77]"
                >
                  <LogOut size={19} />
                </button>

              </div>

            </div>

          </header>

          {/* Контент */}
          <div className="px-5 py-7 md:px-8 md:py-9">

            <div className="mx-auto max-w-[1400px]">

              {/* Поиск на мобильном */}
              <div className="mb-6 md:hidden">
                <UserSearch />
              </div>

              {error && (
                <div className="mb-6 rounded-2xl border border-[#efc9cc] bg-[#fff1f1] px-5 py-4 text-sm text-[#a95057]">
                  {error}
                </div>
              )}

              {/* Главная карточка */}
              {relationship &&
              partner &&
              partnerName ? (
                <CoupleHero
                  user={user}
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

              {/* Основные функции */}
              <section className="mt-7">

                <div className="mb-4 flex items-end justify-between">

                  <div>

                    <p className="text-sm font-medium text-[#c1767d]">
                      Всё для вас двоих
                    </p>

                    <h2 className="mt-1 text-2xl font-semibold text-[#554442]">
                      Ваше пространство
                    </h2>

                  </div>

                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

                  <FeatureCard
                    icon={
                      <CalendarDays
                        size={23}
                      />
                    }
                    title="Календарь"
                    description="Планы, встречи и важные даты в одном месте."
                    background="bg-[#f9e4e4]"
                    iconColor="text-[#bf7076]"
                  />

                  <FeatureCard
                    icon={
                      <Gift size={23} />
                    }
                    title="Вишлисты"
                    description="Сохраняйте желания и идеи подарков друг для друга."
                    background="bg-[#eee7f4]"
                    iconColor="text-[#837495]"
                  />

                  <FeatureCard
                    icon={
                      <MapPin size={23} />
                    }
                    title="Карта"
                    description="Делитесь местоположением, когда это нужно вам обоим."
                    background="bg-[#e8efe4]"
                    iconColor="text-[#718269]"
                  />

                  <FeatureCard
                    icon={
                      <Images size={23} />
                    }
                    title="Доска дня"
                    description="Фотографии и маленькие моменты вашего дня."
                    background="bg-[#f8eadc]"
                    iconColor="text-[#aa7a59]"
                  />

                </div>

              </section>

              {/* Нижние карточки */}
              <section className="mt-7 grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">

                {/* Ближайшие планы */}
                <article className="rounded-[28px] border border-[#eee0dc] bg-white p-6 md:p-7">

                  <div className="flex items-center justify-between">

                    <div>

                      <p className="text-sm text-[#c0767d]">
                        Календарь
                      </p>

                      <h2 className="mt-1 text-xl font-semibold text-[#554442]">
                        Ближайшие планы
                      </h2>

                    </div>

                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f9e4e4] text-[#bf7076]">
                      <CalendarDays
                        size={21}
                      />
                    </div>

                  </div>

                  <div className="mt-6 rounded-[22px] border border-dashed border-[#eadbd7] bg-[#fffaf9] px-5 py-10 text-center">

                    <p className="font-medium text-[#765f5a]">
                      Здесь появятся
                      ваши общие события
                    </p>

                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#a08b85]">
                      Следующим крупным
                      модулем мы добавим
                      полноценный общий
                      календарь.
                    </p>

                  </div>

                </article>

                {/* Отношения */}
                <article className="rounded-[28px] border border-[#eee0dc] bg-white p-6 md:p-7">

                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f9e2e4] text-[#c06e76]">
                    <Heart
                      size={21}
                    />
                  </div>

                  {relationship &&
                  partner &&
                  partnerName ? (
                    <>
                      <p className="mt-5 text-sm text-[#9d8781]">
                        Ваши отношения
                      </p>

                      <h2 className="mt-1 text-xl font-semibold text-[#554442]">
                        {userName}
                        {' ♡ '}
                        {partnerName}
                      </h2>

                      <p className="mt-4 text-3xl font-semibold text-[#c36f77]">
                        {
                          relationship
                            .daysTogether
                        }
                      </p>

                      <p className="mt-1 text-sm text-[#9c8781]">
                        дней вместе
                      </p>

                      <div className="mt-5 border-t border-[#f2e7e3] pt-5">

                        <p className="text-sm text-[#9b8580]">
                          Вместе с
                        </p>

                        <p className="mt-1 font-medium text-[#65514d]">
                          {formatDate(
                            relationship
                              .startedAt,
                          )}
                        </p>

                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          router.push(
                            '/settings/relationship',
                          )
                        }
                        className="mt-5 flex items-center gap-2 rounded-xl border border-transparent px-3 py-2 text-sm font-medium text-[#9a7b76] transition-all duration-150 hover:border-[#efd5d3] hover:bg-[#fff0ef] hover:text-[#c36f77] active:scale-[0.97] active:bg-[#f9dfe1]"
                      >
                        <Settings2 size={17} />

                        Настройки отношений
                    </button>
                    </>
                  ) : (
                    <>
                      <p className="mt-5 text-sm text-[#9d8781]">
                        Отношения
                      </p>

                      <h2 className="mt-1 text-xl font-semibold text-[#554442]">
                        Найдите своего человека
                      </h2>

                      <p className="mt-3 text-sm leading-6 text-[#97817c]">
                        Найдите пользователя
                        через поиск и отправьте
                        приглашение.
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          router.push(
                            '/invitations',
                          )
                        }
                        className="mt-5 flex items-center gap-2 text-sm font-medium text-[#c36f77]"
                      >
                        Приглашения

                        <ChevronRight
                          size={17}
                        />
                      </button>
                    </>
                  )}

                </article>

              </section>

            </div>

          </div>

        </div>

      </div>

    </main>
  );
}

/*
 * Большая карточка для пользователя,
 * который уже состоит в отношениях.
 */
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
    <section className="relative overflow-hidden rounded-[32px] border border-[#ecdeda] bg-gradient-to-br from-[#fff0ef] via-[#fdf5f1] to-[#f0eaf6] p-7 shadow-[0_20px_70px_rgba(91,65,59,0.06)] md:p-10">

      <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-white/40 blur-3xl" />

      <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">

        <div>

          <div className="flex items-center gap-2 text-sm font-medium text-[#c06f77]">
            <Heart
              size={16}
              fill="currentColor"
            />

            Ваше общее пространство
          </div>

          <h1 className="mt-4 max-w-2xl text-3xl font-semibold leading-tight text-[#554442] md:text-4xl">
            Добро пожаловать,
            {' '}
            {userName}
            {' ♡'}
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-[#917b75] md:text-base">
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
              className="rounded-2xl bg-[#dc8b92] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#d17a82]"
            >
              Профиль партнёра
            </button>

            <button
              type="button"
              onClick={
                onSettingsClick
              }
              className="flex items-center gap-2 rounded-2xl border border-[#e5ceca] bg-white/70 px-5 py-3 text-sm font-medium text-[#806964] shadow-sm transition-all duration-150 hover:border-[#dc9298] hover:bg-[#fff0ef] hover:text-[#bd666e] hover:shadow-md active:scale-[0.97] active:bg-[#f9dfe1]"
            >
              <Settings2
                size={17}
              />

              Настройки отношений
            </button>

          </div>

        </div>

        {/* Пара */}
        <div className="flex flex-col items-center">

          <div className="flex items-center">

            <Avatar
              name={userName}
              avatarUrl={
                user.avatarUrl
              }
              size="large"
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
              size="large"
            />

          </div>

          <p className="mt-5 text-center text-sm text-[#9d8781]">
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
            {formatDate(
              relationship
                .startedAt,
            )}
          </p>

        </div>

      </div>

    </section>
  );
}

/*
 * Карточка для пользователя,
 * у которого пока нет пары.
 */
function SingleHero({
  userName,
  onInvitationsClick,
}: {
  userName: string;
  onInvitationsClick: () => void;
}) {
  return (
    <section className="relative overflow-hidden rounded-[32px] border border-[#ecdeda] bg-gradient-to-br from-[#fff0ef] via-[#fdf5f1] to-[#f0eaf6] p-7 md:p-10">

      <div className="max-w-2xl">

        <div className="flex items-center gap-2 text-sm font-medium text-[#c06f77]">
          <Heart
            size={16}
          />

          Вдвоём
        </div>

        <h1 className="mt-4 text-3xl font-semibold text-[#554442] md:text-4xl">
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
          className="mt-6 flex items-center gap-2 rounded-2xl bg-[#dc8b92] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#d17a82]"
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

/*
 * Карточка будущего раздела.
 */
function FeatureCard({
  icon,
  title,
  description,
  background,
  iconColor,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  background: string;
  iconColor: string;
}) {
  return (
    <article className="group rounded-[26px] border border-[#eee0dc] bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-[0_16px_45px_rgba(91,65,59,0.06)]">

      <div
        className={`flex h-11 w-11 items-center justify-center rounded-2xl ${background} ${iconColor}`}
      >
        {icon}
      </div>

      <h3 className="mt-5 font-semibold text-[#554442]">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-[#9a8580]">
        {description}
      </p>

      <div className="mt-5 flex items-center gap-1 text-xs font-medium text-[#b5a09a]">
        Скоро

        <ChevronRight
          size={14}
          className="transition group-hover:translate-x-0.5"
        />
      </div>

    </article>
  );
}

/*
 * Пункт бокового меню.
 */
function SidebarItem({
  icon,
  label,
  active = false,
  badge,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  badge?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={[
        'mb-1 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm transition',
        active
          ? 'bg-[#fff0ef] font-medium text-[#c36f77]'
          : 'text-[#846f69]',
        onClick
          ? 'hover:bg-[#fff5f2]'
          : 'cursor-default',
      ].join(' ')}
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

/*
 * Универсальный аватар.
 */
function Avatar({
  name,
  avatarUrl,
  size,
}: {
  name: string;
  avatarUrl: string | null;
  size: 'small' | 'large';
}) {
  const initial =
    name
      .charAt(0)
      .toUpperCase();

  const sizeClasses =
    size === 'large'
      ? 'h-20 w-20 text-2xl'
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

/*
 * Приводим дату к привычному виду:
 * 27 марта 2026 г.
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