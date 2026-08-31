import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';

import { CreateCalendarEventDto } from './dto/create-calendar-event.dto.js';
import { UpdateCalendarEventDto } from './dto/update-calendar-event.dto.js';

@Injectable()
export class CalendarService {
  constructor(
    private readonly prisma:
      PrismaService,
  ) {}

  /*
   * Получаем активные отношения
   * текущего пользователя.
   */
  private async getActiveRelationship(
    userId: string,
  ) {
    const relationship =
      await this.prisma.relationship.findFirst({
        where: {
          status: 'ACTIVE',

          OR: [
            {
              user1Id: userId,
            },
            {
              user2Id: userId,
            },
          ],
        },
      });

    if (!relationship) {
      throw new BadRequestException(
        'Для использования общего календаря необходимо состоять в отношениях',
      );
    }

    return relationship;
  }

  /*
   * Получение событий пары.
   *
   * Можно передать диапазон:
   * ?from=2026-09-01&to=2026-10-01
   */
  async findAll(
    userId: string,
    from?: string,
    to?: string,
  ) {
    const relationship =
      await this.getActiveRelationship(
        userId,
      );

    let fromDate:
      | Date
      | undefined;

    let toDate:
      | Date
      | undefined;

    if (from) {
      fromDate =
        new Date(from);

      if (
        Number.isNaN(
          fromDate.getTime(),
        )
      ) {
        throw new BadRequestException(
          'Некорректная дата начала периода',
        );
      }
    }

    if (to) {
      toDate =
        new Date(to);

      if (
        Number.isNaN(
          toDate.getTime(),
        )
      ) {
        throw new BadRequestException(
          'Некорректная дата окончания периода',
        );
      }
    }

    if (
      fromDate &&
      toDate &&
      fromDate >= toDate
    ) {
      throw new BadRequestException(
        'Дата начала периода должна быть раньше даты окончания',
      );
    }

    return this.prisma.calendarEvent.findMany({
      where: {
        relationshipId:
          relationship.id,

        startsAt: {
          ...(fromDate
            ? {
                gte:
                  fromDate,
              }
            : {}),

          ...(toDate
            ? {
                lt:
                  toDate,
              }
            : {}),
        },
      },

      select: {
        id: true,
        title: true,
        description: true,
        location: true,
        startsAt: true,
        endsAt: true,
        allDay: true,
        createdAt: true,
        updatedAt: true,

        createdBy: {
          select: {
            id: true,
            nickname: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },

      orderBy: {
        startsAt: 'asc',
      },
    });
  }

  /*
   * Получение одного события.
   */
  async findOne(
    userId: string,
    eventId: string,
  ) {
    const relationship =
      await this.getActiveRelationship(
        userId,
      );

    const event =
      await this.prisma.calendarEvent.findUnique({
        where: {
          id: eventId,
        },

        select: {
          id: true,
          relationshipId: true,
          title: true,
          description: true,
          location: true,
          startsAt: true,
          endsAt: true,
          allDay: true,
          createdAt: true,
          updatedAt: true,

          createdBy: {
            select: {
              id: true,
              nickname: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      });

    if (!event) {
      throw new NotFoundException(
        'Событие не найдено',
      );
    }

    if (
      event.relationshipId !==
      relationship.id
    ) {
      throw new ForbiddenException(
        'У вас нет доступа к этому событию',
      );
    }

    const {
      relationshipId: _relationshipId,
      ...safeEvent
    } = event;

    return safeEvent;
  }

  /*
   * Создание общего события.
   */
  async create(
    userId: string,
    data: CreateCalendarEventDto,
  ) {
    const relationship =
      await this.getActiveRelationship(
        userId,
      );

    const startsAt =
      new Date(
        data.startsAt,
      );

    const endsAt =
      data.endsAt
        ? new Date(
            data.endsAt,
          )
        : null;

    if (
      Number.isNaN(
        startsAt.getTime(),
      )
    ) {
      throw new BadRequestException(
        'Некорректная дата начала события',
      );
    }

    if (
      endsAt &&
      Number.isNaN(
        endsAt.getTime(),
      )
    ) {
      throw new BadRequestException(
        'Некорректная дата окончания события',
      );
    }

    if (
      endsAt &&
      endsAt < startsAt
    ) {
      throw new BadRequestException(
        'Дата окончания не может быть раньше даты начала',
      );
    }

    const title =
      data.title.trim();

    if (!title) {
      throw new BadRequestException(
        'Укажите название события',
      );
    }

    return this.prisma.calendarEvent.create({
      data: {
        relationshipId:
          relationship.id,

        createdById:
          userId,

        title,

        description:
          data.description
            ?.trim() ||
          null,

        location:
          data.location
            ?.trim() ||
          null,

        startsAt,

        endsAt,

        allDay:
          data.allDay ??
          false,
      },

      select: {
        id: true,
        title: true,
        description: true,
        location: true,
        startsAt: true,
        endsAt: true,
        allDay: true,
        createdAt: true,
        updatedAt: true,

        createdBy: {
          select: {
            id: true,
            nickname: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  /*
   * Изменение события.
   *
   * Оба участника пары могут
   * изменять общие события.
   */
  async update(
    userId: string,
    eventId: string,
    data: UpdateCalendarEventDto,
  ) {
    const relationship =
      await this.getActiveRelationship(
        userId,
      );

    const event =
      await this.prisma.calendarEvent.findUnique({
        where: {
          id: eventId,
        },
      });

    if (!event) {
      throw new NotFoundException(
        'Событие не найдено',
      );
    }

    if (
      event.relationshipId !==
      relationship.id
    ) {
      throw new ForbiddenException(
        'У вас нет доступа к этому событию',
      );
    }

    const startsAt =
      data.startsAt
        ? new Date(
            data.startsAt,
          )
        : event.startsAt;

    let endsAt =
      event.endsAt;

    if (
      data.endsAt !== undefined
    ) {
      endsAt =
        data.endsAt
          ? new Date(
              data.endsAt,
            )
          : null;
    }

    if (
      Number.isNaN(
        startsAt.getTime(),
      )
    ) {
      throw new BadRequestException(
        'Некорректная дата начала события',
      );
    }

    if (
      endsAt &&
      Number.isNaN(
        endsAt.getTime(),
      )
    ) {
      throw new BadRequestException(
        'Некорректная дата окончания события',
      );
    }

    if (
      endsAt &&
      endsAt < startsAt
    ) {
      throw new BadRequestException(
        'Дата окончания не может быть раньше даты начала',
      );
    }

    let title:
      | string
      | undefined;

    if (
      data.title !==
      undefined
    ) {
      title =
        data.title.trim();

      if (!title) {
        throw new BadRequestException(
          'Название события не может быть пустым',
        );
      }
    }

    return this.prisma.calendarEvent.update({
      where: {
        id: eventId,
      },

      data: {
        title,

        description:
          data.description !==
          undefined
            ? data.description
                .trim() ||
              null
            : undefined,

        location:
          data.location !==
          undefined
            ? data.location
                .trim() ||
              null
            : undefined,

        startsAt:
          data.startsAt !==
          undefined
            ? startsAt
            : undefined,

        endsAt:
          data.endsAt !==
          undefined
            ? endsAt
            : undefined,

        allDay:
          data.allDay,
      },

      select: {
        id: true,
        title: true,
        description: true,
        location: true,
        startsAt: true,
        endsAt: true,
        allDay: true,
        createdAt: true,
        updatedAt: true,

        createdBy: {
          select: {
            id: true,
            nickname: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  /*
   * Удаление события.
   *
   * Календарь общий, поэтому
   * удалить событие может любой
   * участник текущей пары.
   */
  async remove(
    userId: string,
    eventId: string,
  ) {
    const relationship =
      await this.getActiveRelationship(
        userId,
      );

    const event =
      await this.prisma.calendarEvent.findUnique({
        where: {
          id: eventId,
        },

        select: {
          id: true,
          relationshipId: true,
        },
      });

    if (!event) {
      throw new NotFoundException(
        'Событие не найдено',
      );
    }

    if (
      event.relationshipId !==
      relationship.id
    ) {
      throw new ForbiddenException(
        'У вас нет доступа к этому событию',
      );
    }

    await this.prisma.calendarEvent.delete({
      where: {
        id: eventId,
      },
    });

    return {
      success: true,
    };
  }
}