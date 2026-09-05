import {
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class LoginDto {
  /*
   * Здесь намеренно НЕ используем @IsEmail(),
   * потому что поле принимает как email,
   * так и никнейм пользователя.
   */
  @IsString()
  @MinLength(3)
  @MaxLength(254)
  login!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;
}