import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum NotificationType {
  GROUP_JOIN = 'group_join', // 모임 참가
  GROUP_LEAVE = 'group_leave', // 모임 탈퇴
  GROUP_CLOSED = 'group_closed', // 모임 마감
  GROUP_DELETED = 'group_deleted', // 모임 삭제
  GROUP_CANCELLED = 'group_cancelled', // 모임 취소 (최소 인원 미달 등)
  GROUP_WAITLIST_SPOT_OPEN = 'group_waitlist_spot_open', // 예약 대기: 매치 빈 자리 생김
  REFEREE_RANK_MATCH_IN_REGION = 'referee_rank_match_in_region', // 내 지역 랭크매치 생성 → 심판 신청 알림
  CREATOR_NEW_MATCH = 'creator_new_match', // 매치장이 새 매치 생성 → 매치장을 팔로우한 사람에게 알림
  NEW_FOLLOWER = 'new_follower', // 새 팔로워
  FACILITY_RESERVATION = 'facility_reservation', // 시설 예약
  SYSTEM = 'system', // 시스템 알림
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  @Index()
  userId: number;

  @Column({ type: 'enum', enum: NotificationType })
  @Index()
  type: NotificationType;

  @Column({ type: 'varchar', length: 200 })
  title: string; // 알림 제목

  @Column({ type: 'text' })
  message: string; // 알림 메시지

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any> | null; // 추가 데이터 (모임 ID, 참가자 정보 등)

  @Column({ type: 'boolean', default: false })
  isRead: boolean; // 읽음 여부

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
