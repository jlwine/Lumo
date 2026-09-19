import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateNotificationPreferencesDto {
  @IsOptional()
  @IsBoolean()
  relationship?: boolean;

  @IsOptional()
  @IsBoolean()
  calendar?: boolean;

  @IsOptional()
  @IsBoolean()
  dayBoard?: boolean;
}
