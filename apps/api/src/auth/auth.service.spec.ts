import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { vi } from 'vitest';
import { AuthService } from './auth.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { MailService } from '../mail/mail.service.js';

describe('AuthService', () => {
  it.each(['missing', 'expired'])('не меняет пароль по ссылке %s', async (state) => {
    const prisma = {
      passwordResetToken: {
        findUnique: vi.fn().mockResolvedValue(state === 'missing' ? null : { id: 'reset', expiresAt: new Date(0) }),
        delete: vi.fn().mockResolvedValue({}),
      },
      $transaction: vi.fn(),
    };
    const module = await Test.createTestingModule({
      providers: [AuthService, { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: {} }, { provide: MailService, useValue: {} }],
    }).compile();
    await expect(module.get(AuthService).resetPassword('invalid', 'new-password')).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
    if (state === 'expired') expect(prisma.passwordResetToken.delete).toHaveBeenCalledWith({ where: { id: 'reset' } });
    await module.close();
  });
});