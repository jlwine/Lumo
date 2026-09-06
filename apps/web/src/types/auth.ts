export type User = {
  id: string;
  email: string;
  nickname: string;
  displayName: string | null;
  avatarUrl: string | null;
  birthDate: string | null;

  /*
   * null означает, что email
   * пользователя ещё не подтверждён.
   */
  emailVerifiedAt: string | null;
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
  birthDate: string | null;
  emailVerifiedAt: string | null;
  createdAt: string;
};

/*
 * Общий формат ответа для действий,
 * которые возвращают success + message.
 */
export type AuthActionResponse = {
  success: boolean;
  message: string;
};