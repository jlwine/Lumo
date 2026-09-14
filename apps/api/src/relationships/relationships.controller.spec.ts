import { Test } from '@nestjs/testing';
import { vi } from 'vitest';
import { RelationshipsController } from './relationships.controller.js';
import { RelationshipsService } from './relationships.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

describe('RelationshipsController', () => {
  it('передаёт запрос сервису и возвращает результат', async () => {
    const result = { id: 'user-1' };
    const service = { getInvitations: vi.fn().mockResolvedValue(result) };
    const module = await Test.createTestingModule({
      controllers: [RelationshipsController],
      providers: [{ provide: RelationshipsService, useValue: service }],
    }).overrideGuard(JwtAuthGuard).useValue({ canActivate: () => true }).compile();
    const controller = module.get(RelationshipsController);
    expect(await controller.getInvitations({ user: { sub: 'user-1' } })).toEqual(result);
    expect(service.getInvitations).toHaveBeenCalledWith('user-1');
    await module.close();
  });
});