import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

export const INQUIRY_TYPES = [
  '버그발생신고',
  '업체 제휴 문의',
  '기능 제안',
  '서비스 이용 문의',
  '결제/환불 문의',
  '기타',
] as const;

export type InquiryType = (typeof INQUIRY_TYPES)[number];

@Entity('contacts')
export class Contact {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 50 })
  type: InquiryType;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar', length: 255 })
  @Index()
  submitterEmail: string;

  @Column({ type: 'int', nullable: true })
  @Index()
  userId: number | null;

  @CreateDateColumn()
  createdAt: Date;
}
