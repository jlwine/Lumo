export type CalendarEventCreator = {
  id: string;
  nickname: string;
  displayName: string | null;
  avatarUrl: string | null;
};

export type CalendarEventScope = 'PERSONAL' | 'SHARED';

export type CalendarEventParticipant = {
  role: 'OWNER' | 'EDITOR';
  user: CalendarEventCreator;
};

export type CalendarEvent = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startsAt: string;
  endsAt: string | null;
  allDay: boolean;
  scope: CalendarEventScope;
  createdAt: string;
  updatedAt: string;
  createdBy: CalendarEventCreator;
  participants: CalendarEventParticipant[];
  canEdit: boolean;
  canChangeScope: boolean;
};
