import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  RelationshipInvitationStatus,
  RelationshipStatus,
} from '../generated/prisma/client.js';

import { PrismaService } from '../prisma/prisma.service.js';

import { AcceptInvitationDto } from './dto/accept-invitation.dto.js';

@Injectable()
export class RelationshipsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  private async findActiveRelationship(
    userId: string,
  ) {
    return this.prisma.relationship.findFirst({
      where: {
        status: RelationshipStatus.ACTIVE,

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
  }

  async createInvitation(
    currentUserId: string,
    nickname: string,
  ) {
    const normalizedNickname = nickname
      .trim()
      .toLowerCase();

    const receiver =
      await this.prisma.user.findUnique({
        where: {
          nickname: normalizedNickname,
        },

        select: {
          id: true,
          nickname: true,
          displayName: true,
          avatarUrl: true,
        },
      });

    if (!receiver) {
      throw new NotFoundException(
        'Пользователь не найден',
      );
    }

    if (receiver.id === currentUserId) {
      throw new BadRequestException(
        'Нельзя пригласить самого себя в отношения',
      );
    }

    const currentRelationship =
      await this.findActiveRelationship(
        currentUserId,
      );

    if (currentRelationship) {
      throw new ConflictException(
        'Вы уже состоите в отношениях',
      );
    }

    const receiverRelationship =
      await this.findActiveRelationship(
        receiver.id,
      );

    if (receiverRelationship) {
      throw new ConflictException(
        'Пользователь уже состоит в отношениях',
      );
    }

    const existingInvitation =
      await this.prisma.relationshipInvitation.findFirst({
        where: {
          status:
            RelationshipInvitationStatus.PENDING,

          OR: [
            {
              senderId: currentUserId,
              receiverId: receiver.id,
            },
            {
              senderId: receiver.id,
              receiverId: currentUserId,
            },
          ],
        },
      });

    if (existingInvitation) {
      throw new ConflictException(
        'Между вами уже существует активное приглашение',
      );
    }

    return this.prisma.relationshipInvitation.create({
      data: {
        senderId: currentUserId,
        receiverId: receiver.id,
      },

      include: {
        sender: {
          select: {
            id: true,
            nickname: true,
            displayName: true,
            avatarUrl: true,
          },
        },

        receiver: {
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

  async getInvitations(
    currentUserId: string,
  ) {
    const received =
      await this.prisma.relationshipInvitation.findMany({
        where: {
          receiverId: currentUserId,

          status:
            RelationshipInvitationStatus.PENDING,
        },

        include: {
          sender: {
            select: {
              id: true,
              nickname: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },

        orderBy: {
          createdAt: 'desc',
        },
      });

    const sent =
      await this.prisma.relationshipInvitation.findMany({
        where: {
          senderId: currentUserId,

          status:
            RelationshipInvitationStatus.PENDING,
        },

        include: {
          receiver: {
            select: {
              id: true,
              nickname: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },

        orderBy: {
          createdAt: 'desc',
        },
      });

    return {
      received,
      sent,
    };
  }

  async acceptInvitation(
    currentUserId: string,
    invitationId: string,
    data: AcceptInvitationDto,
  ) {
    const invitation =
      await this.prisma.relationshipInvitation.findUnique({
        where: {
          id: invitationId,
        },
      });

    if (!invitation) {
      throw new NotFoundException(
        'Приглашение не найдено',
      );
    }

    if (
      invitation.receiverId !== currentUserId
    ) {
      throw new ForbiddenException(
        'Вы не можете принять это приглашение',
      );
    }

    if (
      invitation.status !==
      RelationshipInvitationStatus.PENDING
    ) {
      throw new ConflictException(
        'Это приглашение уже обработано',
      );
    }

    const senderRelationship =
      await this.findActiveRelationship(
        invitation.senderId,
      );

    if (senderRelationship) {
      throw new ConflictException(
        'Отправитель уже состоит в отношениях',
      );
    }

    const receiverRelationship =
      await this.findActiveRelationship(
        invitation.receiverId,
      );

    if (receiverRelationship) {
      throw new ConflictException(
        'Вы уже состоите в отношениях',
      );
    }

    const startedAt = data.startedAt
      ? new Date(data.startedAt)
      : new Date();

    if (startedAt > new Date()) {
      throw new BadRequestException(
        'Дата начала отношений не может быть в будущем',
      );
    }

    return this.prisma.$transaction(
      async (transaction) => {
        const relationship =
          await transaction.relationship.create({
            data: {
              user1Id: invitation.senderId,
              user2Id: invitation.receiverId,
              startedAt,
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

        await transaction.relationshipInvitation.update({
          where: {
            id: invitation.id,
          },

          data: {
            status:
              RelationshipInvitationStatus.ACCEPTED,

            respondedAt: new Date(),
          },
        });

        // Отменяем остальные активные приглашения
        // обоих пользователей после создания пары.
        await transaction.relationshipInvitation.updateMany({
          where: {
            status:
              RelationshipInvitationStatus.PENDING,

            id: {
              not: invitation.id,
            },

            OR: [
              {
                senderId: {
                  in: [
                    invitation.senderId,
                    invitation.receiverId,
                  ],
                },
              },
              {
                receiverId: {
                  in: [
                    invitation.senderId,
                    invitation.receiverId,
                  ],
                },
              },
            ],
          },

          data: {
            status:
              RelationshipInvitationStatus.CANCELLED,

            respondedAt: new Date(),
          },
        });

        return relationship;
      },
    );
  }

  async declineInvitation(
    currentUserId: string,
    invitationId: string,
  ) {
    const invitation =
      await this.prisma.relationshipInvitation.findUnique({
        where: {
          id: invitationId,
        },
      });

    if (!invitation) {
      throw new NotFoundException(
        'Приглашение не найдено',
      );
    }

    if (
      invitation.receiverId !== currentUserId
    ) {
      throw new ForbiddenException(
        'Вы не можете отклонить это приглашение',
      );
    }

    if (
      invitation.status !==
      RelationshipInvitationStatus.PENDING
    ) {
      throw new ConflictException(
        'Это приглашение уже обработано',
      );
    }

    return this.prisma.relationshipInvitation.update({
      where: {
        id: invitation.id,
      },

      data: {
        status:
          RelationshipInvitationStatus.DECLINED,

        respondedAt: new Date(),
      },
    });
  }

  async cancelInvitation(
    currentUserId: string,
    invitationId: string,
  ) {
    const invitation =
      await this.prisma.relationshipInvitation.findUnique({
        where: {
          id: invitationId,
        },
      });

    if (!invitation) {
      throw new NotFoundException(
        'Приглашение не найдено',
      );
    }

    if (
      invitation.senderId !== currentUserId
    ) {
      throw new ForbiddenException(
        'Вы не можете отменить это приглашение',
      );
    }

    if (
      invitation.status !==
      RelationshipInvitationStatus.PENDING
    ) {
      throw new ConflictException(
        'Это приглашение уже обработано',
      );
    }

    return this.prisma.relationshipInvitation.update({
      where: {
        id: invitation.id,
      },

      data: {
        status:
          RelationshipInvitationStatus.CANCELLED,

        respondedAt: new Date(),
      },
    });
  }

  async getCurrentRelationship(
    currentUserId: string,
  ) {
    const relationship =
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

    if (!relationship) {
      return {
        relationship: null,
      };
    }

    const partner =
      relationship.user1Id === currentUserId
        ? relationship.user2
        : relationship.user1;

    const millisecondsInDay =
      1000 * 60 * 60 * 24;

    const daysTogether = Math.floor(
      (Date.now() -
        relationship.startedAt.getTime()) /
        millisecondsInDay,
    );

    return {
      relationship: {
        id: relationship.id,
        status: relationship.status,
        startedAt: relationship.startedAt,
        daysTogether,
        partner,
      },
    };
  }
  async updateStartDate(
  currentUserId: string,
  startedAtString: string,
) {
  const relationship =
    await this.findActiveRelationship(currentUserId);

  if (!relationship) {
    throw new NotFoundException(
      'Вы не состоите в отношениях',
    );
  }

  const startedAt = new Date(startedAtString);

  if (startedAt > new Date()) {
    throw new BadRequestException(
      'Дата начала отношений не может быть в будущем',
    );
  }

  return this.prisma.relationship.update({
    where: {
      id: relationship.id,
    },

    data: {
      startedAt,
    },
  });
}

async endRelationship(
  currentUserId: string,
) {
  const relationship =
    await this.findActiveRelationship(currentUserId);

  if (!relationship) {
    throw new NotFoundException(
      'Вы не состоите в отношениях',
    );
  }

  return this.prisma.relationship.update({
    where: {
      id: relationship.id,
    },

    data: {
      status: RelationshipStatus.ENDED,
      endedAt: new Date(),
    },
  });
 }
}