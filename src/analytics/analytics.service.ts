import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { Session } from '../sessions/entities/session.entity';
import { SessionStatus } from '../sessions/enums/session-status.enum';
import { CoachStats } from './interfaces/coach-stats.interface';
import { ClientProgress } from './interfaces/client-progress.interface';
import { CoachAnalytics } from './entities/coach-analytics.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionsRepository: Repository<Session>,
    @InjectRepository(CoachAnalytics)
    private readonly coachAnalyticsRepository: Repository<CoachAnalytics>,
  ) {}

  handleClientSessionStatusUpdated({
    coachId,
    status,
  }: {
    coachId: string;
    status: SessionStatus;
  }) {
    if (status === SessionStatus.COMPLETED) {
      this.coachAnalyticsRepository.update(
        { coachId: coachId },
        {
          completedSessions: () => 'completedSessions + 1',
          upcomingSessions: () => 'upcomingSessions - 1',
        },
      );
    } else if (status === SessionStatus.CANCELLED) {
      this.coachAnalyticsRepository.update(
        { coachId: coachId },
        { upcomingSessions: () => 'upcomingSessions - 1' },
      );
    }
  }

  handleCoachCreated({ coachId }: { coachId: string }) {
    this.coachAnalyticsRepository.insert({
      coachId,
      totalSessions: 0,
      completedSessions: 0,
      upcomingSessions: 0,
    });
  }

  handleNewCoachSessionAdded({ coachId }: { coachId: string }) {
    this.coachAnalyticsRepository.update(
      { coachId: coachId },
      {
        totalSessions: () => 'totalSessions + 1',
        upcomingSessions: () => 'upcomingSessions + 1',
      },
    );
  }

  async updateCoachAnalytics(coachId: string): Promise<void> {
    const [totalSessions, completedSessions, upcomingSessions] =
      await Promise.all([
        this.sessionsRepository.count({
          where: { coach: { id: coachId } },
        }),
        this.sessionsRepository.count({
          where: {
            coach: { id: coachId },
            status: SessionStatus.COMPLETED,
          },
        }),
        this.sessionsRepository.count({
          where: {
            coach: { id: coachId },
            status: SessionStatus.SCHEDULED,
            scheduledAt: MoreThan(new Date()),
          },
        }),
      ]);
    const completionRate = totalSessions
      ? (completedSessions / totalSessions) * 100
      : 0;
    await this.coachAnalyticsRepository.save({
      coachId,
      totalSessions,
      completedSessions,
      upcomingSessions,
      completionRate,
    });
  }

  async getCoachStats(coachId: string): Promise<CoachStats> {
    let analytics = await this.coachAnalyticsRepository.findOne({
      where: { coachId },
    });
    if (!analytics) {
      await this.updateCoachAnalytics(coachId);
      analytics = await this.coachAnalyticsRepository.findOne({
        where: { coachId },
      });
    }
    return {
      totalSessions: analytics.totalSessions,
      completedSessions: analytics.completedSessions,
      upcomingSessions: analytics.upcomingSessions,
      completionRate: analytics.completionRate,
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

  async getTopCoaches(limit: number = 10) {
    const topCoaches = await this.coachAnalyticsRepository
      .createQueryBuilder('analytics')
      .leftJoin('analytics.coach', 'coach')
      .addSelect([
        'coach.id',
        'coach.firstName',
        'coach.lastName',
        'coach.email',
      ])
      .addSelect('analytics.totalSessions', 'totalSessions')
      .addSelect('analytics.completedSessions', 'completedSessions')
      .orderBy('analytics.completedSessions', 'DESC')
      .limit(limit)
      .getRawMany();
    return { topCoaches };
  }
}
