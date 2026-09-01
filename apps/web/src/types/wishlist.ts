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