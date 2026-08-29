import {
  IsString,
  MinLength,
} from 'class-validator';

export class LoginDto {
  @IsString({
    message: 'Email или никнейм должен быть строкой',
  })
  @MinLength(1, {
    message: 'Введите email или никнейм',
  })
  login: string;

  @IsString({
    message: 'Пароль должен быть строкой',
  })
  @MinLength(1, {
    message: 'Введите пароль',
  })
  password: string;
}