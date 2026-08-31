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
  Save,
  Settings2,
  TriangleAlert,
  X,
} from 'lucide-react';

import { useRouter } from 'next/navigation';

import { apiRequest } from '@/lib/api';

import {
  getAccessToken,
  removeAccessToken,
} from '@/lib/auth';

import type {
  Relationship,
  RelationshipResponse,
} from '@/types/relationship';

export default function RelationshipSettingsPage() {
  const router = useRouter();

  const [
    relationship,
    setRelationship,
  ] =
    useState<Relationship | null>(
      null,
    );

  const [
    startedAt,
    setStartedAt,
  ] = useState('');

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isSaving,
    setIsSaving,
  ] = useState(false);

  const [
    isEnding,
    setIsEnding,
  ] = useState(false);

  const [
    showEndDialog,
    setShowEndDialog,
  ] = useState(false);

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
   * Получаем текущие отношения.
   * Функция сама React-state не изменяет.
   */
  const fetchRelationship =
    useCallback(
      async () => {
        const token =
          getAccessToken();

        if (!token) {
          removeAccessToken();
          router.replace(
            '/login',
          );

          return null;
        }

        return apiRequest<RelationshipResponse>(
          '/relationships/me',
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          },
        );
      },
      [router],
    );

  /*
   * Загружаем отношения при
   * открытии страницы.
   */
  useEffect(() => {
    let cancelled = false;

    async function loadRelationship() {
      try {
        const result =
          await fetchRelationship();

        if (
          cancelled ||
          !result
        ) {
          return;
        }

        setRelationship(
          result.relationship,
        );

        if (
          result.relationship
        ) {
          setStartedAt(
            toDateInputValue(
              result.relationship
                .startedAt,
            ),
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
            'Не удалось загрузить отношения',
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadRelationship();

    return () => {
      cancelled = true;
    };
  }, [fetchRelationship]);

  /*
   * Изменяем дату начала отношений.
   */
  async function saveStartDate() {
    if (
      !relationship ||
      !startedAt
    ) {
      return;
    }

    const token =
      getAccessToken();

    if (!token) {
      removeAccessToken();
      router.replace('/login');

      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);

      await apiRequest(
        '/relationships/me/start-date',
        {
          method: 'PATCH',

          headers: {
            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify({
            startedAt:
              `${startedAt}T00:00:00.000Z`,
          }),
        },
      );

      /*
       * После изменения даты
       * получаем актуальные данные,
       * включая daysTogether.
       */
      const result =
        await fetchRelationship();

      if (
        result?.relationship
      ) {
        setRelationship(
          result.relationship,
        );

        setStartedAt(
          toDateInputValue(
            result.relationship
              .startedAt,
          ),
        );
      }

      setSuccess(
        'Дата начала отношений обновлена',
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
          'Не удалось изменить дату',
        );
      }
    } finally {
      setIsSaving(false);
    }
  }

  /*
   * Завершаем текущие отношения.
   * Запись не удаляется из базы,
   * backend переводит её в ENDED.
   */
  async function endRelationship() {
    if (!relationship) {
      return;
    }

    const token =
      getAccessToken();

    if (!token) {
      removeAccessToken();
      router.replace('/login');

      return;
    }

    try {
      setIsEnding(true);
      setError(null);

      await apiRequest(
        '/relationships/me',
        {
          method: 'DELETE',

          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        },
      );

      setShowEndDialog(false);

      /*
       * Главная страница заново
       * запросит текущие отношения
       * и увидит relationship: null.
       */
      router.push('/home');
    } catch (error) {
      if (
        error instanceof Error
      ) {
        setError(
          error.message,
        );
      } else {
        setError(
          'Не удалось завершить отношения',
        );
      }
    } finally {
      setIsEnding(false);
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

  /*
   * Пользователь сейчас
   * ни с кем не состоит в отношениях.
   */
  if (!relationship) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fffaf8] p-5">

        <section className="w-full max-w-md rounded-[30px] border border-[#eedfdb] bg-white p-8 text-center shadow-[0_20px_70px_rgba(91,65,59,0.07)]">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fae3e5] text-[#c6747b]">
            <Heart
              size={26}
            />
          </div>

          <h1 className="mt-5 text-2xl font-semibold text-[#554442]">
            Нет активных отношений
          </h1>

          <p className="mt-3 text-sm leading-6 text-[#927d78]">
            Когда вы создадите пару,
            здесь появятся настройки
            ваших отношений.
          </p>

          {error && (
            <p className="mt-4 text-sm text-[#b6545b]">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={() =>
              router.push(
                '/home',
              )
            }
            className="mt-6 rounded-2xl bg-[#df8e94] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#d57a82]"
          >
            На главную
          </button>

        </section>

      </main>
    );
  }

  const partnerName =
    relationship.partner
      .displayName ??
    relationship.partner
      .nickname;

  const partnerInitial =
    partnerName
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
            router.push(
              '/home',
            )
          }
          className="mb-6 flex items-center gap-2 rounded-xl border border-transparent px-3 py-2 text-sm font-medium text-[#876f6a] transition-all duration-150 hover:border-[#efd8d4] hover:bg-[#fff0ed] hover:text-[#c36f77] hover:shadow-sm active:scale-[0.96] active:bg-[#f8dfdd]"
        >
          <ArrowLeft
            size={18}
          />

          На главную
        </button>

        <header className="mb-8">

          <div className="flex items-center gap-2 text-sm font-medium text-[#ca747c]">
            <Settings2
              size={17}
            />

            Настройки отношений
          </div>

          <h1 className="mt-2 text-3xl font-semibold text-[#554442]">
            Вы и {partnerName}
          </h1>

          <p className="mt-3 text-[#94807b]">
            Здесь можно изменить
            информацию о ваших
            отношениях.
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
            >
              <X size={17} />
            </button>

          </div>
        )}

        {success && (
          <div className="mb-6 rounded-2xl border border-[#dce8d3] bg-[#f5faef] px-5 py-4 text-sm text-[#647557]">
            {success}
          </div>
        )}

        {/* Карточка пары */}
        <section className="rounded-[30px] border border-[#eedfdb] bg-white p-7 shadow-[0_20px_70px_rgba(91,65,59,0.06)]">

          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">

            {relationship
              .partner
              .avatarUrl ? (
              <div
                role="img"
                aria-label={
                  `Аватар ${partnerName}`
                }
                className="h-20 w-20 shrink-0 rounded-full bg-cover bg-center"
                style={{
                  backgroundImage:
                    `url("${relationship.partner.avatarUrl}")`,
                }}
              />
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[#f7dfe1] text-2xl font-semibold text-[#b76870]">
                {partnerInitial}
              </div>
            )}

            <div className="min-w-0 flex-1">

              <p className="text-sm text-[#a08b85]">
                Ваш партнёр
              </p>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/profile/${relationship.partner.nickname}`,
                  )
                }
                className="mt-1 text-left text-xl font-semibold text-[#554442] transition hover:text-[#c36f77]"
              >
                {partnerName}
              </button>

              <p className="mt-1 text-sm text-[#a08b85]">
                @
                {
                  relationship
                    .partner
                    .nickname
                }
              </p>

            </div>

            <div className="rounded-[22px] bg-[#fff5f3] px-6 py-4 text-center">

              <p className="text-3xl font-semibold text-[#c6747b]">
                {
                  relationship
                    .daysTogether
                }
              </p>

              <p className="mt-1 text-xs text-[#9f8984]">
                дней вместе
              </p>

            </div>

          </div>

        </section>

        {/* Дата начала отношений */}
        <section className="mt-6 rounded-[30px] border border-[#eedfdb] bg-white p-7">

          <div className="flex items-start gap-4">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#eee8f5] text-[#817392]">
              <CalendarDays
                size={21}
              />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-[#554442]">
                Дата начала отношений
              </h2>

              <p className="mt-1 text-sm leading-6 text-[#93807a]">
                От этой даты считается,
                сколько дней вы вместе.
              </p>
            </div>

          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">

            <input
              type="date"
              value={startedAt}
              max={today}
              onChange={(
                event,
              ) => {
                setStartedAt(
                  event
                    .target
                    .value,
                );

                setSuccess(null);
              }}
              className="min-h-12 flex-1 rounded-2xl border border-[#eadbd7] bg-[#fffdfc] px-4 text-[#554442] outline-none transition focus:border-[#df9ca1] focus:ring-4 focus:ring-[#f7e3e5]"
            />

            <button
              type="button"
              disabled={
                isSaving ||
                !startedAt ||
                startedAt ===
                  toDateInputValue(
                    relationship
                      .startedAt,
                  )
              }
              onClick={() =>
                void saveStartDate()
              }
              className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#df8e94] px-6 font-medium text-white transition hover:bg-[#d57a82] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save size={18} />

              {isSaving
                ? 'Сохраняем...'
                : 'Сохранить'}
            </button>

          </div>

          <p className="mt-4 text-sm text-[#9a8580]">
            Сейчас:{' '}
            <span className="font-medium text-[#6c5753]">
              {formatDate(
                relationship
                  .startedAt,
              )}
            </span>
          </p>

        </section>

        {/* Опасная зона */}
        <section className="mt-6 rounded-[30px] border border-[#f0d3d3] bg-[#fffafa] p-7">

          <div className="flex items-start gap-4">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#fdeaea] text-[#c75f65]">
              <TriangleAlert
                size={21}
              />
            </div>

            <div className="flex-1">

              <h2 className="text-lg font-semibold text-[#70494a]">
                Завершение отношений
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#987777]">
                После завершения вы
                больше не будете
                отображаться как текущая
                пара. История отношений
                останется сохранена.
              </p>

                <button
                type="button"
                onClick={() =>
                    setShowEndDialog(
                    true,
                    )
                }
                className="mt-5 rounded-2xl border border-[#e5aeb1] bg-white px-5 py-3 text-sm font-medium text-[#b8555c] transition-all duration-150 hover:border-[#d96d73] hover:bg-[#c86167] hover:text-white hover:shadow-md active:scale-[0.97] active:bg-[#ae4e54]"
                >
                Разорвать отношения
                </button>

            </div>

          </div>

        </section>

      </div>

      {showEndDialog && (
        <EndRelationshipDialog
          partnerName={
            partnerName
          }
          isEnding={
            isEnding
          }
          onCancel={() =>
            setShowEndDialog(
              false,
            )
          }
          onConfirm={() =>
            void endRelationship()
          }
        />
      )}

    </main>
  );
}

function EndRelationshipDialog({
  partnerName,
  isEnding,
  onCancel,
  onConfirm,
}: {
  partnerName: string;
  isEnding: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#4e3d3d]/30 p-5 backdrop-blur-sm">

      <div className="w-full max-w-md rounded-[30px] border border-[#efd5d5] bg-white p-7 shadow-[0_30px_100px_rgba(73,48,45,0.22)]">

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fdeaea] text-[#c45e64]">
          <TriangleAlert
            size={24}
          />
        </div>

        <h2 className="mt-5 text-2xl font-semibold text-[#624b48]">
          Разорвать отношения
          с {partnerName}?
        </h2>

        <p className="mt-3 text-sm leading-6 text-[#917975]">
          Вы перестанете быть
          текущей парой в приложении.
          История этих отношений
          останется сохранена.
        </p>

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row">

          <button
            type="button"
            disabled={
              isEnding
            }
            onClick={
              onCancel
            }
            className="flex-1 rounded-2xl border border-[#e6d8d5] px-5 py-3 font-medium text-[#79635f] transition-all duration-150 hover:border-[#d9c1bc] hover:bg-[#fff1ef] hover:text-[#b66a6f] active:scale-[0.97] active:bg-[#f8e3e1] disabled:pointer-events-none disabled:opacity-50"
          >
            Отмена
          </button>

          <button
            type="button"
            disabled={
              isEnding
            }
            onClick={
              onConfirm
            }
            className="flex-1 rounded-2xl bg-[#c86167] px-5 py-3 font-medium text-white shadow-sm transition-all duration-150 hover:bg-[#b85359] hover:shadow-md active:scale-[0.97] active:bg-[#a8494f] disabled:pointer-events-none disabled:opacity-50"
          >
            {isEnding
              ? 'Завершаем...'
              : 'Разорвать'}
          </button>

        </div>

      </div>

    </div>
  );
}

function toDateInputValue(
  value: string,
) {
  return new Date(value)
    .toISOString()
    .slice(0, 10);
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