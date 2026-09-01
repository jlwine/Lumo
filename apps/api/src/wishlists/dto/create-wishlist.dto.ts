import {
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateWishlistDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}