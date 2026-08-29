import {
  IsDateString,
  IsOptional,
} from 'class-validator';

export class AcceptInvitationDto {
  @IsOptional()
  @IsDateString(
    {},
    {
      message: 'Дата начала отношений указана неверно',
    },
  )
  startedAt?: string;
}