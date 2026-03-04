import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

/**
 * 전화번호 기반 블랙리스트.
 * 본인인증 도입 후에도 phone 기준으로 중복 가입·재가입 방지 가능.
 */
@Entity('blacklist')
export class Blacklist {
  @PrimaryGeneratedColumn('increment')
  id: number;

  /** 블랙리스트 등록된 전화번호 (하이픈 제거 형식) */
  @Column({ type: 'varchar', length: 20, unique: true })
  @Index()
  phone: string;

  /** 사유 (관리자 참고용) */
  @Column({ type: 'varchar', length: 500, nullable: true })
  reason: string | null;

  /** 등록한 관리자 ID */
  @Column({ type: 'int', nullable: true })
  createdByUserId: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'createdByUserId' })
  createdBy: User | null;

  @CreateDateColumn()
  createdAt: Date;
}
