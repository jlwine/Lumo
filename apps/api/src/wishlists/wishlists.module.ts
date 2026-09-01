import {
  Module,
} from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';

import { WishlistsController } from './wishlists.controller.js';
import { WishlistsService } from './wishlists.service.js';

@Module({
  imports: [
    AuthModule,
  ],

  controllers: [
    WishlistsController,
  ],

  providers: [
    WishlistsService,
  ],
})
export class WishlistsModule {}