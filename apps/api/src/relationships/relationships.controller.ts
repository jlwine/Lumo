import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

import { AcceptInvitationDto } from './dto/accept-invitation.dto.js';
import { RelationshipsService } from './relationships.service.js';

@Controller('relationships')
@UseGuards(JwtAuthGuard)
export class RelationshipsController {
  constructor(
    private readonly relationshipsService:
      RelationshipsService,
  ) {}

  @Post('invitations/:nickname')
  async createInvitation(
    @Param('nickname') nickname: string,
    @Req() request: any,
  ) {
    return this.relationshipsService.createInvitation(
      request.user.sub,
      nickname,
    );
  }

  @Get('invitations')
  async getInvitations(
    @Req() request: any,
  ) {
    return this.relationshipsService.getInvitations(
      request.user.sub,
    );
  }

  @Post('invitations/:id/accept')
  async acceptInvitation(
    @Param('id') invitationId: string,
    @Body() data: AcceptInvitationDto,
    @Req() request: any,
  ) {
    return this.relationshipsService.acceptInvitation(
      request.user.sub,
      invitationId,
      data,
    );
  }

  @Post('invitations/:id/decline')
  async declineInvitation(
    @Param('id') invitationId: string,
    @Req() request: any,
  ) {
    return this.relationshipsService.declineInvitation(
      request.user.sub,
      invitationId,
    );
  }

  @Delete('invitations/:id')
  async cancelInvitation(
    @Param('id') invitationId: string,
    @Req() request: any,
  ) {
    return this.relationshipsService.cancelInvitation(
      request.user.sub,
      invitationId,
    );
  }

  @Get('me')
  async getCurrentRelationship(
    @Req() request: any,
  ) {
    return this.relationshipsService.getCurrentRelationship(
      request.user.sub,
    );
  }
}