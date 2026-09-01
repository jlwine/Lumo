'use client';

import {
  type ClipboardEvent,
  type DragEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  ArrowLeft,
  Clipboard,
  ExternalLink,
  Gift,
  Heart,
  ImagePlus,
  Link as LinkIcon,
  Pencil,
  Plus,
  ShoppingBag,
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
  Wishlist,
  WishlistImageUploadResponse,
  WishlistItem,
  WishlistsResponse,
} from '@/types/wishlist';

type ActiveTab =
  | 'mine'
  | 'partner';

type WishlistForm = {
  title: string;
  description: string;
};

type WishlistItemForm = {
  title: string;
  description: string;
  url: string;
  imageUrl: string;
  price: string;
};

const emptyWishlistForm: WishlistForm = {
  title: '',
  description: '',
};

const emptyItemForm: WishlistItemForm = {
  title: '',
  description: '',
  url: '',
  imageUrl: '',
  price: '',
};

const wishlistInputClass =
  'w-full rounded-2xl border border-[#e5dce5] bg-[#fffdfc] px-4 py-3.5 text-[#554442] outline-none transition focus:border-[#bba8c7] focus:ring-4 focus:ring-[#f0e9f4]';

const maxImageSize =
  5 * 1024 * 1024;

const allowedImageTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

export default function WishlistsPage() {
  const router =
    useRouter();

  const [
    data,
    setData,
  ] =
    useState<WishlistsResponse>({
      mine: [],
      partner: [],
    });

  const [
    activeTab,
    setActiveTab,
  ] =
    useState<ActiveTab>(
      'mine',
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
    selectedWishlist,
    setSelectedWishlist,
  ] =
    useState<Wishlist | null>(
      null,
    );

  const [
    wishlistForm,
    setWishlistForm,
  ] =
    useState<WishlistForm>(
      emptyWishlistForm,
    );

  const [
    showWishlistForm,
    setShowWishlistForm,
  ] =
    useState(false);

  const [
    editingWishlist,
    setEditingWishlist,
  ] =
    useState<Wishlist | null>(
      null,
    );

  const [
    deletingWishlist,
    setDeletingWishlist,
  ] =
    useState<Wishlist | null>(
      null,
    );

  const [
    itemForm,
    setItemForm,
  ] =
    useState<WishlistItemForm>(
      emptyItemForm,
    );

  const [
    showItemForm,
    setShowItemForm,
  ] =
    useState(false);

  const [
    editingItem,
    setEditingItem,
  ] =
    useState<WishlistItem | null>(
      null,
    );

  const [
    deletingItem,
    setDeletingItem,
  ] =
    useState<WishlistItem | null>(
      null,
    );

  const [
    imageFile,
    setImageFile,
  ] =
    useState<File | null>(
      null,
    );

  const [
    localImagePreviewUrl,
    setLocalImagePreviewUrl,
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

  const fetchWishlists =
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

        return apiRequest<
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
      },
      [router],
    );

  useEffect(() => {
    let cancelled =
      false;

    async function loadWishlists() {
      try {
        const result =
          await fetchWishlists();

        if (
          cancelled ||
          !result
        ) {
          return;
        }

        setData(
          result,
        );

        setSelectedWishlist(
          result.mine[0] ??
          null,
        );

        setError(
          null,
        );
      } catch (error) {
        if (cancelled) {
          return;
        }

        setError(
          getErrorMessage(
            error,
            'Не удалось загрузить вишлисты',
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

    void loadWishlists();

    return () => {
      cancelled = true;
    };
  }, [fetchWishlists]);

  useEffect(() => {
    return () => {
      if (
        localImagePreviewUrl
      ) {
        URL.revokeObjectURL(
          localImagePreviewUrl,
        );
      }
    };
  }, [
    localImagePreviewUrl,
  ]);

  async function refreshWishlists(
    wishlistId?: string,
  ) {
    const result =
      await fetchWishlists();

    if (!result) {
      return;
    }

    setData(
      result,
    );

    if (wishlistId) {
      const allWishlists = [
        ...result.mine,
        ...result.partner,
      ];

      const updatedWishlist =
        allWishlists.find(
          (wishlist) =>
            wishlist.id ===
            wishlistId,
        ) ??
        null;

      setSelectedWishlist(
        updatedWishlist,
      );

      return;
    }

    const visible =
      activeTab ===
      'mine'
        ? result.mine
        : result.partner;

    setSelectedWishlist(
      visible[0] ??
      null,
    );
  }

  const visibleWishlists =
    useMemo(
      () =>
        activeTab ===
        'mine'
          ? data.mine
          : data.partner,
      [
        activeTab,
        data,
      ],
    );

  const partnerName =
    data.partner[0]
      ? data.partner[0].owner
          .displayName ??
        data.partner[0].owner
          .nickname
      : 'партнёра';

  function openCreateWishlist() {
    setEditingWishlist(
      null,
    );

    setWishlistForm(
      emptyWishlistForm,
    );

    setError(
      null,
    );

    setShowWishlistForm(
      true,
    );
  }

  function closeWishlistForm() {
    setShowWishlistForm(
      false,
    );

    setEditingWishlist(
      null,
    );

    setWishlistForm(
      emptyWishlistForm,
    );

    setError(
      null,
    );
  }

  function openEditWishlist(
    wishlist: Wishlist,
  ) {
    setEditingWishlist(
      wishlist,
    );

    setWishlistForm({
      title:
        wishlist.title,

      description:
        wishlist.description ??
        '',
    });

    setError(
      null,
    );

    setShowWishlistForm(
      true,
    );
  }

  async function saveWishlist() {
    const token =
      getAccessToken();

    if (!token) {
      removeAccessToken();

      router.replace(
        '/login',
      );

      return;
    }

    const title =
      wishlistForm.title.trim();

    if (!title) {
      setError(
        'Укажите название вишлиста',
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

      if (editingWishlist) {
        await apiRequest(
          `/wishlists/${editingWishlist.id}`,
          {
            method:
              'PATCH',

            headers: {
              Authorization:
                `Bearer ${token}`,
            },

            body:
              JSON.stringify({
                title,

                description:
                  wishlistForm.description.trim(),
              }),
          },
        );

        await refreshWishlists(
          editingWishlist.id,
        );
      } else {
        const createdWishlist =
          await apiRequest<Wishlist>(
            '/wishlists',
            {
              method:
                'POST',

              headers: {
                Authorization:
                  `Bearer ${token}`,
              },

              body:
                JSON.stringify({
                  title,

                  description:
                    wishlistForm.description.trim(),
                }),
            },
          );

        await refreshWishlists(
          createdWishlist.id,
        );
      }

      closeWishlistForm();
    } catch (error) {
      setError(
        getErrorMessage(
          error,
          'Не удалось сохранить вишлист',
        ),
      );
    } finally {
      setIsSaving(
        false,
      );
    }
  }

  async function deleteWishlist() {
    if (!deletingWishlist) {
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
        `/wishlists/${deletingWishlist.id}`,
        {
          method:
            'DELETE',

          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        },
      );

      setDeletingWishlist(
        null,
      );

      await refreshWishlists();
    } catch (error) {
      setError(
        getErrorMessage(
          error,
          'Не удалось удалить вишлист',
        ),
      );
    } finally {
      setIsDeleting(
        false,
      );
    }
  }

  function clearLocalImagePreview() {
    if (
      localImagePreviewUrl
    ) {
      URL.revokeObjectURL(
        localImagePreviewUrl,
      );
    }

    setLocalImagePreviewUrl(
      null,
    );

    setImageFile(
      null,
    );
  }

  function closeItemForm() {
    clearLocalImagePreview();

    setShowItemForm(
      false,
    );

    setEditingItem(
      null,
    );

    setItemForm(
      emptyItemForm,
    );

    setError(
      null,
    );
  }

  function openCreateItem() {
    if (!selectedWishlist) {
      return;
    }

    clearLocalImagePreview();

    setEditingItem(
      null,
    );

    setItemForm(
      emptyItemForm,
    );

    setError(
      null,
    );

    setShowItemForm(
      true,
    );
  }

  function openEditItem(
    item: WishlistItem,
  ) {
    clearLocalImagePreview();

    setEditingItem(
      item,
    );

    setItemForm({
      title:
        item.title,

      description:
        item.description ??
        '',

      url:
        item.url ??
        '',

      imageUrl:
        item.imageUrl ??
        '',

      price:
        item.price !==
        null
          ? String(
              item.price,
            )
          : '',
    });

    setError(
      null,
    );

    setShowItemForm(
      true,
    );
  }

  function selectImageFile(
    file: File,
  ) {
    if (
      !allowedImageTypes.includes(
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
      maxImageSize
    ) {
      setError(
        'Изображение должно быть не больше 5 МБ',
      );

      return;
    }

    if (
      localImagePreviewUrl
    ) {
      URL.revokeObjectURL(
        localImagePreviewUrl,
      );
    }

    const previewUrl =
      URL.createObjectURL(
        file,
      );

    setImageFile(
      file,
    );

    setLocalImagePreviewUrl(
      previewUrl,
    );

    setError(
      null,
    );
  }

  function removeItemImage() {
    clearLocalImagePreview();

    setItemForm(
      (
        current,
      ) => ({
        ...current,
        imageUrl: '',
      }),
    );

    setError(
      null,
    );
  }

  async function uploadItemImage(
    token: string,
  ) {
    if (!imageFile) {
      return itemForm.imageUrl.trim();
    }

    const formData =
      new FormData();

    formData.append(
      'file',
      imageFile,
    );

    const result =
      await apiRequest<
        WishlistImageUploadResponse
      >(
        '/wishlists/items/image',
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

    return result.imageUrl;
  }

  async function saveItem() {
    if (!selectedWishlist) {
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

    const title =
      itemForm.title.trim();

    if (!title) {
      setError(
        'Укажите название желания',
      );

      return;
    }

    const price =
      itemForm.price.trim()
        ? Number(
            itemForm.price,
          )
        : undefined;

    if (
      price !== undefined &&
      (
        !Number.isInteger(
          price,
        ) ||
        price < 0
      )
    ) {
      setError(
        'Цена должна быть целым положительным числом',
      );

      return;
    }

    if (
      price !== undefined &&
      price >
        100_000_000
    ) {
      setError(
        'Цена слишком большая',
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

      const imageUrl =
        await uploadItemImage(
          token,
        );

      const requestBody = {
        title,

        description:
          itemForm.description.trim(),

        url:
          itemForm.url.trim() ||
          undefined,

        imageUrl:
          editingItem
            ? imageUrl
            : imageUrl ||
              undefined,

        price,
      };

      if (editingItem) {
        await apiRequest(
          `/wishlists/${selectedWishlist.id}/items/${editingItem.id}`,
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
        await apiRequest(
          `/wishlists/${selectedWishlist.id}/items`,
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

      await refreshWishlists(
        selectedWishlist.id,
      );

      closeItemForm();
    } catch (error) {
      setError(
        getErrorMessage(
          error,
          'Не удалось сохранить желание',
        ),
      );
    } finally {
      setIsSaving(
        false,
      );
    }
  }

  async function deleteItem() {
    if (
      !selectedWishlist ||
      !deletingItem
    ) {
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
        `/wishlists/${selectedWishlist.id}/items/${deletingItem.id}`,
        {
          method:
            'DELETE',

          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        },
      );

      setDeletingItem(
        null,
      );

      await refreshWishlists(
        selectedWishlist.id,
      );
    } catch (error) {
      setError(
        getErrorMessage(
          error,
          'Не удалось удалить желание',
        ),
      );
    } finally {
      setIsDeleting(
        false,
      );
    }
  }

  function changeTab(
    tab: ActiveTab,
  ) {
    setActiveTab(
      tab,
    );

    const wishlists =
      tab ===
      'mine'
        ? data.mine
        : data.partner;

    setSelectedWishlist(
      wishlists[0] ??
      null,
    );
  }

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
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-[#876f6a] transition hover:bg-[#fff0ed] hover:text-[#c36f77]"
          >
            <ArrowLeft
              size={18}
            />

            На главную
          </button>

          {activeTab ===
            'mine' && (
            <button
              type="button"
              onClick={
                openCreateWishlist
              }
              className="flex items-center gap-2 rounded-2xl bg-[#9b87ad] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#8d779f]"
            >
              <Plus
                size={18}
              />

              Новый вишлист
            </button>
          )}

        </div>

        <header className="mb-7">

          <p className="text-sm font-medium text-[#927ba3]">
            ♡ Желания
          </p>

          <h1 className="mt-1 text-3xl font-semibold text-[#554442]">
            Вишлисты
          </h1>

          <p className="mt-3 max-w-2xl text-[#98837e]">
            Сохраняйте вещи,
            впечатления и идеи,
            которые хотелось бы
            однажды получить.
          </p>

        </header>

        {error &&
          !showItemForm &&
          !showWishlistForm && (
          <ErrorMessage
            message={
              error
            }
            onClose={() =>
              setError(
                null,
              )
            }
          />
        )}

        <div className="mb-6 inline-flex max-w-full overflow-x-auto rounded-2xl border border-[#e8dedf] bg-white p-1.5">

          <button
            type="button"
            onClick={() =>
              changeTab(
                'mine',
              )
            }
            className={[
              'whitespace-nowrap rounded-xl px-5 py-2.5 text-sm font-medium transition-all',

              activeTab ===
              'mine'
                ? 'bg-[#eee7f4] text-[#79668b] shadow-sm'
                : 'text-[#9c8983] hover:bg-[#fff7f5]',
            ].join(
              ' ',
            )}
          >
            Мои вишлисты

            <span className="ml-2 opacity-60">
              {data.mine.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() =>
              changeTab(
                'partner',
              )
            }
            className={[
              'whitespace-nowrap rounded-xl px-5 py-2.5 text-sm font-medium transition-all',

              activeTab ===
              'partner'
                ? 'bg-[#eee7f4] text-[#79668b] shadow-sm'
                : 'text-[#9c8983] hover:bg-[#fff7f5]',
            ].join(
              ' ',
            )}
          >
            Вишлисты {partnerName}

            <span className="ml-2 opacity-60">
              {data.partner.length}
            </span>
          </button>

        </div>

        {isLoading ? (
          <div className="flex min-h-[450px] items-center justify-center">

            <Gift
              size={36}
              className="animate-pulse text-[#9a87ab]"
            />

          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[330px_minmax(0,1fr)]">

            <aside className="self-start rounded-[28px] border border-[#eee0dc] bg-white p-5 xl:sticky xl:top-6">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-sm text-[#9a86aa]">
                    {activeTab ===
                    'mine'
                      ? 'Ваши списки'
                      : `Списки ${partnerName}`}
                  </p>

                  <h2 className="mt-1 text-xl font-semibold text-[#554442]">
                    {visibleWishlists.length}{' '}
                    {pluralizeWishlists(
                      visibleWishlists.length,
                    )}
                  </h2>

                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eee7f4] text-[#88769a]">
                  <Gift
                    size={21}
                  />
                </div>

              </div>

              <div className="mt-5 space-y-3">

                {visibleWishlists.map(
                  (
                    wishlist,
                  ) => (
                    <button
                      key={
                        wishlist.id
                      }
                      type="button"
                      onClick={() =>
                        setSelectedWishlist(
                          wishlist,
                        )
                      }
                      className={[
                        'w-full rounded-[20px] border p-4 text-left transition-all',

                        selectedWishlist?.id ===
                        wishlist.id
                          ? 'border-[#cfc0db] bg-[#f7f2fa] shadow-sm'
                          : 'border-[#eee2df] bg-[#fffaf9] hover:border-[#d9cddf] hover:bg-[#fdf8ff]',
                      ].join(
                        ' ',
                      )}
                    >

                      <p className="font-semibold text-[#5e4b48]">
                        {wishlist.title}
                      </p>

                      <p className="mt-1 text-xs text-[#a18d87]">
                        {wishlist.items.length}{' '}
                        {pluralizeItems(
                          wishlist.items.length,
                        )}
                      </p>

                    </button>
                  ),
                )}

                {visibleWishlists.length ===
                  0 && (
                  <div className="rounded-[20px] border border-dashed border-[#e4dbe7] bg-[#fdfafd] px-4 py-8 text-center">

                    <Gift
                      size={27}
                      className="mx-auto text-[#b7a6c2]"
                    />

                    <p className="mt-4 text-sm text-[#77677f]">
                      Пока здесь пусто
                    </p>

                  </div>
                )}

              </div>

            </aside>

            <section className="min-h-[520px] rounded-[30px] border border-[#eee0dc] bg-white p-5 md:p-7">

              {selectedWishlist ? (
                <>

                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#f1e6e3] pb-6">

                    <div>

                      <p className="text-sm font-medium text-[#927ba3]">
                        {activeTab ===
                        'mine'
                          ? 'Мой вишлист'
                          : `Вишлист ${partnerName}`}
                      </p>

                      <h2 className="mt-1 text-2xl font-semibold text-[#554442]">
                        {selectedWishlist.title}
                      </h2>

                      {selectedWishlist.description && (
                        <p className="mt-3 text-sm text-[#99847e]">
                          {selectedWishlist.description}
                        </p>
                      )}

                    </div>

                    {activeTab ===
                      'mine' && (
                      <div className="flex gap-2">

                        <button
                          type="button"
                          title="Редактировать вишлист"
                          onClick={() =>
                            openEditWishlist(
                              selectedWishlist,
                            )
                          }
                          className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#e8dcdf] text-[#8d7772] transition hover:bg-[#f8f3fb]"
                        >
                          <Pencil
                            size={17}
                          />
                        </button>

                        <button
                          type="button"
                          title="Удалить вишлист"
                          onClick={() =>
                            setDeletingWishlist(
                              selectedWishlist,
                            )
                          }
                          className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#efd4d4] text-[#b96569] transition hover:bg-[#fff0f0]"
                        >
                          <Trash2
                            size={17}
                          />
                        </button>

                      </div>
                    )}

                  </div>

                  {activeTab ===
                    'mine' && (
                    <button
                      type="button"
                      onClick={
                        openCreateItem
                      }
                      className="mt-6 flex items-center gap-2 rounded-2xl bg-[#9b87ad] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#8d779f]"
                    >
                      <Plus
                        size={18}
                      />

                      Добавить желание
                    </button>
                  )}

                  {selectedWishlist.items.length >
                  0 ? (
                    <div className="mt-6 grid gap-5 sm:grid-cols-2 2xl:grid-cols-3">

                      {selectedWishlist.items.map(
                        (
                          item,
                        ) => (
                          <WishlistItemCard
                            key={
                              item.id
                            }
                            item={
                              item
                            }
                            canEdit={
                              activeTab ===
                              'mine'
                            }
                            onEdit={() =>
                              openEditItem(
                                item,
                              )
                            }
                            onDelete={() =>
                              setDeletingItem(
                                item,
                              )
                            }
                          />
                        ),
                      )}

                    </div>
                  ) : (
                    <div className="mt-8 flex min-h-[330px] items-center justify-center rounded-[24px] border border-dashed border-[#e6dce9] bg-[#fdfafd] text-center">

                      <div>

                        <ShoppingBag
                          size={35}
                          className="mx-auto text-[#a58fb3]"
                        />

                        <p className="mt-4 font-semibold text-[#65536d]">
                          Здесь пока пусто
                        </p>

                      </div>

                    </div>
                  )}

                </>
              ) : (
                <div className="flex min-h-[500px] items-center justify-center text-center">

                  <div>

                    <Heart
                      size={38}
                      className="mx-auto text-[#ad9aba]"
                    />

                    <p className="mt-4 text-[#8d7b8c]">
                      Выберите вишлист
                    </p>

                  </div>

                </div>
              )}

            </section>

          </div>
        )}

      </div>

      {showWishlistForm && (
        <WishlistFormDialog
          form={
            wishlistForm
          }
          editing={
            Boolean(
              editingWishlist,
            )
          }
          isSaving={
            isSaving
          }
          error={
            error
          }
          onChange={
            setWishlistForm
          }
          onClearError={() =>
            setError(
              null,
            )
          }
          onClose={
            closeWishlistForm
          }
          onSave={() =>
            void saveWishlist()
          }
        />
      )}

      {showItemForm && (
        <ItemFormDialog
          form={
            itemForm
          }
          editing={
            Boolean(
              editingItem,
            )
          }
          isSaving={
            isSaving
          }
          error={
            error
          }
          imagePreviewUrl={
            localImagePreviewUrl ||
            itemForm.imageUrl ||
            null
          }
          onChange={
            setItemForm
          }
          onSelectImage={
            selectImageFile
          }
          onRemoveImage={
            removeItemImage
          }
          onClearError={() =>
            setError(
              null,
            )
          }
          onClose={
            closeItemForm
          }
          onSave={() =>
            void saveItem()
          }
        />
      )}

      {deletingWishlist && (
        <ConfirmDialog
          title="Удалить вишлист?"
          description={`«${deletingWishlist.title}» и все желания внутри него будут удалены.`}
          isLoading={
            isDeleting
          }
          onCancel={() =>
            setDeletingWishlist(
              null,
            )
          }
          onConfirm={() =>
            void deleteWishlist()
          }
        />
      )}

      {deletingItem && (
        <ConfirmDialog
          title="Удалить желание?"
          description={`«${deletingItem.title}» исчезнет из этого вишлиста.`}
          isLoading={
            isDeleting
          }
          onCancel={() =>
            setDeletingItem(
              null,
            )
          }
          onConfirm={() =>
            void deleteItem()
          }
        />
      )}

    </main>
  );
}

function ErrorMessage({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4 rounded-2xl border border-[#edc9ca] bg-[#fff4f3] px-4 py-3.5 text-sm leading-6 text-[#a35d61]">

      <span>
        {message}
      </span>

      <button
        type="button"
        onClick={
          onClose
        }
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[#b66b70] transition hover:bg-[#f8dfe0]"
      >
        <X
          size={15}
        />
      </button>

    </div>
  );
}

function ImageDropzone({
  previewUrl,
  disabled,
  onSelect,
  onRemove,
}: {
  previewUrl: string | null;
  disabled: boolean;
  onSelect: (
    file: File,
  ) => void;
  onRemove: () => void;
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
    const imageItem =
      Array.from(
        event.clipboardData.items,
      ).find(
        (item) =>
          item.type.startsWith(
            'image/',
          ),
      );

    const file =
      imageItem?.getAsFile();

    if (!file) {
      return;
    }

    event.preventDefault();

    onSelect(
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
        (item) =>
          item.type.startsWith(
            'image/',
          ),
      );

    if (file) {
      onSelect(
        file,
      );
    }
  }

  if (previewUrl) {
    return (
      <div className="overflow-hidden rounded-[24px] border border-[#dfd4e3] bg-[#fbf8fc]">

        <div className="relative">

          <div
            role="img"
            aria-label="Предпросмотр изображения желания"
            className="aspect-[16/10] w-full bg-white bg-contain bg-center bg-no-repeat"
            style={{
              backgroundImage:
                `url("${previewUrl}")`,
            }}
          />

          <button
            type="button"
            disabled={
              disabled
            }
            onClick={
              onRemove
            }
            title="Удалить изображение"
            className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full border border-[#f0dddd] bg-white/95 text-[#bd6268] shadow-md transition hover:bg-[#fff0f0] hover:text-[#a94d54] active:scale-[0.94]"
          >
            <Trash2
              size={17}
            />
          </button>

        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eee4ef] px-4 py-3">

          <p className="text-xs text-[#9d8998]">
            Изображение будет сохранено
            вместе с желанием
          </p>

          <button
            type="button"
            disabled={
              disabled
            }
            onClick={() =>
              inputRef.current?.click()
            }
            className="rounded-lg px-2 py-1 text-sm font-medium text-[#846e95] transition hover:bg-[#f0e8f4] hover:text-[#6d5880]"
          >
            Заменить
          </button>

        </div>

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
              event.target
                .files?.[0];

            if (file) {
              onSelect(
                file,
              );
            }

            event.target.value =
              '';
          }}
        />

      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onPaste={
        handlePaste
      }
      onDragEnter={(
        event,
      ) => {
        event.preventDefault();

        setIsDragging(
          true,
        );
      }}
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
      onClick={() =>
        inputRef.current?.click()
      }
      onKeyDown={(
        event,
      ) => {
        if (
          event.key ===
            'Enter' ||
          event.key ===
            ' '
        ) {
          event.preventDefault();

          inputRef.current?.click();
        }
      }}
      className={[
        'cursor-pointer rounded-[24px] border-2 border-dashed px-6 py-10 text-center outline-none transition-all',

        isDragging
          ? 'border-[#a991b8] bg-[#f4edf7]'
          : 'border-[#dfd4e3] bg-[#fdfafd] hover:border-[#bba7c7] hover:bg-[#faf5fc]',
      ].join(
        ' ',
      )}
    >

      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[20px] bg-[#eee6f3] text-[#8b759d]">

        <ImagePlus
          size={25}
        />

      </div>

      <p className="mt-4 font-semibold text-[#69566f]">
        Добавьте изображение
      </p>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#9c8b9e]">
        Вставьте картинку через{' '}
        <strong>
          Ctrl + V
        </strong>
        , перетащите её сюда
        или выберите файл.
      </p>

      <div className="mt-5 flex flex-wrap justify-center gap-2">

        <span className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs text-[#89758e] shadow-sm">

          <Clipboard
            size={14}
          />

          Ctrl + V
        </span>

        <span className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs text-[#89758e] shadow-sm">

          <Upload
            size={14}
          />

          Выбрать файл
        </span>

      </div>

      <p className="mt-4 text-xs text-[#b09faf]">
        JPG, PNG или WEBP · до 5 МБ
      </p>

      <input
        ref={
          inputRef
        }
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        disabled={
          disabled
        }
        onChange={(
          event,
        ) => {
          const file =
            event.target
              .files?.[0];

          if (file) {
            onSelect(
              file,
            );
          }

          event.target.value =
            '';
        }}
      />

    </div>
  );
}

function WishlistItemCard({
  item,
  canEdit,
  onEdit,
  onDelete,
}: {
  item: WishlistItem;
  canEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="overflow-hidden rounded-[24px] border border-[#eee1df] bg-[#fffdfc] transition hover:border-[#d9cbe0] hover:shadow-sm">

      {item.imageUrl ? (
        <div
          role="img"
          aria-label={
            item.title
          }
          className="aspect-[4/3] bg-white bg-contain bg-center bg-no-repeat"
          style={{
            backgroundImage:
              `url("${item.imageUrl}")`,
          }}
        />
      ) : (
        <div className="flex aspect-[4/3] items-center justify-center bg-[#f7f1f8]">

          <Gift
            size={40}
            className="text-[#b5a3c0]"
          />

        </div>
      )}

      <div className="p-5">

        <div className="flex justify-between gap-3">

          <div>

            <h3 className="font-semibold text-[#594744]">
              {item.title}
            </h3>

            {item.price !==
              null && (
              <p className="mt-2 text-lg font-semibold text-[#8d779f]">
                {formatPrice(
                  item.price,
                )}
              </p>
            )}

          </div>

          {canEdit && (
            <div className="flex gap-1">

              <button
                type="button"
                title="Редактировать"
                onClick={
                  onEdit
                }
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#927f98] transition hover:bg-[#f3edf6]"
              >
                <Pencil
                  size={15}
                />
              </button>

              <button
                type="button"
                title="Удалить"
                onClick={
                  onDelete
                }
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#b46065] transition hover:bg-[#fff0f0]"
              >
                <Trash2
                  size={15}
                />
              </button>

            </div>
          )}

        </div>

        {item.description && (
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#9a8580]">
            {item.description}
          </p>
        )}

        {item.url && (
          <button
            type="button"
            onClick={() =>
              window.open(
                item.url!,
                '_blank',
                'noopener,noreferrer',
              )
            }
            className="mt-4 flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-[#8b759c] transition hover:bg-[#f4eef7]"
          >
            <ExternalLink
              size={15}
            />

            Открыть товар
          </button>
        )}

      </div>

    </article>
  );
}

function WishlistFormDialog({
  form,
  editing,
  isSaving,
  error,
  onChange,
  onClearError,
  onClose,
  onSave,
}: {
  form: WishlistForm;
  editing: boolean;
  isSaving: boolean;
  error: string | null;
  onChange: (
    value: WishlistForm,
  ) => void;
  onClearError: () => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#4d403e]/30 p-5 backdrop-blur-sm">

      <div className="w-full max-w-lg rounded-[30px] border border-[#eadfe8] bg-white p-7 shadow-[0_30px_100px_rgba(73,48,45,0.22)]">

        <div className="flex items-start justify-between gap-4">

          <div>

            <p className="text-sm text-[#927ba3]">
              {editing
                ? 'Редактирование'
                : 'Новый список'}
            </p>

            <h2 className="mt-1 text-2xl font-semibold text-[#554442]">
              {editing
                ? 'Изменить вишлист'
                : 'Создать вишлист'}
            </h2>

          </div>

          <ModalCloseButton
            disabled={
              isSaving
            }
            onClick={
              onClose
            }
          />

        </div>

        {error && (
          <div className="mt-5">

            <ErrorMessage
              message={
                error
              }
              onClose={
                onClearError
              }
            />

          </div>
        )}

        <div className="mt-6 space-y-5">

          <FormField
            label="Название"
          >
            <input
              value={
                form.title
              }
              onChange={(
                event,
              ) =>
                onChange({
                  ...form,
                  title:
                    event.target.value,
                })
              }
              className={
                wishlistInputClass
              }
            />
          </FormField>

          <FormField
            label="Описание"
          >
            <textarea
              value={
                form.description
              }
              onChange={(
                event,
              ) =>
                onChange({
                  ...form,
                  description:
                    event.target.value,
                })
              }
              rows={4}
              className={`${wishlistInputClass} resize-none`}
            />
          </FormField>

        </div>

        <button
          type="button"
          disabled={
            isSaving
          }
          onClick={
            onSave
          }
          className="mt-7 w-full rounded-2xl bg-[#9b87ad] py-3.5 font-medium text-white transition hover:bg-[#8d779f] disabled:opacity-50"
        >
          {isSaving
            ? 'Сохраняем...'
            : 'Сохранить'}
        </button>

      </div>

    </div>
  );
}

function ItemFormDialog({
  form,
  editing,
  isSaving,
  error,
  imagePreviewUrl,
  onChange,
  onSelectImage,
  onRemoveImage,
  onClearError,
  onClose,
  onSave,
}: {
  form: WishlistItemForm;
  editing: boolean;
  isSaving: boolean;
  error: string | null;
  imagePreviewUrl: string | null;
  onChange: (
    value: WishlistItemForm,
  ) => void;
  onSelectImage: (
    file: File,
  ) => void;
  onRemoveImage: () => void;
  onClearError: () => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#4d403e]/30 p-4 backdrop-blur-sm">

      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[30px] border border-[#eadfe8] bg-white p-6 shadow-[0_30px_100px_rgba(73,48,45,0.22)] md:p-7">

        <div className="flex items-start justify-between gap-4">

          <div>

            <p className="text-sm text-[#927ba3]">
              {editing
                ? 'Редактирование'
                : 'Новое желание'}
            </p>

            <h2 className="mt-1 text-2xl font-semibold text-[#554442]">
              {editing
                ? 'Изменить желание'
                : 'Добавить желание'}
            </h2>

          </div>

          <ModalCloseButton
            disabled={
              isSaving
            }
            onClick={
              onClose
            }
          />

        </div>

        {/* Ошибка теперь находится прямо в модальном окне */}
        {error && (
          <div className="mt-5">

            <ErrorMessage
              message={
                error
              }
              onClose={
                onClearError
              }
            />

          </div>
        )}

        <div className="mt-7 space-y-5">

          <ImageDropzone
            previewUrl={
              imagePreviewUrl
            }
            disabled={
              isSaving
            }
            onSelect={
              onSelectImage
            }
            onRemove={
              onRemoveImage
            }
          />

          <FormField
            label="Название"
          >
            <input
              maxLength={120}
              value={
                form.title
              }
              onChange={(
                event,
              ) =>
                onChange({
                  ...form,
                  title:
                    event.target.value,
                })
              }
              className={
                wishlistInputClass
              }
              placeholder="Например, наушники"
            />
          </FormField>

          <FormField
            label="Цена"
          >
            <div className="relative">

              <input
                type="number"
                min="0"
                max="100000000"
                value={
                  form.price
                }
                onChange={(
                  event,
                ) =>
                  onChange({
                    ...form,
                    price:
                      event.target.value,
                  })
                }
                className={`${wishlistInputClass} pr-12`}
                placeholder="25000"
              />

              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[#a7929e]">
                ₽
              </span>

            </div>
          </FormField>

          <FormField
            label="Ссылка на товар"
            icon={
              <LinkIcon
                size={15}
              />
            }
          >
            <input
              type="url"
              maxLength={2000}
              value={
                form.url
              }
              onChange={(
                event,
              ) =>
                onChange({
                  ...form,
                  url:
                    event.target.value,
                })
              }
              className={
                wishlistInputClass
              }
              placeholder="https://..."
            />
          </FormField>

          <FormField
            label="Описание"
          >
            <textarea
              rows={5}
              maxLength={1000}
              value={
                form.description
              }
              onChange={(
                event,
              ) =>
                onChange({
                  ...form,
                  description:
                    event.target.value,
                })
              }
              className={`${wishlistInputClass} resize-none`}
              placeholder="Размер, цвет или любые детали..."
            />
          </FormField>

        </div>

        <button
          type="button"
          disabled={
            isSaving
          }
          onClick={
            onSave
          }
          className="mt-7 w-full rounded-2xl bg-[#9b87ad] py-3.5 font-medium text-white transition hover:bg-[#8d779f] active:scale-[0.99] disabled:opacity-50"
        >
          {isSaving
            ? 'Сохраняем...'
            : editing
              ? 'Сохранить изменения'
              : 'Добавить желание'}
        </button>

      </div>

    </div>
  );
}

function ModalCloseButton({
  disabled,
  onClick,
}: {
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title="Закрыть"
      aria-label="Закрыть"
      disabled={
        disabled
      }
      onClick={
        onClick
      }
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#eadfe5] bg-[#fffafc] text-[#8f7c86] shadow-sm transition-all hover:border-[#d9c4d0] hover:bg-[#f8eff4] hover:text-[#b05e70] active:scale-[0.92] disabled:opacity-40"
    >
      <X
        size={20}
        strokeWidth={2.2}
      />
    </button>
  );
}

function FormField({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>

      <div className="mb-2 flex items-center gap-1.5 text-sm font-medium text-[#665451]">

        {icon}

        {label}

      </div>

      {children}

    </div>
  );
}

function ConfirmDialog({
  title,
  description,
  isLoading,
  onCancel,
  onConfirm,
}: {
  title: string;
  description: string;
  isLoading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#4d403e]/35 p-5 backdrop-blur-sm">

      <div className="w-full max-w-md rounded-[28px] border border-[#eadfdd] bg-white p-7 shadow-[0_30px_100px_rgba(73,48,45,0.22)]">

        <Trash2
          className="text-[#c45e64]"
        />

        <h2 className="mt-5 text-xl font-semibold text-[#624b48]">
          {title}
        </h2>

        <p className="mt-3 text-sm leading-6 text-[#917975]">
          {description}
        </p>

        <div className="mt-6 flex gap-3">

          <button
            type="button"
            onClick={
              onCancel
            }
            className="flex-1 rounded-2xl border border-[#e7d9d5] py-3 text-[#765f5b] transition hover:bg-[#fff6f4]"
          >
            Отмена
          </button>

          <button
            type="button"
            disabled={
              isLoading
            }
            onClick={
              onConfirm
            }
            className="flex-1 rounded-2xl bg-[#c86167] py-3 text-white transition hover:bg-[#b85359] disabled:opacity-50"
          >
            {isLoading
              ? 'Удаляем...'
              : 'Удалить'}
          </button>

        </div>

      </div>

    </div>
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

function pluralizeWishlists(
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
    return 'вишлист';
  }

  if (
    mod10 >= 2 &&
    mod10 <= 4 &&
    (
      mod100 < 12 ||
      mod100 > 14
    )
  ) {
    return 'вишлиста';
  }

  return 'вишлистов';
}

function pluralizeItems(
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
    return 'желание';
  }

  if (
    mod10 >= 2 &&
    mod10 <= 4 &&
    (
      mod100 < 12 ||
      mod100 > 14
    )
  ) {
    return 'желания';
  }

  return 'желаний';
}

function getErrorMessage(
  error: unknown,
  fallback: string,
) {
  return error instanceof Error
    ? error.message
    : fallback;
}