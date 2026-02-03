import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Follow } from './entities/follow.entity';
import { User } from './entities/user.entity';

@Injectable()
export class FollowService {
  constructor(
    @InjectRepository(Follow)
    private followRepository: Repository<Follow>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * 팔로우하기
   */
  async follow(followerId: number, followingId: number): Promise<Follow> {
    // 자기 자신을 팔로우할 수 없음
    if (followerId === followingId) {
      throw new BadRequestException('자기 자신을 팔로우할 수 없습니다.');
    }

    // 팔로잉 대상이 존재하는지 확인
    const following = await this.userRepository.findOne({
      where: { id: followingId },
    });

    if (!following) {
      throw new NotFoundException('팔로우할 사용자를 찾을 수 없습니다.');
    }

    // 이미 팔로우 중인지 확인
    const existingFollow = await this.followRepository.findOne({
      where: {
        followerId,
        followingId,
      },
    });

    if (existingFollow) {
      throw new BadRequestException('이미 팔로우 중인 사용자입니다.');
    }

    // 팔로우 생성
    const follow = this.followRepository.create({
      followerId,
      followingId,
    });

    return await this.followRepository.save(follow);
  }

  /**
   * 언팔로우하기
   */
  async unfollow(followerId: number, followingId: number): Promise<void> {
    const follow = await this.followRepository.findOne({
      where: {
        followerId,
        followingId,
      },
    });

    if (!follow) {
      throw new NotFoundException('팔로우 관계를 찾을 수 없습니다.');
    }

    await this.followRepository.remove(follow);
  }

  /**
   * 팔로워 목록 조회 (나를 팔로우하는 사람들)
   */
  async getFollowers(userId: number): Promise<User[]> {
    const follows = await this.followRepository.find({
      where: { followingId: userId },
      relations: ['follower'],
      order: { createdAt: 'DESC' },
    });

    return follows.map((follow) => follow.follower);
  }

  /**
   * 팔로잉 목록 조회 (내가 팔로우하는 사람들)
   */
  async getFollowing(userId: number): Promise<User[]> {
    const follows = await this.followRepository.find({
      where: { followerId: userId },
      relations: ['following'],
      order: { createdAt: 'DESC' },
    });

    return follows.map((follow) => follow.following);
  }

  /**
   * 팔로워 수 조회
   */
  async getFollowersCount(userId: number): Promise<number> {
    return this.followRepository.count({ where: { followingId: userId } });
  }

  /**
   * 팔로잉 수 조회
   */
  async getFollowingCount(userId: number): Promise<number> {
    return this.followRepository.count({ where: { followerId: userId } });
  }

  /**
   * 팔로우 여부 확인
   */
  async isFollowing(followerId: number, followingId: number): Promise<boolean> {
    const follow = await this.followRepository.findOne({
      where: {
        followerId,
        followingId,
      },
    });

    return !!follow;
  }

  /**
   * 팔로우 한 단계: 내가 팔로우하는 사람들이 팔로우하는 유저 (친구의 친구)
   * 자기 자신과 이미 팔로우 중인 유저 제외
   */
  async getFriendsOfFriends(userId: number): Promise<Map<number, number>> {
    const myFollowing = await this.getFollowing(userId);
    const myFollowingIds = new Set(myFollowing.map((u) => u.id));
    if (myFollowingIds.size === 0) return new Map();

    const candidateCounts = new Map<number, number>();
    for (const friend of myFollowing) {
      const theirFollowing = await this.getFollowing(friend.id);
      for (const candidate of theirFollowing) {
        if (candidate.id === userId || myFollowingIds.has(candidate.id)) continue;
        candidateCounts.set(candidate.id, (candidateCounts.get(candidate.id) ?? 0) + 1);
      }
    }
    return candidateCounts;
  }

  /**
   * 같이 했던 유저 목록 조회 (같은 모임에 참여한 적이 있는 유저)
   */
  async getUsersPlayedTogether(userId: number): Promise<User[]> {
    // 같은 그룹에 참여한 적이 있는 유저들을 조회
    // GroupParticipant를 통해 조회
    const query = this.userRepository
      .createQueryBuilder('user')
      .innerJoin(
        'group_participants',
        'gp1',
        'gp1.user_id = user.id AND gp1.user_id != :userId',
        { userId },
      )
      .innerJoin(
        'group_participants',
        'gp2',
        'gp2.group_id = gp1.group_id AND gp2.user_id = :userId',
        { userId },
      )
      .where('user.id != :userId', { userId })
      .groupBy('user.id')
      .orderBy('MAX(gp1.joined_at)', 'DESC')
      .limit(50);

    return await query.getMany();
  }
}
