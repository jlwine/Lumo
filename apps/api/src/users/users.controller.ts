import {
  Controller,
  Get,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

import { UsersService } from './users.service.js';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  @Get()
  async findAll() {
    return this.usersService.findAll();
  }

  @Get('search')
  async search(
    @Query('query') query: string,
    @Req() request: any,
  ) {
    return this.usersService.search(
      query ?? '',
      request.user.sub,
    );
  }

  @Get(':nickname')
  async findByNickname(
    @Param('nickname') nickname: string,
    @Req() request: any,
  ) {
    return this.usersService.findByNickname(
      nickname,
      request.user.sub,
    );
  }
}