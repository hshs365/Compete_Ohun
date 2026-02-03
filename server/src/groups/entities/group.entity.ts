import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { GroupParticipant } from './group-participant.entity';
import { GroupGameSettings } from './group-game-settings.entity';

@Entity('groups')
export class Group {
  @PrimaryGeneratedColumn('increment')
  id: number;

  // 모임 기본 정보
  @Column({ type: 'varchar', length: 100 })
  name: string; // 모임 이름

  @Column({ type: 'varchar', length: 200 })
  location: string; // 위치 (주소)

  @Column({ type: 'decimal', precision: 10, scale: 8 })
  @Index()
  latitude: number; // 위도

  @Column({ type: 'decimal', precision: 11, scale: 8 })
  @Index()
  longitude: number; // 경도

  @Column({ type: 'varchar', length: 50 })
  @Index()
  category: string; // 운동 종목 (배드민턴, 축구 등)

  @Column({ type: 'text', nullable: true })
  description: string | null; // 모임 설명

  @Column({ type: 'varchar', length: 200, nullable: true })
  meetingTime: string | null; // 모임 시간 (예: 매주 토요일 10:00)

  @Column({ type: 'varchar', length: 50, nullable: true })
  contact: string | null; // 연락처

  // 준비물 (선택 항목, 배열로 저장)
  @Column({ type: 'text', array: true, default: [] })
  equipment: string[]; // 준비물 목록

  // 생성자 정보
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'creator_id' })
  creator: User;

  @Column({ name: 'creator_id' })
  @Index()
  creatorId: number;

  // 참가자 수 (참가 기능 구현 시 업데이트)
  @Column({ type: 'int', default: 1 })
  participantCount: number; // 참가자 수 (생성자 포함)

  // 최대 참여자 수 (선택사항)
  @Column({ type: 'int', nullable: true })
  maxParticipants: number | null; // 최대 참여자 수 (null이면 제한 없음)

  // 최소 참여자 수 (선택사항)
  @Column({ type: 'int', nullable: true })
  minParticipants: number | null; // 최소 참여자 수 (null이면 제한 없음)

  // 실제 모임 일시 (스케줄러에서 사용)
  @Column({ type: 'timestamp', nullable: true })
  meetingDateTime: Date | null; // 실제 모임 일시 (예: 2024-01-15 10:00:00)

  // 참가비 정보
  @Column({ type: 'boolean', default: false })
  hasFee: boolean; // 참가비 여부

  @Column({ type: 'int', nullable: true })
  feeAmount: number | null; // 참가비 금액 (원 단위)

  @Column({ type: 'int', nullable: true })
  facilityId: number | null; // 선택된 시설 ID (시설에서 진행하는 경우)

  // 성별 제한 (선택사항)
  @Column({ type: 'varchar', length: 20, nullable: true })
  genderRestriction: 'male' | 'female' | null; // 'male': 남자만, 'female': 여자만, null: 제한 없음

  // 참가자 관계
  @OneToMany(() => GroupParticipant, (participant) => participant.group, {
    cascade: true,
  })
  participants: GroupParticipant[];

  // 게임 설정 관계 (1:1)
  @OneToOne(() => GroupGameSettings, (gameSettings) => gameSettings.group, {
    cascade: false,
  })
  gameSettings: GroupGameSettings | null;

  // 매치 유형 (종목별·유형별 관리)
  @Column({ type: 'varchar', length: 20, default: 'normal' })
  @Index()
  type: 'normal' | 'rank' | 'event'; // normal: 일반 매치, rank: 랭크매치, event: 이벤트매치

  // 모임 상태
  @Column({ type: 'boolean', default: true })
  isActive: boolean; // 모임 활성화 여부

  @Column({ type: 'boolean', default: false })
  isClosed: boolean; // 모임 인원 마감 여부

  @Column({ type: 'boolean', default: false })
  isCompleted: boolean; // 모임 종료 여부 (meetingDateTime이 지났거나 수동으로 종료 처리)

  // 메타 정보
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

