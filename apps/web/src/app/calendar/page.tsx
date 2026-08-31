'use client';

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
    form,
    setForm,
  ] =
    useState<EventForm>(
      emptyForm,
    );

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
   * текущей календарной сетки.
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
            'Не удалось загрузить календарь',
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
   * Если открыли страницу через:
   *
   * /calendar?edit=ID
   *
   * отдельно получаем конкретное
   * событие и сразу открываем
   * форму его редактирования.
   *
   * Это работает даже если событие
   * находится в другом месяце.
   */
  useEffect(() => {
    if (!editEventId) {
      return;
    }

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
              editEventId,
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
         * Убираем параметр из URL,
         * чтобы редактор не открылся
         * повторно после дальнейших
         * изменений страницы.
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
            'Не удалось открыть событие',
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

  async function refreshEvents() {
    const result =
      await fetchEvents();

    if (result) {
      setEvents(
        result,
      );
    }
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

  function closeEventForm() {
    setShowEventForm(
      false,
    );

    setForm(
      emptyForm,
    );

    if (!selectedEvent) {
      setSelectedEvent(
        null,
      );
    }
  }

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
        'Укажите название события',
      );

      return;
    }

    if (!form.date) {
      setError(
        'Укажите дату события',
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
            'Время окончания не может быть раньше начала',
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
          'Не удалось сохранить событие',
        );
      }
    } finally {
      setIsSaving(
        false,
      );
    }
  }

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
          'Не удалось удалить событие',
        );
      }
    } finally {
      setIsDeleting(
        false,
      );
    }
  }

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
            />

            На главную
          </button>

          <button
            type="button"
            onClick={() =>
              openCreateEvent()
            }
            className="flex items-center gap-2 rounded-2xl bg-[#df8e94] px-5 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-[#d37b83] hover:shadow-md active:scale-[0.97]"
          >
            <Plus
              size={18}
            />

            Новое событие
          </button>

        </div>

        <header className="mb-7">

          <p className="text-sm font-medium text-[#c8757c]">
            ♡ Общее пространство
          </p>

          <h1 className="mt-1 text-3xl font-semibold text-[#554442]">
            Календарь
          </h1>

          <p className="mt-3 text-[#98837e]">
            Ваши общие планы,
            встречи и важные даты.
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

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">

          <section className="overflow-hidden rounded-[30px] border border-[#eedfdb] bg-white shadow-[0_20px_70px_rgba(91,65,59,0.05)]">

            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#f1e5e1] px-5 py-5 md:px-7">

              <div className="flex items-center gap-2">

                <button
                  type="button"
                  title="Предыдущий месяц"
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
                  title="Следующий месяц"
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
              >
                Сегодня
              </button>

            </div>

            <div className="grid grid-cols-7 border-b border-[#f1e5e1] bg-[#fffaf9]">

              {[
                'Пн',
                'Вт',
                'Ср',
                'Чт',
                'Пт',
                'Сб',
                'Вс',
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
                            `Выбрать ${day.date.toLocaleDateString(
                              'ru-RU',
                            )}`
                          }
                        />

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
                              ещё{' '}
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

          <aside className="self-start rounded-[28px] border border-[#eedfdb] bg-white p-5 xl:sticky xl:top-6">

            <div className="flex items-start justify-between gap-3">

              <div>

                <p className="text-sm text-[#c1767d]">
                  Выбранный день
                </p>

                <h2 className="mt-1 text-xl font-semibold text-[#554442]">
                  {selectedDate
                    ? formatSelectedDate(
                        selectedDate,
                      )
                    : 'Выберите дату'}
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
              />

              Добавить событие
            </button>

            <div className="mt-5 space-y-3">

              {selectedDayEvents.length ===
                0 && (
                <div className="rounded-[20px] border border-dashed border-[#eadbd7] bg-[#fffaf9] px-4 py-8 text-center">

                  <p className="text-sm font-medium text-[#876f69]">
                    Планов пока нет
                  </p>

                  <p className="mt-2 text-xs leading-5 text-[#ac9892]">
                    Хороший день,
                    чтобы что-нибудь
                    запланировать.
                  </p>

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
                        ? 'Весь день'
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

            <p className="text-sm font-medium text-[#c8757c]">
              Событие
            </p>

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
                  ? 'Весь день'
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
          Добавил(а):{' '}
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
            />

            Редактировать
          </button>

          <button
            type="button"
            onClick={
              onDelete
            }
            className="flex items-center justify-center gap-2 rounded-2xl border border-[#efc7c9] px-5 py-3 font-medium text-[#b75b61] transition-all hover:bg-[#c86167] hover:text-white active:scale-[0.97]"
          >
            <Trash2
              size={17}
            />

            Удалить
          </button>

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
                ? 'Редактирование'
                : 'Новый план'}
            </p>

            <h2 className="mt-1 text-2xl font-semibold text-[#554442]">
              {editing
                ? 'Изменить событие'
                : 'Добавить событие'}
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
            >
              Название
            </label>

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
              placeholder="Например, свидание ♡"
              className="w-full rounded-2xl border border-[#eadbd7] bg-[#fffdfc] px-4 py-3.5 text-[#554442] outline-none transition focus:border-[#df9ca1] focus:ring-4 focus:ring-[#f7e3e5]"
            />

          </div>

          <div>

            <label
              htmlFor="eventDate"
              className="mb-2 block text-sm font-medium text-[#665451]"
            >
              Дата
            </label>

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

              <p className="text-sm font-medium text-[#66514d]">
                Весь день
              </p>

              <p className="mt-0.5 text-xs text-[#a48f89]">
                Время начала
                указывать не нужно
              </p>

            </div>

          </label>

          {!form.allDay && (
            <div className="grid gap-4 sm:grid-cols-2">

              <div>

                <label
                  htmlFor="startTime"
                  className="mb-2 block text-sm font-medium text-[#665451]"
                >
                  Начало
                </label>

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
                >
                  Окончание
                </label>

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
            >
              Место
            </label>

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
              placeholder="Необязательно"
              className="w-full rounded-2xl border border-[#eadbd7] bg-[#fffdfc] px-4 py-3.5 text-[#554442] outline-none focus:border-[#df9ca1] focus:ring-4 focus:ring-[#f7e3e5]"
            />

          </div>

          <div>

            <label
              htmlFor="eventDescription"
              className="mb-2 block text-sm font-medium text-[#665451]"
            >
              Заметка
            </label>

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
              placeholder="Что важно не забыть?"
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
            ? 'Сохраняем...'
            : editing
              ? 'Сохранить изменения'
              : 'Создать событие'}
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

        <h2 className="mt-5 text-xl font-semibold text-[#624b48]">
          Удалить событие?
        </h2>

        <p className="mt-3 text-sm leading-6 text-[#917975]">
          «{event.title}» будет
          удалено из общего календаря
          для вас обоих.
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
          >
            Отмена
          </button>

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
              ? 'Удаляем...'
              : 'Удалить'}
          </button>

        </div>

      </div>

    </div>
  );
}

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

function formatMonth(
  value: Date,
) {
  return new Intl.DateTimeFormat(
    'ru-RU',
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
    'ru-RU',
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
    'ru-RU',
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
    'ru-RU',
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