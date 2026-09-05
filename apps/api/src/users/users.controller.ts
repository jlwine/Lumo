import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import {
  FileInterceptor,
} from '@nestjs/platform-express';

import {
  randomUUID,
} from 'node:crypto';

import {
  mkdirSync,
} from 'node:fs';

import {
  extname,
  join,
} from 'node:path';

import {
  diskStorage,
} from 'multer';

import {
  JwtAuthGuard,
} from '../auth/guards/jwt-auth.guard.js';

import {
  UpdateEmailDto,
} from './dto/update-email.dto.js';

import {
  UpdatePasswordDto,
} from './dto/update-password.dto.js';

import {
  UpdateProfileDto,
} from './dto/update-profile.dto.js';

import {
  UsersService,
} from './users.service.js';

/*
 * Папка, в которой во время разработки
 * будут храниться аватары пользователей.
 */
const avatarDirectory =
  join(
    process.cwd(),
    'uploads',
    'avatars',
  );

/*
 * Создаём папку автоматически,
 * если её ещё нет.
 */
mkdirSync(
  avatarDirectory,
  {
    recursive: true,
  },
);

@Controller('users')
@UseGuards(
  JwtAuthGuard,
)
export class UsersController {
  constructor(
    private readonly usersService:
      UsersService,
  ) {}

  /*
   * Получение списка пользователей.
   */
  @Get()
  async findAll() {
    return this.usersService.findAll();
  }

  /*
   * Поиск пользователей
   * по никнейму или имени.
   */
  @Get('search')
  async search(
    @Query('query')
    query: string,

    @Req()
    request: any,
  ) {
    return this.usersService.search(
      query ?? '',
      request.user.sub,
    );
  }

  /*
   * Изменение данных
   * текущего пользователя.
   */
  @Patch('me')
  async updateProfile(
    @Body()
    data:
      UpdateProfileDto,

    @Req()
    request: any,
  ) {
    return this.usersService.updateProfile(
      request.user.sub,
      data,
    );
  }

  /*
   * Изменение электронной почты
   * текущего пользователя.
   *
   * Для подтверждения операции
   * требуется текущий пароль.
   */
  @Patch('me/email')
  async updateEmail(
    @Body()
    data:
      UpdateEmailDto,

    @Req()
    request: any,
  ) {
    return this.usersService.updateEmail(
      request.user.sub,
      data,
    );
  }

  /*
   * Изменение пароля
   * текущего пользователя.
   *
   * Пользователь должен знать
   * свой действующий пароль.
   */
  @Patch('me/password')
  async updatePassword(
    @Body()
    data:
      UpdatePasswordDto,

    @Req()
    request: any,
  ) {
    return this.usersService.updatePassword(
      request.user.sub,
      data,
    );
  }

  /*
   * Загрузка нового аватара.
   */
  @Post('me/avatar')
  @UseInterceptors(
    FileInterceptor(
      'avatar',
      {
        /*
         * Сохраняем файлы
         * на диск во время разработки.
         */
        storage:
          diskStorage({
            destination:
              avatarDirectory,

            /*
             * Для каждого аватара создаём
             * уникальное имя файла.
             */
            filename: (
              _request,
              file,
              callback,
            ) => {
              const extension =
                extname(
                  file.originalname,
                ).toLowerCase();

              callback(
                null,
                `${randomUUID()}${extension}`,
              );
            },
          }),

        /*
         * Ограничиваем размер
         * изображения пятью мегабайтами.
         */
        limits: {
          fileSize:
            5 *
            1024 *
            1024,
        },

        /*
         * Разрешаем только
         * поддерживаемые изображения.
         */
        fileFilter: (
          _request,
          file,
          callback,
        ) => {
          const allowedTypes = [
            'image/jpeg',
            'image/png',
            'image/webp',
          ];

          if (
            !allowedTypes.includes(
              file.mimetype,
            )
          ) {
            callback(
              new BadRequestException(
                'Разрешены только изображения JPG, PNG и WEBP',
              ),
              false,
            );

            return;
          }

          callback(
            null,
            true,
          );
        },
      },
    ),
  )
  async uploadAvatar(
    @UploadedFile()
    file:
      | Express.Multer.File
      | undefined,

    @Req()
    request: any,
  ) {
    if (!file) {
      throw new BadRequestException(
        'Файл изображения не найден',
      );
    }

    /*
     * Пока приложение работает локально,
     * используем адрес локального API.
     *
     * Позже в production это значение
     * можно будет задать через .env.
     */
    const publicApiUrl =
      process.env.PUBLIC_API_URL ??
      'http://localhost:3001';

    const avatarUrl =
      `${publicApiUrl}/uploads/avatars/${file.filename}`;

    return this.usersService.updateAvatar(
      request.user.sub,
      avatarUrl,
    );
  }

  /*
   * Получение публичного профиля
   * пользователя по никнейму.
   *
   * Динамический маршрут оставляем
   * последним, чтобы он не мешал
   * остальным маршрутам.
   */
  @Get(':nickname')
  async findByNickname(
    @Param('nickname')
    nickname:
      string,

    @Req()
    request: any,
  ) {
    return this.usersService.findByNickname(
      nickname,
      request.user.sub,
    );
  }
}