import {
  Module,
} from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';

import { CalendarController } from './calendar.controller.js';
import { CalendarService } from './calendar.service.js';

@Module({
  imports: [
    /*
     * CalendarController использует JwtAuthGuard.
     * AuthModule экспортирует JwtAuthGuard
     * и JwtModule с JwtService.
     */
    AuthModule,
  ],

  controllers: [
    CalendarController,
  ],

  providers: [
    CalendarService,
  ],
})
export class CalendarModule {}