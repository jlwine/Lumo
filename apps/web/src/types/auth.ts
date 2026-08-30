export type User = {
  id: string;
  email: string;
  nickname: string;
  displayName: string | null;
  avatarUrl: string | null;
};

export type LoginResponse = {
  accessToken: string;
  user: User;
};

export type RegisterResponse = {
  id: string;
  email: string;
  nickname: string;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: string;
};