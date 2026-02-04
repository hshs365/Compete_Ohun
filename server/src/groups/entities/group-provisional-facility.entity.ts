import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { Group } from './group.entity';
import { Facility } from '../../facilities/entities/facility.entity';

/**
 * 매치 가계약: 1·2·3순위 시설. 인원 마감 전까지 실제 예약 없음.
 * 인원 마감 시 1순위 → 2순위 → 3순위 순으로 빈 슬롯 있는 시설에 확정 예약.
 */
@Entity('group_provisional_facilities')
@Unique(['groupId', 'priority'])
export class GroupProvisionalFacility {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @ManyToOne(() => Group, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group: Group;

  @Column({ name: 'group_id' })
  @Index()
  groupId: number;

  @ManyToOne(() => Facility, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'facility_id' })
  facility: Facility;

  @Column({ name: 'facility_id' })
  @Index()
  facilityId: number;

  /** 1=1순위, 2=2순위, 3=3순위 */
  @Column({ type: 'smallint' })
  @Index()
  priority: number;
}
