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
  description: string;

  @Column({ type: 'datetime' })
  @Index()
  scheduledAt: Date;

  @Column({
    type: 'varchar',
    enum: SessionStatus,
    default: SessionStatus.SCHEDULED,
  })
  @Index()
  status: SessionStatus;

  @ManyToOne(() => User, (user) => user.clientSessions)
  @Index()
  client: User;

  @ManyToOne(() => User, (user) => user.coachSessions)
  @Index()
  coach: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
