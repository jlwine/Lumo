import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { vi } from 'vitest';
import { RelationshipsService } from './relationships.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('RelationshipsService', () => {
  it('завершает активную пару, сохраняет запись и больше не показывает её как текущую', async () => {
    const relationship = {
      id: 'relationship-1',
      user1Id: 'user-1',
      user2Id: 'user-2',
      status: 'ACTIVE',
      endedAt: null as Date | null,
    };
    const prisma = {
      relationship: {
        findFirst: vi.fn().mockImplementation(async () =>
          relationship.status === 'ACTIVE' ? relationship : null,
        ),
        update: vi.fn().mockImplementation(async ({ data }) => {
          relationship.status = data.status;
          relationship.endedAt = data.endedAt;
          return { ...relationship };
        }),
      },
    };
    const module = await Test.createTestingModule({
      providers: [RelationshipsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    const service = module.get(RelationshipsService);

    await service.endRelationship('user-1');

    expect(prisma.relationship.findFirst).toHaveBeenCalledWith({
      where: {
        status: 'ACTIVE',
        OR: [{ user1Id: 'user-1' }, { user2Id: 'user-1' }],
      },
    });
    expect(prisma.relationship.update).toHaveBeenCalledWith({
      where: { id: 'relationship-1' },
      data: { status: 'ENDED', endedAt: expect.any(Date) },
    });
    await expect(service.getCurrentRelationship('user-2')).resolves.toEqual({ relationship: null });
    await expect(service.endRelationship('user-1')).rejects.toBeInstanceOf(NotFoundException);
    await module.close();
  });

  it('отклоняет приглашение несуществующему пользователю', async () => {
    const prisma = { user: { findUnique: vi.fn().mockResolvedValue(null) } };
    const module = await Test.createTestingModule({
      providers: [RelationshipsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    await expect(module.get(RelationshipsService).createInvitation('sender', ' Missing '))
      .rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.user.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { nickname: 'missing' } }));
    await module.close();
  });

  it('при повторном соединении той же пары возвращает прежнюю запись с фотографиями', async () => {
    const previous = {
      id: 'relationship-1',
      user1Id: 'user-1',
      user2Id: 'user-2',
      startedAt: new Date('2026-03-30'),
      status: 'ENDED',
      endedAt: new Date('2026-09-01'),
    };
    const transaction = {
      relationship: {
        findFirst: vi.fn().mockResolvedValue(previous),
        update: vi.fn().mockResolvedValue({ ...previous, status: 'ACTIVE', endedAt: null }),
        create: vi.fn(),
      },
      relationshipInvitation: { update: vi.fn(), updateMany: vi.fn() },
    };
    const prisma = {
      relationshipInvitation: { findUnique: vi.fn().mockResolvedValue({
        id: 'invitation-1', senderId: 'user-1', receiverId: 'user-2', status: 'PENDING',
      }) },
      relationship: { findFirst: vi.fn().mockResolvedValue(null) },
      notification: { create: vi.fn() },
      $transaction: vi.fn(async (callback: (value: typeof transaction) => Promise<unknown>) => callback(transaction)),
    };
    const module = await Test.createTestingModule({
      providers: [RelationshipsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    const result = await module.get(RelationshipsService).acceptInvitation('user-2', 'invitation-1', {});

    expect(result.id).toBe(previous.id);
    expect(transaction.relationship.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: previous.id },
      data: { status: 'ACTIVE', endedAt: null },
    }));
    expect(transaction.relationship.create).not.toHaveBeenCalled();
    await module.close();
  });
});
