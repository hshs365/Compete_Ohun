import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export const NOTICE_TYPES = ['update', 'info', 'warning', 'success'] as const;
export type NoticeType = (typeof NOTICE_TYPES)[number];

@Entity('notices')
export class Notice {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 20 })
  type: NoticeType;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  version: string | null;

  @Column({ type: 'boolean', default: false })
  isImportant: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
