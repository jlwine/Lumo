import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { describe, expect, it, vi } from 'vitest';

import { PrismaService } from '../prisma/prisma.service.js';
import { DayBoardService } from './day-board.service.js';

const relationship = {
  id: 'relationship-1',
  user1: {
    id: 'user-1',
    nickname: 'chervy4k',
    displayName: 'Данила',
    avatarUrl: null,
  },
  user2: {
    id: 'user-2',
    nickname: 'nika',
    displayName: 'Ника',
    avatarUrl: null,
  },
};

function createService(prisma: object) {
  return new DayBoardService(
    prisma as PrismaService,
    { get: vi.fn() } as unknown as ConfigService,
  );
}

describe('DayBoardService reactions', () => {
  it('добавляет одно сердце к фотографии партнёра', async () => {
    const upsert = vi.fn().mockResolvedValue({});
    const service = createService({
      relationship: { findFirst: vi.fn().mockResolvedValue(relationship) },
      dayBoardEntry: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'entry-1',
          authorId: 'user-2',
        }),
      },
      dayBoardReaction: {
        upsert,
        count: vi.fn().mockResolvedValue(1),
      },
    });

    await expect(service.addHeart('user-1', 'entry-1')).resolves.toEqual({
      entryId: 'entry-1',
      heartCount: 1,
      reactedByMe: true,
    });
    expect(upsert).toHaveBeenCalledWith({
      where: {
        entryId_userId: {
          entryId: 'entry-1',
          userId: 'user-1',
        },
      },
      create: {
        entryId: 'entry-1',
        userId: 'user-1',
      },
      update: {},
    });
  });

  it('не позволяет ставить сердце собственной фотографии', async () => {
    const upsert = vi.fn();
    const service = createService({
      relationship: { findFirst: vi.fn().mockResolvedValue(relationship) },
      dayBoardEntry: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'entry-1',
          authorId: 'user-1',
        }),
      },
      dayBoardReaction: { upsert },
    });

    await expect(service.addHeart('user-1', 'entry-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(upsert).not.toHaveBeenCalled();
  });

  it('возвращает количество сердец и реакцию текущего пользователя', async () => {
    const entry = {
      id: 'entry-1',
      relationshipId: relationship.id,
      authorId: 'user-2',
      boardDate: new Date('2026-09-15T00:00:00.000Z'),
      imageUrl: 'http://localhost/image.webp',
      thumbnailUrl: 'http://localhost/thumb.webp',
      caption: null,
      createdAt: new Date('2026-09-15T10:00:00.000Z'),
      updatedAt: new Date('2026-09-15T10:00:00.000Z'),
      author: relationship.user2,
      reactions: [{ userId: 'user-1' }],
    };
    const service = createService({
      relationship: { findFirst: vi.fn().mockResolvedValue(relationship) },
      dayBoardEntry: { findMany: vi.fn().mockResolvedValue([entry]) },
    });

    const result = await service.getToday('user-1', '2026-09-15');
    expect(result.partner).toMatchObject({
      id: 'entry-1',
      heartCount: 1,
      reactedByMe: true,
    });
  });
});

describe('DayBoardService past relationship archive', () => {
  it('показывает только завершённые отношения с фотографиями', async () => {
    const findMany = vi.fn().mockResolvedValue([{
      ...relationship,
      user1Id: 'user-1',
      user2Id: 'user-2',
      startedAt: new Date('2026-03-30'),
      endedAt: new Date('2026-09-01'),
      _count: { dayBoardEntries: 2 },
    }]);
    const service = createService({ relationship: {
      findFirst: vi.fn().mockResolvedValue(null),
      findMany,
    } });

    const archive = await service.getArchives('user-1');
    expect(archive.relationships[0]).toMatchObject({
      id: relationship.id,
      partner: relationship.user2,
      photoCount: 2,
    });
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        status: 'ENDED',
        OR: [{ user1Id: 'user-1' }, { user2Id: 'user-1' }],
        dayBoardEntries: { some: {} },
      }),
    }));
  });

  it('после воссоединения убирает прежние записи пары из архива', async () => {
    const service = createService({ relationship: {
      findFirst: vi.fn().mockResolvedValue({ user1Id: 'user-1', user2Id: 'user-2' }),
      findMany: vi.fn().mockResolvedValue([{
        ...relationship,
        user1Id: 'user-1',
        user2Id: 'user-2',
        startedAt: new Date('2026-03-30'),
        endedAt: new Date('2026-09-01'),
        _count: { dayBoardEntries: 2 },
      }]),
    } });
    await expect(service.getArchives('user-1')).resolves.toEqual({ relationships: [] });
  });

  it('показывает снимки всех прежних записей той же пары в текущей истории', async () => {
    const findEntries = vi.fn().mockResolvedValue([]);
    const service = createService({
      relationship: {
        findFirst: vi.fn().mockResolvedValue(relationship),
        findMany: vi.fn().mockResolvedValue([{ id: 'relationship-1' }, { id: 'relationship-old' }]),
      },
      dayBoardEntry: { findMany: findEntries },
    });

    await service.getHistory('user-1', 'all');
    expect(findEntries).toHaveBeenCalledWith(expect.objectContaining({
      where: { relationshipId: { in: ['relationship-1', 'relationship-old'] } },
    }));
    expect(findEntries.mock.calls[0][0]).not.toHaveProperty('take');
  });

  it('возвращает фотографии завершённой пары только её участнику', async () => {
    const findFirst = vi.fn().mockResolvedValue({
      ...relationship,
      user1Id: 'user-1',
      user2Id: 'user-2',
    });
    const findMany = vi.fn().mockResolvedValue([{
      id: 'entry-1',
      relationshipId: relationship.id,
      authorId: 'user-2',
      boardDate: new Date('2026-08-30T00:00:00.000Z'),
      imageUrl: 'http://localhost/image.webp',
      thumbnailUrl: 'http://localhost/thumb.webp',
      caption: 'Лето',
      createdAt: new Date('2026-08-30T10:00:00.000Z'),
      updatedAt: new Date('2026-08-30T10:00:00.000Z'),
      author: relationship.user2,
      reactions: [],
    }]);
    const service = createService({ relationship: { findFirst }, dayBoardEntry: { findMany } });

    const archive = await service.getArchive('user-1', relationship.id);
    expect(archive.partnerUser.id).toBe('user-2');
    expect(archive.days[0].partner?.caption).toBe('Лето');
    expect(findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        id: relationship.id,
        status: 'ENDED',
        OR: [{ user1Id: 'user-1' }, { user2Id: 'user-1' }],
      }),
    }));
  });

  it('не раскрывает архив чужому пользователю', async () => {
    const findMany = vi.fn();
    const service = createService({
      relationship: { findFirst: vi.fn().mockResolvedValue(null) },
      dayBoardEntry: { findMany },
    });
    await expect(service.getArchive('stranger', relationship.id)).rejects.toBeInstanceOf(NotFoundException);
    expect(findMany).not.toHaveBeenCalled();
  });
});
