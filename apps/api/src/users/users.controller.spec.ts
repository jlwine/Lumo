import { Test } from '@nestjs/testing';
import { vi } from 'vitest';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

describe('UsersController', () => {
  it('передаёт запрос сервису и возвращает результат', async () => {
    const result = { id: 'user-1' };
    const service = { findAll: vi.fn().mockResolvedValue(result) };
    const module = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: service }],
    }).overrideGuard(JwtAuthGuard).useValue({ canActivate: () => true }).compile();
    const controller = module.get(UsersController);
    expect(await controller.findAll()).toEqual(result);
    expect(service.findAll).toHaveBeenCalledWith();
    await module.close();
  });
});