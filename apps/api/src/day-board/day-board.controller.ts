import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import {
  FileInterceptor,
} from '@nestjs/platform-express';

import {
  memoryStorage,
} from 'multer';

import {
  DayBoardAuthGuard,
} from './day-board-auth.guard.js';

import type {
  DayBoardAuthenticatedRequest,
} from './day-board-auth.guard.js';

import { DayBoardService } from './day-board.service.js';

import { UpdateDayBoardEntryDto } from './dto/update-day-board-entry.dto.js';
import { UpsertDayBoardEntryDto } from './dto/upsert-day-board-entry.dto.js';

@Controller(
  'day-board',
)
@UseGuards(
  DayBoardAuthGuard,
)
export class DayBoardController {
  constructor(
    private readonly dayBoardService:
      DayBoardService,
  ) {}

  /*
   * Сегодняшние фотографии пары.
   */
  @Get(
    'today',
  )
  getToday(
    @Req()
    request:
      DayBoardAuthenticatedRequest,

    @Query(
      'date',
    )
    date?: string,
  ) {
    return this.dayBoardService.getToday(
      this.getUserId(
        request,
      ),
      date,
    );
  }

  /*
   * Облегчённая версия
   * для будущего мобильного виджета.
   */
  @Get(
    'widget',
  )
  getWidget(
    @Req()
    request:
      DayBoardAuthenticatedRequest,

    @Query(
      'date',
    )
    date?: string,
  ) {
    return this.dayBoardService.getWidget(
      this.getUserId(
        request,
      ),
      date,
    );
  }

  /*
   * Архив предыдущих дней.
   */
  @Get(
    'history',
  )
  getHistory(
    @Req()
    request:
      DayBoardAuthenticatedRequest,

    @Query(
      'limit',
    )
    limit?: string,
  ) {
    return this.dayBoardService.getHistory(
      this.getUserId(
        request,
      ),
      limit,
    );
  }

  /*
   * Создание или замена
   * сегодняшней фотографии.
   *
   * Файл хранится в памяти только
   * до обработки Sharp.
   */
  @Post(
    'today',
  )
  @UseInterceptors(
    FileInterceptor(
      'file',
      {
        storage:
          memoryStorage(),

        limits: {
          fileSize:
            10 *
            1024 *
            1024,
        },
      },
    ),
  )
  upsertToday(
    @Req()
    request:
      DayBoardAuthenticatedRequest,

    @Body()
    data:
      UpsertDayBoardEntryDto,

    @UploadedFile()
    file?:
      Express.Multer.File,
  ) {
    return this.dayBoardService.upsertToday(
      this.getUserId(
        request,
      ),
      data,
      file,
    );
  }

  /*
   * Изменяем подпись,
   * не заменяя фотографию.
   */
  @Patch(
    'today',
  )
  updateToday(
    @Req()
    request:
      DayBoardAuthenticatedRequest,

    @Query(
      'date',
    )
    date:
      string | undefined,

    @Body()
    data:
      UpdateDayBoardEntryDto,
  ) {
    return this.dayBoardService.updateToday(
      this.getUserId(
        request,
      ),
      date,
      data,
    );
  }

  /*
   * Удаляем свою фотографию
   * за выбранный день.
   */
  @Delete(
    'today',
  )
  removeToday(
    @Req()
    request:
      DayBoardAuthenticatedRequest,

    @Query(
      'date',
    )
    date?: string,
  ) {
    return this.dayBoardService.removeToday(
      this.getUserId(
        request,
      ),
      date,
    );
  }

  private getUserId(
    request:
      DayBoardAuthenticatedRequest,
  ) {
    if (
      !request.dayBoardUserId
    ) {
      throw new UnauthorizedException(
        'Требуется авторизация',
      );
    }

    return request.dayBoardUserId;
  }
}
