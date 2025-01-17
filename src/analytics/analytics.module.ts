import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { Session } from '../sessions/entities/session.entity';
import { CoachAnalytics } from './entities/coach-analytics.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Session, CoachAnalytics])],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
