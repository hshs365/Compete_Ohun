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

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'varchar', length: 100 })
  brand: string;

  @Column({ type: 'int' })
  price: number;

  @Column({ type: 'int', nullable: true })
  originalPrice: number | null;

  @Column({ type: 'varchar', length: 100 })
  @Index()
  category: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  @Index()
  sport: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  /** 대표 이미지 URL (썸네일·목록용). images[0]과 동기화 */
  @Column({ type: 'text', nullable: true })
  image: string | null;

  /** 상품 이미지 URL 목록 (정면·측면 등 다중 각도, 쿠팡 스타일) */
  @Column({ type: 'simple-json', nullable: true })
  images: string[] | null;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ type: 'int', default: 0 })
  reviewCount: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'seller_id' })
  seller: User;

  @Column({ name: 'seller_id' })
  @Index()
  sellerId: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
