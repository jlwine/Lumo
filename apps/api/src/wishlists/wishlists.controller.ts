import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
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
} from 'crypto';

import {
  mkdirSync,
} from 'fs';

import {
  join,
} from 'path';

import {
  diskStorage,
} from 'multer';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

import { CreateWishlistDto } from './dto/create-wishlist.dto.js';
import { CreateWishlistItemDto } from './dto/create-wishlist-item.dto.js';
import { UpdateWishlistDto } from './dto/update-wishlist.dto.js';
import { UpdateWishlistItemDto } from './dto/update-wishlist-item.dto.js';

import { WishlistsService } from './wishlists.service.js';

/*
 * Папка для изображений желаний.
 */
const wishlistImagesDirectory =
  join(
    process.cwd(),
    'uploads',
    'wishlist-items',
  );

/*
 * Создаём папку автоматически,
 * если её ещё нет.
 */
mkdirSync(
  wishlistImagesDirectory,
  {
    recursive: true,
  },
);

@Controller('wishlists')
@UseGuards(JwtAuthGuard)
export class WishlistsController {
  constructor(
    private readonly wishlistsService:
      WishlistsService,
  ) {}

  /*
   * Загружаем изображение
   * для желания.
   */
  @Post('items/image')
  @UseInterceptors(
    FileInterceptor(
      'file',
      {
        storage:
          diskStorage({
            destination:
              wishlistImagesDirectory,

            filename: (
              _request,
              file,
              callback,
            ) => {
              const extension =
                getImageExtension(
                  file.mimetype,
                );

              callback(
                null,
                `${randomUUID()}${extension}`,
              );
            },
          }),

        limits: {
          fileSize:
            5 * 1024 * 1024,

          files: 1,
        },

        fileFilter: (
          _request,
          file,
          callback,
        ) => {
          const allowedMimeTypes = [
            'image/jpeg',
            'image/png',
            'image/webp',
          ];

          if (
            !allowedMimeTypes.includes(
              file.mimetype,
            )
          ) {
            callback(
              new BadRequestException(
                'Поддерживаются только JPG, PNG и WEBP',
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
  async uploadItemImage(
    @UploadedFile()
    file:
      | Express.Multer.File
      | undefined,

    @Req()
    request: any,
  ) {
    if (!file) {
      throw new BadRequestException(
        'Изображение не получено',
      );
    }

    /*
     * Формируем абсолютный URL,
     * который frontend сможет
     * сразу сохранить в WishlistItem.
     */
    const imageUrl =
      `${request.protocol}://${request.get(
        'host',
      )}/uploads/wishlist-items/${file.filename}`;

    return {
      imageUrl,
    };
  }

  /*
   * Свои вишлисты
   * и вишлисты партнёра.
   */
  @Get()
  async findAll(
    @Req()
    request: any,
  ) {
    return this.wishlistsService.findAll(
      request.user.sub,
    );
  }

  /*
   * Получаем один вишлист.
   */
  @Get(':id')
  async findOne(
    @Param('id')
    wishlistId: string,

    @Req()
    request: any,
  ) {
    return this.wishlistsService.findOne(
      request.user.sub,
      wishlistId,
    );
  }

  /*
   * Создаём новый вишлист.
   */
  @Post()
  async create(
    @Body()
    data: CreateWishlistDto,

    @Req()
    request: any,
  ) {
    return this.wishlistsService.create(
      request.user.sub,
      data,
    );
  }

  /*
   * Изменяем вишлист.
   */
  @Patch(':id')
  async update(
    @Param('id')
    wishlistId: string,

    @Body()
    data: UpdateWishlistDto,

    @Req()
    request: any,
  ) {
    return this.wishlistsService.update(
      request.user.sub,
      wishlistId,
      data,
    );
  }

  /*
   * Удаляем вишлист.
   */
  @Delete(':id')
  async remove(
    @Param('id')
    wishlistId: string,

    @Req()
    request: any,
  ) {
    return this.wishlistsService.remove(
      request.user.sub,
      wishlistId,
    );
  }

  /*
   * Добавляем желание.
   */
  @Post(':id/items')
  async createItem(
    @Param('id')
    wishlistId: string,

    @Body()
    data: CreateWishlistItemDto,

    @Req()
    request: any,
  ) {
    return this.wishlistsService.createItem(
      request.user.sub,
      wishlistId,
      data,
    );
  }

  /*
   * Изменяем желание.
   */
  @Patch(':id/items/:itemId')
  async updateItem(
    @Param('id')
    wishlistId: string,

    @Param('itemId')
    itemId: string,

    @Body()
    data: UpdateWishlistItemDto,

    @Req()
    request: any,
  ) {
    return this.wishlistsService.updateItem(
      request.user.sub,
      wishlistId,
      itemId,
      data,
    );
  }

  /*
   * Удаляем желание.
   */
  @Delete(':id/items/:itemId')
  async removeItem(
    @Param('id')
    wishlistId: string,

    @Param('itemId')
    itemId: string,

    @Req()
    request: any,
  ) {
    return this.wishlistsService.removeItem(
      request.user.sub,
      wishlistId,
      itemId,
    );
  }
}

/*
 * Не доверяем расширению исходного файла.
 * Определяем его по MIME-типу.
 */
function getImageExtension(
  mimeType: string,
) {
  switch (mimeType) {
    case 'image/png':
      return '.png';

    case 'image/webp':
      return '.webp';

    case 'image/jpeg':
    default:
      return '.jpg';
  }
}