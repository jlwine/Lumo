import {
  Module,
} from '@nestjs/common';

import {
  ConfigModule,
} from '@nestjs/config';

import { AuthModule } from './auth/auth.module.js';
import { CalendarModule } from './calendar/calendar.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { RelationshipsModule } from './relationships/relationships.module.js';
import { UsersModule } from './users/users.module.js';
import { WishlistsModule } from './wishlists/wishlists.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    PrismaModule,
    AuthModule,
    UsersModule,
    RelationshipsModule,
    CalendarModule,
    WishlistsModule,
  ],
})
export class AppModule {}