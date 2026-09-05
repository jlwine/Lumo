import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

import type {
  Request,
} from 'express';

export type DayBoardAuthenticatedRequest =
  Request & {
    dayBoardUserId?: string;
  };

type JwtPayload = {
  sub?: string;
  userId?: string;
  id?: string;
};

@Injectable()
export class DayBoardAuthGuard
implements CanActivate {
  constructor(
    private readonly jwtService:
      JwtService,
  ) {}

  async canActivate(
    context: ExecutionContext,
  ) {
    const request =
      context
        .switchToHttp()
        .getRequest<
          DayBoardAuthenticatedRequest
        >();

    const authorization =
      request.headers.authorization;

    if (
      !authorization ||
      !authorization.startsWith(
        'Bearer ',
      )
    ) {
      throw new UnauthorizedException(
        'Требуется авторизация',
      );
    }

    const token =
      authorization
        .slice(
          7,
        )
        .trim();

    if (!token) {
      throw new UnauthorizedException(
        'Требуется авторизация',
      );
    }

    try {
      const payload =
        await this.jwtService.verifyAsync<
          JwtPayload
        >(
          token,
        );

      const userId =
        payload.sub ??
        payload.userId ??
        payload.id;

      if (!userId) {
        throw new UnauthorizedException(
          'В токене отсутствует идентификатор пользователя',
        );
      }

      request.dayBoardUserId =
        userId;

      return true;
    } catch (
      error
    ) {
      if (
        error instanceof
        UnauthorizedException
      ) {
        throw error;
      }

      throw new UnauthorizedException(
        'Сессия истекла или токен недействителен',
      );
    }
  }
}
