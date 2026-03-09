import { Controller, Get, Post, Delete, Query, UseGuards, Request, Param, ParseIntPipe, BadRequestException, NotFoundException, HttpCode, HttpStatus } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserScoreService } from './user-score.service';
import { FollowService } from './follow.service';
import { PointsService } from './points.service';
import { AchievementsService } from './achievements.service';
import { RecommendedUsersService } from './recommended-users.service';
import { UserReviewStatsService } from './user-review-stats.service';
import { NotificationsService } from '../notifications/notifications.service';
import { HallOfFameQueryDto } from './dto/hall-of-fame-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from './entities/user.entity';
import { PointTransactionType } from './entities/point-transaction.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSeasonScore } from './entities/user-season-score.entity';
import { NotificationType } from '../notifications/entities/notification.entity';

/**
 * 올코트플레이 랭크: 랭크 매치 참여 후 심판이 승패를 기록했을 때만 등급이 부여됨.
 * ohunRanks에 명시적으로 저장된 종목만 반환 (관심/참가 종목에 대한 기본 F/C 부여 없음).
 */
function getEffectiveAllcourtplayRanks(targetUser: User): Record<string, string> {
  const stored = targetUser.ohunRanks || {};
  const result: Record<string, string> = {};
  for (const [sport, rank] of Object.entries(stored)) {
    if (rank === 'none') {
      result[sport] = 'none';
    } else if (rank && /^[SABCDEF]$/i.test(rank)) {
      result[sport] = rank.toUpperCase();
    }
  }
  return result;
}

@Controller('api/users')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private userScoreService: UserScoreService,
    private followService: FollowService,
    private pointsService: PointsService,
    private achievementsService: AchievementsService,
    private recommendedUsersService: RecommendedUsersService,
    private userReviewStatsService: UserReviewStatsService,
    private notificationsService: NotificationsService,
    @InjectRepository(UserSeasonScore)
    private seasonScoreRepository: Repository<UserSeasonScore>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * 명예의 전당 랭킹 조회 (용병 지수 = 참가 횟수 + 활동 종목 수 + 매너점수 합산)
   */
  @Get('hall-of-fame')
  async getHallOfFame(@Query() queryDto: HallOfFameQueryDto) {
    const {
      year = new Date().getFullYear(),
      region = '전국',
      sport = '전체',
      page = 1,
      limit = 50,
    } = queryDto;

    const skip = (page - 1) * limit;

    // 용병 랭킹: sport='전체'인 행만 사용 (참가 횟수, 매너점수 포함)
    const allScores = await this.seasonScoreRepository
      .createQueryBuilder('score')
      .leftJoinAndSelect('score.user', 'user')
      .where('score.year = :year', { year })
      .andWhere('score.region = :region', { region })
      .andWhere('score.sport = :sport', { sport })
      .getMany();

    if (allScores.length === 0) {
      return { rankings: [], total: 0, page, limit, year, region, sport };
    }

    const userIds = allScores.map((s) => s.userId);
    // 활동한 종목 수: 같은 연도/지역에서 sport != '전체'인 행의 개수(종목별 1행)
    const sportsCountRaw = await this.seasonScoreRepository
      .createQueryBuilder('score')
      .select('score.userId', 'userId')
      .addSelect('COUNT(DISTINCT score.sport)', 'sportsCount')
      .where('score.year = :year', { year })
      .andWhere('score.region = :region', { region })
      .andWhere('score.sport != :sport', { sport: '전체' })
      .andWhere('score.userId IN (:...userIds)', { userIds })
      .groupBy('score.userId')
      .getRawMany<{ userId: number; sportsCount: string }>();

    const sportsCountByUser = new Map<number, number>();
    sportsCountRaw.forEach((r) => sportsCountByUser.set(r.userId, parseInt(r.sportsCount, 10) || 0));

    const WEIGHT_PARTICIPATION = 10;
    const WEIGHT_MANNER = 1;
    const WEIGHT_SPORTS = 20;

    const withComposite = allScores.map((score) => {
      const sportsCount = sportsCountByUser.get(score.userId) ?? 0;
      const composite =
        (score.groupsParticipated || 0) * WEIGHT_PARTICIPATION +
        (score.mannerScore || 0) * WEIGHT_MANNER +
        sportsCount * WEIGHT_SPORTS;
      return { score, composite, sportsCount };
    });

    withComposite.sort((a, b) => b.composite - a.composite);
    const total = withComposite.length;
    const paged = withComposite.slice(skip, skip + limit);

    const rankings = paged.map(({ score, composite, sportsCount }, index) => ({
      id: score.user.id,
      rank: skip + index + 1,
      nickname: score.user.nickname,
      tag: score.user.tag,
      score: composite,
      groupsParticipated: score.groupsParticipated ?? 0,
      mannerScore: score.mannerScore ?? 0,
      sportsCount,
      sportCategory: sport === '전체' ? '전체' : sport,
      region,
      year,
      activityScore: score.activityScore,
      leadershipScore: score.leadershipScore,
      diversityScore: score.diversityScore,
      continuityScore: score.continuityScore,
      growthScore: score.growthScore,
      groupsCreated: score.groupsCreated,
      groupsCompleted: score.groupsCompleted,
      avatar: score.user.profileImageUrl,
    }));

    return {
      rankings,
      total,
      page,
      limit,
      year,
      region,
      sport,
    };
  }

  /**
   * 내 순위 조회 (용병 지수 동일 공식 적용)
   */
  @Get('hall-of-fame/my-rank')
  @UseGuards(JwtAuthGuard)
  async getMyRank(@Request() req, @Query() queryDto: HallOfFameQueryDto) {
    const userId = req.user.userId;
    const {
      year = new Date().getFullYear(),
      region = '전국',
      sport = '전체',
    } = queryDto;

    const myScore = await this.seasonScoreRepository.findOne({
      where: { userId, year, region, sport },
      relations: ['user'],
    });

    if (!myScore) {
      return {
        rank: null,
        score: 0,
        groupsParticipated: 0,
        mannerScore: 0,
        sportsCount: 0,
        message: '랭킹 데이터가 없습니다.',
      };
    }

    const sportsCountRaw = await this.seasonScoreRepository
      .createQueryBuilder('score')
      .select('COUNT(DISTINCT score.sport)', 'sportsCount')
      .where('score.year = :year', { year })
      .andWhere('score.region = :region', { region })
      .andWhere('score.sport != :sport', { sport: '전체' })
      .andWhere('score.userId = :userId', { userId })
      .getRawOne<{ sportsCount: string }>();

    const sportsCount = parseInt(sportsCountRaw?.sportsCount ?? '0', 10) || 0;
    const WEIGHT_PARTICIPATION = 10;
    const WEIGHT_MANNER = 1;
    const WEIGHT_SPORTS = 20;
    const myComposite =
      (myScore.groupsParticipated || 0) * WEIGHT_PARTICIPATION +
      (myScore.mannerScore || 0) * WEIGHT_MANNER +
      sportsCount * WEIGHT_SPORTS;

    const allScores = await this.seasonScoreRepository
      .createQueryBuilder('score')
      .where('score.year = :year', { year })
      .andWhere('score.region = :region', { region })
      .andWhere('score.sport = :sport', { sport })
      .getMany();

    const userIds = allScores.map((s) => s.userId);
    const sportsCountRawAll = await this.seasonScoreRepository
      .createQueryBuilder('score')
      .select('score.userId', 'userId')
      .addSelect('COUNT(DISTINCT score.sport)', 'sportsCount')
      .where('score.year = :year', { year })
      .andWhere('score.region = :region', { region })
      .andWhere('score.sport != :sport', { sport: '전체' })
      .andWhere('score.userId IN (:...userIds)', { userIds })
      .groupBy('score.userId')
      .getRawMany<{ userId: number; sportsCount: string }>();

    const sportsCountByUser = new Map<number, number>();
    sportsCountRawAll.forEach((r) => sportsCountByUser.set(r.userId, parseInt(r.sportsCount, 10) || 0));

    const rank = allScores.filter((score) => {
      const sc = sportsCountByUser.get(score.userId) ?? 0;
      const composite =
        (score.groupsParticipated || 0) * WEIGHT_PARTICIPATION +
        (score.mannerScore || 0) * WEIGHT_MANNER +
        sc * WEIGHT_SPORTS;
      return composite > myComposite;
    }).length;

    return {
      rank: rank + 1,
      score: myComposite,
      groupsParticipated: myScore.groupsParticipated ?? 0,
      mannerScore: myScore.mannerScore ?? 0,
      sportsCount,
      year,
      region,
      sport,
    };
  }

  /**
   * 팔로우하기 (대상 유저에게 새 팔로워 알림 발송)
   */
  @Post('follow/:userId')
  @UseGuards(JwtAuthGuard)
  async follow(@CurrentUser() user: User, @Param('userId', ParseIntPipe) followingId: number) {
    await this.followService.follow(user.id, followingId);
    const displayName = `${user.nickname || '회원'}${user.tag || ''}`;
    await this.notificationsService.createNotification(
      followingId,
      NotificationType.NEW_FOLLOWER,
      '새 팔로워',
      `${displayName}님이 회원님을 팔로우했습니다.`,
      { followerId: user.id },
    );
    return { message: '팔로우했습니다.' };
  }

  /**
   * 언팔로우하기
   */
  @Delete('follow/:userId')
  @UseGuards(JwtAuthGuard)
  async unfollow(@CurrentUser() user: User, @Param('userId', ParseIntPipe) followingId: number) {
    await this.followService.unfollow(user.id, followingId);
    return { message: '언팔로우했습니다.' };
  }

  /**
   * 팔로워 목록 조회 (나를 팔로우하는 사람들, 맞팔로우 여부 포함)
   */
  @Get('followers')
  @UseGuards(JwtAuthGuard)
  async getFollowers(@CurrentUser() user: User) {
    const followers = await this.followService.getFollowers(user.id);
    const followingIds = await this.followService.getFollowing(user.id).then((list) =>
      list.map((u) => u.id),
    );
    return followers.map((follower) => ({
      id: follower.id,
      nickname: follower.nickname,
      tag: follower.tag,
      profileImageUrl: follower.profileImageUrl,
      isFollowing: followingIds.includes(follower.id),
    }));
  }

  /**
   * 팔로잉 목록 조회
   */
  @Get('following')
  @UseGuards(JwtAuthGuard)
  async getFollowing(@CurrentUser() user: User) {
    const following = await this.followService.getFollowing(user.id);
    return following.map((followingUser) => ({
      id: followingUser.id,
      nickname: followingUser.nickname,
      tag: followingUser.tag,
      profileImageUrl: followingUser.profileImageUrl,
      isFollowing: true,
    }));
  }

  /**
   * 같이 했던 유저 목록 조회
   */
  @Get('played-together')
  @UseGuards(JwtAuthGuard)
  async getUsersPlayedTogether(@CurrentUser() user: User) {
    const users = await this.followService.getUsersPlayedTogether(user.id);
    // 팔로우 여부도 함께 반환
    const followingIds = await this.followService.getFollowing(user.id).then((list) =>
      list.map((u) => u.id),
    );

    return users.map((user) => ({
      id: user.id,
      nickname: user.nickname,
      tag: user.tag,
      profileImageUrl: user.profileImageUrl,
      isFollowing: followingIds.includes(user.id),
    }));
  }

  /**
   * 전체 유저 검색 (닉네임, 태그, 이메일)
   */
  @Get('search')
  @UseGuards(JwtAuthGuard)
  async searchUsers(@CurrentUser() currentUser: User, @Query('q') query: string) {
    const q = (query || '').trim();
    if (!q || q.length < 1) {
      return [];
    }
    const users = await this.usersService.searchUsers(q, currentUser.id, 30);
    const followingIds = await this.followService.getFollowing(currentUser.id).then((list) =>
      list.map((u) => u.id),
    );
    return users.map((u) => ({
      id: u.id,
      nickname: u.nickname,
      tag: u.tag,
      profileImageUrl: u.profileImageUrl,
      isFollowing: followingIds.includes(u.id),
    }));
  }

  /**
   * 팔로우 여부 확인
   */
  @Get('follow/:userId/status')
  @UseGuards(JwtAuthGuard)
  async getFollowStatus(@CurrentUser() user: User, @Param('userId', ParseIntPipe) followingId: number) {
    const isFollowing = await this.followService.isFollowing(user.id, followingId);
    return { isFollowing };
  }

  /**
   * 내 포인트 획득/사용 내역 조회
   */
  @Get('my/point-history')
  @UseGuards(JwtAuthGuard)
  async getMyPointHistory(@CurrentUser() user: User, @Query('limit') limitStr?: string) {
    const limit = limitStr ? Math.min(parseInt(limitStr, 10) || 50, 100) : 50;
    return this.pointsService.getHistory(user.id, limit);
  }

  /**
   * 포인트 충전 (현재: 클릭 시 100,000P 지급. 추후 결제 연동 시 이 엔드포인트에서 결제 검증 후 지급)
   */
  @Post('my/charge')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async chargePoints(@CurrentUser() user: User) {
    const CHARGE_AMOUNT = 100000;
    const result = await this.pointsService.addTransaction(
      user.id,
      CHARGE_AMOUNT,
      PointTransactionType.EARN,
      '포인트 충전',
    );
    return { balance: result.balance, added: CHARGE_AMOUNT };
  }

  /**
   * 내 축구 스텟 (매치 리뷰에서 뽑힌 횟수 기반, 레이더차트용 1~10)
   * @deprecated GET me/sport-stats?sport=축구 사용 권장
   */
  @Get('me/football-stats')
  @UseGuards(JwtAuthGuard)
  async getMyFootballStats(@CurrentUser() user: User) {
    return this.userReviewStatsService.getFootballStatsFromReviews(user.id);
  }

  /**
   * 종목별 내 스텟 (최근 20경기 평균 + Z-score 1~10 스케일링)
   * ?sport=축구 | 풋살 | 농구 | 테니스
   */
  @Get('me/sport-stats')
  @UseGuards(JwtAuthGuard)
  async getMySportStats(
    @CurrentUser() user: User,
    @Query('sport') sport?: string,
  ) {
    const s = (sport || '축구').trim();
    return this.userReviewStatsService.getSportStatsFromReviews(user.id, s);
  }

  /**
   * 업적 동기화: 미지급 업적이 있으면 포인트 지급 후 결과 반환 (내 정보 페이지 로드 시 호출)
   */
  @Get('me/achievements/sync')
  @UseGuards(JwtAuthGuard)
  async syncMyAchievements(@CurrentUser() user: User) {
    return this.achievementsService.syncAchievements(user.id);
  }

  /**
   * 다른 유저의 프로필 요약 (공개 정보만: 닉네임, 지역, 관심 종목, 올코트플레이 랭크, 선수 여부, 가입일, 팔로워/팔로잉 수)
   */
  @Get(':id/profile-summary')
  @UseGuards(JwtAuthGuard)
  async getProfileSummary(
    @CurrentUser() currentUser: User,
    @Param('id', ParseIntPipe) userId: number,
  ) {
    const targetUser = await this.usersService.findById(userId);
    if (!targetUser) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }
    const [followersCount, followingCount, isFollowing, activitySummary] = await Promise.all([
      this.followService.getFollowersCount(userId),
      this.followService.getFollowingCount(userId),
      this.followService.isFollowing(currentUser.id, userId),
      this.usersService.getActivitySummaryForProfile(userId),
    ]);
    const effectiveRanks = getEffectiveAllcourtplayRanks(targetUser);
    const earnedTitles = this.usersService.getEarnedTitlesFromCount(activitySummary.countByCategory);
    const preferredPosition =
      targetUser.sportPositions?.length && targetUser.sportPositions[0].positions?.length
        ? targetUser.sportPositions[0].positions.join(', ')
        : null;
    const ohunRankPoints = targetUser.ohunRankPoints ?? {};
    const primarySport =
      Object.keys(effectiveRanks)[0] ||
      targetUser.interestedSports?.[0] ||
      (Object.keys(ohunRankPoints).length ? Object.keys(ohunRankPoints)[0] : null);
    const primaryStats = primarySport ? ohunRankPoints[primarySport] : null;
    const totalGames = primaryStats ? primaryStats.wins + primaryStats.losses : 0;
    const winRate = totalGames > 0 ? Math.round((primaryStats!.wins / totalGames) * 100) : 0;
    const totalScore =
      primaryStats != null ? primaryStats.points : targetUser.totalScore ?? 0;
    return {
      id: targetUser.id,
      nickname: targetUser.nickname,
      tag: targetUser.tag,
      profileImageUrl: targetUser.profileImageUrl,
      residenceSido: targetUser.residenceSido,
      residenceSigungu: targetUser.residenceSigungu,
      interestedSports: targetUser.interestedSports || [],
      effectiveRanks: Object.keys(effectiveRanks).length ? effectiveRanks : undefined,
      athleteVerified: targetUser.athleteVerified,
      athleteData: targetUser.athleteData ? { sport: targetUser.athleteData.sport } : null,
      createdAt: targetUser.createdAt,
      followersCount,
      followingCount,
      totalScore,
      isFollowing,
      skillLevel: targetUser.skillLevel ?? null,
      mannerScore: targetUser.mannerScore ?? 80, // 기본 80점 (기존 데이터 호환)
      preferredPosition: preferredPosition ?? undefined,
      earnedTitles,
      recentCompletedActivities: activitySummary.recentCompleted,
      rankMatchStats:
        primaryStats != null
          ? { totalGames, wins: primaryStats.wins, losses: primaryStats.losses, winRate }
          : undefined,
    };
  }

  /**
   * 추천 유저 (거리, 친구의 친구, 같은 종목 기반)
   */
  @Get('recommended')
  @UseGuards(JwtAuthGuard)
  async getRecommendedUsers(@CurrentUser() user: User, @Query('limit') limitStr?: string) {
    const limit = limitStr ? Math.min(parseInt(limitStr, 10) || 20, 50) : 20;
    const recommended = await this.recommendedUsersService.getRecommendedUsers(user.id, limit);
    const followingIds = await this.followService.getFollowing(user.id).then((list) =>
      list.map((u) => u.id),
    );
    return recommended.map((r) => ({
      ...r,
      isFollowing: followingIds.includes(r.id),
    }));
  }

  /**
   * 매치 초대 (DM처럼 상대 유저에게 함께 매치하고 싶다는 알림 전송)
   */
  /**
   * 선수 등록: 대한체육회 스포츠지원포털 선수 API로 실명 조회 후 선수 뱃지 부여
   */
  @Post('athlete-register')
  @UseGuards(JwtAuthGuard)
  async registerAthlete(@CurrentUser() user: User) {
    return this.usersService.registerAthlete(user.id);
  }

  /**
   * 매치 초대 (DM처럼 상대 유저에게 함께 매치하고 싶다는 알림 전송)
   */
  @Post('match-invite/:userId')
  @UseGuards(JwtAuthGuard)
  async sendMatchInvite(
    @CurrentUser() inviter: User,
    @Param('userId', ParseIntPipe) inviteeId: number,
  ) {
    if (inviter.id === inviteeId) {
      throw new BadRequestException('자기 자신에게는 초대할 수 없습니다.');
    }
    const invitee = await this.usersService.findById(inviteeId);
    if (!invitee) {
      throw new NotFoundException('초대할 사용자를 찾을 수 없습니다.');
    }
    await this.notificationsService.createNotification(
      inviteeId,
      NotificationType.SYSTEM,
      '함께 매치하고 싶어요',
      `${inviter.nickname}${inviter.tag ? ` ${inviter.tag}` : ''}님이 함께 매치하고 싶어합니다. 프로필을 확인해 보세요!`,
      { inviterId: inviter.id, type: 'match_invite' },
    );
    return { message: '매치 초대를 보냈습니다.' };
  }
}
