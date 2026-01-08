import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Group } from './group.entity';

@Entity('group_game_settings')
export class GroupGameSettings {
  @PrimaryGeneratedColumn('increment')
  id: number;

  // 모임과의 관계 (1:1)
  @OneToOne(() => Group, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group: Group;

  @Column({ name: 'group_id', unique: true })
  groupId: number;

  // 게임 타입 (team 또는 individual)
  @Column({ type: 'varchar', length: 20, default: 'individual' })
  gameType: 'team' | 'individual';

  // 모집할 포지션 목록 (JSON 배열로 저장)
  @Column({ type: 'text', array: true, default: [] })
  positions: string[];

  // 팀당 최소 인원 (팀 게임인 경우)
  @Column({ type: 'int', nullable: true })
  minPlayersPerTeam: number | null;

  // 밸런스 조정 옵션
  @Column({ type: 'boolean', default: false })
  balanceByExperience: boolean; // 선수 출신 여부 고려

  @Column({ type: 'boolean', default: false })
  balanceByRank: boolean; // 랭커 여부 고려

  // 메타 정보
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
