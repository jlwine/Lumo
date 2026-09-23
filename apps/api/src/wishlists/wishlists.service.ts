import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';

import { CreateWishlistDto } from './dto/create-wishlist.dto.js';
import { CreateWishlistItemDto } from './dto/create-wishlist-item.dto.js';
import { UpdateWishlistDto } from './dto/update-wishlist.dto.js';
import { UpdateWishlistItemDto } from './dto/update-wishlist-item.dto.js';
import { UpsertWishlistGiftMarkDto } from './dto/upsert-wishlist-gift-mark.dto.js';

@Injectable()
export class WishlistsService {
  constructor(
    private readonly prisma:
      PrismaService,
  ) {}

  async getArchives(userId: string) {
    const partnerId = await this.getPartnerId(userId);
    const visibleOwnerIds = partnerId ? [userId, partnerId] : [userId];

    const [current, relationships] = await Promise.all([
      this.prisma.wishlist.findMany({
        where: {
          ownerId: { in: visibleOwnerIds },
          items: { some: { archivedAt: { not: null } } },
        },
        select: {
          id: true,
          title: true,
          description: true,
          ownerId: true,
          owner: {
            select: { id: true, displayName: true, nickname: true, avatarUrl: true },
          },
          items: {
            where: { archivedAt: { not: null } },
            select: {
              id: true,
              title: true,
              description: true,
              url: true,
              imageUrl: true,
              price: true,
              priority: true,
              status: true,
              archivedAt: true,
              archiveReason: true,
              giftMarks: {
                where: {
                  OR: [{ partnerId: userId }, { hiddenFromOwner: false }],
                },
                select: { status: true, hiddenFromOwner: true },
              },
              createdAt: true,
              updatedAt: true,
            },
            orderBy: { archivedAt: 'desc' },
          },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.relationship.findMany({
        where: {
          status: 'ENDED',
          OR: [{ user1Id: userId }, { user2Id: userId }],
        },
        select: {
          id: true,
          user1Id: true,
          endedAt: true,
          archivedWishlists: true,
          user1: { select: { id: true, displayName: true, nickname: true } },
          user2: { select: { id: true, displayName: true, nickname: true } },
        },
        orderBy: { endedAt: 'desc' },
      }),
    ]);

    return {
      current: current.map((wishlist) => ({
        ...this.serializeWishlistGiftMarks(wishlist),
        canRestore: wishlist.ownerId === userId,
      })),
      relationships: relationships
        .filter((relationship) => Array.isArray(relationship.archivedWishlists))
        .map((relationship) => ({
          id: relationship.id,
          endedAt: relationship.endedAt,
          partner: relationship.user1Id === userId ? relationship.user2 : relationship.user1,
          wishlists: relationship.archivedWishlists,
        })),
    };
  }

  /*
   * Ищем активного партнёра
   * текущего пользователя.
   */
  private async getPartnerId(
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

        select: {
          user1Id: true,
          user2Id: true,
        },
      });

    if (!relationship) {
      return null;
    }

    return relationship.user1Id ===
      userId
      ? relationship.user2Id
      : relationship.user1Id;
  }

  /*
   * Получаем свои вишлисты
   * и вишлисты партнёра.
   */
  async findAll(
    userId: string,
  ) {
    const partnerId =
      await this.getPartnerId(
        userId,
      );

    const mine =
      await this.prisma.wishlist.findMany({
        where: {
          ownerId: userId,
        },

        select: {
          id: true,
          title: true,
          description: true,
          createdAt: true,
          updatedAt: true,

          owner: {
            select: {
              id: true,
              nickname: true,
              displayName: true,
              avatarUrl: true,
            },
          },

          items: {
            where: { archivedAt: null },
            select: {
              id: true,
              title: true,
              description: true,
              url: true,
              imageUrl: true,
              price: true,
              priority: true,
              status: true,
              giftMarks: {
                where: {
                  hiddenFromOwner: false,
                },
                select: {
                  status: true,
                  hiddenFromOwner: true,
                },
              },
              createdAt: true,
              updatedAt: true,
            },

            orderBy: [
              {
                priority: 'desc',
              },
              {
                createdAt: 'desc',
              },
            ],
          },

          _count: {
            select: {
              items: { where: { archivedAt: null } },
            },
          },
        },

        orderBy: {
          createdAt: 'desc',
        },
      });

    const partner =
      partnerId
        ? await this.prisma.wishlist.findMany({
            where: {
              ownerId:
                partnerId,
            },

            select: {
              id: true,
              title: true,
              description: true,
              createdAt: true,
              updatedAt: true,

              owner: {
                select: {
                  id: true,
                  nickname: true,
                  displayName: true,
                  avatarUrl: true,
                },
              },

              items: {
                where: { archivedAt: null },
                select: {
                  id: true,
                  title: true,
                  description: true,
                  url: true,
                  imageUrl: true,
                  price: true,
                  priority: true,
                  status: true,
                  giftMarks: {
                    where: {
                      partnerId:
                        userId,
                    },
                    select: {
                      status: true,
                      hiddenFromOwner: true,
                    },
                  },
                  createdAt: true,
                  updatedAt: true,
                },

                orderBy: [
                  {
                    priority:
                      'desc',
                  },
                  {
                    createdAt:
                      'desc',
                  },
                ],
              },

              _count: {
                select: {
                  items: { where: { archivedAt: null } },
                },
              },
            },

            orderBy: {
              createdAt:
                'desc',
            },
          })
        : [];

    return {
      mine:
        mine.map(
          (wishlist) =>
            this.serializeWishlistGiftMarks(
              wishlist,
            ),
        ),
      partner:
        partner.map(
          (wishlist) =>
            this.serializeWishlistGiftMarks(
              wishlist,
            ),
        ),
    };
  }

  /*
   * Получаем один вишлист.
   *
   * Смотреть его может владелец
   * или его текущий партнёр.
   */
  async findOne(
    userId: string,
    wishlistId: string,
  ) {
    const wishlist =
      await this.prisma.wishlist.findUnique({
        where: {
          id: wishlistId,
        },

        select: {
          id: true,
          ownerId: true,
          title: true,
          description: true,
          createdAt: true,
          updatedAt: true,

          owner: {
            select: {
              id: true,
              nickname: true,
              displayName: true,
              avatarUrl: true,
            },
          },

          items: {
            where: { archivedAt: null },
            select: {
              id: true,
              title: true,
              description: true,
              url: true,
              imageUrl: true,
              price: true,
              priority: true,
              status: true,
              giftMarks: {
                where: {
                  OR: [
                    {
                      partnerId:
                        userId,
                    },
                    {
                      hiddenFromOwner:
                        false,
                    },
                  ],
                },
                select: {
                  status: true,
                  hiddenFromOwner: true,
                },
              },
              createdAt: true,
              updatedAt: true,
            },

            orderBy: [
              {
                priority:
                  'desc',
              },
              {
                createdAt:
                  'desc',
              },
            ],
          },
        },
      });

    if (!wishlist) {
      throw new NotFoundException(
        'Вишлист не найден',
      );
    }

    if (
      wishlist.ownerId !==
      userId
    ) {
      const partnerId =
        await this.getPartnerId(
          userId,
        );

      if (
        partnerId !==
        wishlist.ownerId
      ) {
        throw new ForbiddenException(
          'У вас нет доступа к этому вишлисту',
        );
      }
    }

    const {
      ownerId:
        _ownerId,
      ...safeWishlist
    } = wishlist;

    return {
      ...safeWishlist,

      items:
        safeWishlist.items.map(
          (item) => {
            const {
              giftMarks,
              ...safeItem
            } = item;

            return {
              ...safeItem,
              giftMark:
                giftMarks[0] ??
                null,
            };
          },
        ),

      canEdit:
        wishlist.ownerId ===
        userId,
    };
  }

  /*
   * Создаём собственный вишлист.
   */
  async create(
    userId: string,
    data: CreateWishlistDto,
  ) {
    const title =
      data.title.trim();

    if (!title) {
      throw new BadRequestException(
        'Укажите название вишлиста',
      );
    }

    return this.prisma.wishlist.create({
      data: {
        ownerId:
          userId,

        title,

        description:
          data.description
            ?.trim() ||
          null,
      },

      select: {
        id: true,
        title: true,
        description: true,
        createdAt: true,
        updatedAt: true,

        owner: {
          select: {
            id: true,
            nickname: true,
            displayName: true,
            avatarUrl: true,
          },
        },

        items: {
          select: {
            id: true,
          },
        },
      },
    });
  }

  /*
   * Изменяем собственный вишлист.
   */
  async update(
    userId: string,
    wishlistId: string,
    data: UpdateWishlistDto,
  ) {
    await this.ensureWishlistOwner(
      userId,
      wishlistId,
    );

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
          'Название вишлиста не может быть пустым',
        );
      }
    }

    return this.prisma.wishlist.update({
      where: {
        id: wishlistId,
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
      },
    });
  }

  /*
   * Удаляем собственный вишлист.
   */
  async remove(
    userId: string,
    wishlistId: string,
  ) {
    await this.ensureWishlistOwner(
      userId,
      wishlistId,
    );

    await this.prisma.wishlist.delete({
      where: {
        id: wishlistId,
      },
    });

    return {
      success: true,
    };
  }

  /*
   * Добавляем желание.
   */
  async createItem(
    userId: string,
    wishlistId: string,
    data: CreateWishlistItemDto,
  ) {
    await this.ensureWishlistOwner(
      userId,
      wishlistId,
    );

    const title =
      data.title.trim();

    if (!title) {
      throw new BadRequestException(
        'Укажите название желания',
      );
    }

    return this.prisma.wishlistItem.create({
      data: {
        wishlistId,

        title,

        description:
          data.description
            ?.trim() ||
          null,

        url:
          data.url
            ?.trim() ||
          null,

        imageUrl:
          data.imageUrl
            ?.trim() ||
          null,

        price:
          data.price,

        priority:
          data.priority ??
          3,

        status: 'WANT',
      },
    });
  }

  /*
   * Изменяем желание.
   */
  async updateItem(
    userId: string,
    wishlistId: string,
    itemId: string,
    data: UpdateWishlistItemDto,
  ) {
    await this.ensureWishlistOwner(
      userId,
      wishlistId,
    );

    const item =
      await this.prisma.wishlistItem.findUnique({
        where: {
          id: itemId,
        },
      });

    if (!item) {
      throw new NotFoundException(
        'Желание не найдено',
      );
    }

    if (
      item.wishlistId !==
      wishlistId
    ) {
      throw new ForbiddenException(
        'Желание не относится к этому вишлисту',
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
          'Название желания не может быть пустым',
        );
      }
    }

    return this.prisma.wishlistItem.update({
      where: {
        id: itemId,
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

        url:
          data.url !==
          undefined
            ? data.url.trim() ||
              null
            : undefined,

        imageUrl:
          data.imageUrl !==
          undefined
            ? data.imageUrl
                .trim() ||
              null
            : undefined,

        price:
          data.price,

        priority:
          data.priority,
      },
    });
  }

  async archiveItem(
    userId: string,
    wishlistId: string,
    itemId: string,
    reason: 'RECEIVED' | 'NO_LONGER_NEEDED',
  ) {
    await this.ensureWishlistOwner(userId, wishlistId);
    const item = await this.prisma.wishlistItem.findUnique({
      where: { id: itemId },
      select: { id: true, wishlistId: true, archivedAt: true },
    });

    if (!item) {
      throw new NotFoundException('Желание не найдено');
    }
    if (item.wishlistId !== wishlistId) {
      throw new ForbiddenException('Желание не относится к этому вишлисту');
    }
    if (item.archivedAt) {
      throw new BadRequestException('Желание уже находится в архиве');
    }

    return this.prisma.wishlistItem.update({
      where: { id: itemId },
      data: {
        status: reason === 'RECEIVED' ? 'RECEIVED' : 'WANT',
        archivedAt: new Date(),
        archiveReason: reason,
      },
    });
  }

  async restoreItem(
    userId: string,
    wishlistId: string,
    itemId: string,
  ) {
    await this.ensureWishlistOwner(userId, wishlistId);
    const item = await this.prisma.wishlistItem.findUnique({
      where: { id: itemId },
      select: { id: true, wishlistId: true, archivedAt: true },
    });

    if (!item) {
      throw new NotFoundException('Желание не найдено');
    }
    if (item.wishlistId !== wishlistId) {
      throw new ForbiddenException('Желание не относится к этому вишлисту');
    }
    if (!item.archivedAt) {
      throw new BadRequestException('Желание уже находится в активном списке');
    }

    return this.prisma.$transaction(async (transaction) => {
      await transaction.wishlistGiftMark.deleteMany({ where: { itemId } });
      return transaction.wishlistItem.update({
        where: { id: itemId },
        data: {
          status: 'WANT',
          archivedAt: null,
          archiveReason: null,
        },
      });
    });
  }

  /*
   * Удаляем желание.
   */
  async removeItem(
    userId: string,
    wishlistId: string,
    itemId: string,
  ) {
    await this.ensureWishlistOwner(
      userId,
      wishlistId,
    );

    const item =
      await this.prisma.wishlistItem.findUnique({
        where: {
          id: itemId,
        },

        select: {
          id: true,
          wishlistId: true,
        },
      });

    if (!item) {
      throw new NotFoundException(
        'Желание не найдено',
      );
    }

    if (
      item.wishlistId !==
      wishlistId
    ) {
      throw new ForbiddenException(
        'Желание не относится к этому вишлисту',
      );
    }

    await this.prisma.wishlistItem.delete({
      where: {
        id: itemId,
      },
    });

    return {
      success: true,
    };
  }

  async upsertGiftMark(
    userId: string,
    itemId: string,
    data: UpsertWishlistGiftMarkDto,
  ) {
    await this.ensurePartnerWishlistItem(
      userId,
      itemId,
    );

    if (data.status === 'GIVEN') {
      const currentMark = await this.prisma.wishlistGiftMark.findUnique({
        where: { itemId_partnerId: { itemId, partnerId: userId } },
        select: { status: true },
      });
      if (currentMark?.status !== 'PURCHASED') {
        throw new BadRequestException('Сначала отметьте подарок как купленный');
      }

      return this.prisma.$transaction(async (transaction) => {
        const mark = await transaction.wishlistGiftMark.update({
          where: { itemId_partnerId: { itemId, partnerId: userId } },
          data: { status: 'GIVEN', hiddenFromOwner: false },
          select: { status: true, hiddenFromOwner: true },
        });
        await transaction.wishlistItem.update({
          where: { id: itemId },
          data: {
            status: 'RECEIVED',
            archivedAt: new Date(),
            archiveReason: 'RECEIVED',
          },
        });
        return mark;
      });
    }

    return this.prisma.wishlistGiftMark.upsert({
      where: {
        itemId_partnerId: {
          itemId,
          partnerId:
            userId,
        },
      },
      create: {
        itemId,
        partnerId:
          userId,
        status:
          data.status,
        hiddenFromOwner:
          data.hiddenFromOwner ??
          true,
      },
      update: {
        status:
          data.status,
        hiddenFromOwner:
          data.hiddenFromOwner,
      },
      select: {
        status: true,
        hiddenFromOwner: true,
      },
    });
  }

  async removeGiftMark(
    userId: string,
    itemId: string,
  ) {
    await this.ensurePartnerWishlistItem(
      userId,
      itemId,
    );

    await this.prisma.wishlistGiftMark.deleteMany({
      where: {
        itemId,
        partnerId:
          userId,
      },
    });

    return {
      success: true,
    };
  }

  private serializeWishlistGiftMarks<
    T extends {
      items: Array<{
        giftMarks: Array<{
          status: 'PLANNING' | 'PURCHASED' | 'GIVEN';
          hiddenFromOwner: boolean;
        }>;
      }>;
    },
  >(wishlist: T) {
    return {
      ...wishlist,
      items:
        wishlist.items.map(
          (item) => {
            const {
              giftMarks,
              ...safeItem
            } = item;

            return {
              ...safeItem,
              giftMark:
                giftMarks[0] ??
                null,
            };
          },
        ),
    };
  }

  private async ensurePartnerWishlistItem(
    userId: string,
    itemId: string,
  ) {
    const partnerId =
      await this.getPartnerId(
        userId,
      );

    if (!partnerId) {
      throw new ForbiddenException(
        'Отметки подарков доступны только для желаний партнёра',
      );
    }

    const item =
      await this.prisma.wishlistItem.findUnique({
        where: {
          id:
            itemId,
        },
        select: {
          id: true,
          archivedAt: true,
          wishlist: {
            select: {
              ownerId: true,
            },
          },
        },
      });

    if (!item) {
      throw new NotFoundException(
        'Желание не найдено',
      );
    }

    if (item.archivedAt) {
      throw new BadRequestException('Архивное желание нельзя отметить как подарок');
    }

    if (
      item.wishlist.ownerId !==
      partnerId
    ) {
      throw new ForbiddenException(
        'Отметку можно поставить только на желание текущего партнёра',
      );
    }

    return item;
  }

  /*
   * Проверяем, что пользователь
   * является владельцем вишлиста.
   */
  private async ensureWishlistOwner(
    userId: string,
    wishlistId: string,
  ) {
    const wishlist =
      await this.prisma.wishlist.findUnique({
        where: {
          id: wishlistId,
        },

        select: {
          id: true,
          ownerId: true,
        },
      });

    if (!wishlist) {
      throw new NotFoundException(
        'Вишлист не найден',
      );
    }

    if (
      wishlist.ownerId !==
      userId
    ) {
      throw new ForbiddenException(
        'Изменять вишлист может только его владелец',
      );
    }

    return wishlist;
  }
}
