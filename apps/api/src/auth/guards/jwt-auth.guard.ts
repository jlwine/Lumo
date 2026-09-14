import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import {
  ConfigService,
} from '@nestjs/config';

import {
  JwtService,
} from '@nestjs/jwt';

import {
  PrismaService,
} from '../../prisma/prisma.service.js';

type JwtPayload = {
  sub?: string;

  email?: string;

  nickname?: string;

  sessionVersion?: number;

  iat?: number;

  exp?: number;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService:
      JwtService,

    private readonly configService:
      ConfigService,

    private readonly prisma:
      PrismaService,
  ) {}

  async canActivate(
    context:
      ExecutionContext,
  ): Promise<boolean> {
    const request =
      context
        .switchToHttp()
        .getRequest();

    const authHeader =
      request.headers.authorization;

    if (
      !authHeader
    ) {
      throw new UnauthorizedException(
        'Токен авторизации не передан',
      );
    }

    const [
      type,
      token,
    ] =
      authHeader.split(
        ' ',
      );

    if (
      type !==
        'Bearer' ||
      !token
    ) {
      throw new UnauthorizedException(
        'Неверный формат токена авторизации',
      );
    }

    const secret =
      this.configService.get<string>(
        'JWT_SECRET',
      );

    if (
      !secret
    ) {
      throw new Error(
        'Переменная окружения JWT_SECRET не найдена',
      );
    }

    let payload:
      JwtPayload;

    /*
     * Сначала обычная проверка JWT:
     *
     * - подпись;
     * - срок действия;
     * - корректность структуры.
     */
    try {
      payload =
        await this.jwtService.verifyAsync<JwtPayload>(
          token,
          {
            secret,
          },
        );
    } catch {
      throw new UnauthorizedException(
        'Токен недействителен или истёк',
      );
    }

    if (
      !payload.sub
    ) {
      throw new UnauthorizedException(
        'Токен недействителен',
      );
    }

    /*
     * Дополнительно проверяем,
     * существует ли пользователь
     * и совпадает ли версия его сессии.
     */
    const user =
      await this.prisma.user.findUnique({
        where: {
          id:
            payload.sub,
        },

        select: {
          id: true,
          sessionVersion: true,
        },
      });

    if (
      !user
    ) {
      throw new UnauthorizedException(
        'Пользователь не найден',
      );
    }

    /*
     * Старые JWT, созданные до появления
     * sessionVersion, считаем версией 0.
     *
     * Благодаря этому миграция сама по себе
     * не выкинет всех пользователей из аккаунтов.
     */
    const tokenSessionVersion =
      typeof payload.sessionVersion ===
      'number'
        ? payload.sessionVersion
        : 0;

    if (
      tokenSessionVersion !==
      user.sessionVersion
    ) {
      throw new UnauthorizedException(
        'Сессия завершена. Войдите снова',
      );
    }

    request.user =
      payload;

    return true;
  }
}