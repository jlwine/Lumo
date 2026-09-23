import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { vi } from 'vitest';
import { UsersService } from './users.service.js';
import { AuthService } from '../auth/auth.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('UsersService', () => {
  it.each(['wrong-password', 'same-password'])('не меняет пароль: %s', async (scenario) => {
    const prisma = {
      user: { findUnique: vi.fn().mockResolvedValue({ id: 'user', passwordHash: await bcrypt.hash('current-password', 4) }) },
      $transaction: vi.fn(),
    };
    const module = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: prisma }, { provide: AuthService, useValue: {} }],
    }).compile();
    await expect(module.get(UsersService).updatePassword('user', {
      currentPassword: scenario === 'wrong-password' ? 'wrong' : 'current-password',
      newPassword: scenario === 'same-password' ? 'current-password' : 'new-password',
    })).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
    await module.close();
  });

  it('обезличивает аккаунт, завершает отношения и сохраняет желания для архива партнёра', async () => {
    const passwordHash = await bcrypt.hash('current-password', 4);
    const transaction = {
      user: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
      relationship: {
        findMany: vi.fn().mockResolvedValue([{
          id: 'relationship-1', user1Id: 'user-1', user2Id: 'user-2',
        }]),
        update: vi.fn().mockResolvedValue({}),
      },
      wishlist: { findMany: vi.fn().mockResolvedValue([{
        id: 'wishlist-1', title: 'Подарки', description: null,
        items: [{
          id: 'item-1', title: 'Книга', description: null, url: null,
          imageUrl: null, price: 1000, priority: 3, status: 'WANT',
          giftMarks: [{ status: 'PLANNING' }],
        }],
      }]) },
      relationshipInvitation: { deleteMany: vi.fn() },
      calendarEvent: { deleteMany: vi.fn() },
      wishlistGiftMark: { deleteMany: vi.fn() },
      notification: { deleteMany: vi.fn() },
      notificationPreferences: { deleteMany: vi.fn() },
      emailVerificationToken: { deleteMany: vi.fn() },
      passwordResetToken: { deleteMany: vi.fn() },
    };
    const prisma = {
      user: { findUnique: vi.fn().mockResolvedValue({
        id: 'user-1', passwordHash, deletedAt: null,
      }) },
      $transaction: vi.fn(async (callback: (value: typeof transaction) => Promise<unknown>) => callback(transaction)),
    };
    const module = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: prisma }, { provide: AuthService, useValue: {} }],
    }).compile();

    await expect(module.get(UsersService).deleteAccount('user-1', 'current-password'))
      .resolves.toEqual({ success: true });
    expect(transaction.user.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'user-1', deletedAt: null },
      data: expect.objectContaining({
        displayName: 'Удалённый пользователь', deletedAt: expect.any(Date),
        sessionVersion: { increment: 1 },
      }),
    }));
    expect(transaction.relationship.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'relationship-1' },
      data: expect.objectContaining({
        status: 'ENDED', endedAt: expect.any(Date),
        archivedWishlists: [{
          id: 'wishlist-1', title: 'Подарки', description: null,
          items: [expect.objectContaining({ title: 'Книга', giftMark: 'PLANNING' })],
        }],
      }),
    }));
    expect(transaction.calendarEvent.deleteMany).toHaveBeenCalledWith({
      where: { createdById: 'user-1', scope: 'PERSONAL' },
    });
    await module.close();
  });
});
