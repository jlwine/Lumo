import {
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateDayBoardEntryDto {
  @IsOptional()
  @IsString()
  @MaxLength(
    280,
  )
  caption?: string;
}
