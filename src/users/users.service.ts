import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from './enums/user-role.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<{ user: User }> {
    const { user: existingUser } = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }
    const user = this.usersRepository.create(createUserDto);
    user.role = UserRole.ADMIN;
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
  ): Promise<{ user: User | null }> {
    await this.usersRepository.update(id, updateUserDto);
    const res = await this.findById(id);
    return res;
  }

  async delete(id: string): Promise<void> {
    await this.usersRepository.delete(id);
  }
}
