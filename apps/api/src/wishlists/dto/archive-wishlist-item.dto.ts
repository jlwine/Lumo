import { IsIn } from 'class-validator';

export class ArchiveWishlistItemDto {
  @IsIn(['RECEIVED', 'NO_LONGER_NEEDED'])
  reason!: 'RECEIVED' | 'NO_LONGER_NEEDED';
}
