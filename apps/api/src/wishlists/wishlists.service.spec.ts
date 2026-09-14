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
});
