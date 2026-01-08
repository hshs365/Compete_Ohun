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

@Entity('group_evaluations')
@Unique(['groupId', 'evaluatorId', 'evaluateeId']) // 같은 평가자가 같은 피평가자를 중복 평가 불가
export class GroupEvaluation {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @ManyToOne(() => Group, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group: Group;

  @Column({ name: 'group_id' })
  @Index()
  groupId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'evaluator_id' })
  evaluator: User; // 평가자 (모임장)

  @Column({ name: 'evaluator_id' })
  @Index()
  evaluatorId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'evaluatee_id' })
  evaluatee: User; // 피평가자 (참가자)

  @Column({ name: 'evaluatee_id' })
  @Index()
  evaluateeId: number;

  @Column({ type: 'decimal', precision: 3, scale: 2 })
  rating: number; // 평가 점수 (0-5)

  @Column({ type: 'text', nullable: true })
  comment: string | null; // 평가 코멘트

  @Column({ type: 'boolean', default: false })
  wasPunctual: boolean; // 시간 준수 여부

  @Column({ type: 'boolean', default: false })
  wasCooperative: boolean; // 협조적이었는지

  @Column({ type: 'boolean', default: false })
  wasSkilled: boolean; // 실력이 있었는지

  @CreateDateColumn()
  createdAt: Date;
}
