import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { Session } from './entities/session.entity';
import { CreateSessionDto } from './dto/create-session.dto';
import { UserRole } from '../users/enums/user-role.enum';
import { SessionStatus } from './enums/session-status.enum';
import { UpdateSessionDto } from './dto/update-session.dto';
import { IPaginationOptions } from 'src/interfaces/IPaginationOptions';
import { IPaginationResult } from 'src/interfaces/IPaginationResult';

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionsRepository: Repository<Session>,
  ) {}

  async create(
    createSessionDto: CreateSessionDto,
    coachId: string,
  ): Promise<Session> {
    const session = this.sessionsRepository.create({
      ...createSessionDto,
      coach: { id: coachId },
      client: { id: createSessionDto.clientId },
    });
    return this.sessionsRepository.save(session);
  }

  async findAll(
    userId: string,
    role: UserRole,
    paginationOptions?: IPaginationOptions,
  ): Promise<IPaginationResult<Session>> {
    const page = paginationOptions?.page
      ? parseInt(paginationOptions.page, 10)
      : 1;
    const limit = paginationOptions?.limit
      ? parseInt(paginationOptions.limit, 10)
      : 10;
    const skip = (page - 1) * limit;
    const query = this.sessionsRepository
      .createQueryBuilder('session')
      .leftJoin('session.coach', 'coach')
      .addSelect([
        'coach.id',
        'coach.firstName',
        'coach.lastName',
        'coach.email',
      ])
      .leftJoin('session.client', 'client')
      .addSelect([
        'client.id',
        'client.firstName',
        'client.lastName',
        'client.email',
      ]);
    if (role === UserRole.COACH) {
      query.where('coach.id = :userId', { userId });
    } else if (role === UserRole.CLIENT) {
      query.where('client.id = :userId', { userId });
    }
    query
      .skip(skip)
      .take(Math.min(limit, 100))
      .orderBy('session.createdAt', 'ASC');
    const [sessions, total] = await query.getManyAndCount();
    const result: IPaginationResult<Session> = {
      data: sessions,
      total,
      page,
      limit,
    };
    return result;
  }

  async findOne(id: string): Promise<Session> {
    const session = await this.sessionsRepository.findOne({
      where: { id },
      relations: ['coach', 'client'],
    });
    if (!session) {
      throw new NotFoundException('Session not found');
    }
    return session;
  }

  async update(
    id: string,
    updateSessionDto: UpdateSessionDto,
    userId: string,
    role: UserRole,
  ): Promise<Session> {
    const session = await this.findOne(id);
    if (role === UserRole.COACH && session.coach.id !== userId) {
      throw new ForbiddenException('You can only update your own sessions');
    }
    if (role === UserRole.CLIENT && session.client.id !== userId) {
      throw new ForbiddenException('You can only update your own sessions');
    }
    await this.sessionsRepository.update(id, updateSessionDto);
    return this.findOne(id);
  }

  async complete(id: string, userId: string): Promise<Session> {
    const session = await this.findOne(id);
    if (session.client.id !== userId) {
      throw new ForbiddenException('Only clients can complete sessions');
    }
    if (session.status !== SessionStatus.SCHEDULED) {
      throw new ForbiddenException('Session is not in scheduled state');
    }
    return this.update(
      id,
      { status: SessionStatus.COMPLETED },
      userId,
      UserRole.CLIENT,
    );
  }

  async findUpcoming(clientId: string): Promise<Session[]> {
    return this.sessionsRepository.find({
      where: {
        client: { id: clientId },
        status: SessionStatus.SCHEDULED,
        scheduledAt: MoreThan(new Date()),
      },
      order: {
        scheduledAt: 'ASC',
      },
    });
  }
}
