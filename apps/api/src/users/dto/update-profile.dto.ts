import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message:
      'Никнейм может содержать только латинские буквы, цифры и нижнее подчёркивание',
  })
  nickname?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  displayName?: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string;


  @IsOptional()
  @IsString({
    message: 'Пол должен быть строкой',
  })
  @IsIn(
    [
      'MALE',
      'FEMALE',
    ],
    {
      message: 'Выберите пол',
    },
  )
  gender?:
    | 'MALE'
    | 'FEMALE';
}
