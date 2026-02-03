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
