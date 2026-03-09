import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique, Index } from 'typeorm';
import { User } from './user.entity';

/** 업적 지급 이력 (중복 지급 방지) */
@Entity('user_achievements')
@Unique(['userId', 'achievementId'])
@Index(['userId'])
export class UserAchievement {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  /** 업적 식별자 (first-match, first-creation, active-participant, match-master) */
  @Column({ type: 'varchar', length: 50 })
  achievementId: string;

  @CreateDateColumn({ name: 'granted_at' })
  grantedAt: Date;
}
