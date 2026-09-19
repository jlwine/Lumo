import { IsString, Length } from 'class-validator';

export class RevokeOtherSessionsDto {
  @IsString()
  @Length(1, 72, { message: 'Введите текущий пароль' })
  currentPassword!: string;
}
