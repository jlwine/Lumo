import { tr } from '@/i18n/core';

import type {
  Area,
} from 'react-easy-crop';

/*
 * Загружаем изображение в браузере,
 * чтобы затем нарисовать нужный участок
 * на Canvas.
 */
function createImage(
  src: string,
) {
  return new Promise<HTMLImageElement>(
    (
      resolve,
      reject,
    ) => {
      const image =
        new Image();

      image.onload = () =>
        resolve(image);

      image.onerror = (
        error,
      ) =>
        reject(error);

      image.src = src;
    },
  );
}

/*
 * Создаём квадратный аватар
 * размером 512x512.
 *
 * На сервер отправляется уже
 * обрезанная версия изображения.
 */
export async function getCroppedAvatar(
  imageSrc: string,
  crop: Area,
) {
  const image =
    await createImage(
      imageSrc,
    );

  const canvas =
    document.createElement(
      'canvas',
    );

  const context =
    canvas.getContext(
      '2d',
    );

  if (!context) {
    throw new Error(
      tr('Не удалось подготовить изображение'),
    );
  }

  const avatarSize =
    512;

  canvas.width =
    avatarSize;

  canvas.height =
    avatarSize;

  /*
   * Заполняем фон белым.
   * Это важно для PNG с прозрачностью,
   * поскольку итоговый файл будет JPEG.
   */
  context.fillStyle =
    '#ffffff';

  context.fillRect(
    0,
    0,
    avatarSize,
    avatarSize,
  );

  context.drawImage(
    image,

    crop.x,
    crop.y,
    crop.width,
    crop.height,

    0,
    0,
    avatarSize,
    avatarSize,
  );

  return new Promise<Blob>(
    (
      resolve,
      reject,
    ) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(
              new Error(
                tr('Не удалось создать аватар'),
              ),
            );

            return;
          }

          resolve(blob);
        },

        'image/jpeg',
        0.92,
      );
    },
  );
}