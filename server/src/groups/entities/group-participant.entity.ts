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

  @Column({ name: 'group_id', type: 'int', nullable: false })
  @Index()
  groupId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id', type: 'int', nullable: false })
  @Index()
  userId: number;

  // 참가 상태 (참가, 취소 등)
  @Column({ type: 'varchar', length: 20, default: 'joined' })
  status: string; // 'joined', 'cancelled' 등

  // 참가 평가 관련 필드
  @Column({ type: 'boolean', default: false })
  wasLate: boolean; // 지각 여부

  @Column({ type: 'boolean', default: false })
  wasAbsent: boolean; // 불참 여부

  @Column({ type: 'boolean', default: false })
  wasCompleted: boolean; // 모임 완주 여부

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  rating: number | null; // 참가자 평가 점수 (0-5, 모임장이 평가)

  @Column({ type: 'text', nullable: true })
  ratingComment: string | null; // 평가 코멘트

  @Column({ type: 'timestamp', nullable: true })
  ratedAt: Date | null; // 평가 일시

  // 메타 정보
  @CreateDateColumn({ name: 'joined_at' })
  joinedAt: Date;
}





