import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { vi } from 'vitest';
import { RelationshipsService } from './relationships.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('RelationshipsService', () => {
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
});