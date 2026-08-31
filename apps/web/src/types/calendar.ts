export type CalendarEventCreator = {
  id: string;
  nickname: string;
  displayName: string | null;
  avatarUrl: string | null;
};

export type CalendarEvent = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startsAt: string;
  endsAt: string | null;
  allDay: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: CalendarEventCreator;
};