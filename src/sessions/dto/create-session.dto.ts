import { IsString, IsDateString, IsUUID, IsOptional } from 'class-validator';

export class CreateSessionDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  scheduledAt: Date;

  @IsUUID()
  clientId: string;
}
