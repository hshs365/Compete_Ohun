import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Group } from './group.entity';

/** 매치 예약 대기: 인원 마감 시 빈 자리 알림을 먼저 건 순서대로 받기 위한 대기열 */
@Entity('group_waitlist')
@Unique(['groupId', 'userId'])
export class GroupWaitlist {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @ManyToOne(() => Group, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group: Group;

  @Column({ name: 'group_id', type: 'int', nullable: false })
  @Index()
  groupId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id', type: 'int', nullable: false })
  @Index()
  userId: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
