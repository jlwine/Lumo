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

  async register(data: RegisterDto) {
    const email = data.email.trim().toLowerCase();
    const nickname = data.nickname.trim().toLowerCase();

    const existingEmail = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingEmail) {
      throw new ConflictException(
        'Пользователь с таким email уже существует',
      );
    }

    const existingNickname = await this.prisma.user.findUnique({
      where: {
        nickname,
      },
    });

    if (existingNickname) {
      throw new ConflictException(
        'Пользователь с таким никнеймом уже существует',
      );
    }

    const passwordHash = await bcrypt.hash(
      data.password,
      12,
    );

    const user = await this.prisma.user.create({
      data: {
        email,
        nickname,
        displayName: data.displayName?.trim(),
        passwordHash,
      },
    });

    return {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
    };
  }

  async login(data: LoginDto) {
    const login = data.login.trim().toLowerCase();

    const user = login.includes('@')
      ? await this.prisma.user.findUnique({
          where: {
            email: login,
          },
        })
      : await this.prisma.user.findUnique({
          where: {
            nickname: login,
          },
        });

    if (!user) {
      throw new UnauthorizedException(
        'Неверный email, никнейм или пароль',
      );
    }

    const passwordMatches = await bcrypt.compare(
      data.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException(
        'Неверный email, никнейм или пароль',
      );
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      nickname: user.nickname,
    });

    return {
      accessToken,

      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      },
    };
  }
}