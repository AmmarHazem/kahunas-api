import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
  Delete,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { Roles } from 'src/auth/guards/Role.decorator';
import { UserRole } from 'src/users/enums/user-role.enum';
import { RoleGuard } from 'src/auth/guards/role.guard';
import { IPaginationOptions } from 'src/interfaces/IPaginationOptions';
import { ListSessionsDto } from './dto/list-sessions.dto';
import { IPaginationResult } from 'src/interfaces/IPaginationResult';
import { Session } from './entities/session.entity';
import { AdminGuard } from 'src/auth/guards/admin.guard';

@Controller('sessions')
@UseGuards(JwtAuthGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  @Roles(UserRole.COACH)
  @UseGuards(RoleGuard)
  create(@Body() createSessionDto: CreateSessionDto, @Request() req) {
    return this.sessionsService.create(createSessionDto, req.user.id);
  }

  @Roles(UserRole.ADMIN)
  @UseGuards(RoleGuard)
  @Get()
  findAll(@Request() req, @Query() query: IPaginationOptions) {
    return this.sessionsService.findAll(req.user.id, req.user.role, query);
  }

  @Roles(UserRole.CLIENT)
  @UseGuards(RoleGuard)
  @Get('client-upcoming')
  findClientUpcoming(@Request() req, @Query() query?: IPaginationOptions) {
    return this.sessionsService.findClientUpcoming({
      clientId: req.user.id,
      paginationOptions: query,
    });
  }

  @Roles(UserRole.COACH)
  @UseGuards(RoleGuard)
  @Get('coach-upcoming')
  findCoachUpcoming(@Request() req, @Query() query?: IPaginationOptions) {
    return this.sessionsService.findCoachUpcoming({
      coachId: req.user.id,
      paginationOptions: query,
    });
  }

  @Roles(UserRole.CLIENT)
  @UseGuards(RoleGuard)
  @Get('client-complete')
  getClientComplete(@Request() req, @Query() query?: IPaginationOptions) {
    return this.sessionsService.getClientComplete(req.user.id, query);
  }

  @Roles(UserRole.COACH)
  @UseGuards(RoleGuard)
  @Get('coach-complete')
  getCoachComplete(@Request() req, @Query() query?: IPaginationOptions) {
    return this.sessionsService.getCoachComplete(req.user.id, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.sessionsService.getUserSession(id, req.user.role, req.user.id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateSessionDto: UpdateSessionDto,
    @Request() req,
  ) {
    return this.sessionsService.update(
      id,
      updateSessionDto,
      req.user.id,
      req.user.role,
    );
  }

  @Roles(UserRole.ADMIN)
  @UseGuards(RoleGuard)
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.sessionsService.deleteSession({ sessionId: id });
  }

  @UseGuards(AdminGuard)
  @Get('client/:clientId')
  async findUserSessions(
    @Param('clientId') clientId: string,
    @Query() query: ListSessionsDto,
  ): Promise<IPaginationResult<Session>> {
    return this.sessionsService.findUserSessions({
      clientId: clientId,
      options: query,
    });
  }
}
