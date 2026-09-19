import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import type { NotificationCategory } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

type NotificationInput = {
  userId: string;
  category: NotificationCategory;
  title: string;
  body: string;
  href?: string;
};

const categoryPreference = {
  RELATIONSHIP: 'relationship',
  CALENDAR: 'calendar',
  DAY_BOARD: 'dayBoard',
} as const;
const logger = new Logger('Notifications');

export async function createNotification(
  prisma: PrismaService,
  input: NotificationInput,
) {
  try {
    const preferences = await prisma.notificationPreferences.findUnique({
      where: { userId: input.userId },
    });

    if (preferences?.[categoryPreference[input.category]] === false) {
      return null;
    }

    return await prisma.notification.create({ data: input });
  } catch (error) {
    logger.warn('Не удалось сохранить уведомление', error);
    return null;
  }
}

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    const [items, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 100,
        select: {
          id: true,
          category: true,
          title: true,
          body: true,
          href: true,
          createdAt: true,
          readAt: true,
        },
      }),
      this.prisma.notification.count({ where: { userId, readAt: null } }),
    ]);

    return { items, unreadCount };
  }

  async unreadCount(userId: string) {
    return {
      count: await this.prisma.notification.count({
        where: { userId, readAt: null },
      }),
    };
  }

  async markRead(userId: string, notificationId: string) {
    const updated = await this.prisma.notification.updateMany({
      where: { id: notificationId, userId, readAt: null },
      data: { readAt: new Date() },
    });

    if (updated.count === 0) {
      const exists = await this.prisma.notification.findFirst({
        where: { id: notificationId, userId },
        select: { id: true },
      });
      if (!exists) throw new NotFoundException('Уведомление не найдено');
    }

    return { success: true };
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { success: true };
  }

  async getPreferences(userId: string) {
    const preferences = await this.prisma.notificationPreferences.findUnique({
      where: { userId },
      select: { relationship: true, calendar: true, dayBoard: true },
    });
    return preferences ?? { relationship: true, calendar: true, dayBoard: true };
  }

  async updatePreferences(
    userId: string,
    data: { relationship?: boolean; calendar?: boolean; dayBoard?: boolean },
  ) {
    return this.prisma.notificationPreferences.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
      select: { relationship: true, calendar: true, dayBoard: true },
    });
  }
}
