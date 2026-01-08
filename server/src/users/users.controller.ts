import { Controller, Get, Post, Delete, Query, UseGuards, Request, Param, ParseIntPipe } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserScoreService } from './user-score.service';
import { FollowService } from './follow.service';
import { HallOfFameQueryDto } from './dto/hall-of-fame-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSeasonScore } from './entities/user-season-score.entity';

@Controller('api/users')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private userScoreService: UserScoreService,
    private followService: FollowService,
    @InjectRepository(UserSeasonScore)
    private seasonScoreRepository: Repository<UserSeasonScore>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * 명예의 전당 랭킹 조회
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

    // 랭킹 조회
    const queryBuilder = this.seasonScoreRepository
      .createQueryBuilder('score')
      .leftJoinAndSelect('score.user', 'user')
      .where('score.year = :year', { year })
      .andWhere('score.region = :region', { region })
      .andWhere('score.sport = :sport', { sport })
      .orderBy('score.totalScore', 'DESC')
      .addOrderBy('score.createdAt', 'ASC') // 동점 시 먼저 달성한 사람이 우선
      .skip(skip)
      .take(limit);

    const [scores, total] = await queryBuilder.getManyAndCount();

    // 랭킹 데이터 포맷팅
    const rankings = scores.map((score, index) => ({
      id: score.user.id,
      rank: skip + index + 1,
      nickname: score.user.nickname,
      tag: score.user.tag,
      score: score.totalScore,
      sportCategory: sport === '전체' ? '전체' : sport,
      region: region,
      year: year,
      activityScore: score.activityScore,
      mannerScore: score.mannerScore,
      leadershipScore: score.leadershipScore,
      diversityScore: score.diversityScore,
      continuityScore: score.continuityScore,
      growthScore: score.growthScore,
      groupsCreated: score.groupsCreated,
      groupsParticipated: score.groupsParticipated,
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
   * 내 순위 조회
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

    // 내 점수 조회
    const myScore = await this.seasonScoreRepository.findOne({
      where: { userId, year, region, sport },
      relations: ['user'],
    });

    if (!myScore) {
      return {
        rank: null,
        score: 0,
        message: '랭킹 데이터가 없습니다.',
      };
    }

    // 내 순위 계산
    const rank = await this.seasonScoreRepository
      .createQueryBuilder('score')
      .where('score.year = :year', { year })
      .andWhere('score.region = :region', { region })
      .andWhere('score.sport = :sport', { sport })
      .andWhere(
        '(score.totalScore > :myScore OR (score.totalScore = :myScore AND score.createdAt < :myCreatedAt))',
        {
          myScore: myScore.totalScore,
          myCreatedAt: myScore.createdAt,
        },
      )
      .getCount();

    return {
      rank: rank + 1,
      score: myScore.totalScore,
      year,
      region,
      sport,
    };
  }

  /**
   * 팔로우하기
   */
  @Post('follow/:userId')
  @UseGuards(JwtAuthGuard)
  async follow(@CurrentUser() user: User, @Param('userId', ParseIntPipe) followingId: number) {
    await this.followService.follow(user.id, followingId);
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
   * 팔로워 목록 조회
   */
  @Get('followers')
  @UseGuards(JwtAuthGuard)
  async getFollowers(@CurrentUser() user: User) {
    const followers = await this.followService.getFollowers(user.id);
    return followers.map((follower) => ({
      id: follower.id,
      nickname: follower.nickname,
      tag: follower.tag,
      profileImageUrl: follower.profileImageUrl,
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
   * 팔로우 여부 확인
   */
  @Get('follow/:userId/status')
  @UseGuards(JwtAuthGuard)
  async getFollowStatus(@CurrentUser() user: User, @Param('userId', ParseIntPipe) followingId: number) {
    const isFollowing = await this.followService.isFollowing(user.id, followingId);
    return { isFollowing };
  }
}
