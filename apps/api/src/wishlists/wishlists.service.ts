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
              items: true,
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
                  items: true,
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

        status:
          data.status ??
          'WANT',
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

        status:
          data.status,
      },
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
          status: 'PLANNING' | 'PURCHASED';
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
