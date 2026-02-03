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

@Entity('group_referees')
@Unique(['groupId', 'userId']) // 같은 사용자가 같은 모임에 중복 심판 신청 불가
export class GroupReferee {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @ManyToOne(() => Group, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group: Group;

  @Column({ name: 'group_id', type: 'int', nullable: false })
  @Index()
  groupId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id', type: 'int', nullable: false })
  @Index()
  userId: number;

  @CreateDateColumn({ name: 'applied_at' })
  appliedAt: Date;
}
