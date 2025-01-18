import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { Request as ExpressRequest } from 'express';
import { RequestUser } from 'src/auth/dto/RequestUser.dto';
import { UserRole } from './enums/user-role.enum';
import { IPaginationOptions } from 'src/interfaces/IPaginationOptions';
import { IPaginationResult } from 'src/interfaces/IPaginationResult';
import { User } from './entities/user.entity';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  getProfile(@Request() req) {
    return this.usersService.findById(req.user.id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req: ExpressRequest,
  ) {
    return this.usersService.update(id, updateUserDto, req.user as RequestUser);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    await this.usersService.delete(id);
  }

  @Post('admin')
  @UseGuards(AdminGuard)
  async createAdmin(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto, UserRole.ADMIN);
  }

  @Get('clients')
  @UseGuards(AdminGuard)
  async findAllClients(
    @Query() query: IPaginationOptions,
  ): Promise<IPaginationResult<User>> {
    return this.usersService.findAllClients(query);
  }
}
