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

  async findAll(userId: string, role: UserRole): Promise<Session[]> {
    const query = this.sessionsRepository
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.coach', 'coach')
      .leftJoinAndSelect('session.client', 'client');

    if (role === UserRole.COACH) {
      query.where('coach.id = :userId', { userId });
    } else {
      query.where('client.id = :userId', { userId });
    }

    return query.getMany();
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
