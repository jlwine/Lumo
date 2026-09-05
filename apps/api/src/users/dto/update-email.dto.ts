import {
  IsEmail,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateEmailDto {
  @IsEmail(
    {},
    {
      message:
        'Введите корректный email',
    },
  )
  @MaxLength(254)
  email:
    string;

  @IsString()
  @MinLength(1)
  @MaxLength(72)
  currentPassword:
    string;
}