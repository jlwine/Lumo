import { ValidationPipe } from '@nestjs/common';

import { NestFactory } from '@nestjs/core';

import {
  NestExpressApplication,
} from '@nestjs/platform-express';

import { join } from 'node:path';

import { AppModule } from './app.module.js';

async function bootstrap() {
  const app =
    await NestFactory.create<NestExpressApplication>(
      AppModule,
    );

  /*
   * Разрешаем frontend обращаться
   * к backend во время разработки.
   */
  app.enableCors({
    origin:
      'http://localhost:3000',

    credentials: true,
  });

  /*
   * Разрешаем браузеру получать
   * загруженные изображения.
   */
  app.useStaticAssets(
    join(
      process.cwd(),
      'uploads',
    ),
    {
      prefix:
        '/uploads/',
    },
  );

  /*
   * Глобальная проверка
   * входящих данных.
   */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted:
        true,
      transform: true,
    }),
  );

  const port =
    process.env.PORT ??
    3001;

  await app.listen(port);

  console.log(
    `API запущен: http://localhost:${port}`,
  );
}

void bootstrap();