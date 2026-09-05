import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import * as bcrypt from 'bcrypt';

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
  ) {}

  /*
   * Получение списка пользователей.
   */
  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        nickname: true,
        displayName: true,
        avatarUrl: true,
        birthDate: true,
        createdAt: true,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /*
   * Поиск пользователей.
   */
  async search(
    query: string,
    currentUserId: string,
  ) {
    const normalizedQuery =
      query.trim();

    if (
      normalizedQuery.length < 2
    ) {
      return [];
    }

    return this.prisma.user.findMany({
      where: {
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

  /*
   * Получение публичного профиля.
   */
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
          nickname: true,
          displayName: true,
          avatarUrl: true,
          birthDate: true,
          createdAt: true,
        },
      });

    if (!user) {
      throw new NotFoundException(
        'Пользователь не найден',
      );
    }

    /*
     * Активные отношения
     * открытого пользователя.
     */
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

    /*
     * Активные отношения
     * текущего пользователя.
     */
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

    /*
     * Незавершённое приглашение
     * между пользователями.
     */
    const pendingInvitation =
      user.id !==
      currentUserId
        ? await this.prisma.relationshipInvitation.findFirst(
            {
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
            },
          )
        : null;

    /*
     * Определяем партнёра
     * открытого пользователя.
     */
    let partner:
      | {
          id: string;

          nickname:
            string;

          displayName:
            | string
            | null;

          avatarUrl:
            | string
            | null;
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

    /*
     * Направление существующего
     * приглашения.
     */
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

  /*
   * Изменение данных профиля.
   */
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

    if (!user) {
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
      },

      select: {
        id: true,
        email: true,
        nickname: true,
        displayName: true,
        avatarUrl: true,
        birthDate: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /*
   * Изменение электронной почты.
   *
   * Перед изменением пользователь
   * должен подтвердить действие
   * своим текущим паролем.
   */
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
        },
      });

    if (!user) {
      throw new NotFoundException(
        'Пользователь не найден',
      );
    }

    /*
     * Проверяем текущий пароль.
     */
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

    /*
     * Email всегда храним
     * в нижнем регистре.
     */
    const normalizedEmail =
      data.email
        .trim()
        .toLowerCase();

    /*
     * Проверяем, не используется ли
     * этот email другим аккаунтом.
     */
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

    return this.prisma.user.update({
      where: {
        id:
          userId,
      },

      data: {
        email:
          normalizedEmail,
      },

      select: {
        id: true,
        email: true,
        nickname: true,
        displayName: true,
        avatarUrl: true,
        birthDate: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /*
   * Изменение пароля.
   *
   * Сначала проверяем старый пароль,
   * затем убеждаемся, что новый пароль
   * действительно отличается от него.
   */
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

    if (!user) {
      throw new NotFoundException(
        'Пользователь не найден',
      );
    }

    /*
     * Проверяем действующий пароль.
     */
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

    /*
     * Проверяем, что новый пароль
     * не совпадает со старым.
     */
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
     * Создаём новый bcrypt-хэш.
     *
     * 10 раундов достаточно
     * для текущего проекта.
     */
    const passwordHash =
      await bcrypt.hash(
        data.newPassword,
        10,
      );

    await this.prisma.user.update({
      where: {
        id:
          userId,
      },

      data: {
        passwordHash,
      },
    });

    return {
      success:
        true,
    };
  }

  /*
   * Сохраняем адрес нового аватара.
   */
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

    if (!user) {
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
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}