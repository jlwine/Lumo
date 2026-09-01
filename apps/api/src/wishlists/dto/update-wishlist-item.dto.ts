import {
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class UpdateWishlistItemDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @ValidateIf(
    (_object, value) =>
      value !== '',
  )
  @IsUrl({
    require_protocol: true,
    require_tld: false,
  })
  @MaxLength(2000)
  url?: string;

  /*
   * Пустая строка означает,
   * что пользователь удалил фото.
   *
   * localhost разрешаем
   * для локальной разработки.
   */
  @IsOptional()
  @ValidateIf(
    (_object, value) =>
      value !== '',
  )
  @IsUrl({
    require_protocol: true,
    require_tld: false,
  })
  @MaxLength(2000)
  imageUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100000000)
  price?: number;
}