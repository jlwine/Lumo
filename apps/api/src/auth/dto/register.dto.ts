import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

export class RegisterDto {
  @IsEmail({}, {
    message: 'Введите корректный email',
  })
  email: string;

  @IsString({
    message: 'Никнейм должен быть строкой',
  })
  @Length(3, 30, {
    message: 'Никнейм должен содержать от 3 до 30 символов',
  })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message:
      'Никнейм может содержать только латинские буквы, цифры и знак подчёркивания',
  })
  nickname: string;

  @IsString({
    message: 'Пароль должен быть строкой',
  })
  @Length(8, 72, {
    message: 'Пароль должен содержать от 8 до 72 символов',
  })
  password: string;

  @IsOptional()
  @IsString({
    message: 'Имя должно быть строкой',
  })
  @MaxLength(50, {
    message: 'Имя не может быть длиннее 50 символов',
  })
  displayName?: string;
}