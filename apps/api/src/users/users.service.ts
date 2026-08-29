import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  RelationshipInvitationStatus,
  RelationshipStatus,
} from '../generated/prisma/client.js';

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
    currentUserId: string,
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

    const relationship =
      await this.prisma.relationship.findFirst({
        where: {
          status: RelationshipStatus.ACTIVE,

          OR: [
            {
              user1Id: user.id,
            },
            {
              user2Id: user.id,
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
          status: RelationshipStatus.ACTIVE,

          OR: [
            {
              user1Id: currentUserId,
            },
            {
              user2Id: currentUserId,
            },
          ],
        },
      });

    const pendingInvitation =
      currentUserId !== user.id
        ? await this.prisma.relationshipInvitation.findFirst({
            where: {
              status:
                RelationshipInvitationStatus.PENDING,

              OR: [
                {
                  senderId: currentUserId,
                  receiverId: user.id,
                },
                {
                  senderId: user.id,
                  receiverId: currentUserId,
                },
              ],
            },
          })
        : null;

    let relationshipInfo;

    if (!relationship) {
      relationshipInfo = {
        status: 'SINGLE',
        partner: null,
        startedAt: null,
      };
    } else {
      const partner =
        relationship.user1Id === user.id
          ? relationship.user2
          : relationship.user1;

      relationshipInfo = {
        status: 'ACTIVE',
        partner,
        startedAt: relationship.startedAt,
      };
    }

    let canInvite = true;
    let inviteUnavailableReason: string | null = null;

    if (user.id === currentUserId) {
      canInvite = false;
      inviteUnavailableReason = 'SELF';
    } else if (currentUserRelationship) {
      canInvite = false;
      inviteUnavailableReason =
        'CURRENT_USER_IN_RELATIONSHIP';
    } else if (relationship) {
      canInvite = false;
      inviteUnavailableReason =
        'USER_IN_RELATIONSHIP';
    } else if (pendingInvitation) {
      canInvite = false;
      inviteUnavailableReason =
        'INVITATION_ALREADY_EXISTS';
    }

    let invitation = null;

    if (pendingInvitation) {
      invitation = {
        id: pendingInvitation.id,
        status: pendingInvitation.status,

        direction:
          pendingInvitation.senderId === currentUserId
            ? 'SENT'
            : 'RECEIVED',
      };
    }

    return {
      ...user,

      relationship: relationshipInfo,

      actions: {
        canInvite,
        inviteUnavailableReason,
      },

      invitation,
    };
  }
}