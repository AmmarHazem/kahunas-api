import { Expose } from 'class-transformer';
import { User } from 'src/users/entities/user.entity';
import {
  Entity,
  Column,
  PrimaryColumn,
  UpdateDateColumn,
  JoinColumn,
  OneToOne,
} from 'typeorm';

@Entity('coach_analytics')
export class CoachAnalytics {
  @PrimaryColumn()
  coachId: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'coachId' })
  coach: User;

  @Column({ default: 0 })
  totalSessions: number;

  @Column({ default: 0 })
  completedSessions: number;

  @Column({ default: 0 })
  upcomingSessions: number;

  @Expose()
  get completionRate(): number {
    return this.totalSessions
      ? (this.completedSessions / this.totalSessions) * 100
      : 0;
  }

  @UpdateDateColumn()
  lastUpdatedAt: Date;
}
