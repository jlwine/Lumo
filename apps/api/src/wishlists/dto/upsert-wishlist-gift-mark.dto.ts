import { IsBoolean, IsIn, IsOptional } from 'class-validator';

export class UpsertWishlistGiftMarkDto {
  @IsIn(['PLANNING', 'PURCHASED', 'GIVEN'])
  status!: 'PLANNING' | 'PURCHASED' | 'GIVEN';

  @IsOptional()
  @IsBoolean()
  hiddenFromOwner?: boolean;
}
