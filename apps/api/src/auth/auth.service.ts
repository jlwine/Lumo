import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service.js';

import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /*
   * Регистрация нового пользователя.
   */
  async register(
    data: RegisterDto,
  ) {
    /*
     * Email и никнейм храним
     * в нижнем регистре.
     */
    const email =
      data.email
        .trim()
        .toLowerCase();

    const nickname =
      data.nickname
        .trim()
        .toLowerCase();

    /*
     * Проверяем, не занят ли email.
     */
    const userWithEmail =
      await this.prisma.user.findUnique({
        where: {
          email,
        },

        select: {
          id: true,
        },
      });

    if (userWithEmail) {
      throw new ConflictException(
        'Пользователь с таким email уже существует',
      );
    }

    /*
     * Проверяем уникальность никнейма.
     */
    const userWithNickname =
      await this.prisma.user.findUnique({
        where: {
          nickname,
        },

        select: {
          id: true,
        },
      });

    if (userWithNickname) {
      throw new ConflictException(
        'Этот никнейм уже занят',
      );
    }

    /*
     * Хешируем пароль.
     * Сам пароль в базу никогда
     * не сохраняется.
     */
    const passwordHash =
      await bcrypt.hash(
        data.password,
        12,
      );

    /*
     * Создаём пользователя.
     */
    const user =
      await this.prisma.user.create({
        data: {
          email,
          nickname,
          passwordHash,

          displayName:
            data.displayName
              ?.trim() ||
            null,
        },

        select: {
          id: true,
          email: true,
          nickname: true,
          displayName: true,
          avatarUrl: true,
          birthDate: true,
          createdAt: true,
        },
      });

    return user;
  }

  /*
   * Авторизация по email
   * или никнейму.
   */
  async login(
    data: LoginDto,
  ) {
    const login =
      data.login
        .trim()
        .toLowerCase();

    /*
     * Ищем пользователя сразу
     * по email или nickname.
     */
    const user =
      await this.prisma.user.findFirst({
        where: {
          OR: [
            {
              email: login,
            },
            {
              nickname: login,
            },
          ],
        },
      });

    /*
     * Не сообщаем отдельно,
     * существует пользователь или нет.
     * Это безопаснее для авторизации.
     */
    if (!user) {
      throw new UnauthorizedException(
        'Неверный логин или пароль',
      );
    }

    const passwordMatches =
      await bcrypt.compare(
        data.password,
        user.passwordHash,
      );

    if (!passwordMatches) {
      throw new UnauthorizedException(
        'Неверный логин или пароль',
      );
    }

    /*
     * В JWT храним только данные,
     * необходимые для авторизации.
     */
    const accessToken =
      await this.jwtService.signAsync({
        sub: user.id,
        email: user.email,
        nickname:
          user.nickname,
      });

    return {
      accessToken,

      user: {
        id: user.id,
        email: user.email,
        nickname:
          user.nickname,
        displayName:
          user.displayName,
        avatarUrl:
          user.avatarUrl,
        birthDate:
          user.birthDate,
      },
    };
  }

  /*
   * Получение текущего пользователя
   * по id из JWT.
   */
  async getCurrentUser(
    userId: string,
  ) {
    const user =
      await this.prisma.user.findUnique({
        where: {
          id: userId,
        },

        select: {
          id: true,
          email: true,
          nickname: true,
          displayName: true,
          avatarUrl: true,
          birthDate: true,
          createdAt: true,
        },
      });

    if (!user) {
      throw new UnauthorizedException(
        'Пользователь не найден',
      );
    }

    return user;
  }
}