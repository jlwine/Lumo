'use client';

import {
  useEffect,
  useState,
} from 'react';

import { useRouter } from 'next/navigation';
import { UserSearch } from '@/components/user-search';

import {
  CalendarDays,
  Camera,
  ChevronRight,
  Gift,
  Heart,
  Home,
  LogOut,
  MapPin,
  Settings,
  UserRound,
} from 'lucide-react';

import { apiRequest } from '@/lib/api';

import {
  getAccessToken,
  removeAccessToken,
} from '@/lib/auth';

import type { User } from '@/types/auth';

import type {
  RelationshipResponse,
} from '@/types/relationship';

export default function HomePage() {
  const router = useRouter();

  const [user, setUser] =
    useState<User | null>(null);

  const [
    relationshipData,
    setRelationshipData,
  ] = useState<RelationshipResponse>({
    relationship: null,
  });

  const [isLoading, setIsLoading] =
    useState(true);

  useEffect(() => {
    async function loadHome() {
      const token = getAccessToken();

      if (!token) {
        router.replace('/login');
        return;
      }

      try {
        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [
          currentUser,
          currentRelationship,
        ] = await Promise.all([
          apiRequest<User>(
            '/auth/me',
            {
              headers,
            },
          ),

          apiRequest<RelationshipResponse>(
            '/relationships/me',
            {
              headers,
            },
          ),
        ]);

        setUser(currentUser);

        setRelationshipData(
          currentRelationship,
        );
      } catch {
        removeAccessToken();
        router.replace('/login');
      } finally {
        setIsLoading(false);
      }
    }

    void loadHome();
  }, [router]);

  function handleLogout() {
    removeAccessToken();
    router.replace('/login');
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fffaf8]">
        <div className="text-center">
          <Heart
            className="mx-auto mb-4 animate-pulse text-[#dc8f96]"
            size={36}
          />

          <p className="text-[#8b7672]">
            Загружаем ваше пространство...
          </p>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  const relationship =
    relationshipData.relationship;

  const partner =
    relationship?.partner ?? null;

  const userName =
    user.displayName ?? user.nickname;

  const partnerName =
    partner?.displayName ??
    partner?.nickname ??
    '';

  const userInitial =
    userName.charAt(0).toUpperCase();

  const partnerInitial =
    partnerName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-[#fffaf8] text-[#554442]">

      <div className="mx-auto flex min-h-screen max-w-[1700px]">

        {/* Боковое меню */}
        <aside className="hidden w-[270px] shrink-0 border-r border-[#f0e2de] bg-[#fffdfb] px-5 py-7 lg:flex lg:flex-col">

          <div className="mb-10 flex items-center gap-3 px-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f9e3e5]">
              <Heart
                size={23}
                strokeWidth={1.8}
                className="text-[#d77f87]"
              />
            </div>

            <span className="text-2xl font-semibold tracking-tight">
              Вдвоём
            </span>
          </div>

          <nav className="space-y-2">

            <SidebarItem
              icon={<Home size={20} />}
              label="Главная"
              active
            />

            <SidebarItem
              icon={<CalendarDays size={20} />}
              label="Календарь"
              disabled
            />

            <SidebarItem
              icon={<Gift size={20} />}
              label="Вишлисты"
              disabled
            />

            <SidebarItem
              icon={<MapPin size={20} />}
              label="Карта"
              disabled
            />

            <SidebarItem
              icon={<Camera size={20} />}
              label="Доска дня"
              disabled
            />

            <SidebarItem
              icon={<Settings size={20} />}
              label="Настройки"
              disabled
            />

          </nav>

          <div className="mt-auto rounded-[24px] border border-[#f1e0dc] bg-[#fff8f5] p-5">

            <Heart
              size={22}
              className="mb-3 text-[#dc8f96]"
            />

            <p className="font-medium">
              Ваше пространство
            </p>

            <p className="mt-1 text-sm leading-6 text-[#9a8580]">
              Всё важное для вас двоих
              в одном месте.
            </p>

          </div>

        </aside>

        {/* Основная область */}
        <main className="min-w-0 flex-1">

          {/* Верхняя панель */}
          <header className="flex h-[88px] items-center justify-between border-b border-[#f0e2de] bg-[#fffdfb]/90 px-6 backdrop-blur md:px-10">

            <div className="hidden w-full max-w-md md:block">
              <UserSearch />
            </div>

            <div className="ml-auto flex items-center gap-4">

              <button
                type="button"
                className="flex items-center gap-3 rounded-2xl px-3 py-2 transition hover:bg-[#fff4f2]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f6dfe1] font-semibold text-[#a75f66]">
                  {userInitial}
                </div>

                <div className="hidden text-left sm:block">
                  <p className="text-sm font-medium">
                    {userName}
                  </p>

                  <p className="text-xs text-[#a38f89]">
                    @{user.nickname}
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                title="Выйти"
                className="flex h-10 w-10 items-center justify-center rounded-xl text-[#927c77] transition hover:bg-[#fff0ef] hover:text-[#c66f77]"
              >
                <LogOut size={19} />
              </button>

            </div>

          </header>

          <div className="p-5 md:p-8 lg:p-10">

            {/* Hero */}
            <section className="overflow-hidden rounded-[32px] border border-[#efdeda] bg-gradient-to-br from-[#f9dfe2] via-[#f7e7ec] to-[#e9e2f5] p-7 md:p-10">

              <div className="flex flex-col justify-between gap-10 xl:flex-row xl:items-center">

                <div className="flex items-center gap-5">

                  <Avatar
                    letter={userInitial}
                  />

                  {partner && (
                    <>
                      <div className="-mx-3 flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm">
                        <Heart
                          size={20}
                          fill="#dc8f96"
                          className="text-[#dc8f96]"
                        />
                      </div>

                      <Avatar
                        letter={partnerInitial}
                        secondary
                      />
                    </>
                  )}

                </div>

                <div className="max-w-2xl xl:flex-1">

                  <p className="mb-2 text-sm font-medium text-[#c26d75]">
                    Ваше пространство ♡
                  </p>

                  <h1 className="text-3xl font-semibold leading-tight md:text-4xl">

                    {partner
                      ? `Добро пожаловать, ${userName} и ${partnerName}!`
                      : `Добро пожаловать, ${userName}!`}

                  </h1>

                  <p className="mt-4 max-w-xl leading-7 text-[#826d69]">

                    {partner
                      ? 'Ваши планы, желания и маленькие моменты теперь всегда рядом.'
                      : 'Найдите свою вторую половинку по никнейму и создайте общее пространство.'}

                  </p>

                </div>

                {relationship ? (
                  <div className="min-w-[220px] rounded-[26px] border border-white/70 bg-white/65 p-6 backdrop-blur">

                    <p className="text-sm text-[#937e79]">
                      Вместе уже
                    </p>

                    <div className="mt-2 flex items-end gap-2">
                      <span className="text-5xl font-semibold">
                        {relationship.daysTogether}
                      </span>

                      <span className="mb-1 text-[#c26d75]">
                        дней
                      </span>
                    </div>

                    <p className="mt-3 text-sm text-[#9f8a84]">
                      с{' '}
                      {formatDate(
                        relationship.startedAt,
                      )}
                    </p>

                  </div>
                ) : (
                  <div className="min-w-[220px] rounded-[26px] border border-white/70 bg-white/65 p-6 backdrop-blur">

                    <UserRound
                      size={25}
                      className="text-[#d27f86]"
                    />

                    <p className="mt-4 font-medium">
                      Пока вы здесь один
                    </p>

                    <p className="mt-2 text-sm leading-6 text-[#947f7a]">
                      Скоро добавим удобный
                      поиск второй половинки.
                    </p>

                  </div>
                )}

              </div>

            </section>

            {/* Карточки модулей */}
            <section className="mt-7 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">

              <FeatureCard
                icon={
                  <CalendarDays size={23} />
                }
                title="Календарь"
                description="Совместные планы и важные события."
                accent="pink"
              />

              <FeatureCard
                icon={<Gift size={23} />}
                title="Вишлисты"
                description="Ваши желания и идеи подарков."
                accent="lavender"
              />

              <FeatureCard
                icon={<MapPin size={23} />}
                title="Карта"
                description="Будьте рядом даже на расстоянии."
                accent="sage"
              />

              <FeatureCard
                icon={<Camera size={23} />}
                title="Доска дня"
                description="Делитесь маленькими моментами дня."
                accent="peach"
              />

            </section>

            {/* Нижний блок */}
            <section className="mt-7 grid gap-5 lg:grid-cols-3">

              <div className="rounded-[28px] border border-[#efe1dd] bg-white p-7 lg:col-span-2">

                <div className="flex items-center justify-between">

                  <div>
                    <p className="text-sm font-medium text-[#c26d75]">
                      Ближайшие события
                    </p>

                    <h2 className="mt-1 text-xl font-semibold">
                      Ваш общий календарь
                    </h2>
                  </div>

                  <CalendarDays
                    className="text-[#dc9ca1]"
                  />

                </div>

                <div className="mt-8 flex min-h-[150px] items-center justify-center rounded-[22px] border border-dashed border-[#ecd9d5] bg-[#fffaf8]">

                  <div className="text-center">

                    <p className="font-medium text-[#796561]">
                      Здесь появятся ваши планы
                    </p>

                    <p className="mt-2 text-sm text-[#ab9691]">
                      Календарь будет следующим
                      крупным модулем приложения.
                    </p>

                  </div>

                </div>

              </div>

              <div className="rounded-[28px] border border-[#efe1dd] bg-white p-7">

                <Heart
                  size={25}
                  className="text-[#dc8f96]"
                />

                <h2 className="mt-5 text-xl font-semibold">
                  {partner
                    ? `${userName} ♡ ${partnerName}`
                    : 'Найдите друг друга'}
                </h2>

                <p className="mt-3 text-sm leading-6 text-[#97827d]">
                  {partner
                    ? 'Теперь это пространство принадлежит вам двоим.'
                    : 'Профиль и приглашения в отношения уже поддерживаются backend.'}
                </p>

              </div>

            </section>

          </div>

        </main>

      </div>
    </div>
  );
}

function SidebarItem({
  icon,
  label,
  active = false,
  disabled = false,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={[
        'flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition',
        active
          ? 'bg-[#f9e1e3] text-[#b8666d]'
          : 'text-[#75615d] hover:bg-[#fff3f1]',
        disabled
          ? 'cursor-default opacity-70'
          : '',
      ].join(' ')}
    >
      {icon}

      <span>{label}</span>

      {disabled && (
        <span className="ml-auto rounded-full bg-[#f5eeeb] px-2 py-0.5 text-[10px] font-normal text-[#ae9b96]">
          скоро
        </span>
      )}
    </button>
  );
}

function Avatar({
  letter,
  secondary = false,
}: {
  letter: string;
  secondary?: boolean;
}) {
  return (
    <div
      className={[
        'flex h-20 w-20 items-center justify-center rounded-full border-4 border-white text-2xl font-semibold shadow-sm',
        secondary
          ? 'bg-[#e8e2f3] text-[#796a91]'
          : 'bg-[#eadfcf] text-[#7c6658]',
      ].join(' ')}
    >
      {letter}
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  accent:
    | 'pink'
    | 'lavender'
    | 'sage'
    | 'peach';
}) {
  const accentClasses = {
    pink: 'bg-[#f9e2e4] text-[#c57279]',
    lavender:
      'bg-[#eee7f6] text-[#83729b]',
    sage: 'bg-[#e8f0e5] text-[#708168]',
    peach: 'bg-[#faeadf] text-[#b77d62]',
  };

  return (
    <button
      type="button"
      className="group rounded-[26px] border border-[#efe1dd] bg-white p-6 text-left transition hover:-translate-y-0.5 hover:shadow-[0_14px_40px_rgba(102,72,66,0.08)]"
    >
      <div className="flex items-start justify-between">

        <div
          className={[
            'flex h-11 w-11 items-center justify-center rounded-2xl',
            accentClasses[accent],
          ].join(' ')}
        >
          {icon}
        </div>

        <ChevronRight
          size={18}
          className="text-[#c7b7b2] transition group-hover:translate-x-1"
        />

      </div>

      <h3 className="mt-5 text-lg font-semibold">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-[#9a8580]">
        {description}
      </p>

    </button>
  );
}

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