import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import * as bcrypt from 'bcrypt';

import {
  AuthService,
} from '../auth/auth.service.js';

import {
  PrismaService,
} from '../prisma/prisma.service.js';

import {
  UpdateEmailDto,
} from './dto/update-email.dto.js';

import {
  UpdatePasswordDto,
} from './dto/update-password.dto.js';

import {
  UpdateProfileDto,
} from './dto/update-profile.dto.js';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma:
      PrismaService,

    private readonly authService:
      AuthService,
  ) {}

  async findAll() {
    return this.prisma.user.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        nickname: true,
        displayName: true,
        avatarUrl: true,
        birthDate: true,
        gender: true,
        createdAt: true,
      },

      orderBy: {
        createdAt:
          'desc',
      },
    });
  }

  async search(
    query: string,
    currentUserId: string,
  ) {
    const normalizedQuery =
      query.trim();

    if (
      normalizedQuery.length <
      2
    ) {
      return [];
    }

    return this.prisma.user.findMany({
      where: {
        deletedAt: null,
        id: {
          not:
            currentUserId,
        },

        OR: [
          {
            nickname: {
              contains:
                normalizedQuery,

              mode:
                'insensitive',
            },
          },

          {
            displayName: {
              contains:
                normalizedQuery,

              mode:
                'insensitive',
            },
          },
        ],
      },

      select: {
        id: true,
        nickname: true,
        displayName: true,
        avatarUrl: true,
      },

      take:
        20,

      orderBy: {
        nickname:
          'asc',
      },
    });
  }

  async findByNickname(
    nickname: string,
    currentUserId: string,
  ) {
    const normalizedNickname =
      nickname
        .trim()
        .toLowerCase();

    const user =
      await this.prisma.user.findUnique({
        where: {
          nickname:
            normalizedNickname,
        },

        select: {
          id: true,
          deletedAt: true,
          nickname: true,
          displayName: true,
          avatarUrl: true,
          birthDate: true,
          gender: true,
          createdAt: true,
        },
      });

    if (
      !user || user.deletedAt
    ) {
      throw new NotFoundException(
        'Пользователь не найден',
      );
    }

    const userRelationship =
      await this.prisma.relationship.findFirst({
        where: {
          status:
            'ACTIVE',

          OR: [
            {
              user1Id:
                user.id,
            },

            {
              user2Id:
                user.id,
            },
          ],
        },

        include: {
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

    const currentUserRelationship =
      await this.prisma.relationship.findFirst({
        where: {
          status:
            'ACTIVE',

          OR: [
            {
              user1Id:
                currentUserId,
            },

            {
              user2Id:
                currentUserId,
            },
          ],
        },
      });

    const pendingInvitation =
      user.id !==
      currentUserId
        ? await this.prisma.relationshipInvitation.findFirst({
            where: {
              status:
                'PENDING',

              OR: [
                {
                  senderId:
                    currentUserId,

                  receiverId:
                    user.id,
                },

                {
                  senderId:
                    user.id,

                  receiverId:
                    currentUserId,
                },
              ],
            },

            select: {
              id: true,
              senderId: true,
              receiverId: true,
              status: true,
            },
          })
        : null;

    let partner:
      | {
          id: string;
          nickname: string;
          displayName: string | null;
          avatarUrl: string | null;
        }
      | null =
      null;

    if (
      userRelationship
    ) {
      partner =
        userRelationship.user1Id ===
        user.id
          ? userRelationship.user2
          : userRelationship.user1;
    }

    const invitation =
      pendingInvitation
        ? {
            id:
              pendingInvitation.id,

            status:
              pendingInvitation.status,

            direction:
              pendingInvitation.senderId ===
              currentUserId
                ? ('SENT' as const)
                : ('RECEIVED' as const),
          }
        : null;

    let canInvite =
      true;

    let inviteUnavailableReason:
      | 'SELF'
      | 'CURRENT_USER_IN_RELATIONSHIP'
      | 'USER_IN_RELATIONSHIP'
      | 'INVITATION_ALREADY_EXISTS'
      | null =
      null;

    if (
      user.id ===
      currentUserId
    ) {
      canInvite =
        false;

      inviteUnavailableReason =
        'SELF';
    } else if (
      currentUserRelationship
    ) {
      canInvite =
        false;

      inviteUnavailableReason =
        'CURRENT_USER_IN_RELATIONSHIP';
    } else if (
      userRelationship
    ) {
      canInvite =
        false;

      inviteUnavailableReason =
        'USER_IN_RELATIONSHIP';
    } else if (
      pendingInvitation
    ) {
      canInvite =
        false;

      inviteUnavailableReason =
        'INVITATION_ALREADY_EXISTS';
    }

    return {
      id:
        user.id,

      nickname:
        user.nickname,

      displayName:
        user.displayName,

      avatarUrl:
        user.avatarUrl,

      birthDate:
        user.birthDate,

      gender:
        user.gender,

      createdAt:
        user.createdAt,

      relationship:
        userRelationship &&
        partner
          ? {
              status:
                'ACTIVE' as const,

              partner,

              startedAt:
                userRelationship.startedAt,
            }
          : {
              status:
                'SINGLE' as const,

              partner:
                null,

              startedAt:
                null,
            },

      invitation,

      actions: {
        canInvite,
        inviteUnavailableReason,
      },
    };
  }

  async deleteAccount(userId: string, currentPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true, deletedAt: true },
    });

    if (!user || user.deletedAt) {
      throw new NotFoundException('Аккаунт не найден');
    }
    if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
      throw new UnauthorizedException('Неверный текущий пароль');
    }

    const now = new Date();
    const impossiblePasswordHash = await bcrypt.hash(randomUUID(), 10);
    await this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.user.updateMany({
        where: { id: userId, deletedAt: null },
        data: {
          email: `deleted-${userId}@deleted.lumo.local`,
          nickname: `deleted_${userId.replace(/-/g, '')}`,
          passwordHash: impossiblePasswordHash,
          displayName: 'Удалённый пользователь',
          avatarUrl: null,
          birthDate: null,
          gender: null,
          emailVerifiedAt: null,
          deletedAt: now,
          sessionVersion: { increment: 1 },
        },
      });
      if (updated.count !== 1) {
        throw new NotFoundException('Аккаунт уже удалён');
      }

      const activeRelationships = await transaction.relationship.findMany({
        where: {
          status: 'ACTIVE',
          OR: [{ user1Id: userId }, { user2Id: userId }],
        },
      });
      for (const relationship of activeRelationships) {
        const partnerId = relationship.user1Id === userId
          ? relationship.user2Id : relationship.user1Id;
        const wishlists = await transaction.wishlist.findMany({
          where: { ownerId: userId },
          select: {
            id: true,
            title: true,
            description: true,
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
                  where: { partnerId },
                  select: { status: true },
                },
              },
            },
          },
        });
        const archivedWishlists = wishlists.map((wishlist) => ({
          id: wishlist.id,
          title: wishlist.title,
          description: wishlist.description,
          items: wishlist.items.map((item) => ({
            id: item.id,
            title: item.title,
            description: item.description,
            url: item.url,
            imageUrl: item.imageUrl,
            price: item.price,
            priority: item.priority,
            status: item.status,
            giftMark: item.giftMarks[0]?.status ?? null,
          })),
        }));
        await transaction.relationship.update({
          where: { id: relationship.id },
          data: { status: 'ENDED', endedAt: now, archivedWishlists },
        });
      }
      await transaction.relationshipInvitation.deleteMany({
        where: { OR: [{ senderId: userId }, { receiverId: userId }] },
      });
      await transaction.calendarEvent.deleteMany({
        where: { createdById: userId, scope: 'PERSONAL' },
      });
      await transaction.wishlistGiftMark.deleteMany({ where: { partnerId: userId } });
      await transaction.notification.deleteMany({ where: { userId } });
      await transaction.notificationPreferences.deleteMany({ where: { userId } });
      await transaction.emailVerificationToken.deleteMany({ where: { userId } });
      await transaction.passwordResetToken.deleteMany({ where: { userId } });
    });

    return { success: true };
  }

  async updateProfile(
    userId: string,
    data:
      UpdateProfileDto,
  ) {
    const user =
      await this.prisma.user.findUnique({
        where: {
          id:
            userId,
        },
      });

    if (
      !user
    ) {
      throw new NotFoundException(
        'Пользователь не найден',
      );
    }

    let nickname:
      | string
      | undefined;

    if (
      data.nickname !==
      undefined
    ) {
      nickname =
        data.nickname
          .trim()
          .toLowerCase();

      if (
        nickname !==
        user.nickname
      ) {
        const existingUser =
          await this.prisma.user.findUnique({
            where: {
              nickname,
            },

            select: {
              id: true,
            },
          });

        if (
          existingUser
        ) {
          throw new ConflictException(
            'Этот никнейм уже занят',
          );
        }
      }
    }

    let birthDate:
      | Date
      | undefined;

    if (
      data.birthDate !==
      undefined
    ) {
      birthDate =
        new Date(
          `${data.birthDate}T00:00:00.000Z`,
        );

      if (
        Number.isNaN(
          birthDate.getTime(),
        )
      ) {
        throw new ConflictException(
          'Некорректная дата рождения',
        );
      }

      if (
        birthDate.getTime() >
        Date.now()
      ) {
        throw new ConflictException(
          'Дата рождения не может быть в будущем',
        );
      }
    }

    return this.prisma.user.update({
      where: {
        id:
          userId,
      },

      data: {
        nickname,

        displayName:
          data.displayName !==
          undefined
            ? data.displayName
                .trim() ||
              null
            : undefined,

        birthDate,

        gender:
          data.gender !==
          undefined
            ? data.gender
            : undefined,
      },

      select: {
        id: true,
        email: true,
        nickname: true,
        displayName: true,
        avatarUrl: true,
        birthDate: true,
        gender: true,
        emailVerifiedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async updateEmail(
    userId: string,
    data:
      UpdateEmailDto,
  ) {
    const user =
      await this.prisma.user.findUnique({
        where: {
          id:
            userId,
        },

        select: {
          id: true,
          email: true,
          passwordHash: true,
          emailVerifiedAt: true,
        },
      });

    if (
      !user
    ) {
      throw new NotFoundException(
        'Пользователь не найден',
      );
    }

    const passwordMatches =
      await bcrypt.compare(
        data.currentPassword,
        user.passwordHash,
      );

    if (
      !passwordMatches
    ) {
      throw new BadRequestException(
        'Неверный текущий пароль',
      );
    }

    const normalizedEmail =
      data.email
        .trim()
        .toLowerCase();

    const existingUser =
      await this.prisma.user.findUnique({
        where: {
          email:
            normalizedEmail,
        },

        select: {
          id: true,
        },
      });

    if (
      existingUser &&
      existingUser.id !==
        userId
    ) {
      throw new ConflictException(
        'Этот email уже используется',
      );
    }

    if (
      normalizedEmail ===
      user.email
    ) {
      return this.prisma.user.findUniqueOrThrow({
        where: {
          id:
            userId,
        },

        select: {
          id: true,
          email: true,
          nickname: true,
          displayName: true,
          avatarUrl: true,
          birthDate: true,
          gender: true,
          emailVerifiedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    }

    const updatedUser =
      await this.prisma.user.update({
        where: {
          id:
            userId,
        },

        data: {
          email:
            normalizedEmail,

          emailVerifiedAt:
            null,
        },

        select: {
          id: true,
          email: true,
          nickname: true,
          displayName: true,
          avatarUrl: true,
          birthDate: true,
          gender: true,
          emailVerifiedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });

    /*
     * Новый email получает письмо
     * подтверждения.
     */
    await this.authService.sendVerificationEmailForUser(
      updatedUser.id,
      updatedUser.email,
    );

    /*
     * Старый email получает
     * уведомление безопасности.
     */
    await this.authService.sendEmailChangedNotification(
      user.email,
      updatedUser.email,
    );

    return updatedUser;
  }

  async updatePassword(
    userId: string,
    data:
      UpdatePasswordDto,
  ) {
    const user =
      await this.prisma.user.findUnique({
        where: {
          id:
            userId,
        },

        select: {
          id: true,
          passwordHash: true,
        },
      });

    if (
      !user
    ) {
      throw new NotFoundException(
        'Пользователь не найден',
      );
    }

    const currentPasswordMatches =
      await bcrypt.compare(
        data.currentPassword,
        user.passwordHash,
      );

    if (
      !currentPasswordMatches
    ) {
      throw new BadRequestException(
        'Неверный текущий пароль',
      );
    }

    const newPasswordMatchesOld =
      await bcrypt.compare(
        data.newPassword,
        user.passwordHash,
      );

    if (
      newPasswordMatchesOld
    ) {
      throw new BadRequestException(
        'Новый пароль должен отличаться от текущего',
      );
    }

    /*
     * Используем 12 bcrypt-раундов,
     * как при регистрации.
     */
    const passwordHash =
      await bcrypt.hash(
        data.newPassword,
        12,
      );

    /*
     * После ручной смены пароля
     * уничтожаем все ранее созданные
     * ссылки восстановления.
     */
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: {
          id:
            userId,
        },

        data: {
          passwordHash,

          /*
          * Отзываем абсолютно все
          * ранее выданные JWT пользователя.
          */
          sessionVersion: {
            increment:
              1,
          },
        },
      }),

      this.prisma.passwordResetToken.deleteMany({
        where: {
          userId,
        },
      }),
    ]);

    return {
      success:
        true,
    };
  }

  async updateAvatar(
    userId: string,
    avatarUrl: string,
  ) {
    const user =
      await this.prisma.user.findUnique({
        where: {
          id:
            userId,
        },

        select: {
          id: true,
        },
      });

    if (
      !user
    ) {
      throw new NotFoundException(
        'Пользователь не найден',
      );
    }

    return this.prisma.user.update({
      where: {
        id:
          userId,
      },

      data: {
        avatarUrl,
      },

      select: {
        id: true,
        email: true,
        nickname: true,
        displayName: true,
        avatarUrl: true,
        birthDate: true,
        gender: true,
        emailVerifiedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
