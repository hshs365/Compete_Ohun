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

/** 호스트(구인자)가 용병에 대해 남긴 리뷰 유형 */
export type MercenaryReviewType = 'no_show' | 'no_equipment' | 'good_manner';

/**
 * 용병 리뷰 — 매치 종료 후 호스트(구인자)가 용병 구하기 매치의 용병들에 대해
 * 노쇼/장비 미지참/매너 칭찬 등 간편 리뷰를 남김
 */
@Entity('mercenary_reviews')
@Unique(['groupId', 'revieweeUserId', 'reviewType'])
export class MercenaryReview {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @ManyToOne(() => Group, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group: Group;

  @Column({ name: 'group_id' })
  @Index()
  groupId: number;

  /** 리뷰 대상 (용병) */
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reviewee_user_id' })
  reviewee: User;

  @Column({ name: 'reviewee_user_id' })
  @Index()
  revieweeUserId: number;

  @Column({ type: 'varchar', length: 20 })
  @Index()
  reviewType: MercenaryReviewType;

  @CreateDateColumn()
  createdAt: Date;
}
