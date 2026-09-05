import {
  Module,
} from '@nestjs/common';

import {
  ConfigService,
} from '@nestjs/config';

import {
  JwtModule,
} from '@nestjs/jwt';

import { PrismaModule } from '../prisma/prisma.module.js';

import { DayBoardAuthGuard } from './day-board-auth.guard.js';
import { DayBoardController } from './day-board.controller.js';
import { DayBoardService } from './day-board.service.js';

@Module({
  imports: [
    PrismaModule,

    JwtModule.registerAsync({
      inject: [
        ConfigService,
      ],

      useFactory: (
        configService:
          ConfigService,
      ) => {
        const secret =
          configService.get<string>(
            'JWT_SECRET',
          );

        if (!secret) {
          throw new Error(
            'JWT_SECRET не задан',
          );
        }

        return {
          secret,
        };
      },
    }),
  ],

  controllers: [
    DayBoardController,
  ],

  providers: [
    DayBoardService,
    DayBoardAuthGuard,
  ],
})
export class DayBoardModule {}
