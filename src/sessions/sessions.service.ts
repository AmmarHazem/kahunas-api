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
import { AnalyticsService } from '../analytics/analytics.service';

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionsRepository: Repository<Session>,
    private readonly analyticsService: AnalyticsService,
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
    const [savedSession] = await Promise.all([
      this.sessionsRepository.save(session),
      this.analyticsService.handleNewCoachSessionAdded({
        coachId,
      }),
    ]);
    return savedSession;
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

  async getUserSession(
    id: string,
    role: UserRole,
    userId: string,
  ): Promise<{ session: Session }> {
    let canAccess = false;
    const session = await this.sessionsRepository.findOne({
      where: { id },
      relations: ['coach', 'client'],
      select: {
        coach: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
        client: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    });
    if (!session) {
      throw new NotFoundException('Session not found');
    }
    if (role === UserRole.ADMIN) {
      canAccess = true;
    } else if (role === UserRole.COACH && session.coach.id === userId) {
      canAccess = true;
    } else if (role === UserRole.CLIENT && session.client.id === userId) {
      canAccess = true;
    }
    if (!canAccess) {
      throw new ForbiddenException(
        'You are not authorized to access this session',
      );
    }
    return { session };
  }

  async findOne(id: string): Promise<Session> {
    const session = await this.sessionsRepository.findOne({
      where: { id },
      relations: ['coach', 'client'],
      select: {
        coach: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
        client: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    });
    if (!session) {
      throw new NotFoundException('Session not found');
    }
    return session;
  }

  async update(
    sessionId: string,
    updateSessionDto: UpdateSessionDto,
    userId: string,
    role: UserRole,
  ): Promise<{ session: Session }> {
    const session = await this.findOne(sessionId);
    if (!session) {
      throw new NotFoundException('Session not found');
    }
    let canAccess = false;
    if (role === UserRole.ADMIN) {
      canAccess = true;
    } else if (role === UserRole.COACH && session.coach.id === userId) {
      canAccess = true;
    } else if (role === UserRole.CLIENT && session.client.id === userId) {
      canAccess = true;
    }
    if (!canAccess) {
      throw new ForbiddenException(
        'You are not authorized to access this session',
      );
    }
    await this.sessionsRepository.update(sessionId, updateSessionDto);
    const [updatedSession] = await Promise.all([
      this.findOne(sessionId),
      this.analyticsService.handleClientSessionStatusUpdated({
        coachId: session.coach.id,
        status: updateSessionDto.status,
      }),
    ]);
    return { session: updatedSession };
  }

  async getCoachComplete(
    userId: string,
    paginationOptions?: IPaginationOptions,
  ): Promise<IPaginationResult<Session>> {
    const page = paginationOptions?.page
      ? parseInt(paginationOptions.page, 10)
      : 1;
    const limit = paginationOptions?.limit
      ? parseInt(paginationOptions.limit, 10)
      : 10;
    const skip = (page - 1) * limit;
    const [sessions, total] = await this.sessionsRepository.findAndCount({
      where: {
        coach: { id: userId },
        status: SessionStatus.COMPLETED,
      },
      relations: ['coach', 'client'],
      select: {
        coach: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
        client: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      order: {
        scheduledAt: 'ASC',
      },
      skip,
      take: Math.min(limit, 100),
    });
    const result: IPaginationResult<Session> = {
      data: sessions,
      total,
      page,
      limit,
    };
    return result;
  }

  async getClientComplete(
    userId: string,
    paginationOptions?: IPaginationOptions,
  ): Promise<IPaginationResult<Session>> {
    const page = paginationOptions?.page
      ? parseInt(paginationOptions.page, 10)
      : 1;
    const limit = paginationOptions?.limit
      ? parseInt(paginationOptions.limit, 10)
      : 10;
    const skip = (page - 1) * limit;
    const [sessions, total] = await this.sessionsRepository.findAndCount({
      where: {
        client: { id: userId },
        status: SessionStatus.COMPLETED,
      },
      relations: ['coach', 'client'],
      select: {
        coach: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
        client: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      order: {
        scheduledAt: 'ASC',
      },
      skip,
      take: Math.min(limit, 100),
    });
    const result: IPaginationResult<Session> = {
      data: sessions,
      total,
      page,
      limit,
    };
    return result;
  }

  async findCoachUpcoming({
    coachId,
    paginationOptions,
  }: {
    coachId: string;
    paginationOptions?: IPaginationOptions;
  }): Promise<IPaginationResult<Session>> {
    const page = paginationOptions?.page
      ? parseInt(paginationOptions.page, 10)
      : 1;
    const limit = paginationOptions?.limit
      ? parseInt(paginationOptions.limit, 10)
      : 10;
    const skip = (page - 1) * limit;
    const [sessions, total] = await this.sessionsRepository.findAndCount({
      where: {
        coach: { id: coachId },
        status: SessionStatus.SCHEDULED,
        scheduledAt: MoreThan(new Date()),
      },
      relations: ['coach', 'client'],
      select: {
        coach: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
        client: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      order: {
        scheduledAt: 'ASC',
      },
      skip,
      take: Math.min(limit, 100),
    });
    const result: IPaginationResult<Session> = {
      data: sessions,
      total,
      page,
      limit,
    };
    return result;
  }

  async findClientUpcoming({
    clientId,
    paginationOptions,
  }: {
    clientId: string;
    paginationOptions?: IPaginationOptions;
  }): Promise<IPaginationResult<Session>> {
    const page = paginationOptions?.page
      ? parseInt(paginationOptions.page, 10)
      : 1;
    const limit = paginationOptions?.limit
      ? parseInt(paginationOptions.limit, 10)
      : 10;
    const skip = (page - 1) * limit;
    const [sessions, total] = await this.sessionsRepository.findAndCount({
      where: {
        client: { id: clientId },
        status: SessionStatus.SCHEDULED,
        scheduledAt: MoreThan(new Date()),
      },
      relations: ['coach', 'client'],
      select: {
        coach: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
        client: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      order: {
        scheduledAt: 'ASC',
      },
      skip,
      take: Math.min(limit, 100),
    });
    const result: IPaginationResult<Session> = {
      data: sessions,
      total,
      page,
      limit,
    };
    return result;
  }

  async deleteSession({ sessionId }: { sessionId: string }): Promise<void> {
    await this.sessionsRepository.delete(sessionId);
  }

  async updateSession(
    id: string,
    updateSessionDto: UpdateSessionDto,
  ): Promise<Session> {
    const session = await this.sessionsRepository.findOne({
      where: { id },
      relations: ['coach', 'client'],
    });
    if (!session) {
      throw new NotFoundException(`Session with ID ${id} not found`);
    }
    const oldStatus = session.status;
    Object.assign(session, updateSessionDto);
    const updatedSession = await this.sessionsRepository.save(session);
    if (oldStatus !== updatedSession.status) {
      await this.analyticsService.updateCoachAnalytics(session.coach.id);
    }
    return updatedSession;
  }
}
