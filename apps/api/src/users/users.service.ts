import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        nickname: true,
        displayName: true,
        avatarUrl: true,
        createdAt: true,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async search(
    query: string,
    currentUserId: string,
  ) {
    const searchQuery = query
      .trim()
      .toLowerCase();

    if (!searchQuery) {
      return [];
    }

    return this.prisma.user.findMany({
      where: {
        AND: [
          {
            id: {
              not: currentUserId,
            },
          },

          {
            OR: [
              {
                nickname: {
                  contains: searchQuery,
                  mode: 'insensitive',
                },
              },

              {
                displayName: {
                  contains: searchQuery,
                  mode: 'insensitive',
                },
              },
            ],
          },
        ],
      },

      select: {
        id: true,
        nickname: true,
        displayName: true,
        avatarUrl: true,
      },

      take: 20,

      orderBy: {
        nickname: 'asc',
      },
    });
  }

  async findByNickname(
    nickname: string,
  ) {
    const normalizedNickname = nickname
      .trim()
      .toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: {
        nickname: normalizedNickname,
      },

      select: {
        id: true,
        nickname: true,
        displayName: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException(
        'Пользователь не найден',
      );
    }

    return user;
  }
}