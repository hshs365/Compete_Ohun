import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { SocialAccount } from '../../social-accounts/entities/social-account.entity';

export enum UserStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  DELETED = 'deleted',
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

export enum SkillLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('increment')
  id: number;

  // 로그인 정보 (일반 로그인용)
  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  @Index()
  email: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  passwordHash: string | null;

  // 서비스 필수 정보
  @Column({ type: 'varchar', length: 50, unique: true })
  @Index()
  nickname: string;

  @Column({ type: 'enum', enum: Gender, nullable: true })
  gender: Gender | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  ageRange: string | null; // '20-24', '25-29', '30-34' 등

  @Column({ type: 'date', nullable: true })
  birthDate: Date | null;

  @Column({ type: 'varchar', length: 50 })
  residenceSido: string; // 시/도

  @Column({ type: 'varchar', length: 50 })
  residenceSigungu: string; // 시/군/구

  // 선택 정보
  @Column({ type: 'text', array: true, default: [] })
  interestedSports: string[]; // 관심 운동 종목 배열

  @Column({ type: 'enum', enum: SkillLevel, nullable: true })
  skillLevel: SkillLevel | null;

  // 약관 동의
  @Column({ type: 'boolean', default: false })
  termsServiceAgreed: boolean;

  @Column({ type: 'boolean', default: false })
  termsPrivacyAgreed: boolean;

  @Column({ type: 'boolean', default: false })
  marketingConsent: boolean;

  @Column({ type: 'boolean', default: false })
  marketingEmailConsent: boolean;

  @Column({ type: 'boolean', default: false })
  marketingSmsConsent: boolean;

  // 계정 상태
  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.PENDING,
  })
  @Index()
  status: UserStatus;

  @Column({ type: 'boolean', default: false })
  isProfileComplete: boolean; // 추가 정보 입력 완료 여부

  // 메타 정보
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date | null;

  // 관계
  @OneToMany(() => SocialAccount, (socialAccount) => socialAccount.user, {
    cascade: true,
  })
  socialAccounts: SocialAccount[];

  // 인덱스 (복합)
  // @Index(['residenceSido', 'residenceSigungu'])
  // residenceIndex: string; // 이 부분은 TypeORM에서 복합 인덱스는 다르게 처리해야 함
}

