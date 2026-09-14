import { BadRequestException } from '@nestjs/common';
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
