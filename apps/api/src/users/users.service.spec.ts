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
});