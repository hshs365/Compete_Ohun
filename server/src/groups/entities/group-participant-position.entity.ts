import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
} from 'typeorm';
import { Group } from './group.entity';
import { User } from '../../users/entities/user.entity';

@Entity('group_participant_positions')
@Index(['groupId', 'userId'], { unique: true })
export class GroupParticipantPosition {
  @PrimaryGeneratedColumn('increment')
  id: number;

  // 모임과의 관계
  @ManyToOne(() => Group, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group: Group;

  @Column({ name: 'group_id' })
  @Index()
  groupId: number;

  // 사용자와의 관계
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  @Index()
  userId: number;

  // 신청한 포지션 코드 (예: 'GK', 'DF', 'MF', 'FW' 등)
  @Column({ type: 'varchar', length: 10 })
  positionCode: string;

  // 구장 슬롯 라벨 (예: 'LW', 'RW', 'LB' 등). 없으면 행 내 첫 슬롯에 표시
  @Column({ type: 'varchar', length: 10, nullable: true })
  slotLabel: string | null;

  /** 전술판 좌표 X (0–100, 왼쪽=0, 오른쪽=100). null이면 positionCode/slotLabel로 기본 위치 계산 */
  @Column({ type: 'float', nullable: true })
  positionX: number | null;

  /** 전술판 좌표 Y (0–100, 우리 골대=0, 상대 골대=100). null이면 positionCode/slotLabel로 기본 위치 계산 */
  @Column({ type: 'float', nullable: true })
  positionY: number | null;

  // 팀 구분 (레드 vs 블루). 'red' | 'blue', 기본값 'red'
  @Column({ type: 'varchar', length: 10, default: 'red' })
  team: string;

  // 선호 포지션 여부
  @Column({ type: 'boolean', default: false })
  isPreferred: boolean;

  // 생성일
  @CreateDateColumn()
  createdAt: Date;
}
