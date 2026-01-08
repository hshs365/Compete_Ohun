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

@Entity('user_sport_participations')
@Unique(['userId', 'sport']) // 같은 사용자가 같은 운동에 대해 중복 레코드 불가
export class UserSportParticipation {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  @Index()
  userId: number;

  @Column({ type: 'varchar', length: 50 })
  @Index()
  sport: string; // 운동 종목

  @Column({ type: 'int', default: 0 })
  participationCount: number; // 참가 횟수

  @Column({ type: 'int', default: 0 })
  victoryCount: number; // 승리 횟수 (이벤트매치)

  @Column({ type: 'int', default: 0 })
  lateCount: number; // 지각 횟수

  @Column({ type: 'int', default: 0 })
  absentCount: number; // 불참 횟수

  @Column({ type: 'int', default: 0 })
  completedCount: number; // 완주 횟수

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  averageRating: number | null; // 평균 평가 점수

  @Column({ type: 'date', nullable: true })
  firstParticipationDate: Date | null; // 첫 참가일

  @Column({ type: 'date', nullable: true })
  lastParticipationDate: Date | null; // 마지막 참가일

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
