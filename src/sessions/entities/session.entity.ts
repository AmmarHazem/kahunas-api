import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { SessionStatus } from '../enums/session-status.enum';

@Entity('sessions')
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'datetime' })
  @Index('idx_client_status_scheduled', ['client', 'status', 'scheduledAt'])
  scheduledAt: Date;

  @Column({
    type: 'varchar',
    enum: SessionStatus,
    default: SessionStatus.SCHEDULED,
  })
  @Index()
  status: SessionStatus;

  @ManyToOne(() => User, (user) => user.clientSessions)
  @Index('idx_client_status', ['client', 'status'])
  client: User;

  @ManyToOne(() => User, (user) => user.coachSessions)
  @Index()
  coach: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
