export type WishlistOwner = {
  id: string;
  nickname: string;
  displayName: string | null;
  avatarUrl: string | null;
};

export type WishlistItem = {
  id: string;

  title: string;
  description: string | null;

  url: string | null;
  imageUrl: string | null;

  price: number | null;

  /*
   * Приоритет желания:
   *
   * 1 — неплохо бы
   * 2 — хочу
   * 3 — очень хочу
   * 4 — очень сильно хочу
   * 5 — мечтаю
   */
  priority: number;

  createdAt: string;
  updatedAt: string;
};

export type Wishlist = {
  id: string;

  title: string;
  description: string | null;

  createdAt: string;
  updatedAt: string;

  owner: WishlistOwner;

  items: WishlistItem[];

  _count?: {
    items: number;
  };
};

export type WishlistsResponse = {
  mine: Wishlist[];
  partner: Wishlist[];
};

export type WishlistDetails = {
  id: string;

  title: string;
  description: string | null;

  createdAt: string;
  updatedAt: string;

  owner: WishlistOwner;

  items: WishlistItem[];

  canEdit: boolean;
};

export type WishlistImageUploadResponse = {
  imageUrl: string;
};