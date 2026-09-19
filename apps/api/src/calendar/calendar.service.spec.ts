import { ForbiddenException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { PrismaService } from '../prisma/prisma.service.js';
import { CalendarService } from './calendar.service.js';

const baseEvent = {
  id: 'event-1',
  relationshipId: null,
  createdById: 'user-1',
  scope: 'PERSONAL' as const,
  title: 'Личное дело',
  description: null,
  location: null,
  startsAt: new Date('2026-09-15T10:00:00.000Z'),
  endsAt: null,
  allDay: false,
  createdAt: new Date('2026-09-15T09:00:00.000Z'),
  updatedAt: new Date('2026-09-15T09:00:00.000Z'),
  relationship: null,
  createdBy: {
    id: 'user-1',
    nickname: 'chervy4k',
    displayName: 'Данила',
    avatarUrl: null,
  },
  participants: [
    {
      role: 'OWNER' as const,
      user: {
        id: 'user-1',
        nickname: 'chervy4k',
        displayName: 'Данила',
        avatarUrl: null,
      },
    },
  ],
};

function createService(prisma: object) {
  return new CalendarService(prisma as PrismaService);
}

describe('CalendarService', () => {
  it('возвращает только личные события участника и не раскрывает внутренние идентификаторы', async () => {
    const findMany = vi.fn().mockResolvedValue([baseEvent]);
    const service = createService({ calendarEvent: { findMany } });

    const result = await service.findAll(
      'user-1',
      '2026-09-01T00:00:00.000Z',
      '2026-10-01T00:00:00.000Z',
      'personal',
    );

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          participants: { some: { userId: 'user-1' } },
          scope: 'PERSONAL',
        }),
      }),
    );
    expect(result[0]).toMatchObject({
      id: 'event-1',
      scope: 'PERSONAL',
      canEdit: true,
      canChangeScope: true,
    });
    expect(result[0]).not.toHaveProperty('relationshipId');
    expect(result[0]).not.toHaveProperty('createdById');
  });

  it('не открывает личное событие другого пользователя', async () => {
    const findUnique = vi.fn().mockResolvedValue({
      ...baseEvent,
      createdById: 'user-2',
      participants: [
        {
          role: 'OWNER',
          user: { ...baseEvent.createdBy, id: 'user-2' },
        },
      ],
    });
    const service = createService({ calendarEvent: { findUnique } });

    await expect(service.findOne('user-1', 'event-1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('добавляет обоих партнёров в совместное событие', async () => {
    const relationship = {
      id: 'relationship-1',
      user1Id: 'user-1',
      user2Id: 'user-2',
    };
    const create = vi.fn().mockImplementation(({ data }) => ({
      ...baseEvent,
      scope: 'SHARED',
      relationshipId: relationship.id,
      relationship: { status: 'ACTIVE' },
      participants: data.participants.create.map(
        (participant: { userId: string; role: 'OWNER' | 'EDITOR' }) => ({
          role: participant.role,
          user: {
            ...baseEvent.createdBy,
            id: participant.userId,
          },
        }),
      ),
    }));
    const notify = vi.fn().mockResolvedValue({});
    const service = createService({
      relationship: { findFirst: vi.fn().mockResolvedValue(relationship) },
      calendarEvent: { create },
      notificationPreferences: { findUnique: vi.fn().mockResolvedValue(null) },
      notification: { create: notify },
    });

    await service.create('user-1', {
      scope: 'SHARED',
      title: 'Ужин',
      startsAt: '2026-09-20T16:00:00.000Z',
    });

    expect(create.mock.calls[0][0].data.participants.create).toEqual([
      { userId: 'user-1', role: 'OWNER' },
      { userId: 'user-2', role: 'EDITOR' },
    ]);
    expect(notify).toHaveBeenCalledWith({ data: expect.objectContaining({
      userId: 'user-2', category: 'CALENDAR',
    }) });
  });

  it('создаёт личное событие пользователю без пары', async () => {
    const create = vi.fn().mockResolvedValue(baseEvent);
    const notify = vi.fn();
    const service = createService({
      relationship: { findFirst: vi.fn().mockResolvedValue(null) },
      calendarEvent: { create },
      notification: { create: notify },
    });

    const result = await service.create('user-1', {
      title: 'Личный план',
      startsAt: '2026-09-20T16:00:00.000Z',
    });

    expect(create.mock.calls[0][0].data).toMatchObject({
      relationshipId: null,
      scope: 'PERSONAL',
      participants: {
        create: [{ userId: 'user-1', role: 'OWNER' }],
      },
    });
    expect(result.scope).toBe('PERSONAL');
    expect(notify).not.toHaveBeenCalled();
  });

  it('сообщает партнёру, когда совместное событие становится личным', async () => {
    const partner = { ...baseEvent.createdBy, id: 'user-2' };
    const sharedEvent = {
      ...baseEvent,
      scope: 'SHARED' as const,
      relationshipId: 'relationship-1',
      relationship: { status: 'ACTIVE' as const },
      participants: [
        baseEvent.participants[0],
        { role: 'EDITOR' as const, user: partner },
      ],
    };
    const notify = vi.fn().mockResolvedValue({});
    const service = createService({
      calendarEvent: {
        findUnique: vi.fn().mockResolvedValue(sharedEvent),
        update: vi.fn().mockResolvedValue({
          ...sharedEvent,
          scope: 'PERSONAL',
          participants: [baseEvent.participants[0]],
        }),
      },
      notificationPreferences: { findUnique: vi.fn().mockResolvedValue(null) },
      notification: { create: notify },
    });

    await service.update('user-1', 'event-1', { scope: 'PERSONAL' });
    expect(notify).toHaveBeenCalledWith({ data: expect.objectContaining({
      userId: 'user-2', category: 'CALENDAR', title: 'Совместное событие удалено',
    }) });
  });

  it('оставляет завершённое совместное событие доступным только для чтения', async () => {
    const archivedEvent = {
      ...baseEvent,
      relationshipId: 'relationship-1',
      scope: 'SHARED' as const,
      relationship: { status: 'ENDED' as const },
    };
    const findUnique = vi.fn().mockResolvedValue(archivedEvent);
    const service = createService({ calendarEvent: { findUnique } });

    const result = await service.findOne('user-1', 'event-1');
    expect(result.canEdit).toBe(false);
    await expect(
      service.update('user-1', 'event-1', { title: 'Новое название' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
