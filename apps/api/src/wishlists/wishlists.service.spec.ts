import { ForbiddenException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { PrismaService } from '../prisma/prisma.service.js';
import { WishlistsService } from './wishlists.service.js';

function createService(prisma: object) {
  return new WishlistsService(
    prisma as PrismaService,
  );
}

describe('WishlistsService gift marks', () => {
  it('возвращает сохранённые желания завершённых отношений', async () => {
    const service = createService({
      relationship: {
        findFirst: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([{
          id: 'relationship-1', user1Id: 'user-1', endedAt: new Date('2026-09-23'),
          archivedWishlists: [{ id: 'wishlist-1', title: 'Подарки', items: [] }],
          user1: { id: 'user-1', displayName: 'Данила', nickname: 'danila' },
          user2: { id: 'user-2', displayName: 'Удалённый пользователь', nickname: 'deleted_user' },
        }]),
      },
      wishlist: { findMany: vi.fn().mockResolvedValue([]) },
    });
    const result = await service.getArchives('user-1');
    expect(result.relationships[0]).toMatchObject({
      id: 'relationship-1',
      partner: { id: 'user-2', displayName: 'Удалённый пользователь' },
      wishlists: [{ id: 'wishlist-1', title: 'Подарки' }],
    });
  });

  it('не запрашивает скрытые отметки для владельца желания', async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const service = createService({
      relationship: {
        findFirst: vi.fn().mockResolvedValue({
          user1Id: 'user-1',
          user2Id: 'user-2',
        }),
      },
      wishlist: { findMany },
    });

    await service.findAll('user-1');

    expect(
      findMany.mock.calls[0][0].select.items.select.giftMarks.where,
    ).toEqual({ hiddenFromOwner: false });
    expect(
      findMany.mock.calls[1][0].select.items.select.giftMarks.where,
    ).toEqual({ partnerId: 'user-1' });
  });

  it('создаёт скрытую отметку только для желания текущего партнёра', async () => {
    const upsert = vi.fn().mockResolvedValue({
      status: 'PLANNING',
      hiddenFromOwner: true,
    });
    const service = createService({
      relationship: {
        findFirst: vi.fn().mockResolvedValue({
          user1Id: 'user-1',
          user2Id: 'user-2',
        }),
      },
      wishlistItem: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'item-1',
          wishlist: { ownerId: 'user-2' },
        }),
      },
      wishlistGiftMark: { upsert },
    });

    await service.upsertGiftMark('user-1', 'item-1', {
      status: 'PLANNING',
    });

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          itemId: 'item-1',
          partnerId: 'user-1',
          hiddenFromOwner: true,
        }),
      }),
    );
  });

  it('запрещает отмечать желание не текущего партнёра', async () => {
    const upsert = vi.fn();
    const service = createService({
      relationship: {
        findFirst: vi.fn().mockResolvedValue({
          user1Id: 'user-1',
          user2Id: 'user-2',
        }),
      },
      wishlistItem: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'item-1',
          wishlist: { ownerId: 'user-3' },
        }),
      },
      wishlistGiftMark: { upsert },
    });

    await expect(
      service.upsertGiftMark('user-1', 'item-1', {
        status: 'PURCHASED',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(upsert).not.toHaveBeenCalled();
  });
  it('переносит полученное желание владельца в архив', async () => {
    const update = vi.fn().mockResolvedValue({ id: 'item-1' });
    const service = createService({
      wishlist: {
        findUnique: vi.fn().mockResolvedValue({ id: 'wishlist-1', ownerId: 'user-1' }),
      },
      wishlistItem: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'item-1', wishlistId: 'wishlist-1', archivedAt: null,
        }),
        update,
      },
    });

    await service.archiveItem('user-1', 'wishlist-1', 'item-1', 'RECEIVED');

    expect(update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'item-1' },
      data: expect.objectContaining({
        status: 'RECEIVED',
        archiveReason: 'RECEIVED',
        archivedAt: expect.any(Date),
      }),
    }));
  });

  it('после вручения раскрывает отметку и архивирует желание', async () => {
    const updateMark = vi.fn().mockResolvedValue({ status: 'GIVEN', hiddenFromOwner: false });
    const updateItem = vi.fn().mockResolvedValue({ id: 'item-1' });
    const service = createService({
      relationship: {
        findFirst: vi.fn().mockResolvedValue({ user1Id: 'user-1', user2Id: 'user-2' }),
      },
      wishlistItem: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'item-1', archivedAt: null, wishlist: { ownerId: 'user-2' },
        }),
      },
      wishlistGiftMark: {
        findUnique: vi.fn().mockResolvedValue({ status: 'PURCHASED' }),
      },
      $transaction: vi.fn().mockImplementation(async (callback) => callback({
        wishlistGiftMark: { update: updateMark },
        wishlistItem: { update: updateItem },
      })),
    });

    await service.upsertGiftMark('user-1', 'item-1', { status: 'GIVEN' });

    expect(updateMark).toHaveBeenCalledWith(expect.objectContaining({
      data: { status: 'GIVEN', hiddenFromOwner: false },
    }));
    expect(updateItem).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        status: 'RECEIVED',
        archiveReason: 'RECEIVED',
        archivedAt: expect.any(Date),
      }),
    }));
  });

});
