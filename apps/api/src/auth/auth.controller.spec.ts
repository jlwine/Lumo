import { Test } from '@nestjs/testing';
import { vi } from 'vitest';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

describe('AuthController', () => {
  it('передаёт запрос сервису и возвращает результат', async () => {
    const result = { id: 'user-1' };
    const service = { getCurrentUser: vi.fn().mockResolvedValue(result) };
    const module = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: service }],
    }).overrideGuard(JwtAuthGuard).useValue({ canActivate: () => true }).compile();
    const controller = module.get(AuthController);
    expect(await controller.me({ user: { sub: 'user-1' } })).toEqual(result);
    expect(service.getCurrentUser).toHaveBeenCalledWith('user-1');
    await module.close();
  });
});