import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThanOrEqual } from 'typeorm';
import { User } from './entities/user.entity';
import { UserScoreHistory, ScoreType } from './entities/user-score-history.entity';
import { UserActivityLog, ActivityType } from './entities/user-activity-log.entity';
import { UserSportParticipation } from './entities/user-sport-participation.entity';
import { UserSeasonScore } from './entities/user-season-score.entity';
import { GroupParticipant } from '../groups/entities/group-participant.entity';
import { Group } from '../groups/entities/group.entity';
import { GroupEvaluation } from '../groups/entities/group-evaluation.entity';

@Injectable()
export class UserScoreService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserScoreHistory)
    private scoreHistoryRepository: Repository<UserScoreHistory>,
    @InjectRepository(UserActivityLog)
    private activityLogRepository: Repository<UserActivityLog>,
    @InjectRepository(UserSportParticipation)
    private sportParticipationRepository: Repository<UserSportParticipation>,
    @InjectRepository(UserSeasonScore)
    private seasonScoreRepository: Repository<UserSeasonScore>,
    @InjectRepository(GroupParticipant)
    private participantRepository: Repository<GroupParticipant>,
    @InjectRepository(Group)
    private groupRepository: Repository<Group>,
    @InjectRepository(GroupEvaluation)
    private evaluationRepository: Repository<GroupEvaluation>,
  ) {}

  /**
   * 활동점수 계산 (참가 횟수 기반)
   */
  async calculateActivityScore(userId: number): Promise<number> {
    const participationCount = await this.participantRepository.count({
      where: { userId, status: 'joined' },
    });
    
    // 참가 횟수당 10점 (최대 1000점)
    const score = Math.min(participationCount * 10, 1000);
    return score;
  }

  /**
   * 매너점수 계산 (성실 참가, 지각/불참 감점)
   */
  async calculateMannerScore(userId: number): Promise<number> {
    const participations = await this.participantRepository.find({
      where: { userId },
    });

    let score = 100; // 기본 점수 100점
    let lateCount = 0;
    let absentCount = 0;
    let completedCount = 0;

    for (const participation of participations) {
      if (participation.wasLate) lateCount++;
      if (participation.wasAbsent) absentCount++;
      if (participation.wasCompleted) completedCount++;
    }

    // 지각: -5점, 불참: -10점
    score -= lateCount * 5;
    score -= absentCount * 10;
    
    // 완주: +2점
    score += completedCount * 2;

    // 최소 0점, 최대 200점
    return Math.max(0, Math.min(score, 200));
  }

  /**
   * 리더십점수 계산 (모임 생성 및 운영)
   */
  async calculateLeadershipScore(userId: number): Promise<number> {
    // User 엔티티의 groupsCreated 필드 사용 (성능 최적화)
    const user = await this.userRepository.findOne({ where: { id: userId } });
    const groupsCreated = user?.groupsCreated || 0;
    
    // 실제 생성한 모임 수와 동기화 (정확도 보장)
    const actualGroupsCreated = await this.groupRepository.count({
      where: { creatorId: userId },
    });
    
    // 동기화 불일치 시 업데이트
    if (groupsCreated !== actualGroupsCreated && user) {
      user.groupsCreated = actualGroupsCreated;
      await this.userRepository.save(user);
    }

    // 생성한 모임의 완주율 계산
    const createdGroups = await this.groupRepository.find({
      where: { creatorId: userId },
      relations: ['participants'],
    });

    let totalGroups = createdGroups.length;
    let completedGroups = 0;
    let totalRating = 0;
    let ratingCount = 0;

    for (const group of createdGroups) {
      // 모임이 완료되었는지 확인 (meetingDateTime이 지났고, 최소 인원 이상 참가)
      if (group.meetingDateTime && group.meetingDateTime < new Date()) {
        const participantCount = await this.participantRepository.count({
          where: { groupId: group.id },
        });
        
        if (participantCount >= (group.minParticipants || 1)) {
          completedGroups++;
        }
      }

      // 모임 평가 평균 계산
      const evaluations = await this.evaluationRepository.find({
        where: { groupId: group.id },
      });

      if (evaluations.length > 0) {
        const avgRating = evaluations.reduce((sum, e) => sum + Number(e.rating), 0) / evaluations.length;
        totalRating += avgRating;
        ratingCount++;
      }
    }

    const completionRate = totalGroups > 0 ? (completedGroups / totalGroups) * 100 : 0;
    const averageRating = ratingCount > 0 ? totalRating / ratingCount : 0;

    // 모임 생성: 개당 20점 (최대 200점)
    // 완주율: 완주율 * 2점 (최대 100점)
    // 평균 평가: 평균 평가 * 10점 (최대 100점)
    let score = Math.min(groupsCreated * 20, 200);
    score += Math.min(completionRate * 2, 100);
    score += Math.min(averageRating * 10, 100);

    return Math.min(score, 400); // 최대 400점
  }

  /**
   * 다양성점수 계산 (다양한 운동 참가)
   */
  async calculateDiversityScore(userId: number): Promise<number> {
    const participations = await this.sportParticipationRepository.find({
      where: { userId },
    });

    const uniqueSportsCount = participations.length;
    
    // 고유 운동 종목 수: 개당 30점 (최대 300점)
    let score = uniqueSportsCount * 30;

    // 새로운 운동 시도 보너스 (첫 참가일이 최근 30일 이내)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    for (const participation of participations) {
      if (
        participation.firstParticipationDate &&
        participation.firstParticipationDate >= thirtyDaysAgo
      ) {
        score += 10; // 새로운 운동 시도 보너스
      }
    }

    return Math.min(score, 500); // 최대 500점
  }

  /**
   * 연속점수 계산 (연속 참가)
   */
  async calculateContinuityScore(userId: number): Promise<number> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return 0;

    const consecutiveDays = user.consecutiveDays || 0;
    const longestConsecutiveDays = user.longestConsecutiveDays || 0;

    // 현재 연속 일수: 일당 5점 (최대 200점)
    // 최장 연속 일수: 일당 2점 (최대 100점)
    let score = Math.min(consecutiveDays * 5, 200);
    score += Math.min(longestConsecutiveDays * 2, 100);

    return Math.min(score, 300); // 최대 300점
  }

  /**
   * 성장점수 계산 (실력 향상, 랭커 달성)
   */
  async calculateGrowthScore(userId: number): Promise<number> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return 0;

    let score = 0;

    // 실력 레벨 상승: beginner -> intermediate: 50점, intermediate -> advanced: 100점
    if (user.skillLevel === 'intermediate' && user.previousSkillLevel === 'beginner') {
      score += 50;
    } else if (user.skillLevel === 'advanced' && user.previousSkillLevel === 'intermediate') {
      score += 100;
    } else if (user.skillLevel === 'advanced' && user.previousSkillLevel === 'beginner') {
      score += 150; // 초급에서 고급으로 바로 상승
    }

    // 랭커 달성: 200점
    if (user.skillLevel === 'advanced' && user.rankerAchievedAt) {
      score += 200;
    }

    // 실력 레벨 상승일이 최근 90일 이내면 보너스
    if (user.skillLevelUpgradedAt) {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      
      if (user.skillLevelUpgradedAt >= ninetyDaysAgo) {
        score += 50; // 최근 상승 보너스
      }
    }

    return Math.min(score, 500); // 최대 500점
  }

  /**
   * 모든 점수 재계산 및 업데이트
   */
  async recalculateAllScores(userId: number): Promise<void> {
    const activityScore = await this.calculateActivityScore(userId);
    const mannerScore = await this.calculateMannerScore(userId);
    const leadershipScore = await this.calculateLeadershipScore(userId);
    const diversityScore = await this.calculateDiversityScore(userId);
    const continuityScore = await this.calculateContinuityScore(userId);
    const growthScore = await this.calculateGrowthScore(userId);

    // 총합 점수 계산 (가중치 적용)
    const totalScore =
      activityScore * 0.3 +
      mannerScore * 0.25 +
      leadershipScore * 0.1 +
      diversityScore * 0.1 +
      continuityScore * 0.1 +
      growthScore * 0.15;

    // User 엔티티 업데이트
    await this.userRepository.update(userId, {
      totalScore: Math.round(totalScore),
      activityScore,
      mannerScore,
      leadershipScore,
      diversityScore,
      continuityScore,
      growthScore,
    });

    // 연도별 점수 업데이트
    await this.updateSeasonScores(userId);
  }

  /**
   * 연도별 점수 업데이트 (지역별, 운동별)
   */
  async updateSeasonScores(userId: number): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return;

    const currentYear = new Date().getFullYear();
    const region = user.residenceSido || '전국'; // 시/도 기준

    // 전체 점수 (전국, 전체 운동)
    await this.updateSeasonScoreForCategory(
      userId,
      currentYear,
      '전국',
      '전체',
      user.totalScore || 0,
      user.activityScore || 0,
      user.mannerScore || 0,
      user.victoryScore || 0,
      user.leadershipScore || 0,
      user.diversityScore || 0,
      user.continuityScore || 0,
      user.growthScore || 0,
    );

    // 지역별 점수 (해당 지역, 전체 운동)
    await this.updateSeasonScoreForCategory(
      userId,
      currentYear,
      region,
      '전체',
      user.totalScore || 0,
      user.activityScore || 0,
      user.mannerScore || 0,
      user.victoryScore || 0,
      user.leadershipScore || 0,
      user.diversityScore || 0,
      user.continuityScore || 0,
      user.growthScore || 0,
    );

    // 운동별 점수 계산 (참가한 각 운동별로)
    const sportParticipations = await this.sportParticipationRepository.find({
      where: { userId },
    });

    for (const participation of sportParticipations) {
      // 해당 운동에 대한 점수 계산 (간단화: 전체 점수의 일부)
      const sportScore = Math.round((user.totalScore || 0) * 0.8); // 운동별 점수는 전체의 80%

      // 전국, 해당 운동
      await this.updateSeasonScoreForCategory(
        userId,
        currentYear,
        '전국',
        participation.sport,
        sportScore,
        Math.round((user.activityScore || 0) * 0.8),
        Math.round((user.mannerScore || 0) * 0.8),
        Math.round((user.victoryScore || 0) * 0.8),
        Math.round((user.leadershipScore || 0) * 0.8),
        Math.round((user.diversityScore || 0) * 0.8),
        Math.round((user.continuityScore || 0) * 0.8),
        Math.round((user.growthScore || 0) * 0.8),
      );

      // 지역, 해당 운동
      await this.updateSeasonScoreForCategory(
        userId,
        currentYear,
        region,
        participation.sport,
        sportScore,
        Math.round((user.activityScore || 0) * 0.8),
        Math.round((user.mannerScore || 0) * 0.8),
        Math.round((user.victoryScore || 0) * 0.8),
        Math.round((user.leadershipScore || 0) * 0.8),
        Math.round((user.diversityScore || 0) * 0.8),
        Math.round((user.continuityScore || 0) * 0.8),
        Math.round((user.growthScore || 0) * 0.8),
      );
    }
  }

  /**
   * 특정 카테고리(연도/지역/운동)의 시즌 점수 업데이트
   */
  async updateSeasonScoreForCategory(
    userId: number,
    year: number,
    region: string,
    sport: string,
    totalScore: number,
    activityScore: number,
    mannerScore: number,
    victoryScore: number,
    leadershipScore: number,
    diversityScore: number,
    continuityScore: number,
    growthScore: number,
  ): Promise<void> {
    let seasonScore = await this.seasonScoreRepository.findOne({
      where: { userId, year, region, sport },
    });

    if (!seasonScore) {
      seasonScore = this.seasonScoreRepository.create({
        userId,
        year,
        region,
        sport,
      });
    }

    seasonScore.totalScore = totalScore;
    seasonScore.activityScore = activityScore;
    seasonScore.mannerScore = mannerScore;
    seasonScore.victoryScore = victoryScore;
    seasonScore.leadershipScore = leadershipScore;
    seasonScore.diversityScore = diversityScore;
    seasonScore.continuityScore = continuityScore;
    seasonScore.growthScore = growthScore;

    // 통계 업데이트
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (user) {
      seasonScore.groupsCreated = user.groupsCreated || 0;
      seasonScore.groupsParticipated = await this.participantRepository.count({
        where: { userId },
      });
      // 완주 수는 추후 구현
    }

    await this.seasonScoreRepository.save(seasonScore);
  }

  /**
   * 모임 참가 시 점수 업데이트
   */
  async onGroupJoin(userId: number, groupId: number, sport: string): Promise<void> {
    // 활동 로그 기록
    await this.activityLogRepository.save({
      userId,
      activityType: ActivityType.GROUP_JOIN,
      relatedGroupId: groupId,
      relatedSport: sport,
      pointsEarned: 10,
    });

    // 운동별 참가 통계 업데이트
    await this.updateSportParticipation(userId, sport);

    // 연속성 업데이트
    await this.updateContinuity(userId);

    // 점수 재계산
    await this.recalculateAllScores(userId);
  }

  /**
   * 모임 완주 시 점수 업데이트
   */
  async onGroupComplete(userId: number, groupId: number): Promise<void> {
    // 활동 로그 기록
    await this.activityLogRepository.save({
      userId,
      activityType: ActivityType.GROUP_COMPLETE,
      relatedGroupId: groupId,
      pointsEarned: 20,
    });

    // 점수 재계산
    await this.recalculateAllScores(userId);
  }

  /**
   * 운동별 참가 통계 업데이트
   */
  async updateSportParticipation(userId: number, sport: string): Promise<void> {
    let participation = await this.sportParticipationRepository.findOne({
      where: { userId, sport },
    });

    if (!participation) {
      participation = this.sportParticipationRepository.create({
        userId,
        sport,
        participationCount: 0,
        firstParticipationDate: new Date(),
      });
    }

    participation.participationCount += 1;
    participation.lastParticipationDate = new Date();

    await this.sportParticipationRepository.save(participation);

    // User의 participatedSports 업데이트
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (user && !user.participatedSports.includes(sport)) {
      user.participatedSports = [...user.participatedSports, sport];
      user.uniqueSportsCount = user.participatedSports.length;
      await this.userRepository.save(user);
    }
  }

  /**
   * 연속성 업데이트
   */
  async updateContinuity(userId: number): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastDate = user.lastParticipationDate
      ? new Date(user.lastParticipationDate)
      : null;
    if (lastDate) {
      lastDate.setHours(0, 0, 0, 0);
    }

    if (!lastDate || lastDate.getTime() === today.getTime()) {
      // 오늘 이미 참가했으면 업데이트 안 함
      return;
    }

    const daysDiff = Math.floor((today.getTime() - (lastDate?.getTime() || 0)) / (1000 * 60 * 60 * 24));

    if (daysDiff === 1) {
      // 연속 참가
      user.consecutiveDays = (user.consecutiveDays || 0) + 1;
      if (user.consecutiveDays > (user.longestConsecutiveDays || 0)) {
        user.longestConsecutiveDays = user.consecutiveDays;
      }
    } else if (daysDiff > 1) {
      // 연속이 끊김
      user.consecutiveDays = 1;
    } else {
      // 첫 참가
      user.consecutiveDays = 1;
    }

    user.lastParticipationDate = today;
    await this.userRepository.save(user);
  }

  /**
   * 실력 레벨 상승 처리
   */
  async upgradeSkillLevel(userId: number, newLevel: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return;

    const previousLevel = user.skillLevel;
    
    if (previousLevel !== newLevel) {
      user.previousSkillLevel = previousLevel as any;
      user.skillLevel = newLevel as any;
      user.skillLevelUpgradedAt = new Date();

      // 랭커 달성 체크
      if (newLevel === 'advanced' && !user.rankerAchievedAt) {
        user.rankerAchievedAt = new Date();
        
        // 활동 로그 기록
        await this.activityLogRepository.save({
          userId,
          activityType: ActivityType.RANKER_ACHIEVED,
          pointsEarned: 200,
        });
      }

      // 활동 로그 기록
      await this.activityLogRepository.save({
        userId,
        activityType: ActivityType.SKILL_UPGRADE,
        pointsEarned: newLevel === 'advanced' ? 100 : 50,
      });

      await this.userRepository.save(user);
      await this.recalculateAllScores(userId);
    }
  }
}
