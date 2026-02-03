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
@Index(['nickname', 'tag'], { unique: true }) // 닉네임 + 태그 조합으로 고유성 보장
export class User {
  @PrimaryGeneratedColumn('increment')
  id: number;

  // 로그인 정보 (일반 로그인용)
  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  @Index()
  email: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  passwordHash: string | null;

  // 연락처 (일반 회원가입 필수, 소셜 로그인 선택)
  @Column({ type: 'varchar', length: 20, nullable: true, unique: true })
  @Index()
  phone: string | null; // 전화번호 (010-1234-5678 형식)

  @Column({ type: 'boolean', default: false })
  phoneVerified: boolean; // 연락처 본인인증 완료 여부

  // 실명인증 정보
  @Column({ type: 'varchar', length: 50, nullable: true })
  realName: string | null; // 실명 (본인인증 시 저장)

  @Column({ type: 'boolean', default: false })
  realNameVerified: boolean; // 실명인증 완료 여부

  // 서비스 필수 정보
  @Column({ type: 'varchar', length: 50 })
  @Index()
  nickname: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  @Index()
  tag: string | null; // 닉네임 태그 (예: #0001, #0002)

  // 닉네임 변경 제한
  @Column({ type: 'timestamp', nullable: true })
  nicknameChangedAt: Date | null; // 마지막 닉네임 변경 일시

  @Column({ type: 'enum', enum: Gender, nullable: true })
  gender: Gender | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  ageRange: string | null; // '20-24', '25-29', '30-34' 등

  @Column({ type: 'date', nullable: true })
  birthDate: Date | null;

  @Column({ type: 'varchar', length: 100 })
  residenceSido: string; // 시/도

  @Column({ type: 'varchar', length: 255 })
  residenceSigungu: string; // 시/군/구 (상세 주소 포함 시 길어질 수 있음)

  // 위치 정보 (위도, 경도)
  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number | null;

  // 선택 정보
  @Column({ type: 'text', array: true, default: [] })
  interestedSports: string[]; // 관심 운동 종목 배열

  /** 스포츠별 포지션 (예: 축구 GK, FW 등). [{ sport: '축구', positions: ['GK', 'FW'] }] */
  @Column({ type: 'jsonb', default: () => "'[]'" })
  sportPositions: { sport: string; positions: string[] }[];

  @Column({ type: 'enum', enum: SkillLevel, nullable: true })
  skillLevel: SkillLevel | null;

  // 명예의 전당 점수 관련 필드
  @Column({ type: 'int', default: 0 })
  totalScore: number; // 총합 점수

  @Column({ type: 'int', default: 0 })
  activityScore: number; // 활동점수

  @Column({ type: 'int', default: 0 })
  mannerScore: number; // 매너점수

  @Column({ type: 'int', default: 0 })
  victoryScore: number; // 승리점수

  @Column({ type: 'int', default: 0 })
  leadershipScore: number; // 리더십점수

  @Column({ type: 'int', default: 0 })
  diversityScore: number; // 다양성점수

  @Column({ type: 'int', default: 0 })
  continuityScore: number; // 연속점수

  @Column({ type: 'int', default: 0 })
  growthScore: number; // 성장점수

  // 연속성 추적 필드
  @Column({ type: 'int', default: 0 })
  consecutiveDays: number; // 연속 참가 일수

  @Column({ type: 'date', nullable: true })
  lastParticipationDate: Date | null; // 마지막 참가일

  @Column({ type: 'int', default: 0 })
  longestConsecutiveDays: number; // 최장 연속 참가 일수

  // 리더십 추적 필드
  @Column({ type: 'int', default: 0 })
  groupsCreated: number; // 생성한 모임 수

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  averageGroupRating: number; // 평균 모임 평가 점수 (0-5)

  // 다양성 추적 필드
  @Column({ type: 'text', array: true, default: [] })
  participatedSports: string[]; // 참가한 운동 종목 목록

  @Column({ type: 'int', default: 0 })
  uniqueSportsCount: number; // 참가한 고유 운동 종목 수

  // 성장 추적 필드
  @Column({ type: 'date', nullable: true })
  rankerAchievedAt: Date | null; // 랭커 등급 달성일

  @Column({ type: 'enum', enum: SkillLevel, nullable: true })
  previousSkillLevel: SkillLevel | null; // 이전 실력 레벨

  @Column({ type: 'date', nullable: true })
  skillLevelUpgradedAt: Date | null; // 실력 레벨 상승일

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

  // 회원 유형
  @Column({ type: 'varchar', length: 20, default: 'individual' })
  @Index()
  memberType: 'individual' | 'business'; // 개인 회원 또는 사업자 회원

  // 사업자 정보
  @Column({ type: 'varchar', length: 20, nullable: true })
  businessNumber: string | null; // 사업자번호 (10자리: XXX-XX-XXXXX)

  @Column({ type: 'boolean', default: false })
  businessNumberVerified: boolean; // 사업자번호 검증 완료 여부

  /** 관리자 여부. true면 사업자 검증 없이 시설/상품 등록·이벤트매치 개최·공지 등 모든 기능 이용 가능 */
  @Column({ name: 'is_admin', type: 'boolean', default: false })
  isAdmin: boolean;

  // 프로필 사진
  @Column({ type: 'text', nullable: true })
  profileImageUrl: string | null; // 프로필 사진 URL (base64 또는 파일 경로)

  /** 대한체육회 스포츠지원포털 선수 등록 여부 */
  @Column({ type: 'boolean', default: false })
  athleteVerified: boolean;

  /** 선수 API에서 조회된 정보 (종목, 등록년도 등). JSON */
  @Column({ type: 'jsonb', nullable: true })
  athleteData: { sport?: string; subSport?: string; registeredYear?: number; [key: string]: unknown } | null;

  /** 오운 랭크: 종목별 S,A,B,C,D,E,F. 저장값 없으면 선수=C/일반=F 기본 */
  @Column({ type: 'jsonb', default: () => "'{}'" })
  ohunRanks: Record<string, string>;

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

