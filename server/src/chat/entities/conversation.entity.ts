import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Group } from '../../groups/entities/group.entity';
import { Message } from './message.entity';

@Entity('conversations')
@Index(['groupId', 'participantId'], { unique: true })
export class Conversation {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ name: 'group_id' })
  @Index()
  groupId: number;

  @Column({ name: 'participant_id' })
  @Index()
  participantId: number;

  @Column({ name: 'creator_id' })
  @Index()
  creatorId: number;

  @ManyToOne(() => Group, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group: Group;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'participant_id' })
  participant: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'creator_id' })
  creator: User;

  @OneToMany(() => Message, (m) => m.conversation, { cascade: true })
  messages: Message[];

  @Column({ name: 'participant_last_read_at', type: 'timestamp', nullable: true })
  participantLastReadAt: Date | null;

  @Column({ name: 'creator_last_read_at', type: 'timestamp', nullable: true })
  creatorLastReadAt: Date | null;

  @Column({ name: 'participant_left_at', type: 'timestamp', nullable: true })
  participantLeftAt: Date | null;

  @Column({ name: 'creator_left_at', type: 'timestamp', nullable: true })
  creatorLeftAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
