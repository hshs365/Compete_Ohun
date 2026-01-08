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

export enum ScoreType {
  ACTIVITY = 'activity', // 활동점수
  MANNER = 'manner', // 매너점수
  VICTORY = 'victory', // 승리점수
  LEADERSHIP = 'leadership', // 리더십점수
  DIVERSITY = 'diversity', // 다양성점수
  CONTINUITY = 'continuity', // 연속점수
  GROWTH = 'growth', // 성장점수
}

@Entity('user_score_history')
export class UserScoreHistory {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  @Index()
  userId: number;

  @Column({ type: 'enum', enum: ScoreType })
  scoreType: ScoreType; // 점수 유형

  @Column({ type: 'int' })
  points: number; // 획득/차감 점수 (양수: 획득, 음수: 차감)

  @Column({ type: 'int' })
  totalScore: number; // 변경 후 총합 점수

  @Column({ type: 'varchar', length: 200, nullable: true })
  reason: string | null; // 점수 변경 사유

  @Column({ type: 'int', nullable: true })
  relatedGroupId: number | null; // 관련 모임 ID

  @Column({ type: 'varchar', length: 50, nullable: true })
  relatedSport: string | null; // 관련 운동 종목

  @CreateDateColumn()
  createdAt: Date;
}
