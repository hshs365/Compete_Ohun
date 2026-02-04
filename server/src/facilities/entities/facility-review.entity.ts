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
import { Facility } from './facility.entity';
import { Group } from '../../groups/entities/group.entity';

/** 시설 리뷰 평가 항목 */
export const FACILITY_REVIEW_CATEGORIES = [
  { key: 'cleanliness', label: '청결도' },
  { key: 'suitableForGame', label: '경기에 지장이 없는 구장인가요?' },
  { key: 'overall', label: '전체 만족도' },
] as const;

/**
 * 시설 리뷰 (매치 참가 후 해당 시설에 대한 리뷰)
 * 0.5 단위 별점, 5점 만점
 */
@Entity('facility_reviews')
@Unique(['groupId', 'reviewerId'])
export class FacilityReview {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @ManyToOne(() => Facility, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'facility_id' })
  facility: Facility;

  @Column({ name: 'facility_id' })
  @Index()
  facilityId: number;

  @ManyToOne(() => Group, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group: Group;

  @Column({ name: 'group_id' })
  @Index()
  groupId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reviewer_id' })
  reviewer: User;

  @Column({ name: 'reviewer_id' })
  @Index()
  reviewerId: number;

  /** 청결도 (0.5~5) */
  @Column({ type: 'decimal', precision: 2, scale: 1 })
  cleanliness: number;

  /** 경기에 지장이 없는 구장인가요 (0.5~5) */
  @Column({ type: 'decimal', precision: 2, scale: 1 })
  suitableForGame: number;

  /** 전체 만족도 (0.5~5) */
  @Column({ type: 'decimal', precision: 2, scale: 1 })
  overall: number;

  @CreateDateColumn()
  createdAt: Date;
}
