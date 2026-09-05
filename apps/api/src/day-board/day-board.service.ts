import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  ConfigService,
} from '@nestjs/config';

import {
  randomUUID,
} from 'node:crypto';

import {
  mkdir,
  unlink,
} from 'node:fs/promises';

import {
  join,
} from 'node:path';

import sharp from 'sharp';

import { PrismaService } from '../prisma/prisma.service.js';

import { UpdateDayBoardEntryDto } from './dto/update-day-board-entry.dto.js';
import { UpsertDayBoardEntryDto } from './dto/upsert-day-board-entry.dto.js';

type DayBoardUser = {
  id: string;
  nickname: string;
  displayName: string | null;
  avatarUrl: string | null;
};

type SerializedDayBoardEntry = {
  id: string;
  date: string;
  imageUrl: string;
  thumbnailUrl: string;
  caption: string | null;
  createdAt: string;
  updatedAt: string;
  author: DayBoardUser;
};

type DayBoardEntryWithAuthor = {
  id: string;
  relationshipId: string;
  authorId: string;
  boardDate: Date;
  imageUrl: string;
  thumbnailUrl: string;
  caption: string | null;
  createdAt: Date;
  updatedAt: Date;

  author: DayBoardUser;
};

@Injectable()
export class DayBoardService {
  constructor(
    private readonly prisma:
      PrismaService,

    private readonly configService:
      ConfigService,
  ) {}

  /*
   * Сегодняшняя доска.
   *
   * Клиент может передать локальную дату
   * пользователя в формате YYYY-MM-DD.
   */
  async getToday(
    userId: string,
    dateValue?: string,
  ) {
    const context =
      await this.getRelationshipContext(
        userId,
      );

    const {
      date,
      dateString,
    } =
      this.parseBoardDate(
        dateValue,
      );

    const entries =
      await this.prisma.dayBoardEntry.findMany({
        where: {
          relationshipId:
            context.relationshipId,

          boardDate:
            date,
        },

        include: {
          author: {
            select: {
              id: true,
              nickname: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      });

    const mine =
      entries.find(
        (entry) =>
          entry.authorId ===
          userId,
      ) ??
      null;

    const partner =
      entries.find(
        (entry) =>
          entry.authorId ===
          context.partner.id,
      ) ??
      null;

    return {
      date:
        dateString,

      me:
        context.me,

      partnerUser:
        context.partner,

      mine:
        mine
          ? this.serializeEntry(
              mine,
            )
          : null,

      partner:
        partner
          ? this.serializeEntry(
              partner,
            )
          : null,
    };
  }

  /*
   * Облегчённый ответ для будущего
   * мобильного виджета.
   */
  async getWidget(
    userId: string,
    dateValue?: string,
  ) {
    const today =
      await this.getToday(
        userId,
        dateValue,
      );

    return {
      date:
        today.date,

      mine:
        today.mine
          ? {
              thumbnailUrl:
                today.mine
                  .thumbnailUrl,

              caption:
                today.mine
                  .caption,

              author:
                today.mine
                  .author,
            }
          : null,

      partner:
        today.partner
          ? {
              thumbnailUrl:
                today.partner
                  .thumbnailUrl,

              caption:
                today.partner
                  .caption,

              author:
                today.partner
                  .author,
            }
          : null,
    };
  }

  /*
   * Архив доски.
   *
   * Возвращаем дни группами:
   * один день содержит максимум
   * по одной записи каждого участника пары.
   */
  async getHistory(
    userId: string,
    limitValue?: string,
  ) {
    const context =
      await this.getRelationshipContext(
        userId,
      );

    const parsedLimit =
      Number(
        limitValue ??
        30,
      );

    const limit =
      Number.isFinite(
        parsedLimit,
      )
        ? Math.min(
            Math.max(
              Math.trunc(
                parsedLimit,
              ),
              1,
            ),
            120,
          )
        : 30;

    const entries =
      await this.prisma.dayBoardEntry.findMany({
        where: {
          relationshipId:
            context.relationshipId,
        },

        include: {
          author: {
            select: {
              id: true,
              nickname: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },

        orderBy: [
          {
            boardDate:
              'desc',
          },
          {
            updatedAt:
              'desc',
          },
        ],

        /*
         * Максимум две записи
         * на один день.
         */
        take:
          limit * 2,
      });

    const grouped =
      new Map<
        string,
        {
          date: string;
          mine:
            | SerializedDayBoardEntry
            | null;
          partner:
            | SerializedDayBoardEntry
            | null;
        }
      >();

    for (
      const entry
      of entries
    ) {
      const date =
        this.dateToString(
          entry.boardDate,
        );

      if (
        !grouped.has(
          date,
        )
      ) {
        grouped.set(
          date,
          {
            date,
            mine: null,
            partner: null,
          },
        );
      }

      const group =
        grouped.get(
          date,
        );

      if (!group) {
        continue;
      }

      if (
        entry.authorId ===
        userId
      ) {
        group.mine =
          this.serializeEntry(
            entry,
          );
      } else {
        group.partner =
          this.serializeEntry(
            entry,
          );
      }
    }

    return {
      me:
        context.me,

      partnerUser:
        context.partner,

      days:
        Array.from(
          grouped.values(),
        ).slice(
          0,
          limit,
        ),
    };
  }

  /*
   * Создаём фотографию дня
   * или заменяем уже существующую.
   *
   * Если файл не передан,
   * но запись уже существует,
   * обновляется только подпись.
   */
  async upsertToday(
    userId: string,
    data: UpsertDayBoardEntryDto,
    file?: Express.Multer.File,
  ) {
    const context =
      await this.getRelationshipContext(
        userId,
      );

    const {
      date,
    } =
      this.parseBoardDate(
        data.date,
      );

    const existing =
      await this.prisma.dayBoardEntry.findFirst({
        where: {
          relationshipId:
            context.relationshipId,

          authorId:
            userId,

          boardDate:
            date,
        },

        include: {
          author: {
            select: {
              id: true,
              nickname: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      });

    if (
      !file &&
      !existing
    ) {
      throw new BadRequestException(
        'Выберите фотографию',
      );
    }

    const caption =
      data.caption !==
      undefined
        ? data.caption
            .trim()
            .slice(
              0,
              280,
            ) ||
          null
        : existing?.caption ??
          null;

    /*
     * Простое изменение подписи
     * без новой фотографии.
     */
    if (
      !file &&
      existing
    ) {
      const updated =
        await this.prisma.dayBoardEntry.update({
          where: {
            id:
              existing.id,
          },

          data: {
            caption,
          },

          include: {
            author: {
              select: {
                id: true,
                nickname: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        });

      return this.serializeEntry(
        updated,
      );
    }

    if (!file) {
      throw new BadRequestException(
        'Выберите фотографию',
      );
    }

    this.validateImage(
      file,
    );

    const stored =
      await this.storeImage(
        file.buffer,
      );

    try {
      let saved:
        DayBoardEntryWithAuthor;

      if (existing) {
        saved =
          await this.prisma.dayBoardEntry.update({
            where: {
              id:
                existing.id,
            },

            data: {
              imageUrl:
                stored.imageUrl,

              thumbnailUrl:
                stored.thumbnailUrl,

              caption,
            },

            include: {
              author: {
                select: {
                  id: true,
                  nickname: true,
                  displayName: true,
                  avatarUrl: true,
                },
              },
            },
          });

        await Promise.all([
          this.deleteStoredFile(
            existing.imageUrl,
          ),
          this.deleteStoredFile(
            existing.thumbnailUrl,
          ),
        ]);
      } else {
        saved =
          await this.prisma.dayBoardEntry.create({
            data: {
              relationshipId:
                context.relationshipId,

              authorId:
                userId,

              boardDate:
                date,

              imageUrl:
                stored.imageUrl,

              thumbnailUrl:
                stored.thumbnailUrl,

              caption,
            },

            include: {
              author: {
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

      return this.serializeEntry(
        saved,
      );
    } catch (
      error
    ) {
      /*
       * Если БД не приняла запись,
       * не оставляем новые файлы сиротами.
       */
      await Promise.all([
        this.deleteStoredFile(
          stored.imageUrl,
        ),
        this.deleteStoredFile(
          stored.thumbnailUrl,
        ),
      ]);

      throw error;
    }
  }

  /*
   * Меняем только подпись
   * сегодняшней записи.
   */
  async updateToday(
    userId: string,
    dateValue: string | undefined,
    data: UpdateDayBoardEntryDto,
  ) {
    const context =
      await this.getRelationshipContext(
        userId,
      );

    const {
      date,
    } =
      this.parseBoardDate(
        dateValue,
      );

    const existing =
      await this.prisma.dayBoardEntry.findFirst({
        where: {
          relationshipId:
            context.relationshipId,

          authorId:
            userId,

          boardDate:
            date,
        },
      });

    if (!existing) {
      throw new NotFoundException(
        'Фотография за этот день не найдена',
      );
    }

    const updated =
      await this.prisma.dayBoardEntry.update({
        where: {
          id:
            existing.id,
        },

        data: {
          caption:
            data.caption !==
            undefined
              ? data.caption
                  .trim()
                  .slice(
                    0,
                    280,
                  ) ||
                null
              : undefined,
        },

        include: {
          author: {
            select: {
              id: true,
              nickname: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      });

    return this.serializeEntry(
      updated,
    );
  }

  /*
   * Удаляем свою фотографию
   * за выбранный день.
   */
  async removeToday(
    userId: string,
    dateValue?: string,
  ) {
    const context =
      await this.getRelationshipContext(
        userId,
      );

    const {
      date,
    } =
      this.parseBoardDate(
        dateValue,
      );

    const existing =
      await this.prisma.dayBoardEntry.findFirst({
        where: {
          relationshipId:
            context.relationshipId,

          authorId:
            userId,

          boardDate:
            date,
        },
      });

    if (!existing) {
      throw new NotFoundException(
        'Фотография за этот день не найдена',
      );
    }

    await this.prisma.dayBoardEntry.delete({
      where: {
        id:
          existing.id,
      },
    });

    await Promise.all([
      this.deleteStoredFile(
        existing.imageUrl,
      ),
      this.deleteStoredFile(
        existing.thumbnailUrl,
      ),
    ]);

    return {
      success: true,
    };
  }

  /*
   * Получаем активную пару
   * и обоих участников.
   */
  private async getRelationshipContext(
    userId: string,
  ) {
    const relationship =
      await this.prisma.relationship.findFirst({
        where: {
          status:
            'ACTIVE',

          OR: [
            {
              user1Id:
                userId,
            },
            {
              user2Id:
                userId,
            },
          ],
        },

        select: {
          id: true,

          user1: {
            select: {
              id: true,
              nickname: true,
              displayName: true,
              avatarUrl: true,
            },
          },

          user2: {
            select: {
              id: true,
              nickname: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      });

    if (!relationship) {
      throw new BadRequestException(
        'Для доски дня сначала нужно создать пару',
      );
    }

    const me =
      relationship.user1.id ===
      userId
        ? relationship.user1
        : relationship.user2;

    const partner =
      relationship.user1.id ===
      userId
        ? relationship.user2
        : relationship.user1;

    return {
      relationshipId:
        relationship.id,

      me,

      partner,
    };
  }

  /*
   * Проверяем формат даты
   * и преобразуем её в @db.Date.
   */
  private parseBoardDate(
    value?: string,
  ) {
    const dateString =
      value?.trim() ||
      this.dateToString(
        new Date(),
      );

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(
        dateString,
      )
    ) {
      throw new BadRequestException(
        'Дата должна быть в формате YYYY-MM-DD',
      );
    }

    const [
      year,
      month,
      day,
    ] =
      dateString
        .split(
          '-',
        )
        .map(
          Number,
        );

    const date =
      new Date(
        Date.UTC(
          year,
          month - 1,
          day,
        ),
      );

    if (
      date.getUTCFullYear() !==
        year ||
      date.getUTCMonth() !==
        month - 1 ||
      date.getUTCDate() !==
        day
    ) {
      throw new BadRequestException(
        'Указана некорректная дата',
      );
    }

    return {
      date,
      dateString,
    };
  }

  private dateToString(
    value: Date,
  ) {
    const year =
      value.getUTCFullYear();

    const month =
      String(
        value.getUTCMonth() +
          1,
      ).padStart(
        2,
        '0',
      );

    const day =
      String(
        value.getUTCDate(),
      ).padStart(
        2,
        '0',
      );

    return `${year}-${month}-${day}`;
  }

  /*
   * Принимаем только обычные
   * форматы изображений.
   */
  private validateImage(
    file: Express.Multer.File,
  ) {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    if (
      !allowedTypes.includes(
        file.mimetype,
      )
    ) {
      throw new BadRequestException(
        'Поддерживаются только JPG, PNG и WEBP',
      );
    }

    if (
      file.size >
      10 * 1024 * 1024
    ) {
      throw new BadRequestException(
        'Фотография должна быть не больше 10 МБ',
      );
    }
  }

  /*
   * Сохраняем две WEBP-версии:
   * полноразмерную и миниатюру.
   */
  private async storeImage(
    buffer: Buffer,
  ) {
    const id =
      randomUUID();

    const originalsDir =
      join(
        process.cwd(),
        'uploads',
        'day-board',
        'originals',
      );

    const thumbnailsDir =
      join(
        process.cwd(),
        'uploads',
        'day-board',
        'thumbnails',
      );

    await Promise.all([
      mkdir(
        originalsDir,
        {
          recursive: true,
        },
      ),
      mkdir(
        thumbnailsDir,
        {
          recursive: true,
        },
      ),
    ]);

    const originalPath =
      join(
        originalsDir,
        `${id}.webp`,
      );

    const thumbnailPath =
      join(
        thumbnailsDir,
        `${id}.webp`,
      );

    try {
      /*
       * Полноразмерное изображение
       * ограничиваем 1800px.
       */
      await sharp(
        buffer,
      )
        .rotate()
        .resize({
          width: 1800,
          height: 1800,
          fit: 'inside',
          withoutEnlargement:
            true,
        })
        .webp({
          quality: 88,
        })
        .toFile(
          originalPath,
        );

      /*
       * Версия для главной страницы
       * и будущего мобильного виджета.
       */
      await sharp(
        buffer,
      )
        .rotate()
        .resize({
          width: 640,
          height: 640,
          fit: 'cover',
          position:
            'centre',
        })
        .webp({
          quality: 78,
        })
        .toFile(
          thumbnailPath,
        );
    } catch {
      await Promise.all([
        unlink(
          originalPath,
        ).catch(
          () =>
            undefined,
        ),
        unlink(
          thumbnailPath,
        ).catch(
          () =>
            undefined,
        ),
      ]);

      throw new BadRequestException(
        'Не удалось обработать изображение',
      );
    }

    return {
      imageUrl:
        this.createPublicUrl(
          `/uploads/day-board/originals/${id}.webp`,
        ),

      thumbnailUrl:
        this.createPublicUrl(
          `/uploads/day-board/thumbnails/${id}.webp`,
        ),
    };
  }

  /*
   * Формируем абсолютную ссылку.
   *
   * Для продакшена позже достаточно
   * задать API_PUBLIC_URL.
   */
  private createPublicUrl(
    pathname: string,
  ) {
    const configured =
      this.configService.get<string>(
        'API_PUBLIC_URL',
      );

    const baseUrl =
      configured?.replace(
        /\/+$/,
        '',
      ) ||
      `http://localhost:${
        this.configService.get<string>(
          'PORT',
        ) ??
        '3001'
      }`;

    return `${baseUrl}${pathname}`;
  }

  private async deleteStoredFile(
    url: string,
  ) {
    try {
      const pathname =
        new URL(
          url,
        ).pathname;

      if (
        !pathname.startsWith(
          '/uploads/day-board/',
        )
      ) {
        return;
      }

      const relativePath =
        pathname.replace(
          /^\/+/,
          '',
        );

      const absolutePath =
        join(
          process.cwd(),
          relativePath,
        );

      await unlink(
        absolutePath,
      ).catch(
        () =>
          undefined,
      );
    } catch {
      /*
       * Удаление старого файла
       * не должно ломать запрос.
       */
    }
  }

  private serializeEntry(
    entry: DayBoardEntryWithAuthor,
  ): SerializedDayBoardEntry {
    return {
      id:
        entry.id,

      date:
        this.dateToString(
          entry.boardDate,
        ),

      imageUrl:
        entry.imageUrl,

      thumbnailUrl:
        entry.thumbnailUrl,

      caption:
        entry.caption,

      createdAt:
        entry.createdAt.toISOString(),

      updatedAt:
        entry.updatedAt.toISOString(),

      author:
        entry.author,
    };
  }
}
