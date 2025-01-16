import { IsString, IsDateString, IsUUID } from 'class-validator';

export class CreateSessionDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsDateString()
  scheduledAt: Date;

  @IsUUID()
  clientId: string;
}
