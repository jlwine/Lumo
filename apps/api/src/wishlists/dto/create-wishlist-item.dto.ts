import {
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateWishlistItemDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsUrl({
    require_protocol: true,
    require_tld: false,
  })
  @MaxLength(2000)
  url?: string;

  /*
   * require_tld: false нужен
   * для локальной разработки,
   * потому что изображение сейчас
   * имеет адрес вида:
   *
   * http://localhost:3001/uploads/...
   */
  @IsOptional()
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