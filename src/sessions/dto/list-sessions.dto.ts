import { IsEnum, IsOptional } from 'class-validator';
import { SessionStatus } from '../enums/session-status.enum';
import { IPaginationOptions } from 'src/interfaces/IPaginationOptions';

export class ListSessionsDto implements IPaginationOptions {
  @IsOptional()
  page?: string;

  @IsOptional()
  limit?: string;

  @IsOptional()
  @IsEnum(SessionStatus)
  status?: SessionStatus;
}
