import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto.js';
import { NotificationsService } from './notifications.service.js';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(@Req() request: { user: { sub: string } }) {
    return this.notifications.list(request.user.sub);
  }

  @Get('unread-count')
  unreadCount(@Req() request: { user: { sub: string } }) {
    return this.notifications.unreadCount(request.user.sub);
  }

  @Get('preferences')
  getPreferences(@Req() request: { user: { sub: string } }) {
    return this.notifications.getPreferences(request.user.sub);
  }

  @Patch('preferences')
  updatePreferences(
    @Req() request: { user: { sub: string } },
    @Body() data: UpdateNotificationPreferencesDto,
  ) {
    return this.notifications.updatePreferences(request.user.sub, data);
  }

  @Post('read-all')
  markAllRead(@Req() request: { user: { sub: string } }) {
    return this.notifications.markAllRead(request.user.sub);
  }

  @Post(':id/read')
  markRead(
    @Req() request: { user: { sub: string } },
    @Param('id') id: string,
  ) {
    return this.notifications.markRead(request.user.sub, id);
  }
}
