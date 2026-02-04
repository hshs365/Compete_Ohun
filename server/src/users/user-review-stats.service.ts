import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MatchReview } from '../groups/entities/match-review.entity';
import { FOOTBALL_STAT_KEYS } from '../constants/match-review';

/** 레이더차트용 1~10 스텟 (FootballStatsRadar와 동일 키) */
export type FootballStatsFromReviews = {
  [K in (typeof FOOTBALL_STAT_KEYS)[number]]: number;
};

@Injectable()
export class UserReviewStatsService {
  constructor(
    @InjectRepository(MatchReview)
    private matchReviewRepository: Repository<MatchReview>,
  ) {}

  /**
   * 매치 리뷰에서 "선택된" 횟수를 종목별로 집계하여 축구 스텟(1~10)으로 반환
   */
  async getFootballStatsFromReviews(userId: number): Promise<FootballStatsFromReviews> {
    const rows = await this.matchReviewRepository
      .createQueryBuilder('r')
      .select('r.category_key', 'key')
      .addSelect('COUNT(*)', 'cnt')
      .where('r.selected_user_id = :userId', { userId })
      .groupBy('r.category_key')
      .getRawMany<{ key: string; cnt: string }>();

    const counts: Record<string, number> = {};
    for (const k of FOOTBALL_STAT_KEYS) {
      counts[k] = 0;
    }
    for (const r of rows) {
      if (FOOTBALL_STAT_KEYS.includes(r.key as any)) {
        counts[r.key] = parseInt(r.cnt, 10) || 0;
      }
    }

    const values = FOOTBALL_STAT_KEYS.map((k) => counts[k] ?? 0);
    const maxCount = Math.max(...values, 1);
    const normalized: FootballStatsFromReviews = {} as FootballStatsFromReviews;
    FOOTBALL_STAT_KEYS.forEach((k, i) => {
      normalized[k] = Math.min(10, Math.round((values[i] / maxCount) * 10));
    });

    return normalized;
  }
}
