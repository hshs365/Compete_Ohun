import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('phone_verifications')
export class PhoneVerification {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 20 })
  @Index()
  phone: string; // 전화번호

  @Column({ type: 'varchar', length: 6 })
  code: string; // 인증번호 (6자리)

  @Column({ type: 'boolean', default: false })
  verified: boolean; // 인증 완료 여부

  @Column({ type: 'int', default: 0 })
  attemptCount: number; // 인증 시도 횟수

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ type: 'timestamp', name: 'expires_at' })
  expiresAt: Date; // 만료 시간 (5분)
}
