import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';

@Controller('sessions')
@UseGuards(JwtAuthGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  create(@Body() createSessionDto: CreateSessionDto, @Request() req) {
    return this.sessionsService.create(createSessionDto, req.user.id);
  }

  @Get()
  findAll(@Request() req) {
    return this.sessionsService.findAll(req.user.id, req.user.role);
  }

  @Get('upcoming')
  findUpcoming(@Request() req) {
    return this.sessionsService.findUpcoming(req.user.id);
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
