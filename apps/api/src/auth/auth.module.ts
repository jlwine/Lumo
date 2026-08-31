import {
  Module,
} from '@nestjs/common';

import {
  ConfigModule,
  ConfigService,
} from '@nestjs/config';

import {
  JwtModule,
} from '@nestjs/jwt';

import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';

import {
  JwtAuthGuard,
} from './guards/jwt-auth.guard.js';

@Module({
  imports: [
    ConfigModule,

    JwtModule.registerAsync({
      imports: [
        ConfigModule,
      ],

      inject: [
        ConfigService,
      ],

      useFactory: (
        configService:
          ConfigService,
      ) => {
        const jwtSecret =
          configService.get<string>(
            'JWT_SECRET',
          );

        if (!jwtSecret) {
          throw new Error(
            'Переменная окружения JWT_SECRET не найдена',
          );
        }

        return {
          secret:
            jwtSecret,

          signOptions: {
            expiresIn:
              '15m',
          },
        };
      },
    }),
  ],

  controllers: [
    AuthController,
  ],

  providers: [
    AuthService,
    JwtAuthGuard,
  ],

  exports: [
    JwtModule,
    JwtAuthGuard,
  ],
})
export class AuthModule {}