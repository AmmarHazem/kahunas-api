import {
  Injectable,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from './enums/user-role.enum';
import { RequestUser } from 'src/auth/dto/RequestUser.dto';
import { AnalyticsService } from 'src/analytics/analytics.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly analyticsService: AnalyticsService,
  ) {}

  async create(
    createUserDto: CreateUserDto,
    role: UserRole,
  ): Promise<{ user: User }> {
    const { user: existingUser } = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }
    const user = this.usersRepository.create(createUserDto);
    user.role = role;
    const savedUser = await this.usersRepository.save(user);
    return { user: savedUser };
  }

  async findByEmail(email: string): Promise<{ user: User | null }> {
    const user = await this.usersRepository.findOne({ where: { email } });
    return { user };
  }

  async findById(id: string): Promise<{ user: User | null }> {
    const user = await this.usersRepository.findOne({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        createdAt: true,
      },
    });
    return { user };
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    user: RequestUser,
  ): Promise<{ user: User | null }> {
    if (user.role !== UserRole.ADMIN && user.id !== id) {
      throw new ForbiddenException('You are not allowed to update this user');
    }
    await this.usersRepository.update(id, updateUserDto);
    const res = await this.findById(id);
    return res;
  }

  async delete(id: string): Promise<void> {
    await this.analyticsService.handleCoachDeleted({ coachId: id });
    await this.usersRepository.delete(id);
  }
}
