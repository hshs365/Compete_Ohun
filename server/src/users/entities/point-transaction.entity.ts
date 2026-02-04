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

export enum PointTransactionType {
  EARN = 'earn',   // 획득 (이벤트 참여, 출석 등)
  USE = 'use',    // 사용 (상품 구매, 참가비 등)
  ADJUST = 'adjust', // 관리자 조정
  REVIEW = 'review', // 선수 리뷰 작성 완료 보상
  FACILITY_REVIEW = 'facility_review', // 시설 리뷰 작성 완료 보상
}

@Entity('point_transactions')
export class PointTransaction {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  @Index()
  userId: number;

  /** 변경량 (양수: 획득, 음수: 사용) */
  @Column({ type: 'int' })
  amount: number;

  @Column({ type: 'enum', enum: PointTransactionType })
  type: PointTransactionType;

  @Column({ type: 'varchar', length: 200, nullable: true })
  description: string | null;

  /** 변경 후 잔액 (조회 편의용) */
  @Column({ type: 'int' })
  balanceAfter: number;

  @CreateDateColumn()
  createdAt: Date;
}
