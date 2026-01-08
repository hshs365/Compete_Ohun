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
import { User } from './user.entity';

@Entity('follows')
@Unique('UQ_follows_follower_following', ['followerId', 'followingId']) // 한 사용자가 같은 사용자를 중복 팔로우할 수 없음
@Index('IDX_follows_follower_id', ['followerId']) // 팔로워 조회 최적화
@Index('IDX_follows_following_id', ['followingId']) // 팔로잉 조회 최적화
export class Follow {
  @PrimaryGeneratedColumn('increment')
  id: number;

  // 팔로워 (팔로우를 하는 사람)
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'follower_id' })
  follower: User;

  @Column({ name: 'follower_id' })
  followerId: number;

  // 팔로잉 (팔로우를 받는 사람)
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'following_id' })
  following: User;

  @Column({ name: 'following_id' })
  followingId: number;

  // 메타 정보
  @CreateDateColumn()
  createdAt: Date;
}
