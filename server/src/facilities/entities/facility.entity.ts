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

@Entity('facilities')
export class Facility {
  @PrimaryGeneratedColumn('increment')
  id: number;

  // 시설 기본 정보
  @Column({ type: 'varchar', length: 100 })
  name: string; // 시설명

  @Column({ type: 'varchar', length: 50 })
  @Index()
  type: string; // 시설 종류 (체육센터, 체육관, 풋살장, 테니스장, 수영장, 골프연습장, 기타)

  @Column({ type: 'varchar', length: 200 })
  address: string; // 주소

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  @Index()
  latitude: number | null; // 위도

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  @Index()
  longitude: number | null; // 경도

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null; // 전화번호

  @Column({ type: 'varchar', length: 100, nullable: true })
  operatingHours: string | null; // 운영시간 (예: 06:00 - 22:00)

  /** 예약 단위(시간). 예: 2이면 2시간 단위로만 예약 가능 (06:00-08:00, 08:00-10:00 등) */
  @Column({ type: 'int', default: 2 })
  reservationSlotHours: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  price: string | null; // 가격 (예: 시간당 15,000원)

  @Column({ type: 'text', nullable: true })
  description: string | null; // 시설 설명

  @Column({ type: 'text', array: true, default: [] })
  amenities: string[]; // 편의시설 (주차, 샤워실, 락커룸 등)

  /** 시설에서 가능한 운동 종목 (체육센터 등 다목적 시설용) */
  @Column({ type: 'text', array: true, default: [] })
  availableSports: string[];

  /** 대표 이미지 URL (목록·썸네일용). images[0]과 동기화 */
  @Column({ type: 'text', nullable: true })
  image: string | null;

  /** 시설 이미지 URL 목록 (다중 각도) */
  @Column({ type: 'simple-json', nullable: true })
  images: string[] | null;

  // 평점 및 리뷰
  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number; // 평균 평점 (0-5)

  @Column({ type: 'int', default: 0 })
  reviewCount: number; // 리뷰 개수

  // 등록자 정보
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column({ name: 'owner_id' })
  @Index()
  ownerId: number; // 등록자 ID (사업자번호 검증 완료된 사용자)

  // 시설 상태
  @Column({ type: 'boolean', default: true })
  isActive: boolean; // 활성화 여부

  // 메타 정보
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

