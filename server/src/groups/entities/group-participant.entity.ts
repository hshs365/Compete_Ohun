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

@Entity('group_participants')
@Unique(['groupId', 'userId']) // 같은 사용자가 같은 모임에 중복 참가 불가
export class GroupParticipant {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @ManyToOne(() => Group, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group: Group;

  @Column({ name: 'group_id' })
  @Index()
  groupId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  @Index()
  userId: number;

  // 참가 상태 (참가, 취소 등)
  @Column({ type: 'varchar', length: 20, default: 'joined' })
  status: string; // 'joined', 'cancelled' 등

  // 메타 정보
  @CreateDateColumn({ name: 'joined_at' })
  joinedAt: Date;
}




