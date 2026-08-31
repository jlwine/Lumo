import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

import { CalendarService } from './calendar.service.js';

import { CreateCalendarEventDto } from './dto/create-calendar-event.dto.js';
import { UpdateCalendarEventDto } from './dto/update-calendar-event.dto.js';

@Controller('calendar')
@UseGuards(JwtAuthGuard)
export class CalendarController {
  constructor(
    private readonly calendarService:
      CalendarService,
  ) {}

  /*
   * Получение событий.
   *
   * Пример:
   * GET /calendar?from=...&to=...
   */
  @Get()
  async findAll(
    @Req()
    request: any,

    @Query('from')
    from?: string,

    @Query('to')
    to?: string,
  ) {
    return this.calendarService.findAll(
      request.user.sub,
      from,
      to,
    );
  }

  /*
   * Получение одного события.
   */
  @Get(':id')
  async findOne(
    @Param('id')
    eventId: string,

    @Req()
    request: any,
  ) {
    return this.calendarService.findOne(
      request.user.sub,
      eventId,
    );
  }

  /*
   * Создание события.
   */
  @Post()
  async create(
    @Body()
    data: CreateCalendarEventDto,

    @Req()
    request: any,
  ) {
    return this.calendarService.create(
      request.user.sub,
      data,
    );
  }

  /*
   * Изменение события.
   */
  @Patch(':id')
  async update(
    @Param('id')
    eventId: string,

    @Body()
    data: UpdateCalendarEventDto,

    @Req()
    request: any,
  ) {
    return this.calendarService.update(
      request.user.sub,
      eventId,
      data,
    );
  }

  /*
   * Удаление события.
   */
  @Delete(':id')
  async remove(
    @Param('id')
    eventId: string,

    @Req()
    request: any,
  ) {
    return this.calendarService.remove(
      request.user.sub,
      eventId,
    );
  }
}