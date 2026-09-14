import { IsBoolean, IsIn, IsOptional } from 'class-validator';

export class UpsertWishlistGiftMarkDto {
  @IsIn(['PLANNING', 'PURCHASED'])
  status!: 'PLANNING' | 'PURCHASED';

  @IsOptional()
  @IsBoolean()
  hiddenFromOwner?: boolean;
}
