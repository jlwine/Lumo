'use client';

import {
  type ClipboardEvent,
  type DragEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  ArrowLeft,
  Camera,
  CalendarDays,
  Heart,
  ImagePlus,
  Images,
  Pencil,
  RefreshCw,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';

import {
  useRouter,
} from 'next/navigation';

import { apiRequest } from '@/lib/api';

import {
  getAccessToken,
  removeAccessToken,
} from '@/lib/auth';

import type {
  DayBoardEntry,
  DayBoardHistoryDay,
  DayBoardHistoryResponse,
  DayBoardTodayResponse,
  DayBoardUser,
} from '@/types/day-board';

const MAX_IMAGE_SIZE =
  10 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

export default function DayBoardPage() {
  const router =
    useRouter();

  const todayDate =
    useMemo(
      () =>
        toLocalDateValue(
          new Date(),
        ),
      [],
    );

  const [
    today,
    setToday,
  ] =
    useState<DayBoardTodayResponse | null>(
      null,
    );

  const [
    history,
    setHistory,
  ] =
    useState<DayBoardHistoryDay[]>(
      [],
    );

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(true);

  const [
    isRefreshing,
    setIsRefreshing,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );

  const [
    showEditor,
    setShowEditor,
  ] =
    useState(false);

  const [
    showDeleteDialog,
    setShowDeleteDialog,
  ] =
    useState(false);

  const [
    caption,
    setCaption,
  ] =
    useState('');

  const [
    imageFile,
    setImageFile,
  ] =
    useState<File | null>(
      null,
    );

  const [
    previewUrl,
    setPreviewUrl,
  ] =
    useState<string | null>(
      null,
    );

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

  const loadData =
    useCallback(
      async (
        refreshing = false,
      ) => {
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
          if (refreshing) {
            setIsRefreshing(
              true,
            );
          } else {
            setIsLoading(
              true,
            );
          }

          setError(
            null,
          );

          const [
            todayResult,
            historyResult,
          ] =
            await Promise.all([
              apiRequest<
                DayBoardTodayResponse
              >(
                `/day-board/today?date=${encodeURIComponent(
                  todayDate,
                )}`,
                {
                  headers: {
                    Authorization:
                      `Bearer ${token}`,
                  },
                },
              ),

              apiRequest<
                DayBoardHistoryResponse
              >(
                '/day-board/history?limit=60',
                {
                  headers: {
                    Authorization:
                      `Bearer ${token}`,
                  },
                },
              ),
            ]);

          setToday(
            todayResult,
          );

          setHistory(
            historyResult.days,
          );
        } catch (
          error
        ) {
          setError(
            getErrorMessage(
              error,
              'Не удалось загрузить доску дня',
            ),
          );
        } finally {
          setIsLoading(
            false,
          );

          setIsRefreshing(
            false,
          );
        }
      },
      [
        router,
        todayDate,
      ],
    );

  useEffect(() => {
    void loadData();
  }, [
    loadData,
  ]);

  useEffect(() => {
    return () => {
      if (
        previewUrl?.startsWith(
          'blob:',
        )
      ) {
        URL.revokeObjectURL(
          previewUrl,
        );
      }
    };
  }, [
    previewUrl,
  ]);

  const archiveDays =
    useMemo(
      () =>
        history.filter(
          (day) =>
            day.date !==
            todayDate,
        ),
      [
        history,
        todayDate,
      ],
    );

  function clearPreview() {
    if (
      previewUrl?.startsWith(
        'blob:',
      )
    ) {
      URL.revokeObjectURL(
        previewUrl,
      );
    }

    setPreviewUrl(
      null,
    );

    setImageFile(
      null,
    );
  }

  function openEditor() {
    clearPreview();

    setCaption(
      today?.mine?.caption ??
      '',
    );

    setPreviewUrl(
      today?.mine?.thumbnailUrl ??
      null,
    );

    setError(
      null,
    );

    setShowEditor(
      true,
    );
  }

  function closeEditor() {
    if (isSaving) {
      return;
    }

    clearPreview();

    setCaption(
      '',
    );

    setShowEditor(
      false,
    );

    setError(
      null,
    );
  }

  function selectImage(
    file: File,
  ) {
    if (
      !ALLOWED_IMAGE_TYPES.includes(
        file.type,
      )
    ) {
      setError(
        'Поддерживаются только JPG, PNG и WEBP',
      );

      return;
    }

    if (
      file.size >
      MAX_IMAGE_SIZE
    ) {
      setError(
        'Фотография должна быть не больше 10 МБ',
      );

      return;
    }

    if (
      previewUrl?.startsWith(
        'blob:',
      )
    ) {
      URL.revokeObjectURL(
        previewUrl,
      );
    }

    const objectUrl =
      URL.createObjectURL(
        file,
      );

    setImageFile(
      file,
    );

    setPreviewUrl(
      objectUrl,
    );

    setError(
      null,
    );
  }

  async function saveTodayEntry() {
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
      !today?.mine &&
      !imageFile
    ) {
      setError(
        'Сначала выберите фотографию',
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

      const formData =
        new FormData();

      formData.append(
        'date',
        todayDate,
      );

      formData.append(
        'caption',
        caption.trim(),
      );

      if (imageFile) {
        formData.append(
          'file',
          imageFile,
        );
      }

      await apiRequest(
        '/day-board/today',
        {
          method:
            'POST',

          headers: {
            Authorization:
              `Bearer ${token}`,
          },

          body:
            formData,
        },
      );

      setShowEditor(
        false,
      );

      clearPreview();

      setCaption(
        '',
      );

      await loadData(
        true,
      );
    } catch (
      error
    ) {
      setError(
        getErrorMessage(
          error,
          'Не удалось сохранить фотографию',
        ),
      );
    } finally {
      setIsSaving(
        false,
      );
    }
  }

  async function deleteTodayEntry() {
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
        `/day-board/today?date=${encodeURIComponent(
          todayDate,
        )}`,
        {
          method:
            'DELETE',

          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        },
      );

      setShowDeleteDialog(
        false,
      );

      await loadData(
        true,
      );
    } catch (
      error
    ) {
      setError(
        getErrorMessage(
          error,
          'Не удалось удалить фотографию',
        ),
      );
    } finally {
      setIsDeleting(
        false,
      );
    }
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fffaf8]">

        <div className="text-center">

          <Heart
            size={38}
            fill="currentColor"
            className="mx-auto animate-pulse text-[#da8791]"
          />

          <p className="mt-4 text-sm text-[#9a8580]">
            Собираем ваши моменты...
          </p>

        </div>

      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fffaf8] px-4 py-6 md:px-8 md:py-8">

      <div className="mx-auto max-w-[1450px]">

        {/* Верхняя панель */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">

          <button
            type="button"
            onClick={() =>
              router.push(
                '/home',
              )
            }
            className="flex items-center gap-2 rounded-xl border border-transparent px-3 py-2 text-sm font-medium text-[#876f6a] transition hover:border-[#efd8d4] hover:bg-[#fff0ed] hover:text-[#c36f77]"
          >
            <ArrowLeft
              size={18}
            />

            На главную
          </button>

          <button
            type="button"
            disabled={
              isRefreshing
            }
            onClick={() =>
              void loadData(
                true,
              )
            }
            className="flex items-center gap-2 rounded-xl border border-[#eadbd7] bg-white px-4 py-2.5 text-sm font-medium text-[#806a65] transition hover:border-[#dcaaa6] hover:bg-[#fff0ef] hover:text-[#c36f77] disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={
                isRefreshing
                  ? 'animate-spin'
                  : ''
              }
            />

            Обновить
          </button>

        </div>

        {/* Заголовок */}
        <header className="relative mb-7 overflow-hidden rounded-[30px] border border-[#eedfdb] bg-gradient-to-r from-[#fff0ec] via-[#fff5ef] to-[#f1ebf8] p-7 shadow-[0_16px_60px_rgba(91,65,59,0.05)] md:p-9">

          <Sparkles
            size={20}
            className="absolute right-10 top-8 text-[#dfb774]"
          />

          <p className="text-sm font-medium text-[#c8757c]">
            ♡ Ваш день
          </p>

          <h1 className="mt-2 text-3xl font-semibold text-[#554442] md:text-4xl">
            Доска дня
          </h1>

          <p className="mt-3 max-w-2xl leading-7 text-[#907c76]">
            Одно фото от каждого из вас.
            Маленький ежедневный снимок жизни,
            который со временем превращается
            в общую историю.
          </p>

          <div className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-white/70 bg-white/60 px-4 py-2 text-sm text-[#806b66] shadow-sm">
            <CalendarDays
              size={16}
            />

            {formatBoardDate(
              todayDate,
            )}
          </div>

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

        {today ? (
          <>

            {/* Сегодня */}
            <section>

              <div className="mb-4 flex items-end justify-between gap-4">

                <div>

                  <p className="text-sm font-medium text-[#c8757c]">
                    Сегодня
                  </p>

                  <h2 className="mt-1 text-2xl font-semibold text-[#554442]">
                    Ваши два момента
                  </h2>

                </div>

                <span className="hidden text-sm text-[#a28d87] sm:block">
                  По одному фото на человека
                </span>

              </div>

              <div className="grid gap-6 lg:grid-cols-2">

                <TodayPhotoCard
                  user={
                    today.me
                  }
                  entry={
                    today.mine
                  }
                  editable
                  onEdit={
                    openEditor
                  }
                  onDelete={() =>
                    setShowDeleteDialog(
                      true,
                    )
                  }
                />

                <TodayPhotoCard
                  user={
                    today.partnerUser
                  }
                  entry={
                    today.partner
                  }
                  editable={
                    false
                  }
                />

              </div>

            </section>

            {/* Архив */}
            <section className="mt-10">

              <div>

                <p className="text-sm font-medium text-[#8e7ca0]">
                  Архив
                </p>

                <h2 className="mt-1 text-2xl font-semibold text-[#554442]">
                  Предыдущие дни
                </h2>

                <p className="mt-2 text-sm text-[#9b8781]">
                  Здесь постепенно соберётся
                  ваша общая визуальная история.
                </p>

              </div>

              {archiveDays.length >
              0 ? (
                <div className="mt-6 space-y-8">

                  {archiveDays.map(
                    (
                      day,
                    ) => (
                      <ArchiveDay
                        key={
                          day.date
                        }
                        day={
                          day
                        }
                        me={
                          today.me
                        }
                        partner={
                          today.partnerUser
                        }
                      />
                    ),
                  )}

                </div>
              ) : (
                <div className="mt-6 flex min-h-[220px] items-center justify-center rounded-[28px] border border-dashed border-[#e8dad7] bg-white/60 px-6 text-center">

                  <div>

                    <Images
                      size={32}
                      className="mx-auto text-[#b8a4b5]"
                    />

                    <p className="mt-4 font-medium text-[#725e5a]">
                      Архив пока пуст
                    </p>

                    <p className="mt-2 text-sm leading-6 text-[#a18d87]">
                      После первого завершённого дня
                      фотографии появятся здесь.
                    </p>

                  </div>

                </div>
              )}

            </section>

          </>
        ) : (
          <div className="rounded-[28px] border border-[#eedfdb] bg-white p-8 text-center text-[#876f69]">
            Доска дня пока недоступна.
          </div>
        )}

      </div>

      {showEditor &&
        today && (
        <DayBoardEditorDialog
          existing={
            today.mine
          }
          caption={
            caption
          }
          previewUrl={
            previewUrl
          }
          isSaving={
            isSaving
          }
          onCaptionChange={
            setCaption
          }
          onSelectImage={
            selectImage
          }
          onClose={
            closeEditor
          }
          onSave={() =>
            void saveTodayEntry()
          }
        />
      )}

      {showDeleteDialog &&
        today?.mine && (
        <DeletePhotoDialog
          isDeleting={
            isDeleting
          }
          onCancel={() =>
            setShowDeleteDialog(
              false,
            )
          }
          onConfirm={() =>
            void deleteTodayEntry()
          }
        />
      )}

    </main>
  );
}

function TodayPhotoCard({
  user,
  entry,
  editable,
  onEdit,
  onDelete,
}: {
  user: DayBoardUser;
  entry: DayBoardEntry | null;
  editable: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const name =
    user.displayName ??
    user.nickname;

  return (
    <article className="overflow-hidden rounded-[30px] border border-[#eedfdb] bg-white shadow-[0_16px_55px_rgba(91,65,59,0.05)]">

      <div className="flex items-center justify-between gap-4 border-b border-[#f1e5e1] px-5 py-4 md:px-6">

        <div className="flex min-w-0 items-center gap-3">

          <UserAvatar
            user={
              user
            }
          />

          <div className="min-w-0">

            <p className="truncate font-semibold text-[#5d4945]">
              {name}
            </p>

            <p className="truncate text-xs text-[#a18b86]">
              @{user.nickname}
            </p>

          </div>

        </div>

        {editable &&
          entry && (
          <div className="flex items-center gap-2">

            <button
              type="button"
              title="Изменить"
              onClick={
                onEdit
              }
              className="flex h-9 w-9 items-center justify-center rounded-xl text-[#927b91] transition hover:bg-[#f5eef7] hover:text-[#78628a]"
            >
              <Pencil
                size={16}
              />
            </button>

            <button
              type="button"
              title="Удалить"
              onClick={
                onDelete
              }
              className="flex h-9 w-9 items-center justify-center rounded-xl text-[#bd7379] transition hover:bg-[#fff0f0] hover:text-[#a95259]"
            >
              <Trash2
                size={16}
              />
            </button>

          </div>
        )}

      </div>

      {entry ? (
        <>

          <div
            role="img"
            aria-label={
              `Фото дня ${name}`
            }
            className="aspect-[4/3] w-full bg-[#f3ece8] bg-cover bg-center"
            style={{
              backgroundImage:
                `url("${entry.imageUrl}")`,
            }}
          />

          <div className="p-5 md:p-6">

            {entry.caption ? (
              <p className="text-[15px] leading-7 text-[#6f5b57]">
                {entry.caption}
              </p>
            ) : (
              <p className="text-sm italic text-[#aa9690]">
                Без подписи
              </p>
            )}

            <p className="mt-4 text-xs text-[#ad9993]">
              Добавлено в{' '}
              {formatTime(
                entry.createdAt,
              )}
            </p>

          </div>

        </>
      ) : (
        <div className="flex min-h-[420px] items-center justify-center bg-gradient-to-br from-[#fffaf8] to-[#f7f0f6] p-7 text-center">

          <div>

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-white text-[#a48cac] shadow-sm">

              <Camera
                size={28}
              />

            </div>

            <p className="mt-5 font-semibold text-[#6b5753]">
              Фото сегодня ещё нет
            </p>

            <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-[#a18d87]">
              {editable
                ? 'Добавь один момент сегодняшнего дня.'
                : 'Когда партнёр добавит фото, оно появится здесь.'}
            </p>

            {editable &&
              onEdit && (
              <button
                type="button"
                onClick={
                  onEdit
                }
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#df8e94] px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-[#d37b83]"
              >
                <ImagePlus
                  size={18}
                />

                Добавить фото
              </button>
            )}

          </div>

        </div>
      )}

      {editable &&
        entry &&
        onEdit && (
        <div className="border-t border-[#f1e5e1] px-5 py-4">

          <button
            type="button"
            onClick={
              onEdit
            }
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#eadbd7] px-4 py-3 text-sm font-medium text-[#806a65] transition hover:border-[#dca6a3] hover:bg-[#fff0ef] hover:text-[#be6870]"
          >
            <Camera
              size={17}
            />

            Заменить фото или подпись
          </button>

        </div>
      )}

    </article>
  );
}

function ArchiveDay({
  day,
  me,
  partner,
}: {
  day: DayBoardHistoryDay;
  me: DayBoardUser;
  partner: DayBoardUser;
}) {
  return (
    <div>

      <div className="mb-3 flex items-center gap-3">

        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f5eef7] text-[#8e789f]">
          <CalendarDays
            size={17}
          />
        </div>

        <h3 className="font-semibold capitalize text-[#695550]">
          {formatBoardDate(
            day.date,
          )}
        </h3>

      </div>

      <div className="grid gap-4 md:grid-cols-2">

        <ArchivePhoto
          user={
            me
          }
          entry={
            day.mine
          }
        />

        <ArchivePhoto
          user={
            partner
          }
          entry={
            day.partner
          }
        />

      </div>

    </div>
  );
}

function ArchivePhoto({
  user,
  entry,
}: {
  user: DayBoardUser;
  entry: DayBoardEntry | null;
}) {
  const name =
    user.displayName ??
    user.nickname;

  if (!entry) {
    return (
      <div className="flex min-h-[180px] items-center justify-center rounded-[24px] border border-dashed border-[#eadfdc] bg-white/55 p-5 text-center">

        <div>

          <Heart
            size={20}
            className="mx-auto text-[#c5b3b5]"
          />

          <p className="mt-2 text-xs text-[#9f8b86]">
            {name} ничего не добавил(а)
          </p>

        </div>

      </div>
    );
  }

  return (
    <article className="grid overflow-hidden rounded-[24px] border border-[#eee0dc] bg-white sm:grid-cols-[180px_minmax(0,1fr)]">

      <div
        role="img"
        aria-label={
          `Фото ${name}`
        }
        className="min-h-[180px] bg-[#f2e9e5] bg-cover bg-center"
        style={{
          backgroundImage:
            `url("${entry.thumbnailUrl}")`,
        }}
      />

      <div className="flex flex-col justify-between p-5">

        <div>

          <p className="text-xs font-medium text-[#b26d74]">
            {name}
          </p>

          <p className="mt-3 text-sm leading-6 text-[#705c58]">
            {entry.caption ??
              'Без подписи'}
          </p>

        </div>

        <p className="mt-5 text-[11px] text-[#aa9690]">
          {formatTime(
            entry.createdAt,
          )}
        </p>

      </div>

    </article>
  );
}

function DayBoardEditorDialog({
  existing,
  caption,
  previewUrl,
  isSaving,
  onCaptionChange,
  onSelectImage,
  onClose,
  onSave,
}: {
  existing: DayBoardEntry | null;
  caption: string;
  previewUrl: string | null;
  isSaving: boolean;
  onCaptionChange: (
    value: string,
  ) => void;
  onSelectImage: (
    file: File,
  ) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const inputRef =
    useRef<HTMLInputElement | null>(
      null,
    );

  const [
    isDragging,
    setIsDragging,
  ] =
    useState(false);

  function handlePaste(
    event:
      ClipboardEvent<HTMLDivElement>,
  ) {
    const item =
      Array.from(
        event.clipboardData.items,
      ).find(
        (
          clipboardItem,
        ) =>
          clipboardItem.type.startsWith(
            'image/',
          ),
      );

    const file =
      item?.getAsFile();

    if (!file) {
      return;
    }

    event.preventDefault();

    onSelectImage(
      file,
    );
  }

  function handleDrop(
    event:
      DragEvent<HTMLDivElement>,
  ) {
    event.preventDefault();

    setIsDragging(
      false,
    );

    const file =
      Array.from(
        event.dataTransfer.files,
      ).find(
        (
          droppedFile,
        ) =>
          droppedFile.type.startsWith(
            'image/',
          ),
      );

    if (file) {
      onSelectImage(
        file,
      );
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#4d403e]/35 p-4 backdrop-blur-sm">

      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[30px] border border-[#eadbd7] bg-white p-6 shadow-[0_30px_100px_rgba(73,48,45,0.22)] md:p-7">

        <div className="flex items-start justify-between gap-4">

          <div>

            <p className="text-sm font-medium text-[#c8757c]">
              Сегодняшний момент
            </p>

            <h2 className="mt-1 text-2xl font-semibold text-[#554442]">
              {existing
                ? 'Изменить фото дня'
                : 'Добавить фото дня'}
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
            className="flex h-10 w-10 items-center justify-center rounded-xl text-[#957f79] transition hover:bg-[#fff0ef] hover:text-[#c36f77]"
          >
            <X
              size={20}
            />
          </button>

        </div>

        <div
          tabIndex={0}
          onPaste={
            handlePaste
          }
          onDragOver={(
            event,
          ) => {
            event.preventDefault();

            setIsDragging(
              true,
            );
          }}
          onDragLeave={() =>
            setIsDragging(
              false,
            )
          }
          onDrop={
            handleDrop
          }
          className="mt-6 outline-none"
        >

          {previewUrl ? (
            <button
              type="button"
              disabled={
                isSaving
              }
              onClick={() =>
                inputRef.current?.click()
              }
              className="group relative block aspect-[4/3] w-full overflow-hidden rounded-[24px] border border-[#e8dad7] bg-[#f3ebe8]"
            >

              <div
                role="img"
                aria-label="Предпросмотр"
                className="absolute inset-0 bg-contain bg-center bg-no-repeat"
                style={{
                  backgroundImage:
                    `url("${previewUrl}")`,
                }}
              />

              <div className="absolute inset-0 flex items-center justify-center bg-[#403432]/0 transition group-hover:bg-[#403432]/30">

                <span className="translate-y-2 rounded-2xl bg-white/95 px-4 py-2 text-sm font-medium text-[#705b57] opacity-0 shadow-sm transition group-hover:translate-y-0 group-hover:opacity-100">
                  Выбрать другое фото
                </span>

              </div>

            </button>
          ) : (
            <button
              type="button"
              disabled={
                isSaving
              }
              onClick={() =>
                inputRef.current?.click()
              }
              className={[
                'flex min-h-[300px] w-full items-center justify-center rounded-[24px] border-2 border-dashed p-7 text-center transition',

                isDragging
                  ? 'border-[#b395b8] bg-[#f5eef8]'
                  : 'border-[#e3d5d8] bg-[#fffaf9] hover:border-[#d3b5ba] hover:bg-[#fff5f4]',
              ].join(
                ' ',
              )}
            >

              <div>

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-white text-[#a48cac] shadow-sm">
                  <ImagePlus
                    size={29}
                  />
                </div>

                <p className="mt-5 font-semibold text-[#695651]">
                  Выберите фотографию
                </p>

                <p className="mt-2 text-sm leading-6 text-[#9f8c86]">
                  Можно нажать сюда,
                  перетащить файл
                  или вставить изображение через Ctrl + V
                </p>

                <div className="mt-4 inline-flex items-center gap-2 text-xs text-[#9b869d]">
                  <Upload
                    size={14}
                  />
                  JPG, PNG или WEBP · до 10 МБ
                </div>

              </div>

            </button>
          )}

          <input
            ref={
              inputRef
            }
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={(
              event,
            ) => {
              const file =
                event.target.files?.[0];

              if (file) {
                onSelectImage(
                  file,
                );
              }

              event.target.value =
                '';
            }}
          />

        </div>

        <div className="mt-6">

          <div className="mb-2 flex items-center justify-between gap-4">

            <label
              htmlFor="dayBoardCaption"
              className="text-sm font-medium text-[#665451]"
            >
              Подпись
            </label>

            <span className="text-xs text-[#ad9993]">
              {caption.length}/280
            </span>

          </div>

          <textarea
            id="dayBoardCaption"
            rows={4}
            maxLength={280}
            value={
              caption
            }
            onChange={(
              event,
            ) =>
              onCaptionChange(
                event.target.value,
              )
            }
            placeholder="Что хочется запомнить об этом моменте?"
            className="w-full resize-none rounded-2xl border border-[#eadbd7] bg-[#fffdfc] px-4 py-3.5 text-[#554442] outline-none transition focus:border-[#df9ca1] focus:ring-4 focus:ring-[#f7e3e5]"
          />

        </div>

        <button
          type="button"
          disabled={
            isSaving
          }
          onClick={
            onSave
          }
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#df8e94] px-6 py-3.5 font-medium text-white shadow-sm transition hover:bg-[#d37b83] disabled:opacity-50"
        >
          <Camera
            size={18}
          />

          {isSaving
            ? 'Сохраняем...'
            : existing
              ? 'Сохранить изменения'
              : 'Добавить на доску'}
        </button>

      </div>

    </div>
  );
}

function DeletePhotoDialog({
  isDeleting,
  onCancel,
  onConfirm,
}: {
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
          Удалить сегодняшнее фото?
        </h2>

        <p className="mt-3 text-sm leading-6 text-[#917975]">
          Оно исчезнет и с вашей доски,
          и из будущего архива этого дня.
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
            className="flex-1 rounded-2xl border border-[#e6d8d5] px-5 py-3 font-medium text-[#79635f] transition hover:bg-[#fff1ef]"
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
            className="flex-1 rounded-2xl bg-[#c86167] px-5 py-3 font-medium text-white transition hover:bg-[#b85359] disabled:opacity-50"
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

function UserAvatar({
  user,
}: {
  user: DayBoardUser;
}) {
  const name =
    user.displayName ??
    user.nickname;

  if (user.avatarUrl) {
    return (
      <div
        role="img"
        aria-label={
          `Аватар ${name}`
        }
        className="h-11 w-11 shrink-0 rounded-full bg-[#f3e7e5] bg-cover bg-center"
        style={{
          backgroundImage:
            `url("${user.avatarUrl}")`,
        }}
      />
    );
  }

  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f1dfe1] font-semibold text-[#b26870]">
      {name
        .charAt(0)
        .toUpperCase()}
    </div>
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

function formatBoardDate(
  value: string,
) {
  const [
    year,
    month,
    day,
  ] =
    value
      .split(
        '-',
      )
      .map(
        Number,
      );

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
      year,
      month - 1,
      day,
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

function getErrorMessage(
  error: unknown,
  fallback: string,
) {
  return error instanceof Error
    ? error.message
    : fallback;
}
