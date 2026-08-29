import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';

import { RelationshipsController } from './relationships.controller.js';
import { RelationshipsService } from './relationships.service.js';

@Module({
  imports: [
    AuthModule,
  ],

  controllers: [
    RelationshipsController,
  ],

  providers: [
    RelationshipsService,
  ],
})
export class RelationshipsModule {}