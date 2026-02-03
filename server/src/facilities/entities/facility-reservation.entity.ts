import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Facility } from './facility.entity';

export enum ReservationStatus {
  PENDING = 'pending',       // 예약 대기 (결제 전 또는 승인 대기)
  CONFIRMED = 'confirmed',   // 예약 확정
  CANCELLED = 'cancelled',   // 예약 취소
  COMPLETED = 'completed',   // 이용 완료
  NO_SHOW = 'no_show',       // 노쇼
}

@Entity('facility_reservations')
@Index(['facilityId', 'reservationDate', 'startTime'])
export class FacilityReservation {
  @PrimaryGeneratedColumn('increment')
  id: number;

  // 예약한 시설
  @ManyToOne(() => Facility, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'facility_id' })
  facility: Facility;

  @Column({ name: 'facility_id' })
  @Index()
  facilityId: number;

  // 예약자
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  @Index()
  userId: number;

  // 예약 일자
  @Column({ type: 'date' })
  @Index()
  reservationDate: string; // YYYY-MM-DD 형식

  // 예약 시작 시간
  @Column({ type: 'time' })
  startTime: string; // HH:MM 형식

  // 예약 종료 시간
  @Column({ type: 'time' })
  endTime: string; // HH:MM 형식

  // 예약 인원
  @Column({ type: 'int', default: 1 })
  numberOfPeople: number;

  // 예약자 연락처
  @Column({ type: 'varchar', length: 20, nullable: true })
  contactPhone: string | null;

  // 예약 메모
  @Column({ type: 'text', nullable: true })
  memo: string | null;

  // 예약 상태
  @Column({
    type: 'enum',
    enum: ReservationStatus,
    default: ReservationStatus.PENDING,
  })
  @Index()
  status: ReservationStatus;

  // 총 금액
  @Column({ type: 'int', default: 0 })
  totalAmount: number;

  // 결제 완료 여부
  @Column({ type: 'boolean', default: false })
  isPaid: boolean;

  // 메타 정보
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
