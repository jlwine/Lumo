import { ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PrismaService } from '../prisma/prisma.service.js';

export type DayBoardAuthenticatedRequest = Request & {
  user?: { sub: string };
  dayBoardUserId?: string;
};

@Injectable()
export class DayBoardAuthGuard extends JwtAuthGuard {
  constructor(jwtService: JwtService, configService: ConfigService, prisma: PrismaService) {
    super(jwtService, configService, prisma);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Единая проверка подписи, срока действия и отзыва сессии.
    await super.canActivate(context);
    const request = context.switchToHttp().getRequest<DayBoardAuthenticatedRequest>();
    request.dayBoardUserId = request.user!.sub;
    return true;
  }
}