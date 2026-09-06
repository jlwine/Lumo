import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import {
  AuthService,
} from './auth.service.js';

import {
  ForgotPasswordDto,
} from './dto/forgot-password.dto.js';

import {
  LoginDto,
} from './dto/login.dto.js';

import {
  RegisterDto,
} from './dto/register.dto.js';

import {
  ResetPasswordDto,
} from './dto/reset-password.dto.js';

import {
  VerifyEmailDto,
} from './dto/verify-email.dto.js';

import {
  JwtAuthGuard,
} from './guards/jwt-auth.guard.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService:
      AuthService,
  ) {}

  /*
   * Регистрация нового пользователя.
   *
   * После создания аккаунта сервис
   * также создаст токен подтверждения
   * email и отправит письмо.
   */
  @Post('register')
  async register(
    @Body()
    data:
      RegisterDto,
  ) {
    return this.authService.register(
      data,
    );
  }

  /*
   * Вход по email или никнейму.
   *
   * Пока не запрещаем вход пользователям
   * с неподтверждённым email.
   */
  @Post('login')
  async login(
    @Body()
    data:
      LoginDto,
  ) {
    return this.authService.login(
      data,
    );
  }

  /*
   * Данные текущего пользователя.
   */
  @Get('me')
  @UseGuards(
    JwtAuthGuard,
  )
  async me(
    @Req()
    request:
      any,
  ) {
    return this.authService.getCurrentUser(
      request.user.sub,
    );
  }

  /*
   * Подтверждение email по токену
   * из ссылки в письме.
   */
  @Post('verify-email')
  async verifyEmail(
    @Body()
    data:
      VerifyEmailDto,
  ) {
    return this.authService.verifyEmail(
      data.token,
    );
  }

  /*
   * Повторная отправка письма
   * подтверждения.
   *
   * Пользователь должен быть авторизован,
   * поэтому мы не принимаем email
   * напрямую из запроса.
   */
  @Post(
    'resend-verification-email',
  )
  @UseGuards(
    JwtAuthGuard,
  )
  async resendVerificationEmail(
    @Req()
    request:
      any,
  ) {
    return this.authService.resendVerificationEmail(
      request.user.sub,
    );
  }

  /*
   * Запрос восстановления пароля.
   *
   * Ответ будет одинаковым независимо
   * от того, существует указанный email
   * или нет.
   */
  @Post('forgot-password')
  async forgotPassword(
    @Body()
    data:
      ForgotPasswordDto,
  ) {
    return this.authService.forgotPassword(
      data.email,
    );
  }

  /*
   * Установка нового пароля
   * по одноразовому reset-токену.
   */
  @Post('reset-password')
  async resetPassword(
    @Body()
    data:
      ResetPasswordDto,
  ) {
    return this.authService.resetPassword(
      data.token,
      data.password,
    );
  }
}