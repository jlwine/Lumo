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
  priority: number;
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
  priority: 3,
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
      [
        router,
      ],
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
  }, [
    fetchWishlists,
  ]);

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

      priority:
        item.priority,
    });

    setError(
      null,
    );

    setShowItemForm(
      true,
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

        priority:
          itemForm.priority,
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

    const list =
      tab ===
      'mine'
        ? data.mine
        : data.partner;

    setSelectedWishlist(
      list[0] ??
      null,
    );
  }

  return (
    <main className="min-h-screen bg-[#fffaf8] px-4 py-6 md:px-8">

      <div className="mx-auto max-w-[1450px]">

        <div className="mb-6 flex items-center justify-between">

          <button
            type="button"
            onClick={() =>
              router.push(
                '/home',
              )
            }
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-[#876f6a] transition hover:bg-[#fff0ed]"
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
              className="flex items-center gap-2 rounded-2xl bg-[#9b87ad] px-5 py-3 text-sm font-medium text-white"
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

          <p className="mt-3 text-[#98837e]">
            Сохраняйте всё,
            что хотелось бы однажды получить.
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

        <div className="mb-6 inline-flex rounded-2xl border border-[#e8dedf] bg-white p-1.5">

          <button
            type="button"
            onClick={() =>
              changeTab(
                'mine',
              )
            }
            className={[
              'rounded-xl px-5 py-2.5 text-sm font-medium',

              activeTab ===
              'mine'
                ? 'bg-[#eee7f4] text-[#79668b]'
                : 'text-[#9c8983]',
            ].join(
              ' ',
            )}
          >
            Мои вишлисты
          </button>

          <button
            type="button"
            onClick={() =>
              changeTab(
                'partner',
              )
            }
            className={[
              'rounded-xl px-5 py-2.5 text-sm font-medium',

              activeTab ===
              'partner'
                ? 'bg-[#eee7f4] text-[#79668b]'
                : 'text-[#9c8983]',
            ].join(
              ' ',
            )}
          >
            Вишлисты {partnerName}
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

            <aside className="self-start rounded-[28px] border border-[#eee0dc] bg-white p-5">

              <p className="text-sm text-[#9a86aa]">
                {activeTab ===
                'mine'
                  ? 'Ваши списки'
                  : `Списки ${partnerName}`}
              </p>

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
                        'w-full rounded-[20px] border p-4 text-left',

                        selectedWishlist?.id ===
                        wishlist.id
                          ? 'border-[#cfc0db] bg-[#f7f2fa]'
                          : 'border-[#eee2df] bg-[#fffaf9]',
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

              </div>

            </aside>

            <section className="min-h-[520px] rounded-[30px] border border-[#eee0dc] bg-white p-7">

              {selectedWishlist ? (
                <>

                  <div className="flex items-start justify-between border-b border-[#f1e6e3] pb-6">

                    <div>

                      <p className="text-sm text-[#927ba3]">
                        {activeTab ===
                        'mine'
                          ? 'Мой вишлист'
                          : `Вишлист ${partnerName}`}
                      </p>

                      <h2 className="mt-1 text-3xl font-semibold text-[#554442]">
                        {selectedWishlist.title}
                      </h2>

                    </div>

                    {activeTab ===
                      'mine' && (
                      <div className="flex gap-2">

                        <button
                          type="button"
                          onClick={() =>
                            openEditWishlist(
                              selectedWishlist,
                            )
                          }
                          className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#e8dcdf]"
                        >
                          <Pencil
                            size={17}
                          />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setDeletingWishlist(
                              selectedWishlist,
                            )
                          }
                          className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#efd4d4] text-[#b96569]"
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
                      className="mt-6 flex items-center gap-2 rounded-2xl bg-[#9b87ad] px-5 py-3 text-sm font-medium text-white"
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
                    <div className="mt-8 flex min-h-[330px] items-center justify-center rounded-[24px] border border-dashed border-[#e6dce9]">

                      <ShoppingBag
                        size={36}
                        className="text-[#a58fb3]"
                      />

                    </div>
                  )}

                </>
              ) : (
                <div className="flex min-h-[500px] items-center justify-center">

                  <Heart
                    size={38}
                    className="text-[#ad9aba]"
                  />

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
    <article className="overflow-hidden rounded-[24px] border border-[#eee1df] bg-[#fffdfc]">

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

          <div className="min-w-0">

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
            <div className="flex">

              <button
                type="button"
                onClick={
                  onEdit
                }
                className="flex h-8 w-8 items-center justify-center text-[#927f98]"
              >
                <Pencil
                  size={15}
                />
              </button>

              <button
                type="button"
                onClick={
                  onDelete
                }
                className="flex h-8 w-8 items-center justify-center text-[#b46065]"
              >
                <Trash2
                  size={15}
                />
              </button>

            </div>
          )}

        </div>

        <PriorityDisplay
          priority={
            item.priority
          }
        />

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
            className="mt-4 flex items-center gap-2 text-sm font-medium text-[#8b759c]"
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

function PriorityDisplay({
  priority,
}: {
  priority: number;
}) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">

      <div className="flex items-center gap-0.5">

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
              size={14}
              fill={
                value <=
                priority
                  ? 'currentColor'
                  : 'none'
              }
              className={
                value <=
                priority
                  ? 'text-[#dc7d87]'
                  : 'text-[#dfd3d5]'
              }
            />
          ),
        )}

      </div>

      <span className="text-xs font-medium text-[#9b7378]">
        {getPriorityLabel(
          priority,
        )}
      </span>

    </div>
  );
}

function PriorityPicker({
  value,
  disabled,
  onChange,
}: {
  value: number;
  disabled: boolean;
  onChange: (
    priority: number,
  ) => void;
}) {
  const [
    hoveredPriority,
    setHoveredPriority,
  ] =
    useState<number | null>(
      null,
    );

  const visiblePriority =
    hoveredPriority ??
    value;

  return (
    <div className="rounded-[22px] border border-[#eadde7] bg-[#fdfafd] p-5">

      <p className="font-medium text-[#67536b]">
        Насколько сильно хочется?
      </p>

      <p className="mt-1 text-sm text-[#a18e9f]">
        Приоритет поможет партнёру
        понять, что хочется больше всего.
      </p>

      <div
        className="mt-5 flex items-center gap-2"
        onMouseLeave={() =>
          setHoveredPriority(
            null,
          )
        }
      >

        {[
          1,
          2,
          3,
          4,
          5,
        ].map(
          (
            priority,
          ) => (
            <button
              key={
                priority
              }
              type="button"
              disabled={
                disabled
              }
              aria-label={`Приоритет ${priority}`}
              onMouseEnter={() =>
                setHoveredPriority(
                  priority,
                )
              }
              onFocus={() =>
                setHoveredPriority(
                  priority,
                )
              }
              onBlur={() =>
                setHoveredPriority(
                  null,
                )
              }
              onClick={() =>
                onChange(
                  priority,
                )
              }
              className="rounded-xl p-1.5 transition hover:scale-110 active:scale-95"
            >
              <Heart
                size={29}
                strokeWidth={1.7}
                fill={
                  priority <=
                    visiblePriority
                    ? 'currentColor'
                    : 'none'
                }
                className={
                  priority <=
                    visiblePriority
                    ? 'text-[#dc7d87]'
                    : 'text-[#d9cdd5]'
                }
              />
            </button>
          ),
        )}

      </div>

      <p className="mt-3 text-sm font-medium text-[#bb6c75]">
        {getPriorityLabel(
          visiblePriority,
        )}
      </p>

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
      <div className="overflow-hidden rounded-[24px] border border-[#dfd4e3]">

        <div className="relative">

          <div
            role="img"
            aria-label="Предпросмотр изображения"
            className="aspect-[16/10] bg-white bg-contain bg-center bg-no-repeat"
            style={{
              backgroundImage:
                `url("${previewUrl}")`,
            }}
          />

          <button
            type="button"
            onClick={
              onRemove
            }
            className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#bd6268] shadow-md"
          >
            <Trash2
              size={17}
            />
          </button>

        </div>

        <div className="flex justify-end px-4 py-3">

          <button
            type="button"
            onClick={() =>
              inputRef.current?.click()
            }
            className="text-sm font-medium text-[#846e95]"
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
              event.target.files?.[0];

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
      className={[
        'cursor-pointer rounded-[24px] border-2 border-dashed px-6 py-9 text-center',

        isDragging
          ? 'border-[#a991b8] bg-[#f4edf7]'
          : 'border-[#dfd4e3] bg-[#fdfafd]',
      ].join(
        ' ',
      )}
    >

      <ImagePlus
        size={27}
        className="mx-auto text-[#8b759d]"
      />

      <p className="mt-4 font-semibold text-[#69566f]">
        Добавьте изображение
      </p>

      <p className="mt-2 text-sm text-[#9c8b9e]">
        Ctrl + V, перетаскивание
        или выбор файла
      </p>

      <div className="mt-4 flex justify-center gap-3 text-xs text-[#89758e]">

        <span className="flex items-center gap-1">
          <Clipboard
            size={14}
          />
          Ctrl + V
        </span>

        <span className="flex items-center gap-1">
          <Upload
            size={14}
          />
          Выбрать файл
        </span>

      </div>

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
            event.target.files?.[0];

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

      <div className="w-full max-w-lg rounded-[30px] bg-white p-7">

        <div className="flex justify-between">

          <h2 className="text-2xl font-semibold text-[#554442]">
            {editing
              ? 'Изменить вишлист'
              : 'Создать вишлист'}
          </h2>

          <ModalCloseButton
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
                    event.target.value,
                })
              }
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
          className="mt-7 w-full rounded-2xl bg-[#9b87ad] py-3.5 font-medium text-white"
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

      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[30px] bg-white p-7">

        <div className="flex justify-between">

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
              placeholder="Например, наушники"
              className={
                wishlistInputClass
              }
            />
          </FormField>

          <FormField
            label="Цена"
          >
            <input
              type="number"
              min="0"
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
              placeholder="25000"
              className={
                wishlistInputClass
              }
            />
          </FormField>

          {/*
           * Новый выбор
           * приоритета желания.
           */}
          <PriorityPicker
            value={
              form.priority
            }
            disabled={
              isSaving
            }
            onChange={(
              priority,
            ) =>
              onChange({
                ...form,
                priority,
              })
            }
          />

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
              placeholder="https://..."
              className={
                wishlistInputClass
              }
            />
          </FormField>

          <FormField
            label="Описание"
          >
            <textarea
              rows={5}
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
              placeholder="Размер, цвет или любые детали..."
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
          className="mt-7 w-full rounded-2xl bg-[#9b87ad] py-3.5 font-medium text-white"
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

function ErrorMessage({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  return (
    <div className="flex justify-between gap-4 rounded-2xl border border-[#edc9ca] bg-[#fff4f3] px-4 py-3 text-sm text-[#a35d61]">

      {message}

      <button
        type="button"
        onClick={
          onClose
        }
      >
        <X
          size={15}
        />
      </button>

    </div>
  );
}

function ModalCloseButton({
  onClick,
}: {
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#eadfe5] bg-[#fffafc] text-[#8f7c86]"
    >
      <X
        size={20}
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
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#4d403e]/35 p-5">

      <div className="w-full max-w-md rounded-[28px] bg-white p-7">

        <Trash2
          className="text-[#c45e64]"
        />

        <h2 className="mt-5 text-xl font-semibold text-[#624b48]">
          {title}
        </h2>

        <p className="mt-3 text-sm text-[#917975]">
          {description}
        </p>

        <div className="mt-6 flex gap-3">

          <button
            type="button"
            onClick={
              onCancel
            }
            className="flex-1 rounded-2xl border py-3"
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
            className="flex-1 rounded-2xl bg-[#c86167] py-3 text-white"
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