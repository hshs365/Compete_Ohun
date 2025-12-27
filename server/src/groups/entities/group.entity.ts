import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { GroupParticipant } from './group-participant.entity';

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

  // 참가자 관계
  @OneToMany(() => GroupParticipant, (participant) => participant.group, {
    cascade: true,
  })
  participants: GroupParticipant[];

  // 모임 상태
  @Column({ type: 'boolean', default: true })
  isActive: boolean; // 모임 활성화 여부

  // 메타 정보
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

