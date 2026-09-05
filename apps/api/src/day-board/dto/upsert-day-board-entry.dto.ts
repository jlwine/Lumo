import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class UpsertDayBoardEntryDto {
  /*
   * Клиент передаёт локальную дату,
   * чтобы день не зависел
   * от часового пояса сервера.
   */
  @IsOptional()
  @IsString()
  @Matches(
    /^\d{4}-\d{2}-\d{2}$/,
    {
      message:
        'Дата должна быть в формате YYYY-MM-DD',
    },
  )
  date?: string;

  @IsOptional()
  @IsString()
  @MaxLength(
    280,
  )
  caption?: string;
}
