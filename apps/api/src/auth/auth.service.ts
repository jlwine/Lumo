import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import {
  JwtService,
} from '@nestjs/jwt';

import {
  createHash,
  randomBytes,
} from 'node:crypto';

import * as bcrypt from 'bcrypt';

import {
  PrismaService,
} from '../prisma/prisma.service.js';

import {
  LoginDto,
} from './dto/login.dto.js';

import {
  RegisterDto,
} from './dto/register.dto.js';

const EMAIL_VERIFICATION_TOKEN_LIFETIME_MS =
  24 *
  60 *
  60 *
  1000;

const PASSWORD_RESET_TOKEN_LIFETIME_MS =
  30 *
  60 *
  1000;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma:
      PrismaService,

    private readonly jwtService:
      JwtService,
  ) {}

  /*
   * ---------------------------------------------------------
   * Регистрация
   * ---------------------------------------------------------
   */

  async register(
    data:
      RegisterDto,
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
     * Пароль в чистом виде
     * никогда не сохраняем.
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
          emailVerifiedAt: true,
          createdAt: true,
        },
      });

    /*
     * Сразу создаём ссылку
     * подтверждения email.
     */
    await this.createEmailVerificationToken(
      user.id,
      user.email,
    );

    return user;
  }

  /*
   * ---------------------------------------------------------
   * Авторизация
   * ---------------------------------------------------------
   */

  async login(
    data:
      LoginDto,
  ) {
    const rawLogin =
      data.login
        .trim()
        .toLowerCase();

    /*
     * Разрешаем пользователю случайно
     * написать @ перед никнеймом.
     */
    const login =
      rawLogin.startsWith(
        '@',
      )
        ? rawLogin.slice(
            1,
          )
        : rawLogin;

    /*
     * Ищем пользователя сразу
     * по email или nickname.
     */
    const user =
      await this.prisma.user.findFirst({
        where: {
          OR: [
            {
              email:
                login,
            },
            {
              nickname:
                login,
            },
          ],
        },
      });

    /*
     * Не сообщаем отдельно,
     * существует пользователь или нет.
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
     * Пока разрешаем вход даже
     * без подтверждения email.
     *
     * Запрет при необходимости
     * можно включить позже.
     */
    const accessToken =
      await this.jwtService.signAsync({
        sub:
          user.id,

        email:
          user.email,

        nickname:
          user.nickname,
      });

    return {
      accessToken,

      user: {
        id:
          user.id,

        email:
          user.email,

        nickname:
          user.nickname,

        displayName:
          user.displayName,

        avatarUrl:
          user.avatarUrl,

        birthDate:
          user.birthDate,

        emailVerifiedAt:
          user.emailVerifiedAt,
      },
    };
  }

  /*
   * ---------------------------------------------------------
   * Текущий пользователь
   * ---------------------------------------------------------
   */

  async getCurrentUser(
    userId:
      string,
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
          nickname: true,
          displayName: true,
          avatarUrl: true,
          birthDate: true,
          emailVerifiedAt: true,
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

  /*
   * ---------------------------------------------------------
   * Подтверждение email
   * ---------------------------------------------------------
   */

  async verifyEmail(
    token:
      string,
  ) {
    const tokenHash =
      this.hashToken(
        token,
      );

    const verificationToken =
      await this.prisma.emailVerificationToken.findUnique({
        where: {
          tokenHash,
        },
      });

    if (
      !verificationToken
    ) {
      throw new BadRequestException(
        'Ссылка подтверждения недействительна или уже была использована',
      );
    }

    /*
     * Проверяем срок действия.
     */
    if (
      verificationToken.expiresAt.getTime() <
      Date.now()
    ) {
      await this.prisma.emailVerificationToken.delete({
        where: {
          id:
            verificationToken.id,
        },
      });

      throw new BadRequestException(
        'Срок действия ссылки подтверждения истёк',
      );
    }

    /*
     * Одной транзакцией:
     *
     * 1. подтверждаем email;
     * 2. удаляем использованный токен.
     */
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: {
          id:
            verificationToken.userId,
        },

        data: {
          emailVerifiedAt:
            new Date(),
        },
      }),

      this.prisma.emailVerificationToken.delete({
        where: {
          id:
            verificationToken.id,
        },
      }),
    ]);

    return {
      success:
        true,

      message:
        'Email успешно подтверждён',
    };
  }

  /*
   * Повторная отправка письма
   * подтверждения.
   */
  async resendVerificationEmail(
    userId:
      string,
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
          emailVerifiedAt: true,
        },
      });

    if (!user) {
      throw new UnauthorizedException(
        'Пользователь не найден',
      );
    }

    /*
     * Если email уже подтверждён,
     * создавать новый токен бессмысленно.
     */
    if (
      user.emailVerifiedAt
    ) {
      return {
        success:
          true,

        message:
          'Email уже подтверждён',
      };
    }

    /*
     * Старый токен автоматически
     * будет заменён новым.
     */
    await this.createEmailVerificationToken(
      user.id,
      user.email,
    );

    return {
      success:
        true,

      message:
        'Письмо подтверждения отправлено повторно',
    };
  }

  /*
   * ---------------------------------------------------------
   * Запрос восстановления пароля
   * ---------------------------------------------------------
   */

  async forgotPassword(
    emailValue:
      string,
  ) {
    const email =
      emailValue
        .trim()
        .toLowerCase();

    const user =
      await this.prisma.user.findUnique({
        where: {
          email,
        },

        select: {
          id: true,
          email: true,
        },
      });

    /*
     * Очень важно:
     *
     * если пользователя не существует,
     * всё равно возвращаем точно такой же ответ.
     *
     * Иначе API позволяет перебирать
     * зарегистрированные email.
     */
    if (user) {
      await this.createPasswordResetToken(
        user.id,
        user.email,
      );
    }

    return {
      success:
        true,

      message:
        'Если аккаунт с таким email существует, мы отправили ссылку для восстановления пароля',
    };
  }

  /*
   * ---------------------------------------------------------
   * Установка нового пароля
   * ---------------------------------------------------------
   */

  async resetPassword(
    token:
      string,

    password:
      string,
  ) {
    const tokenHash =
      this.hashToken(
        token,
      );

    const resetToken =
      await this.prisma.passwordResetToken.findUnique({
        where: {
          tokenHash,
        },
      });

    if (!resetToken) {
      throw new BadRequestException(
        'Ссылка восстановления недействительна или уже была использована',
      );
    }

    /*
     * Просроченный токен сразу удаляем.
     */
    if (
      resetToken.expiresAt.getTime() <
      Date.now()
    ) {
      await this.prisma.passwordResetToken.delete({
        where: {
          id:
            resetToken.id,
        },
      });

      throw new BadRequestException(
        'Срок действия ссылки восстановления пароля истёк',
      );
    }

    const passwordHash =
      await bcrypt.hash(
        password,
        12,
      );

    /*
     * Пароль меняется и токен
     * уничтожается одной транзакцией.
     */
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: {
          id:
            resetToken.userId,
        },

        data: {
          passwordHash,
        },
      }),

      this.prisma.passwordResetToken.delete({
        where: {
          id:
            resetToken.id,
        },
      }),
    ]);

    return {
      success:
        true,

      message:
        'Пароль успешно изменён',
    };
  }

  /*
   * ---------------------------------------------------------
   * Внутренние методы
   * ---------------------------------------------------------
   */

  /*
   * Создаёт новый одноразовый токен
   * подтверждения email.
   *
   * Старый токен пользователя
   * автоматически становится недействительным.
   */
  private async createEmailVerificationToken(
    userId:
      string,

    email:
      string,
  ) {
    const token =
      this.generateToken();

    const tokenHash =
      this.hashToken(
        token,
      );

    const expiresAt =
      new Date(
        Date.now() +
          EMAIL_VERIFICATION_TOKEN_LIFETIME_MS,
      );

    await this.prisma.emailVerificationToken.upsert({
      where: {
        userId,
      },

      create: {
        userId,
        tokenHash,
        expiresAt,
      },

      update: {
        tokenHash,
        expiresAt,
        createdAt:
          new Date(),
      },
    });

    const url =
      this.buildFrontendUrl(
        '/verify-email',
        token,
      );

    /*
     * Пока реальная почта не подключена,
     * ссылка выводится в консоль backend.
     *
     * Следующим этапом этот console.log
     * заменит MailService.
     */
    console.log(
      '\n========================================',
    );

    console.log(
      'Lumo: подтверждение email',
    );

    console.log(
      `Email: ${email}`,
    );

    console.log(
      `Ссылка: ${url}`,
    );

    console.log(
      'Срок действия: 24 часа',
    );

    console.log(
      '========================================\n',
    );
  }

  /*
   * Создаёт одноразовый токен
   * восстановления пароля.
   */
  private async createPasswordResetToken(
    userId:
      string,

    email:
      string,
  ) {
    const token =
      this.generateToken();

    const tokenHash =
      this.hashToken(
        token,
      );

    const expiresAt =
      new Date(
        Date.now() +
          PASSWORD_RESET_TOKEN_LIFETIME_MS,
      );

    await this.prisma.passwordResetToken.upsert({
      where: {
        userId,
      },

      create: {
        userId,
        tokenHash,
        expiresAt,
      },

      update: {
        tokenHash,
        expiresAt,
        createdAt:
          new Date(),
      },
    });

    const url =
      this.buildFrontendUrl(
        '/reset-password',
        token,
      );

    /*
     * Временно выводим ссылку
     * восстановления в backend-консоль.
     */
    console.log(
      '\n========================================',
    );

    console.log(
      'Lumo: восстановление пароля',
    );

    console.log(
      `Email: ${email}`,
    );

    console.log(
      `Ссылка: ${url}`,
    );

    console.log(
      'Срок действия: 30 минут',
    );

    console.log(
      '========================================\n',
    );
  }

  /*
   * Генерируем 32 криптографически
   * случайных байта.
   *
   * base64url безопасно использовать
   * непосредственно внутри URL.
   */
  private generateToken() {
    return randomBytes(
      32,
    ).toString(
      'base64url',
    );
  }

  /*
   * Исходные токены в PostgreSQL
   * никогда не сохраняются.
   */
  private hashToken(
    token:
      string,
  ) {
    return createHash(
      'sha256',
    )
      .update(
        token,
      )
      .digest(
        'hex',
      );
  }

  /*
   * Собираем ссылку на frontend.
   *
   * Можно указать в .env:
   *
   * FRONTEND_URL=http://localhost:3000
   *
   * А в production заменить
   * на реальный адрес Lumo.
   */
  private buildFrontendUrl(
    path:
      string,

    token:
      string,
  ) {
    const frontendUrl =
      (
        process.env.FRONTEND_URL ??
        'http://localhost:3000'
      ).replace(
        /\/+$/,
        '',
      );

    return `${frontendUrl}${path}?token=${encodeURIComponent(
      token,
    )}`;
  }
}