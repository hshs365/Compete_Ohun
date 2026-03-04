import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { MatchReview } from '../groups/entities/match-review.entity';
import { Group } from '../groups/entities/group.entity';
import { GroupParticipant } from '../groups/entities/group-participant.entity';
import {
  FOOTBALL_STAT_KEYS,
  SPORT_RADAR_STAT_KEYS,
  MIN_MATCHES_FOR_STATS,
  RECENT_MATCHES_LIMIT,
} from '../constants/match-review';

/** 레이더차트용 1~10 스텟 (축구) */
export type FootballStatsFromReviews = {
  [K in (typeof FOOTBALL_STAT_KEYS)[number]]: number;
};

/** 종목별 스텟 API 응답 */
export interface SportStatsResponse {
  stats: Record<string, number>;
  matchCount: number;
  overall: number;
  statKeys: string[];
  prevMonthStats?: Record<string, number>;
}

@Injectable()
export class UserReviewStatsService {
  constructor(
    @InjectRepository(MatchReview)
    private matchReviewRepository: Repository<MatchReview>,
    @InjectRepository(Group)
    private groupRepository: Repository<Group>,
    @InjectRepository(GroupParticipant)
    private participantRepository: Repository<GroupParticipant>,
  ) {}

  /**
   * 매치 리뷰에서 "선택된" 횟수를 종목별로 집계하여 축구 스텟(1~10)으로 반환
   * @deprecated getSportStatsFromReviews 사용 권장
   */
  async getFootballStatsFromReviews(userId: number): Promise<FootballStatsFromReviews> {
    const result = await this.getSportStatsFromReviews(userId, '축구');
    const out: FootballStatsFromReviews = {} as FootballStatsFromReviews;
    for (const k of FOOTBALL_STAT_KEYS) {
      out[k as keyof FootballStatsFromReviews] = result.stats[k] ?? 0;
    }
    return out;
  }

  /**
   * 종목별 스텟: 최근 20경기 평균 + 전체 유저 Z-score 기반 1~10 스케일링
   */
  async getSportStatsFromReviews(
    userId: number,
    sport: string,
  ): Promise<SportStatsResponse> {
    const statKeys = SPORT_RADAR_STAT_KEYS[sport] ?? [...FOOTBALL_STAT_KEYS];
    const emptyStats = Object.fromEntries(statKeys.map((k) => [k, 0]));

    // 최근 20경기: user 참여 + 리뷰 완료된 매치 (category = sport)
    const participantGroupIds = await this.participantRepository
      .createQueryBuilder('p')
      .innerJoin('p.group', 'g')
      .innerJoin(MatchReview, 'mr', 'mr.groupId = g.id')
      .where('p.userId = :userId', { userId })
      .andWhere('p.status = :status', { status: 'joined' })
      .andWhere('g.category = :sport', { sport })
      .select(['g.id', 'g.meetingDateTime'])
      .distinct(true)
      .getRawMany<{ g_id: number; g_meeting_date_time: Date | null }>();

    const sorted = participantGroupIds
      .map((r) => ({ id: r.g_id, meetingDateTime: r.g_meeting_date_time }))
      .sort((a, b) => {
        const da = a.meetingDateTime ? new Date(a.meetingDateTime).getTime() : 0;
        const db = b.meetingDateTime ? new Date(b.meetingDateTime).getTime() : 0;
        return db - da;
      })
      .slice(0, RECENT_MATCHES_LIMIT);

    const groupIds = sorted.map((r) => r.id);
    const recentGroups = sorted;
    if (groupIds.length === 0) {
      return {
        stats: emptyStats,
        matchCount: 0,
        overall: 0,
        statKeys: [...statKeys],
      };
    }

    // 각 매치별로 유저의 선택 횟수
    const reviewsByGroup = await this.matchReviewRepository
      .createQueryBuilder('r')
      .select('r.groupId', 'groupId')
      .addSelect('r.categoryKey', 'categoryKey')
      .addSelect('COUNT(*)', 'cnt')
      .where('r.selectedUserId = :userId', { userId })
      .andWhere('r.groupId IN (:...groupIds)', { groupIds })
      .andWhere('r.categoryKey IN (:...statKeys)', { statKeys })
      .groupBy('r.groupId')
      .addGroupBy('r.categoryKey')
      .getRawMany<{ groupId: number; categoryKey: string; cnt: string }>();

    const groupStatTotals: Record<number, Record<string, number>> = {};
    for (const gid of groupIds) {
      groupStatTotals[gid] = Object.fromEntries(statKeys.map((k) => [k, 0]));
    }
    for (const r of reviewsByGroup) {
      if (groupStatTotals[r.groupId] && statKeys.includes(r.categoryKey)) {
        groupStatTotals[r.groupId][r.categoryKey] = parseInt(r.cnt, 10) || 0;
      }
    }

    const n = groupIds.length;
    const rawAverages: Record<string, number> = {};
    for (const k of statKeys) {
      const sum = groupIds.reduce((s, gid) => s + (groupStatTotals[gid]?.[k] ?? 0), 0);
      rawAverages[k] = n > 0 ? sum / n : 0;
    }

    // 전체 유저 해당 종목 평균/표준편차 (Z-score용)
    const populationStats = await this.getPopulationStatsForSport(sport, [...statKeys]);
    const scaled: Record<string, number> = {};
    for (const k of statKeys) {
      const val = rawAverages[k] ?? 0;
      const mean = populationStats.mean[k] ?? 0;
      const std = populationStats.std[k] ?? 1;
      const z = std > 0 ? (val - mean) / std : 0;
      const scaledVal = 5.5 + 2.25 * z;
      scaled[k] = Math.max(1, Math.min(10, Math.round(scaledVal * 10) / 10));
    }

    const overall =
      statKeys.length > 0
        ? Math.round(
            (Object.values(scaled).reduce((a, b) => a + b, 0) / statKeys.length) *
              10
          ) / 10
        : 0;

    // 이전 달 대비 (선택)
    let prevMonthStats: Record<string, number> | undefined;
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const prevMonthGroups = recentGroups.filter(
      (g) => g.meetingDateTime && new Date(g.meetingDateTime) < oneMonthAgo,
    );
    if (prevMonthGroups.length >= MIN_MATCHES_FOR_STATS) {
      const prevGids = prevMonthGroups.map((g) => g.id);
      const prevReviews = await this.matchReviewRepository
        .createQueryBuilder('r')
        .select('r.groupId', 'groupId')
        .addSelect('r.categoryKey', 'categoryKey')
        .addSelect('COUNT(*)', 'cnt')
        .where('r.selectedUserId = :userId', { userId })
        .andWhere('r.groupId IN (:...prevGids)', { prevGids })
        .andWhere('r.categoryKey IN (:...statKeys)', { statKeys })
        .groupBy('r.groupId')
        .addGroupBy('r.categoryKey')
        .getRawMany<{ groupId: number; categoryKey: string; cnt: string }>();
      const prevTotals: Record<number, Record<string, number>> = {};
      for (const gid of prevGids) {
        prevTotals[gid] = Object.fromEntries(statKeys.map((k) => [k, 0]));
      }
      for (const r of prevReviews) {
        if (prevTotals[r.groupId] && statKeys.includes(r.categoryKey)) {
          prevTotals[r.groupId][r.categoryKey] = parseInt(r.cnt, 10) || 0;
        }
      }
      const prevN = prevGids.length;
      prevMonthStats = {};
      for (const k of statKeys) {
        const sum = prevGids.reduce((s, gid) => s + (prevTotals[gid]?.[k] ?? 0), 0);
        const avg = prevN > 0 ? sum / prevN : 0;
        const mean = populationStats.mean[k] ?? 0;
        const std = populationStats.std[k] ?? 1;
        const z = std > 0 ? (avg - mean) / std : 0;
        const scaledVal = 5.5 + 2.25 * z;
        prevMonthStats[k] = Math.max(1, Math.min(10, Math.round(scaledVal * 10) / 10));
      }
    }

    return {
      stats: scaled,
      matchCount: n,
      overall,
      statKeys: [...statKeys],
      prevMonthStats,
    };
  }

  /**
   * 해당 종목 전체 유저의 스텟 평균/표준편차 (최근 20경기 기준)
   */
  private async getPopulationStatsForSport(
    sport: string,
    statKeys: string[],
  ): Promise<{ mean: Record<string, number>; std: Record<string, number> }> {
    const mean: Record<string, number> = {};
    const std: Record<string, number> = {};
    for (const k of statKeys) {
      mean[k] = 0;
      std[k] = 1;
    }

    const rawData = await this.matchReviewRepository
      .createQueryBuilder('r')
      .innerJoin(Group, 'g', 'g.id = r.group_id AND g.category = :sport', { sport })
      .where('r.categoryKey IN (:...statKeys)', { statKeys })
      .select('r.selectedUserId', 'userId')
      .addSelect('r.groupId', 'groupId')
      .addSelect('r.categoryKey', 'categoryKey')
      .getRawMany<{ userId: number; groupId: number; categoryKey: string }>();

    const userGroupCounts: Record<number, Record<number, Record<string, number>>> = {};
    for (const row of rawData) {
      if (!userGroupCounts[row.userId]) {
        userGroupCounts[row.userId] = {};
      }
      if (!userGroupCounts[row.userId][row.groupId]) {
        userGroupCounts[row.userId][row.groupId] = Object.fromEntries(
          statKeys.map((k) => [k, 0]),
        );
      }
      if (statKeys.includes(row.categoryKey)) {
        userGroupCounts[row.userId][row.groupId][row.categoryKey] =
          (userGroupCounts[row.userId][row.groupId][row.categoryKey] ?? 0) + 1;
      }
    }

    const userAverages: Record<string, number[]> = {};
    for (const k of statKeys) {
      userAverages[k] = [];
    }
    for (const userId of Object.keys(userGroupCounts)) {
      const groups = userGroupCounts[Number(userId)];
      const groupIds = Object.keys(groups).map(Number);
      const recent = groupIds.slice(0, RECENT_MATCHES_LIMIT);
      if (recent.length < MIN_MATCHES_FOR_STATS) continue;
      for (const k of statKeys) {
        const sum = recent.reduce((s, gid) => s + (groups[gid]?.[k] ?? 0), 0);
        userAverages[k].push(sum / recent.length);
      }
    }

    for (const k of statKeys) {
      const arr = userAverages[k];
      if (arr.length > 0) {
        mean[k] = arr.reduce((a, b) => a + b, 0) / arr.length;
        const variance =
          arr.reduce((s, x) => s + (x - mean[k]) ** 2, 0) / arr.length;
        std[k] = Math.sqrt(variance) || 1;
      }
    }
    return { mean, std };
  }
}
