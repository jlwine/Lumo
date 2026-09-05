export type DayBoardUser = {
  id: string;
  nickname: string;
  displayName: string | null;
  avatarUrl: string | null;
};

export type DayBoardEntry = {
  id: string;
  date: string;
  imageUrl: string;
  thumbnailUrl: string;
  caption: string | null;
  createdAt: string;
  updatedAt: string;
  author: DayBoardUser;
};

export type DayBoardTodayResponse = {
  date: string;
  me: DayBoardUser;
  partnerUser: DayBoardUser;
  mine: DayBoardEntry | null;
  partner: DayBoardEntry | null;
};

export type DayBoardHistoryDay = {
  date: string;
  mine: DayBoardEntry | null;
  partner: DayBoardEntry | null;
};

export type DayBoardHistoryResponse = {
  me: DayBoardUser;
  partnerUser: DayBoardUser;
  days: DayBoardHistoryDay[];
};

export type DayBoardWidgetResponse = {
  date: string;

  mine: {
    thumbnailUrl: string;
    caption: string | null;
    author: DayBoardUser;
  } | null;

  partner: {
    thumbnailUrl: string;
    caption: string | null;
    author: DayBoardUser;
  } | null;
};
