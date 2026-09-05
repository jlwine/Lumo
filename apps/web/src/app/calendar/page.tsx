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
  useMemo,
  useState,
} from 'react';

import {
  ArrowLeft,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Heart,
  History,
  MapPin,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react';

import {
  useRouter,
  useSearchParams,
} from 'next/navigation';

import { apiRequest } from '@/lib/api';

import {
  getAccessToken,
  removeAccessToken,
} from '@/lib/auth';

import type {
  CalendarEvent,
} from '@/types/calendar';

type CalendarDay = {
  date: Date;
  isCurrentMonth: boolean;
};

type EventForm = {
  title: string;
  description: string;
  location: string;
  date: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
};

const emptyForm: EventForm = {
  title: '',
  description: '',
  location: '',
  date: '',
  startTime: '18:00',
  endTime: '19:00',
  allDay: false,
};

export default function CalendarPage() {
  useLanguageVersion();

  const router =
    useRouter();

  const searchParams =
    useSearchParams();

  const editEventId =
    searchParams.get(
      'edit',
    );

  const [
    currentMonth,
    setCurrentMonth,
  ] =
    useState(() => {
      const today =
        new Date();

      return new Date(
        today.getFullYear(),
        today.getMonth(),
        1,
      );
    });

  const [
    events,
    setEvents,
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

  const [
    selectedDate,
    setSelectedDate,
  ] =
    useState<Date | null>(
      new Date(),
    );

  const [
    selectedEvent,
    setSelectedEvent,
  ] =
    useState<CalendarEvent | null>(
      null,
    );

  const [
    showEventForm,
    setShowEventForm,
  ] =
    useState(false);

  const [
    isSaving,
    setIsSaving,
  ] =
    useState(false);

  const [
    isDeleting,
    setIsDeleting,
  ] =
    useState(false);

  const [
    showDeleteDialog,
    setShowDeleteDialog,
  ] =
    useState(false);

  const [
    showHistory,
    setShowHistory,
  ] =
    useState(false);

  const [
    historyEvents,
    setHistoryEvents,
  ] =
    useState<CalendarEvent[]>(
      [],
    );

  const [
    isHistoryLoading,
    setIsHistoryLoading,
  ] =
    useState(false);

  const [
    historyError,
    setHistoryError,
  ] =
    useState<string | null>(
      null,
    );

  const [
    form,
    setForm,
  ] =
    useState<EventForm>(
      emptyForm,
    );

  /*
   * Формируем дни,
   * отображаемые в календаре.
   */
  const calendarDays =
    useMemo(
      () =>
        createCalendarDays(
          currentMonth,
        ),
      [currentMonth],
    );

  const firstVisibleDay =
    calendarDays[0]?.date;

  const lastVisibleDay =
    calendarDays[
      calendarDays.length - 1
    ]?.date;

  /*
   * Получаем события
   * для текущей календарной сетки.
   */
  const fetchEvents =
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

        if (
          !firstVisibleDay ||
          !lastVisibleDay
        ) {
          return [];
        }

        const from =
          startOfDay(
            firstVisibleDay,
          ).toISOString();

        const toDate =
          new Date(
            lastVisibleDay,
          );

        toDate.setDate(
          toDate.getDate() + 1,
        );

        const to =
          startOfDay(
            toDate,
          ).toISOString();

        return apiRequest<
          CalendarEvent[]
        >(
          `/calendar?from=${encodeURIComponent(
            from,
          )}&to=${encodeURIComponent(
            to,
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
        firstVisibleDay,
        lastVisibleDay,
        router,
      ],
    );

  /*
   * Загружаем события
   * при открытии календаря
   * или смене месяца.
   */
  useEffect(() => {
    let cancelled =
      false;

    async function loadEvents() {
      try {
        const result =
          await fetchEvents();

        if (
          cancelled ||
          !result
        ) {
          return;
        }

        setEvents(
          result,
        );

        setError(
          null,
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
            tr('Не удалось загрузить календарь'),
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

    void loadEvents();

    return () => {
      cancelled = true;
    };
  }, [fetchEvents]);

  /*
   * Если календарь открыт через:
   *
   * /calendar?edit=ID
   *
   * получаем конкретное событие
   * и сразу открываем его
   * в режиме редактирования.
   */
  useEffect(() => {
    if (!editEventId) {
      return;
    }

    /*
     * Сохраняем значение отдельно,
     * чтобы TypeScript точно знал,
     * что eventId имеет тип string.
     */
    const eventId =
      editEventId;

    let cancelled =
      false;

    async function loadEventForEditing() {
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
        const event =
          await apiRequest<CalendarEvent>(
            `/calendar/${encodeURIComponent(
              eventId,
            )}`,
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

        const eventDate =
          new Date(
            event.startsAt,
          );

        setSelectedEvent(
          event,
        );

        setSelectedDate(
          eventDate,
        );

        setCurrentMonth(
          new Date(
            eventDate.getFullYear(),
            eventDate.getMonth(),
            1,
          ),
        );

        setForm(
          calendarEventToForm(
            event,
          ),
        );

        setShowEventForm(
          true,
        );

        setError(
          null,
        );

        /*
         * После открытия редактора
         * убираем параметр edit
         * из адресной строки.
         */
        router.replace(
          '/calendar',
          {
            scroll: false,
          },
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
            tr('Не удалось открыть событие'),
          );
        }
      }
    }

    void loadEventForEditing();

    return () => {
      cancelled = true;
    };
  }, [
    editEventId,
    router,
  ]);

  /*
   * Повторная загрузка событий
   * после создания, изменения
   * или удаления.
   */
  async function refreshEvents() {
    const result =
      await fetchEvents();

    if (result) {
      setEvents(
        result,
      );
    }
  }

  /*
   * Загружаем историю
   * завершённых событий.
   *
   * Отдельное поле статуса
   * для этого не требуется:
   * завершённость определяется
   * по дате и времени события.
   */
  async function loadHistoryEvents() {
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
      setIsHistoryLoading(
        true,
      );

      setHistoryError(
        null,
      );

      /*
       * Запрашиваем все события
       * до текущего момента.
       */
      const from =
        new Date(
          0,
        ).toISOString();

      const to =
        new Date().toISOString();

      const result =
        await apiRequest<
          CalendarEvent[]
        >(
          `/calendar?from=${encodeURIComponent(
            from,
          )}&to=${encodeURIComponent(
            to,
          )}`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          },
        );

      const now =
        new Date();

      const completedEvents =
        result
          .filter(
            (event) =>
              isEventCompleted(
                event,
                now,
              ),
          )
          .sort(
            (
              first,
              second,
            ) =>
              getEventCompletionTime(
                second,
              ) -
              getEventCompletionTime(
                first,
              ),
          );

      setHistoryEvents(
        completedEvents,
      );
    } catch (error) {
      if (
        error instanceof Error
      ) {
        setHistoryError(
          error.message,
        );
      } else {
        setHistoryError(
          tr('Не удалось загрузить историю событий'),
        );
      }
    } finally {
      setIsHistoryLoading(
        false,
      );
    }
  }

  /*
   * При каждом открытии истории
   * получаем свежие данные.
   */
  function openHistory() {
    setShowHistory(
      true,
    );

    void loadHistoryEvents();
  }

  function previousMonth() {
    setCurrentMonth(
      new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() - 1,
        1,
      ),
    );
  }

  function nextMonth() {
    setCurrentMonth(
      new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1,
        1,
      ),
    );
  }

  function goToToday() {
    const today =
      new Date();

    setCurrentMonth(
      new Date(
        today.getFullYear(),
        today.getMonth(),
        1,
      ),
    );

    setSelectedDate(
      today,
    );
  }

  function selectDay(
    day: CalendarDay,
  ) {
    setSelectedDate(
      day.date,
    );

    /*
     * Если выбран день
     * соседнего месяца,
     * переключаем месяц.
     */
    if (
      !day.isCurrentMonth
    ) {
      setCurrentMonth(
        new Date(
          day.date.getFullYear(),
          day.date.getMonth(),
          1,
        ),
      );
    }
  }

  /*
   * Открываем создание
   * нового события.
   */
  function openCreateEvent(
    date:
      | Date
      | null =
      selectedDate,
  ) {
    const targetDate =
      date ??
      new Date();

    setSelectedEvent(
      null,
    );

    setForm({
      ...emptyForm,

      date:
        toDateInputValue(
          targetDate,
        ),
    });

    setShowEventForm(
      true,
    );

    setError(
      null,
    );
  }

  /*
   * Открываем карточку
   * существующего события.
   */
  function openEvent(
    event: CalendarEvent,
  ) {
    setSelectedEvent(
      event,
    );

    setShowEventForm(
      false,
    );

    setShowDeleteDialog(
      false,
    );
  }

  /*
   * Переходим из просмотра
   * события к редактированию.
   */
  function editSelectedEvent() {
    if (!selectedEvent) {
      return;
    }

    setForm(
      calendarEventToForm(
        selectedEvent,
      ),
    );

    setShowEventForm(
      true,
    );
  }

  /*
   * Закрываем форму
   * создания или изменения.
   */
  function closeEventForm() {
    setShowEventForm(
      false,
    );

    setForm(
      emptyForm,
    );

    /*
     * Если это было создание,
     * закрываем всё.
     *
     * При редактировании оставляем
     * карточку события выбранной.
     */
    if (!selectedEvent) {
      setSelectedEvent(
        null,
      );
    }
  }

  /*
   * Создаём или изменяем событие.
   */
  async function saveEvent() {
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
      !form.title.trim()
    ) {
      setError(
        tr('Укажите название события'),
      );

      return;
    }

    if (!form.date) {
      setError(
        tr('Укажите дату события'),
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

      const startsAt =
        createEventDate(
          form.date,
          form.allDay
            ? '00:00'
            : form.startTime,
        );

      let endsAt:
        | string
        | undefined;

      if (
        !form.allDay &&
        form.endTime
      ) {
        const endDate =
          createEventDate(
            form.date,
            form.endTime,
          );

        if (
          new Date(
            endDate,
          ) <
          new Date(
            startsAt,
          )
        ) {
          setError(
            tr('Время окончания не может быть раньше начала'),
          );

          return;
        }

        endsAt =
          endDate;
      }

      const requestBody = {
        title:
          form.title.trim(),

        description:
          form.description.trim(),

        location:
          form.location.trim(),

        startsAt,

        endsAt,

        allDay:
          form.allDay,
      };

      let result:
        CalendarEvent;

      if (selectedEvent) {
        result =
          await apiRequest<CalendarEvent>(
            `/calendar/${selectedEvent.id}`,
            {
              method:
                'PATCH',

              headers: {
                Authorization:
                  `Bearer ${token}`,
              },

              body:
                JSON.stringify(
                  requestBody,
                ),
            },
          );
      } else {
        result =
          await apiRequest<CalendarEvent>(
            '/calendar',
            {
              method:
                'POST',

              headers: {
                Authorization:
                  `Bearer ${token}`,
              },

              body:
                JSON.stringify(
                  requestBody,
                ),
            },
          );
      }

      const resultDate =
        new Date(
          result.startsAt,
        );

      setSelectedEvent(
        result,
      );

      setSelectedDate(
        resultDate,
      );

      setCurrentMonth(
        new Date(
          resultDate.getFullYear(),
          resultDate.getMonth(),
          1,
        ),
      );

      setShowEventForm(
        false,
      );

      setForm(
        emptyForm,
      );

      await refreshEvents();
    } catch (error) {
      if (
        error instanceof Error
      ) {
        setError(
          error.message,
        );
      } else {
        setError(
          tr('Не удалось сохранить событие'),
        );
      }
    } finally {
      setIsSaving(
        false,
      );
    }
  }

  /*
   * Удаляем событие.
   */
  async function deleteEvent() {
    if (!selectedEvent) {
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
      setIsDeleting(
        true,
      );

      setError(
        null,
      );

      await apiRequest(
        `/calendar/${selectedEvent.id}`,
        {
          method:
            'DELETE',

          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        },
      );

      setSelectedEvent(
        null,
      );

      setShowDeleteDialog(
        false,
      );

      await refreshEvents();
    } catch (error) {
      if (
        error instanceof Error
      ) {
        setError(
          error.message,
        );
      } else {
        setError(
          tr('Не удалось удалить событие'),
        );
      }
    } finally {
      setIsDeleting(
        false,
      );
    }
  }

  /*
   * События выбранного дня
   * для правой панели.
   */
  const selectedDayEvents =
    selectedDate
      ? events.filter(
          (event) =>
            isSameLocalDay(
              new Date(
                event.startsAt,
              ),
              selectedDate,
            ),
        )
      : [];

  return (
    <main className="min-h-screen bg-[#fffaf8] px-4 py-6 md:px-8 md:py-8">

      <div className="mx-auto max-w-[1450px]">

        {/* Верхние кнопки */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">

          <button
            type="button"
            onClick={() =>
              router.push(
                '/home',
              )
            }
            className="flex items-center gap-2 rounded-xl border border-transparent px-3 py-2 text-sm font-medium text-[#876f6a] transition-all duration-150 hover:border-[#efd8d4] hover:bg-[#fff0ed] hover:text-[#c36f77] hover:shadow-sm active:scale-[0.96]"
          >
            <ArrowLeft
              size={18}
            />{tr('На главную')}</button>

          <div className="flex flex-wrap items-center gap-3">

            <button
              type="button"
              onClick={
                openHistory
              }
              className="flex items-center gap-2 rounded-2xl border border-[#e8d8d4] bg-white px-5 py-3 text-sm font-medium text-[#806a65] shadow-sm transition-all hover:border-[#dca9a7] hover:bg-[#fff2f0] hover:text-[#bd666e] hover:shadow-md active:scale-[0.97]"
            >
              <History
                size={18}
              />{tr('История')}</button>

            <button
              type="button"
              onClick={() =>
                openCreateEvent()
              }
              className="flex items-center gap-2 rounded-2xl bg-[#df8e94] px-5 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-[#d37b83] hover:shadow-md active:scale-[0.97]"
            >
              <Plus
                size={18}
              />{tr('Новое событие')}</button>

          </div>

        </div>

        {/* Заголовок */}
        <header className="mb-7">

          <p className="text-sm font-medium text-[#c8757c]">{tr('♡ Общее пространство')}</p>

          <h1 className="mt-1 text-3xl font-semibold text-[#554442]">{tr('Календарь')}</h1>

          <p className="mt-3 text-[#98837e]">{tr('Ваши общие планы, встречи и важные даты.')}</p>

        </header>

        {/* Ошибка */}
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

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">

          {/* Календарь */}
          <section className="overflow-hidden rounded-[30px] border border-[#eedfdb] bg-white shadow-[0_20px_70px_rgba(91,65,59,0.05)]">

            {/* Навигация по месяцам */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#f1e5e1] px-5 py-5 md:px-7">

              <div className="flex items-center gap-2">

                <button
                  type="button"
                  title={tr('Предыдущий месяц')}
                  onClick={
                    previousMonth
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-[#8e7771] transition-all hover:bg-[#fff0ef] hover:text-[#c36f77] active:scale-[0.94]"
                >
                  <ChevronLeft
                    size={20}
                  />
                </button>

                <button
                  type="button"
                  title={tr('Следующий месяц')}
                  onClick={
                    nextMonth
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-[#8e7771] transition-all hover:bg-[#fff0ef] hover:text-[#c36f77] active:scale-[0.94]"
                >
                  <ChevronRight
                    size={20}
                  />
                </button>

                <h2 className="ml-2 text-xl font-semibold capitalize text-[#554442] md:text-2xl">
                  {formatMonth(
                    currentMonth,
                  )}
                </h2>

              </div>

              <button
                type="button"
                onClick={
                  goToToday
                }
                className="rounded-xl border border-[#eadbd7] px-4 py-2 text-sm font-medium text-[#806a65] transition-all hover:border-[#dcaaa6] hover:bg-[#fff0ef] hover:text-[#c36f77] active:scale-[0.97]"
              >{tr('Сегодня')}</button>

            </div>

            {/* Дни недели */}
            <div className="grid grid-cols-7 border-b border-[#f1e5e1] bg-[#fffaf9]">

              {[
                tr('Пн'),
                tr('Вт'),
                tr('Ср'),
                tr('Чт'),
                tr('Пт'),
                tr('Сб'),
                tr('Вс'),
              ].map(
                (day) => (
                  <div
                    key={
                      day
                    }
                    className="px-2 py-3 text-center text-xs font-medium uppercase tracking-wide text-[#a48e88] md:text-sm"
                  >
                    {day}
                  </div>
                ),
              )}

            </div>

            {/* Календарная сетка */}
            {isLoading ? (
              <div className="flex min-h-[600px] items-center justify-center">

                <Heart
                  size={34}
                  className="animate-pulse text-[#d98a92]"
                />

              </div>
            ) : (
              <div className="grid grid-cols-7">

                {calendarDays.map(
                  (day) => {
                    const dayEvents =
                      events.filter(
                        (event) =>
                          isSameLocalDay(
                            new Date(
                              event.startsAt,
                            ),
                            day.date,
                          ),
                      );

                    const isToday =
                      isSameLocalDay(
                        day.date,
                        new Date(),
                      );

                    const isSelected =
                      selectedDate
                        ? isSameLocalDay(
                            day.date,
                            selectedDate,
                          )
                        : false;

                    return (
                      <div
                        key={
                          day.date.toISOString()
                        }
                        className={[
                          'relative min-h-[105px] border-b border-r border-[#f1e7e3] p-2 text-left transition md:min-h-[135px] md:p-3',

                          day.isCurrentMonth
                            ? 'bg-white'
                            : 'bg-[#fffaf9]',

                          isSelected
                            ? 'bg-[#fff5f4]'
                            : '',
                        ].join(
                          ' ',
                        )}
                      >

                        {/* Нажатие по пустой части дня */}
                        <button
                          type="button"
                          onClick={() =>
                            selectDay(
                              day,
                            )
                          }
                          onDoubleClick={() =>
                            openCreateEvent(
                              day.date,
                            )
                          }
                          className="absolute inset-0 z-0 transition hover:bg-[#fff9f7]"
                          aria-label={
                            tr('Выбрать {date}', {
                              date: day.date.toLocaleDateString(
                                getIntlLocale(),
                              ),
                            })
                          }
                        />

                        {/* Номер дня */}
                        <div className="pointer-events-none relative z-10">

                          <div
                            className={[
                              'flex h-7 w-7 items-center justify-center rounded-full text-sm',

                              isToday
                                ? 'bg-[#df8e94] font-semibold text-white'
                                : day.isCurrentMonth
                                  ? 'text-[#65514d]'
                                  : 'text-[#baa7a1]',
                            ].join(
                              ' ',
                            )}
                          >
                            {day.date.getDate()}
                          </div>

                        </div>

                        {/* События */}
                        <div className="relative z-20 mt-2 space-y-1">

                          {dayEvents
                            .slice(
                              0,
                              3,
                            )
                            .map(
                              (
                                event,
                              ) => (
                                <button
                                  key={
                                    event.id
                                  }
                                  type="button"
                                  onClick={() =>
                                    openEvent(
                                      event,
                                    )
                                  }
                                  className="block w-full truncate rounded-lg bg-[#fae5e6] px-2 py-1 text-left text-[10px] font-medium text-[#a85f66] transition hover:bg-[#f6d7da] active:scale-[0.98] md:text-xs"
                                >

                                  {!event.allDay && (
                                    <span className="mr-1 opacity-70">
                                      {formatTime(
                                        event.startsAt,
                                      )}
                                    </span>
                                  )}

                                  {
                                    event.title
                                  }

                                </button>
                              ),
                            )}

                          {dayEvents.length >
                            3 && (
                            <p className="pl-1 text-[10px] text-[#a48f89] md:text-xs">
                              {tr('ещё')}{' '}
                              {dayEvents.length -
                                3}
                            </p>
                          )}

                        </div>

                      </div>
                    );
                  },
                )}

              </div>
            )}

          </section>

          {/* События выбранного дня */}
          <aside className="self-start rounded-[28px] border border-[#eedfdb] bg-white p-5 xl:sticky xl:top-6">

            <div className="flex items-start justify-between gap-3">

              <div>

                <p className="text-sm text-[#c1767d]">{tr('Выбранный день')}</p>

                <h2 className="mt-1 text-xl font-semibold text-[#554442]">
                  {selectedDate
                    ? formatSelectedDate(
                        selectedDate,
                      )
                    : tr('Выберите дату')}
                </h2>

              </div>

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#f9e4e4] text-[#bf7076]">
                <CalendarDays
                  size={20}
                />
              </div>

            </div>

            <button
              type="button"
              disabled={
                !selectedDate
              }
              onClick={() =>
                openCreateEvent()
              }
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-[#eadbd7] px-4 py-3 text-sm font-medium text-[#896f69] transition-all hover:border-[#dfaaa7] hover:bg-[#fff0ef] hover:text-[#bd666e] active:scale-[0.98] disabled:opacity-50"
            >
              <Plus
                size={17}
              />{tr('Добавить событие')}</button>

            <div className="mt-5 space-y-3">

              {selectedDayEvents.length ===
                0 && (
                <div className="rounded-[20px] border border-dashed border-[#eadbd7] bg-[#fffaf9] px-4 py-8 text-center">

                  <p className="text-sm font-medium text-[#876f69]">{tr('Планов пока нет')}</p>

                  <p className="mt-2 text-xs leading-5 text-[#ac9892]">{tr('Хороший день, чтобы что-нибудь запланировать.')}</p>

                </div>
              )}

              {selectedDayEvents.map(
                (event) => (
                  <button
                    key={
                      event.id
                    }
                    type="button"
                    onClick={() =>
                      openEvent(
                        event,
                      )
                    }
                    className="w-full rounded-[20px] border border-[#f0e1dd] bg-[#fffaf9] p-4 text-left transition-all hover:border-[#e4c6c3] hover:bg-[#fff4f2] hover:shadow-sm active:scale-[0.99]"
                  >

                    <p className="font-semibold text-[#5e4a47]">
                      {event.title}
                    </p>

                    <div className="mt-2 flex items-center gap-2 text-xs text-[#9b8580]">

                      <Clock
                        size={14}
                      />

                      {event.allDay
                        ? tr('Весь день')
                        : formatEventTime(
                            event,
                          )}

                    </div>

                    {event.location && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-[#9b8580]">

                        <MapPin
                          size={14}
                        />

                        <span className="truncate">
                          {
                            event.location
                          }
                        </span>

                      </div>
                    )}

                  </button>
                ),
              )}

            </div>

          </aside>

        </div>

      </div>

      {/* История завершённых событий */}
      {showHistory && (
        <EventHistoryDialog
          events={
            historyEvents
          }
          isLoading={
            isHistoryLoading
          }
          error={
            historyError
          }
          onClose={() =>
            setShowHistory(
              false,
            )
          }
          onOpenEvent={(
            event,
          ) => {
            setShowHistory(
              false,
            );

            openEvent(
              event,
            );
          }}
        />
      )}

      {/* Просмотр события */}
      {selectedEvent &&
        !showEventForm && (
        <EventDetailsDialog
          event={
            selectedEvent
          }
          onClose={() =>
            setSelectedEvent(
              null,
            )
          }
          onEdit={
            editSelectedEvent
          }
          onDelete={() =>
            setShowDeleteDialog(
              true,
            )
          }
        />
      )}

      {/* Создание / редактирование */}
      {showEventForm && (
        <EventFormDialog
          form={
            form
          }
          editing={
            Boolean(
              selectedEvent,
            )
          }
          isSaving={
            isSaving
          }
          onChange={
            setForm
          }
          onClose={
            closeEventForm
          }
          onSave={() =>
            void saveEvent()
          }
        />
      )}

      {/* Подтверждение удаления */}
      {showDeleteDialog &&
        selectedEvent && (
        <DeleteEventDialog
          event={
            selectedEvent
          }
          isDeleting={
            isDeleting
          }
          onCancel={() =>
            setShowDeleteDialog(
              false,
            )
          }
          onConfirm={() =>
            void deleteEvent()
          }
        />
      )}

    </main>
  );
}

function EventHistoryDialog({
  events,
  isLoading,
  error,
  onClose,
  onOpenEvent,
}: {
  events: CalendarEvent[];
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
  onOpenEvent: (
    event: CalendarEvent,
  ) => void;
}) {
  const groups =
    useMemo(
      () =>
        groupHistoryEvents(
          events,
        ),
      [
        events,
      ],
    );

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-[#4d403e]/30 p-4 backdrop-blur-sm md:p-6">

      <div className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-[30px] border border-[#eadbd7] bg-white shadow-[0_30px_100px_rgba(73,48,45,0.22)]">

        <div className="flex items-start justify-between gap-4 border-b border-[#f0e3df] px-6 py-6 md:px-8">

          <div className="flex items-start gap-4">

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#f9e7e8] text-[#c8757c]">
              <History
                size={22}
              />
            </div>

            <div>

              <p className="text-sm font-medium text-[#c8757c]">{tr('Ваши общие воспоминания')}</p>

              <h2 className="mt-1 text-2xl font-semibold text-[#554442]">{tr('История событий')}</h2>

              <p className="mt-2 text-sm leading-6 text-[#9b8580]">{tr('Здесь автоматически появляются события, которые уже завершились.')}</p>

            </div>

          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[#957f79] transition hover:bg-[#fff0ef] hover:text-[#c36f77] active:scale-[0.94]"
            aria-label={tr('Закрыть историю')}
          >
            <X
              size={20}
            />
          </button>

        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 md:px-8">

          {isLoading && (
            <div className="flex min-h-[360px] flex-col items-center justify-center text-center">

              <Heart
                size={34}
                className="animate-pulse text-[#d98a92]"
              />

              <p className="mt-4 text-sm text-[#9b8580]">{tr('Загружаем прошлые события...')}</p>

            </div>
          )}

          {!isLoading &&
            error && (
            <div className="rounded-[20px] border border-[#efc9cc] bg-[#fff1f1] px-5 py-4 text-sm leading-6 text-[#a95057]">
              {error}
            </div>
          )}

          {!isLoading &&
            !error &&
            events.length ===
              0 && (
            <div className="flex min-h-[360px] items-center justify-center">

              <div className="max-w-sm text-center">

                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f9e7e8] text-[#c8757c]">
                  <History
                    size={25}
                  />
                </div>

                <h3 className="mt-5 text-lg font-semibold text-[#5f4b47]">{tr('История пока пуста')}</h3>

                <p className="mt-2 text-sm leading-6 text-[#a08c86]">{tr('Когда события завершатся, они автоматически появятся здесь.')}</p>

              </div>

            </div>
          )}

          {!isLoading &&
            !error &&
            groups.map(
              (
                group,
              ) => (
                <section
                  key={
                    group.key
                  }
                  className="mb-8 last:mb-0"
                >

                  <div className="mb-3 flex items-center gap-3">

                    <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-[#9b8580]">
                      {group.label}
                    </h3>

                    <div className="h-px flex-1 bg-[#f0e3df]" />

                    <span className="rounded-full bg-[#fff2f0] px-2.5 py-1 text-[10px] font-medium text-[#bd767d]">
                      {group.events.length}
                    </span>

                  </div>

                  <div className="space-y-3">

                    {group.events.map(
                      (
                        event,
                      ) => {
                        const creatorName =
                          event.createdBy
                            .displayName ??
                          event.createdBy
                            .nickname;

                        return (
                          <button
                            key={
                              event.id
                            }
                            type="button"
                            onClick={() =>
                              onOpenEvent(
                                event,
                              )
                            }
                            className="group flex w-full items-start gap-4 rounded-[22px] border border-[#f0e1dd] bg-[#fffaf9] p-4 text-left transition-all hover:border-[#e2c2bf] hover:bg-[#fff4f2] hover:shadow-sm active:scale-[0.995] md:p-5"
                          >

                            <div className="flex w-[58px] shrink-0 flex-col items-center justify-center rounded-2xl bg-[#f9e5e6] px-2 py-3 text-[#bd6d75]">

                              <span className="text-[10px] font-semibold uppercase">
                                {formatHistoryMonthShort(
                                  event.startsAt,
                                )}
                              </span>

                              <span className="mt-0.5 text-2xl font-semibold leading-none">
                                {new Date(
                                  event.startsAt,
                                ).getDate()}
                              </span>

                            </div>

                            <div className="min-w-0 flex-1">

                              <div className="flex items-start justify-between gap-3">

                                <div className="min-w-0">

                                  <p className="truncate font-semibold text-[#5e4a47] transition group-hover:text-[#ad6269]">
                                    {event.title}
                                  </p>

                                  <p className="mt-1 text-xs capitalize text-[#a28d87]">
                                    {formatHistoryDate(
                                      event.startsAt,
                                    )}
                                  </p>

                                </div>

                                <ChevronRight
                                  size={17}
                                  className="mt-0.5 shrink-0 text-[#c8b2ad] transition group-hover:translate-x-0.5 group-hover:text-[#bd777d]"
                                />

                              </div>

                              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-[#907b75]">

                                <span className="flex items-center gap-1.5">

                                  <Clock
                                    size={13}
                                  />

                                  {event.allDay
                                    ? tr('Весь день')
                                    : formatEventTime(
                                        event,
                                      )}

                                </span>

                                {event.location && (
                                  <span className="flex min-w-0 items-center gap-1.5">

                                    <MapPin
                                      size={13}
                                      className="shrink-0"
                                    />

                                    <span className="max-w-[240px] truncate">
                                      {event.location}
                                    </span>

                                  </span>
                                )}

                              </div>

                              <p className="mt-3 text-[11px] text-[#b09b95]">
                                {tr('Добавил(а):')}{' '}
                                {creatorName}
                              </p>

                            </div>

                          </button>
                        );
                      },
                    )}

                  </div>

                </section>
              ),
            )}

        </div>

        {!isLoading &&
          !error &&
          events.length >
            0 && (
          <div className="border-t border-[#f0e3df] bg-[#fffdfb] px-6 py-4 md:px-8">

            <p className="text-center text-xs text-[#a8948e]">
              {tr('Всего завершённых событий:')}{' '}
              <span className="font-semibold text-[#8c716c]">
                {events.length}
              </span>
            </p>

          </div>
        )}

      </div>

    </div>
  );
}

function EventDetailsDialog({
  event,
  onClose,
  onEdit,
  onDelete,
}: {
  event: CalendarEvent;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const creatorName =
    event.createdBy
      .displayName ??
    event.createdBy
      .nickname;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#4d403e]/30 p-5 backdrop-blur-sm">

      <div className="w-full max-w-lg rounded-[30px] border border-[#eadbd7] bg-white p-7 shadow-[0_30px_100px_rgba(73,48,45,0.22)]">

        <div className="flex items-start justify-between gap-4">

          <div>

            <p className="text-sm font-medium text-[#c8757c]">{tr('Событие')}</p>

            <h2 className="mt-1 text-2xl font-semibold text-[#554442]">
              {event.title}
            </h2>

          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[#957f79] transition hover:bg-[#fff0ef] hover:text-[#c36f77] active:scale-[0.94]"
          >
            <X
              size={20}
            />
          </button>

        </div>

        <div className="mt-6 space-y-4">

          <div className="flex items-start gap-3">

            <CalendarDays
              size={19}
              className="mt-0.5 shrink-0 text-[#c3757c]"
            />

            <div>

              <p className="text-sm font-medium text-[#65514d]">
                {formatEventDate(
                  event.startsAt,
                )}
              </p>

              <p className="mt-1 text-sm text-[#9a8580]">
                {event.allDay
                  ? tr('Весь день')
                  : formatEventTime(
                      event,
                    )}
              </p>

            </div>

          </div>

          {event.location && (
            <div className="flex items-start gap-3">

              <MapPin
                size={19}
                className="mt-0.5 shrink-0 text-[#8d809d]"
              />

              <p className="text-sm text-[#6f5a56]">
                {event.location}
              </p>

            </div>
          )}

          {event.description && (
            <div className="rounded-2xl bg-[#fff8f6] p-4 text-sm leading-6 text-[#806c67]">
              {event.description}
            </div>
          )}

        </div>

        <p className="mt-5 text-xs text-[#ad9993]">
          {tr('Добавил(а):')}{' '}
          {creatorName}
        </p>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">

          <button
            type="button"
            onClick={
              onEdit
            }
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#df8e94] px-5 py-3 font-medium text-white transition-all hover:bg-[#d37b83] active:scale-[0.97]"
          >
            <Pencil
              size={17}
            />{tr('Редактировать')}</button>

          <button
            type="button"
            onClick={
              onDelete
            }
            className="flex items-center justify-center gap-2 rounded-2xl border border-[#efc7c9] px-5 py-3 font-medium text-[#b75b61] transition-all hover:bg-[#c86167] hover:text-white active:scale-[0.97]"
          >
            <Trash2
              size={17}
            />{tr('Удалить')}</button>

        </div>

      </div>

    </div>
  );
}

function EventFormDialog({
  form,
  editing,
  isSaving,
  onChange,
  onClose,
  onSave,
}: {
  form: EventForm;
  editing: boolean;
  isSaving: boolean;
  onChange: (
    value: EventForm,
  ) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#4d403e]/30 p-5 backdrop-blur-sm">

      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-[30px] border border-[#eadbd7] bg-white p-7 shadow-[0_30px_100px_rgba(73,48,45,0.22)]">

        <div className="flex items-start justify-between gap-4">

          <div>

            <p className="text-sm font-medium text-[#c8757c]">
              {editing
                ? tr('Редактирование')
                : tr('Новый план')}
            </p>

            <h2 className="mt-1 text-2xl font-semibold text-[#554442]">
              {editing
                ? tr('Изменить событие')
                : tr('Добавить событие')}
            </h2>

          </div>

          <button
            type="button"
            disabled={
              isSaving
            }
            onClick={
              onClose
            }
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[#957f79] transition hover:bg-[#fff0ef] hover:text-[#c36f77] active:scale-[0.94]"
          >
            <X
              size={20}
            />
          </button>

        </div>

        <div className="mt-7 space-y-5">

          <div>

            <label
              htmlFor="eventTitle"
              className="mb-2 block text-sm font-medium text-[#665451]"
            >{tr('Название')}</label>

            <input
              id="eventTitle"
              type="text"
              maxLength={100}
              value={
                form.title
              }
              onChange={(
                event,
              ) =>
                onChange({
                  ...form,
                  title:
                    event.target
                      .value,
                })
              }
              placeholder={tr('Например, свидание ♡')}
              className="w-full rounded-2xl border border-[#eadbd7] bg-[#fffdfc] px-4 py-3.5 text-[#554442] outline-none transition focus:border-[#df9ca1] focus:ring-4 focus:ring-[#f7e3e5]"
            />

          </div>

          <div>

            <label
              htmlFor="eventDate"
              className="mb-2 block text-sm font-medium text-[#665451]"
            >{tr('Дата')}</label>

            <input
              id="eventDate"
              type="date"
              value={
                form.date
              }
              onChange={(
                event,
              ) =>
                onChange({
                  ...form,
                  date:
                    event.target
                      .value,
                })
              }
              className="w-full rounded-2xl border border-[#eadbd7] bg-[#fffdfc] px-4 py-3.5 text-[#554442] outline-none focus:border-[#df9ca1] focus:ring-4 focus:ring-[#f7e3e5]"
            />

          </div>

          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-[#eee0dc] bg-[#fffaf9] p-4">

            <input
              type="checkbox"
              checked={
                form.allDay
              }
              onChange={(
                event,
              ) =>
                onChange({
                  ...form,
                  allDay:
                    event.target
                      .checked,
                })
              }
              className="h-4 w-4 accent-[#d47d85]"
            />

            <div>

              <p className="text-sm font-medium text-[#66514d]">{tr('Весь день')}</p>

              <p className="mt-0.5 text-xs text-[#a48f89]">{tr('Время начала указывать не нужно')}</p>

            </div>

          </label>

          {!form.allDay && (
            <div className="grid gap-4 sm:grid-cols-2">

              <div>

                <label
                  htmlFor="startTime"
                  className="mb-2 block text-sm font-medium text-[#665451]"
                >{tr('Начало')}</label>

                <input
                  id="startTime"
                  type="time"
                  value={
                    form.startTime
                  }
                  onChange={(
                    event,
                  ) =>
                    onChange({
                      ...form,
                      startTime:
                        event.target
                          .value,
                    })
                  }
                  className="w-full rounded-2xl border border-[#eadbd7] bg-[#fffdfc] px-4 py-3.5 text-[#554442] outline-none focus:border-[#df9ca1] focus:ring-4 focus:ring-[#f7e3e5]"
                />

              </div>

              <div>

                <label
                  htmlFor="endTime"
                  className="mb-2 block text-sm font-medium text-[#665451]"
                >{tr('Окончание')}</label>

                <input
                  id="endTime"
                  type="time"
                  value={
                    form.endTime
                  }
                  onChange={(
                    event,
                  ) =>
                    onChange({
                      ...form,
                      endTime:
                        event.target
                          .value,
                    })
                  }
                  className="w-full rounded-2xl border border-[#eadbd7] bg-[#fffdfc] px-4 py-3.5 text-[#554442] outline-none focus:border-[#df9ca1] focus:ring-4 focus:ring-[#f7e3e5]"
                />

              </div>

            </div>
          )}

          <div>

            <label
              htmlFor="eventLocation"
              className="mb-2 block text-sm font-medium text-[#665451]"
            >{tr('Место')}</label>

            <input
              id="eventLocation"
              type="text"
              maxLength={200}
              value={
                form.location
              }
              onChange={(
                event,
              ) =>
                onChange({
                  ...form,
                  location:
                    event.target
                      .value,
                })
              }
              placeholder={tr('Необязательно')}
              className="w-full rounded-2xl border border-[#eadbd7] bg-[#fffdfc] px-4 py-3.5 text-[#554442] outline-none focus:border-[#df9ca1] focus:ring-4 focus:ring-[#f7e3e5]"
            />

          </div>

          <div>

            <label
              htmlFor="eventDescription"
              className="mb-2 block text-sm font-medium text-[#665451]"
            >{tr('Заметка')}</label>

            <textarea
              id="eventDescription"
              maxLength={1000}
              rows={4}
              value={
                form.description
              }
              onChange={(
                event,
              ) =>
                onChange({
                  ...form,
                  description:
                    event.target
                      .value,
                })
              }
              placeholder={tr('Что важно не забыть?')}
              className="w-full resize-none rounded-2xl border border-[#eadbd7] bg-[#fffdfc] px-4 py-3.5 text-[#554442] outline-none focus:border-[#df9ca1] focus:ring-4 focus:ring-[#f7e3e5]"
            />

          </div>

        </div>

        <button
          type="button"
          disabled={
            isSaving
          }
          onClick={
            onSave
          }
          className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#df8e94] px-6 py-3.5 font-medium text-white shadow-sm transition-all hover:bg-[#d37b83] hover:shadow-md active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
        >
          <Save
            size={18}
          />

          {isSaving
            ? tr('Сохраняем...')
            : editing
              ? tr('Сохранить изменения')
              : tr('Создать событие')}
        </button>

      </div>

    </div>
  );
}

function DeleteEventDialog({
  event,
  isDeleting,
  onCancel,
  onConfirm,
}: {
  event: CalendarEvent;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#4d403e]/35 p-5 backdrop-blur-sm">

      <div className="w-full max-w-md rounded-[28px] border border-[#efd3d4] bg-white p-7 shadow-[0_30px_100px_rgba(73,48,45,0.22)]">

        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fdeaea] text-[#c45e64]">
          <Trash2
            size={21}
          />
        </div>

        <h2 className="mt-5 text-xl font-semibold text-[#624b48]">{tr('Удалить событие?')}</h2>

        <p className="mt-3 text-sm leading-6 text-[#917975]">
          {tr(
            '«{title}» будет удалено из общего календаря для вас обоих.',
            {
              title: event.title,
            },
          )}
        </p>

        <div className="mt-6 flex gap-3">

          <button
            type="button"
            disabled={
              isDeleting
            }
            onClick={
              onCancel
            }
            className="flex-1 rounded-2xl border border-[#e6d8d5] px-5 py-3 font-medium text-[#79635f] transition-all hover:bg-[#fff1ef] active:scale-[0.97] disabled:opacity-50"
          >{tr('Отмена')}</button>

          <button
            type="button"
            disabled={
              isDeleting
            }
            onClick={
              onConfirm
            }
            className="flex-1 rounded-2xl bg-[#c86167] px-5 py-3 font-medium text-white transition-all hover:bg-[#b85359] active:scale-[0.97] disabled:opacity-50"
          >
            {isDeleting
              ? tr('Удаляем...')
              : tr('Удалить')}
          </button>

        </div>

      </div>

    </div>
  );
}

/*
 * Преобразуем событие
 * из backend в форму.
 */
function calendarEventToForm(
  event: CalendarEvent,
): EventForm {
  const startDate =
    new Date(
      event.startsAt,
    );

  const endDate =
    event.endsAt
      ? new Date(
          event.endsAt,
        )
      : null;

  return {
    title:
      event.title,

    description:
      event.description ??
      '',

    location:
      event.location ??
      '',

    date:
      toDateInputValue(
        startDate,
      ),

    startTime:
      toTimeInputValue(
        startDate,
      ),

    endTime:
      endDate
        ? toTimeInputValue(
            endDate,
          )
        : '',

    allDay:
      event.allDay,
  };
}

/*
 * Формируем сетку
 * 6 недель × 7 дней.
 */
function createCalendarDays(
  month: Date,
) {
  const year =
    month.getFullYear();

  const monthIndex =
    month.getMonth();

  const firstDay =
    new Date(
      year,
      monthIndex,
      1,
    );

  const weekday =
    firstDay.getDay();

  const offset =
    weekday === 0
      ? 6
      : weekday - 1;

  const gridStart =
    new Date(
      year,
      monthIndex,
      1 - offset,
    );

  const days:
    CalendarDay[] = [];

  for (
    let index = 0;
    index < 42;
    index += 1
  ) {
    const date =
      new Date(
        gridStart,
      );

    date.setDate(
      gridStart.getDate() +
        index,
    );

    days.push({
      date,

      isCurrentMonth:
        date.getMonth() ===
        monthIndex,
    });
  }

  return days;
}

function startOfDay(
  value: Date,
) {
  return new Date(
    value.getFullYear(),
    value.getMonth(),
    value.getDate(),
  );
}

function isSameLocalDay(
  first: Date,
  second: Date,
) {
  return (
    first.getFullYear() ===
      second.getFullYear() &&
    first.getMonth() ===
      second.getMonth() &&
    first.getDate() ===
      second.getDate()
  );
}

function toDateInputValue(
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

function toTimeInputValue(
  value: Date,
) {
  const hours =
    String(
      value.getHours(),
    ).padStart(
      2,
      '0',
    );

  const minutes =
    String(
      value.getMinutes(),
    ).padStart(
      2,
      '0',
    );

  return `${hours}:${minutes}`;
}

/*
 * Преобразуем локальную
 * дату и время в ISO.
 */
function createEventDate(
  date: string,
  time: string,
) {
  const [
    year,
    month,
    day,
  ] =
    date
      .split('-')
      .map(
        Number,
      );

  const [
    hours,
    minutes,
  ] =
    time
      .split(':')
      .map(
        Number,
      );

  return new Date(
    year,
    month - 1,
    day,
    hours,
    minutes,
    0,
    0,
  ).toISOString();
}

/*
 * Событие считается завершённым:
 *
 * - если есть время окончания —
 *   после endsAt;
 * - если окончания нет —
 *   после startsAt;
 * - событие на весь день —
 *   только после завершения
 *   календарного дня.
 */
function isEventCompleted(
  event: CalendarEvent,
  now: Date,
) {
  if (event.allDay) {
    const eventDayEnd =
      new Date(
        event.startsAt,
      );

    eventDayEnd.setHours(
      23,
      59,
      59,
      999,
    );

    return (
      eventDayEnd.getTime() <
      now.getTime()
    );
  }

  const completionDate =
    event.endsAt
      ? new Date(
          event.endsAt,
        )
      : new Date(
          event.startsAt,
        );

  return (
    completionDate.getTime() <
    now.getTime()
  );
}

/*
 * Получаем момент завершения
 * для сортировки истории.
 */
function getEventCompletionTime(
  event: CalendarEvent,
) {
  if (event.allDay) {
    const eventDayEnd =
      new Date(
        event.startsAt,
      );

    eventDayEnd.setHours(
      23,
      59,
      59,
      999,
    );

    return eventDayEnd.getTime();
  }

  return new Date(
    event.endsAt ??
      event.startsAt,
  ).getTime();
}

/*
 * Группируем историю
 * по месяцам.
 */
function groupHistoryEvents(
  events: CalendarEvent[],
) {
  const groups =
    new Map<
      string,
      {
        key: string;
        label: string;
        events: CalendarEvent[];
      }
    >();

  events.forEach(
    (event) => {
      const date =
        new Date(
          event.startsAt,
        );

      const key =
        `${date.getFullYear()}-${String(
          date.getMonth() + 1,
        ).padStart(
          2,
          '0',
        )}`;

      const existing =
        groups.get(
          key,
        );

      if (existing) {
        existing.events.push(
          event,
        );

        return;
      }

      const rawLabel =
        new Intl.DateTimeFormat(
          getIntlLocale(),
          {
            month:
              'long',
            year:
              'numeric',
          },
        ).format(
          date,
        );

      groups.set(
        key,
        {
          key,

          label:
            rawLabel
              .charAt(0)
              .toUpperCase() +
            rawLabel.slice(1),

          events: [
            event,
          ],
        },
      );
    },
  );

  return Array.from(
    groups.values(),
  );
}

function formatHistoryDate(
  value: string,
) {
  return new Intl.DateTimeFormat(
    getIntlLocale(),
    {
      day:
        'numeric',
      month:
        'long',
      weekday:
        'long',
    },
  ).format(
    new Date(
      value,
    ),
  );
}

function formatHistoryMonthShort(
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
    .replace(
      '.',
      '',
    )
    .toUpperCase();
}

function formatMonth(
  value: Date,
) {
  return new Intl.DateTimeFormat(
    getIntlLocale(),
    {
      month:
        'long',
      year:
        'numeric',
    },
  ).format(
    value,
  );
}

function formatSelectedDate(
  value: Date,
) {
  return new Intl.DateTimeFormat(
    getIntlLocale(),
    {
      day:
        'numeric',
      month:
        'long',
      weekday:
        'long',
    },
  ).format(
    value,
  );
}

function formatEventDate(
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
      weekday:
        'long',
    },
  ).format(
    new Date(
      value,
    ),
  );
}

function formatTime(
  value: string,
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
      value,
    ),
  );
}

function formatEventTime(
  event: CalendarEvent,
) {
  const start =
    formatTime(
      event.startsAt,
    );

  if (!event.endsAt) {
    return start;
  }

  const end =
    formatTime(
      event.endsAt,
    );

  return `${start}–${end}`;
}