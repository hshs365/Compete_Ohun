import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { PointTransaction, PointTransactionType } from './entities/point-transaction.entity';

export interface PointHistoryItem {
  id: number;
  amount: number;
  type: PointTransactionType;
  description: string | null;
  balanceAfter: number;
  createdAt: string;
}

@Injectable()
export class PointsService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(PointTransaction)
    private pointTransactionRepository: Repository<PointTransaction>,
  ) {}

  /**
   * 포인트 변동 기록 추가 및 유저 보유 포인트 반영
   */
  async addTransaction(
    userId: number,
    amount: number,
    type: PointTransactionType,
    description?: string | null,
  ): Promise<{ balance: number }> {
    if (amount === 0) {
      throw new BadRequestException('변동량은 0이 될 수 없습니다.');
    }
    const user = await this.userRepository.findOne({ where: { id: userId }, select: ['id', 'points'] });
    if (!user) {
      throw new BadRequestException('사용자를 찾을 수 없습니다.');
    }
    const currentPoints = user.points ?? 0;
    const newBalance = currentPoints + amount;
    if (newBalance < 0) {
      throw new BadRequestException('보유 포인트가 부족합니다.');
    }

    await this.userRepository.update(userId, { points: newBalance });
    await this.pointTransactionRepository.insert({
      userId,
      amount,
      type,
      description: description ?? null,
      balanceAfter: newBalance,
    });

    return { balance: newBalance };
  }

  /**
   * 내 포인트 내역 조회 (최신순)
   */
  async getHistory(userId: number, limit = 50): Promise<PointHistoryItem[]> {
    const list = await this.pointTransactionRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: Math.min(limit, 100),
      select: ['id', 'amount', 'type', 'description', 'balanceAfter', 'createdAt'],
    });
    return list.map((row) => ({
      id: row.id,
      amount: row.amount,
      type: row.type,
      description: row.description,
      balanceAfter: row.balanceAfter,
      createdAt: row.createdAt.toISOString(),
    }));
  }
}
