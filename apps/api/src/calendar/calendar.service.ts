import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateCalendarEventDto } from './dto/create-calendar-event.dto.js';
import { UpdateCalendarEventDto } from './dto/update-calendar-event.dto.js';

const calendarEventSelect = {
  id: true,
  relationshipId: true,
  createdById: true,
  scope: true,
  title: true,
  description: true,
  location: true,
  startsAt: true,
  endsAt: true,
  allDay: true,
  createdAt: true,
  updatedAt: true,
  relationship: { select: { status: true } },
  createdBy: {
    select: {
      id: true,
      nickname: true,
      displayName: true,
      avatarUrl: true,
    },
  },
  participants: {
    select: {
      role: true,
      user: {
        select: {
          id: true,
          nickname: true,
          displayName: true,
          avatarUrl: true,
        },
      },
    },
  },
} as const;

type CalendarFilter = 'all' | 'personal' | 'shared' | 'partner';
type AccessibleEvent = Prisma.CalendarEventGetPayload<{
  select: typeof calendarEventSelect;
}>;

@Injectable()
export class CalendarService {
  constructor(private readonly prisma: PrismaService) {}

  private async findActiveRelationship(userId: string) {
    return this.prisma.relationship.findFirst({
      where: {
        status: 'ACTIVE',
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
      select: { id: true, user1Id: true, user2Id: true },
    });
  }

  private parseDate(value: string, message: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(message);
    }
    return date;
  }

  private validateDates(startsAt: Date, endsAt: Date | null) {
    if (endsAt && endsAt < startsAt) {
      throw new BadRequestException(
        'Дата окончания не может быть раньше даты начала',
      );
    }
  }

  private normalizeFilter(filter?: string): CalendarFilter {
    const normalized = filter ?? 'all';
    if (!['all', 'personal', 'shared', 'partner'].includes(normalized)) {
      throw new BadRequestException('Неизвестный фильтр календаря');
    }
    return normalized as CalendarFilter;
  }

  private async findAccessibleEvent(userId: string, eventId: string) {
    const event = await this.prisma.calendarEvent.findUnique({
      where: { id: eventId },
      select: calendarEventSelect,
    });

    if (!event) {
      throw new NotFoundException('Событие не найдено');
    }

    if (!event.participants.some((participant) => participant.user.id === userId)) {
      throw new ForbiddenException('У вас нет доступа к этому событию');
    }

    return event;
  }

  private ensureCanModify(userId: string, event: AccessibleEvent) {
    if (event.scope === 'PERSONAL' && event.createdById !== userId) {
      throw new ForbiddenException('Изменять личное событие может только автор');
    }

    if (event.scope === 'SHARED' && event.relationship?.status !== 'ACTIVE') {
      throw new ForbiddenException(
        'Архивное совместное событие больше нельзя изменять',
      );
    }
  }

  private serializeEvent(event: AccessibleEvent, userId: string) {
    const {
      relationship,
      relationshipId: _relationshipId,
      createdById: _createdById,
      ...safeEvent
    } = event;
    return {
      ...safeEvent,
      canEdit:
        (safeEvent.scope === 'PERSONAL' && event.createdById === userId) ||
        relationship?.status === 'ACTIVE',
      canChangeScope: event.createdById === userId,
    };
  }

  async findAll(
    userId: string,
    from?: string,
    to?: string,
    filter?: string,
  ) {
    const normalizedFilter = this.normalizeFilter(filter);
    const fromDate = from
      ? this.parseDate(from, 'Некорректная дата начала периода')
      : undefined;
    const toDate = to
      ? this.parseDate(to, 'Некорректная дата окончания периода')
      : undefined;

    if (fromDate && toDate && fromDate >= toDate) {
      throw new BadRequestException(
        'Дата начала периода должна быть раньше даты окончания',
      );
    }

    const events = await this.prisma.calendarEvent.findMany({
      where: {
        participants: { some: { userId } },
        ...(normalizedFilter === 'personal' ? { scope: 'PERSONAL' as const } : {}),
        ...(normalizedFilter === 'shared' ? { scope: 'SHARED' as const } : {}),
        ...(normalizedFilter === 'partner'
          ? { scope: 'SHARED' as const, createdById: { not: userId } }
          : {}),
        startsAt: {
          ...(fromDate ? { gte: fromDate } : {}),
          ...(toDate ? { lt: toDate } : {}),
        },
      },
      select: calendarEventSelect,
      orderBy: { startsAt: 'asc' },
    });

    return events.map((event) => this.serializeEvent(event, userId));
  }

  async findOne(userId: string, eventId: string) {
    return this.serializeEvent(
      await this.findAccessibleEvent(userId, eventId),
      userId,
    );
  }

  async create(userId: string, data: CreateCalendarEventDto) {
    const relationship = await this.findActiveRelationship(userId);
    const scope = data.scope ?? (relationship ? 'SHARED' : 'PERSONAL');

    if (scope === 'SHARED' && !relationship) {
      throw new BadRequestException(
        'Совместное событие можно создать только с активным партнёром',
      );
    }

    const startsAt = this.parseDate(
      data.startsAt,
      'Некорректная дата начала события',
    );
    const endsAt = data.endsAt
      ? this.parseDate(data.endsAt, 'Некорректная дата окончания события')
      : null;
    this.validateDates(startsAt, endsAt);

    const title = data.title.trim();
    if (!title) {
      throw new BadRequestException('Укажите название события');
    }

    const partnerId = relationship
      ? relationship.user1Id === userId
        ? relationship.user2Id
        : relationship.user1Id
      : null;

    const event = await this.prisma.calendarEvent.create({
      data: {
        relationshipId: scope === 'SHARED' ? relationship!.id : null,
        createdById: userId,
        scope,
        title,
        description: data.description?.trim() || null,
        location: data.location?.trim() || null,
        startsAt,
        endsAt,
        allDay: data.allDay ?? false,
        participants: {
          create: [
            { userId, role: 'OWNER' },
            ...(scope === 'SHARED' && partnerId
              ? [{ userId: partnerId, role: 'EDITOR' as const }]
              : []),
          ],
        },
      },
      select: calendarEventSelect,
    });

    return this.serializeEvent(event, userId);
  }

  async update(userId: string, eventId: string, data: UpdateCalendarEventDto) {
    const event = await this.findAccessibleEvent(userId, eventId);
    this.ensureCanModify(userId, event);

    if (data.scope && data.scope !== event.scope && event.createdById !== userId) {
      throw new ForbiddenException('Тип события может изменить только его автор');
    }

    const startsAt = data.startsAt
      ? this.parseDate(data.startsAt, 'Некорректная дата начала события')
      : event.startsAt;
    const endsAt =
      data.endsAt === undefined
        ? event.endsAt
        : data.endsAt
          ? this.parseDate(data.endsAt, 'Некорректная дата окончания события')
          : null;
    this.validateDates(startsAt, endsAt);

    let title: string | undefined;
    if (data.title !== undefined) {
      title = data.title.trim();
      if (!title) {
        throw new BadRequestException('Название события не может быть пустым');
      }
    }

    const nextScope = data.scope ?? event.scope;
    let relationshipId: string | null | undefined;
    let participants:
      | {
          deleteMany: Record<string, never>;
          create: Array<{ userId: string; role: 'OWNER' | 'EDITOR' }>;
        }
      | undefined;

    if (nextScope !== event.scope) {
      if (nextScope === 'SHARED') {
        const relationship = await this.findActiveRelationship(userId);
        if (!relationship) {
          throw new BadRequestException(
            'Совместное событие можно создать только с активным партнёром',
          );
        }
        const partnerId =
          relationship.user1Id === userId
            ? relationship.user2Id
            : relationship.user1Id;
        relationshipId = relationship.id;
        participants = {
          deleteMany: {},
          create: [
            { userId, role: 'OWNER' },
            { userId: partnerId, role: 'EDITOR' },
          ],
        };
      } else {
        relationshipId = null;
        participants = {
          deleteMany: {},
          create: [{ userId, role: 'OWNER' }],
        };
      }
    }

    const updatedEvent = await this.prisma.calendarEvent.update({
      where: { id: eventId },
      data: {
        title,
        description:
          data.description !== undefined
            ? data.description.trim() || null
            : undefined,
        location:
          data.location !== undefined ? data.location.trim() || null : undefined,
        startsAt: data.startsAt !== undefined ? startsAt : undefined,
        endsAt: data.endsAt !== undefined ? endsAt : undefined,
        allDay: data.allDay,
        scope: data.scope,
        relationshipId,
        participants,
      },
      select: calendarEventSelect,
    });

    return this.serializeEvent(updatedEvent, userId);
  }

  async remove(userId: string, eventId: string) {
    const event = await this.findAccessibleEvent(userId, eventId);
    this.ensureCanModify(userId, event);
    await this.prisma.calendarEvent.delete({ where: { id: eventId } });
    return { success: true };
  }
}
