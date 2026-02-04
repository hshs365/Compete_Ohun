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

/**
 * 매치 종료 후 참가자 간 리뷰 (항목별 1명 선택).
 * 예: "가장 기술이 좋은 선수" → selectedUserId
 */
@Entity('match_reviews')
@Unique(['groupId', 'reviewerId', 'categoryKey'])
export class MatchReview {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @ManyToOne(() => Group, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group: Group;

  @Column({ name: 'group_id' })
  @Index()
  groupId: number;

  /** 리뷰 작성자 (참가자) */
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reviewer_id' })
  reviewer: User;

  @Column({ name: 'reviewer_id' })
  @Index()
  reviewerId: number;

  /** 리뷰 항목 키 (예: 테크닉, 스피드, 피지컬) */
  @Column({ type: 'varchar', length: 30 })
  @Index()
  categoryKey: string;

  /** 해당 항목으로 선택된 참가자 */
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'selected_user_id' })
  selectedUser: User;

  @Column({ name: 'selected_user_id' })
  @Index()
  selectedUserId: number;

  @CreateDateColumn()
  createdAt: Date;
}
