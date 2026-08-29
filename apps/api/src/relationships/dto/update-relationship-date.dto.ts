import { IsDateString } from 'class-validator';

export class UpdateRelationshipDateDto {
  @IsDateString(
    {},
    {
      message: 'Дата начала отношений указана неверно',
    },
  )
  startedAt: string;
}