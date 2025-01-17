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
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { Roles } from 'src/auth/guards/Role.decorator';
import { UserRole } from 'src/users/enums/user-role.enum';
import { RoleGuard } from 'src/auth/guards/role.guard';
import { IPaginationOptions } from 'src/interfaces/IPaginationOptions';

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

  @Get()
  findAll(@Request() req, @Query() query: IPaginationOptions) {
    return this.sessionsService.findAll(req.user.id, req.user.role, query);
  }

  @Get('upcoming')
  findUpcoming(@Request() req, @Query() query?: IPaginationOptions) {
    return this.sessionsService.findUpcoming({
      clientId: req.user.id,
      role: req.user.role,
      paginationOptions: query,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sessionsService.findOne(id);
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

  @Put(':id/complete')
  complete(@Param('id') id: string, @Request() req) {
    return this.sessionsService.complete(id, req.user.id);
  }
}
