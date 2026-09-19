export type NotificationCategory = 'RELATIONSHIP' | 'CALENDAR' | 'DAY_BOARD';

export type AppNotification = {
  id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  href: string | null;
  createdAt: string;
  readAt: string | null;
};

export type NotificationsResponse = {
  items: AppNotification[];
  unreadCount: number;
};

export type NotificationPreferences = {
  relationship: boolean;
  calendar: boolean;
  dayBoard: boolean;
};
