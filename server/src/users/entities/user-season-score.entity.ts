import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { User } from './user.entity';

/**
 * 사용자의 연도별(시즌별) 점수 추적 엔티티
 * 연도, 지역, 운동별로 점수를 분리하여 저장
 */
@Entity('user_season_scores')
@Unique(['userId', 'year', 'region', 'sport']) // 같은 사용자의 같은 연도/지역/운동 조합은 중복 불가
export class UserSeasonScore {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  @Index()
  userId: number;

  @Column({ type: 'int' })
  @Index()
  year: number; // 연도 (예: 2025, 2026)

  @Column({ type: 'varchar', length: 50, default: '전국' })
  @Index()
  region: string; // 지역 (예: '서울', '대전', '부산', '전국')

  @Column({ type: 'varchar', length: 50, default: '전체' })
  @Index()
  sport: string; // 운동 종목 (예: '배드민턴', '축구', '전체')

  // 각 점수 유형별 점수
  @Column({ type: 'int', default: 0 })
  activityScore: number; // 활동점수

  @Column({ type: 'int', default: 0 })
  mannerScore: number; // 매너점수

  @Column({ type: 'int', default: 0 })
  victoryScore: number; // 승리점수

  @Column({ type: 'int', default: 0 })
  leadershipScore: number; // 리더십점수

  @Column({ type: 'int', default: 0 })
  diversityScore: number; // 다양성점수

  @Column({ type: 'int', default: 0 })
  continuityScore: number; // 연속점수

  @Column({ type: 'int', default: 0 })
  growthScore: number; // 성장점수

  // 총합 점수 (가중치 적용)
  @Column({ type: 'int', default: 0 })
  @Index()
  totalScore: number; // 총합 점수

  // 통계 필드
  @Column({ type: 'int', default: 0 })
  groupsCreated: number; // 생성한 모임 수

  @Column({ type: 'int', default: 0 })
  groupsParticipated: number; // 참가한 모임 수

  @Column({ type: 'int', default: 0 })
  groupsCompleted: number; // 완주한 모임 수

  @Column({ type: 'int', default: 0 })
  victories: number; // 승리 횟수

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
