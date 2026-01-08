import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

export enum ActivityType {
  GROUP_JOIN = 'group_join', // 모임 참가
  GROUP_CREATE = 'group_create', // 모임 생성
  GROUP_COMPLETE = 'group_complete', // 모임 완주
  GROUP_LEAVE = 'group_leave', // 모임 탈퇴
  GROUP_LATE = 'group_late', // 모임 지각
  GROUP_ABSENT = 'group_absent', // 모임 불참
  EVENT_VICTORY = 'event_victory', // 이벤트 승리
  SKILL_UPGRADE = 'skill_upgrade', // 실력 레벨 상승
  RANKER_ACHIEVED = 'ranker_achieved', // 랭커 달성
  NEW_SPORT_TRY = 'new_sport_try', // 새로운 운동 시도
}

@Entity('user_activity_logs')
export class UserActivityLog {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  @Index()
  userId: number;

  @Column({ type: 'enum', enum: ActivityType })
  @Index()
  activityType: ActivityType; // 활동 유형

  @Column({ type: 'int', nullable: true })
  relatedGroupId: number | null; // 관련 모임 ID

  @Column({ type: 'varchar', length: 50, nullable: true })
  relatedSport: string | null; // 관련 운동 종목

  @Column({ type: 'text', nullable: true })
  description: string | null; // 활동 설명

  @Column({ type: 'int', default: 0 })
  pointsEarned: number; // 획득한 점수

  @CreateDateColumn()
  @Index()
  createdAt: Date;
}
