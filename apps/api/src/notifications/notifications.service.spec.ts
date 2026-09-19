import { NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { PrismaService } from '../prisma/prisma.service.js';
import { createNotification, NotificationsService } from './notifications.service.js';

describe('NotificationsService', () => {
  it('показывает пользователю только его уведомления', async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const count = vi.fn().mockResolvedValue(2);
    const service = new NotificationsService({ notification: { findMany, count } } as unknown as PrismaService);

    expect(await service.list('user-1')).toEqual({ items: [], unreadCount: 2 });
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'user-1' } }));
    expect(count).toHaveBeenCalledWith({ where: { userId: 'user-1', readAt: null } });
  });

  it('не позволяет отметить чужое уведомление прочитанным', async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 0 });
    const findFirst = vi.fn().mockResolvedValue(null);
    const service = new NotificationsService({ notification: { updateMany, findFirst } } as unknown as PrismaService);

    await expect(service.markRead('user-1', 'other-notification')).rejects.toBeInstanceOf(NotFoundException);
    expect(updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'other-notification', userId: 'user-1', readAt: null },
    }));
  });

  it('учитывает отключённую категорию', async () => {
    const create = vi.fn();
    const prisma = {
      notificationPreferences: { findUnique: vi.fn().mockResolvedValue({ calendar: false }) },
      notification: { create },
    } as unknown as PrismaService;

    await createNotification(prisma, {
      userId: 'user-1', category: 'CALENDAR', title: 'Событие', body: 'Описание',
    });
    expect(create).not.toHaveBeenCalled();
  });
});
