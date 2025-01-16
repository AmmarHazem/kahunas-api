import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateSessionDto } from './create-session.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { SessionStatus } from '../enums/session-status.enum';

export class UpdateSessionDto extends PartialType(
  OmitType(CreateSessionDto, ['clientId'] as const),
) {
  @IsEnum(SessionStatus)
  @IsOptional()
  status?: SessionStatus;
}
