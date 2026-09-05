import {
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdatePasswordDto {
  @IsString()
  @MinLength(1)
  @MaxLength(72)
  currentPassword:
    string;

  @IsString()
  @MinLength(
    8,
    {
      message:
        'Новый пароль должен содержать минимум 8 символов',
    },
  )
  @MaxLength(
    72,
    {
      message:
        'Пароль не должен быть длиннее 72 символов',
    },
  )
  newPassword:
    string;
}