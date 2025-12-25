import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum SocialProvider {
  KAKAO = 'kakao',
  GOOGLE = 'google',
}

@Entity('social_accounts')
@Unique(['provider', 'providerUserId']) // 같은 소셜 계정은 한 번만 연동
export class SocialAccount {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @ManyToOne(() => User, (user) => user.socialAccounts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  @Index()
  user: User;

  @Column({ name: 'user_id' })
  userId: number;

  // 소셜 제공자 정보
  @Column({ type: 'enum', enum: SocialProvider })
  @Index()
  provider: SocialProvider;

  @Column({ type: 'varchar', length: 255, name: 'provider_user_id' })
  @Index()
  providerUserId: string; // 소셜 서비스의 사용자 ID

  // 소셜 서비스에서 받은 정보 (참고용)
  @Column({ type: 'varchar', length: 255, nullable: true, name: 'provider_email' })
  providerEmail: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'provider_name' })
  providerName: string | null;

  @Column({ type: 'text', nullable: true, name: 'provider_profile_image_url' })
  providerProfileImageUrl: string | null;

  // 연동 상태
  @Column({ type: 'boolean', default: false, name: 'is_primary' })
  isPrimary: boolean; // 주요 로그인 계정 여부

  // 메타 정보
  @CreateDateColumn({ name: 'linked_at' })
  linkedAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'last_used_at' })
  lastUsedAt: Date | null;
}


