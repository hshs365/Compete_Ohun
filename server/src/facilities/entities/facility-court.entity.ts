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
import { Facility } from './facility.entity';

/** 시설 하위의 개별 구장(면). 하나의 시설에 여러 구장 등록 가능 */
@Entity('facility_courts')
export class FacilityCourt {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @ManyToOne(() => Facility, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'facility_id' })
  facility: Facility;

  @Column({ name: 'facility_id' })
  @Index()
  facilityId: number;

  /** 층수/구역 명칭 (예: "4층 B코트", "실외 2구장"). 유저가 찾아갈 '명찰' 역할 */
  @Column({ type: 'varchar', length: 80 })
  courtName: string;

  /** 층 수준 (예: "4층", "지하1층", "1층") */
  @Column({ type: 'varchar', length: 30, nullable: true })
  floorLevel: string | null;

  /** 구장 번호/명 (예: "B코트", "2구장") */
  @Column({ type: 'varchar', length: 30, nullable: true })
  courtNumber: string | null;

  /** 바닥 재질: 우레탄, 인조잔디, 마루, 콘크리트, 모래, 천연잔디, 타일, 기타 */
  @Column({ type: 'varchar', length: 30 })
  @Index()
  floorMaterial: string;

  /** 층고(m). 실내용 */
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  ceilingHeight: number | null;

  /** 정식 규격 여부. 실외용 */
  @Column({ type: 'boolean', nullable: true })
  officialSpec: boolean | null;

  /** 단독 사용 여부 (옆 코트와 붙어있는지) */
  @Column({ type: 'boolean', default: false })
  isExclusiveUse: boolean;

  /** 해당 구장 전용 현장 사진 URL 목록 */
  @Column({ type: 'simple-json', nullable: true })
  images: string[] | null;

  /** 찾아가는 길 텍스트 (엘리베이터 2호기, 주차장 뒤 철문 등) */
  @Column({ type: 'text', nullable: true })
  directionsGuide: string | null;

  /** 실내/실외 */
  @Column({ type: 'varchar', length: 20 })
  @Index()
  indoorOutdoor: 'indoor' | 'outdoor';

  /** 정렬 순서 (낮을수록 먼저) */
  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
