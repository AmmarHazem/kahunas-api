import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { Session } from '../sessions/entities/session.entity';
import { SessionStatus } from '../sessions/enums/session-status.enum';
import { CoachStats } from './interfaces/coach-stats.interface';
import { ClientProgress } from './interfaces/client-progress.interface';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionsRepository: Repository<Session>,
  ) {}

  async getCoachStats(coachId: string): Promise<CoachStats> {
    const [totalSessions, completedSessions] = await Promise.all([
      this.sessionsRepository.count({
        where: { coach: { id: coachId } },
      }),
      this.sessionsRepository.count({
        where: {
          coach: { id: coachId },
          status: SessionStatus.COMPLETED,
        },
      }),
    ]);

    const upcomingSessions = await this.sessionsRepository.count({
      where: {
        coach: { id: coachId },
        status: SessionStatus.SCHEDULED,
        scheduledAt: MoreThan(new Date()),
      },
    });

    return {
      totalSessions,
      completedSessions,
      upcomingSessions,
      completionRate: totalSessions
        ? (completedSessions / totalSessions) * 100
        : 0,
    };
  }

  async getClientProgress(clientId: string): Promise<ClientProgress> {
    const [totalSessions, completedSessions] = await Promise.all([
      this.sessionsRepository.count({
        where: { client: { id: clientId } },
      }),
      this.sessionsRepository.count({
        where: {
          client: { id: clientId },
          status: SessionStatus.COMPLETED,
        },
      }),
    ]);

    const upcomingSessions = await this.sessionsRepository.count({
      where: {
        client: { id: clientId },
        status: SessionStatus.SCHEDULED,
        scheduledAt: MoreThan(new Date()),
      },
    });

    return {
      totalSessions,
      completedSessions,
      upcomingSessions,
      progressRate: totalSessions
        ? (completedSessions / totalSessions) * 100
        : 0,
    };
  }

  async getTopCoaches(limit: number = 10): Promise<any[]> {
    return this.sessionsRepository
      .createQueryBuilder('session')
      .select('coach.id', 'coachId')
      .addSelect('COUNT(*)', 'totalSessions')
      .addSelect(
        'COUNT(CASE WHEN session.status = :completed THEN 1 END)',
        'completedSessions',
      )
      .leftJoin('session.coach', 'coach')
      .where('session.status = :completed', {
        completed: SessionStatus.COMPLETED,
      })
      .groupBy('coach.id')
      .orderBy('completedSessions', 'DESC')
      .limit(limit)
      .setParameter('completed', SessionStatus.COMPLETED)
      .getRawMany();
  }
}
