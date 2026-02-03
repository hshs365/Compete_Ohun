import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserStatus } from './entities/user.entity';
import { FollowService } from './follow.service';

/** Haversine 공식으로 두 좌표 간 거리(km) 계산 */
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // 지구 반경(km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export interface RecommendedUserDto {
  id: number;
  nickname: string;
  tag: string | null;
  profileImageUrl: string | null;
  isFollowing: boolean;
  totalScore: number;
  participatedSports: string[];
  interestedSports: string[];
  residenceSido: string;
  residenceSigungu: string;
  mutualCount: number;
  distanceKm: number | null;
  commonSports: string[];
  scoreBreakdown?: { mutual: number; region: number; sport: number; distance: number };
}

@Injectable()
export class RecommendedUsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private followService: FollowService,
  ) {}

  async getRecommendedUsers(
    userId: number,
    limit = 20,
  ): Promise<RecommendedUserDto[]> {
    const me = await this.userRepository.findOne({
      where: { id: userId, status: UserStatus.ACTIVE },
    });
    if (!me) return [];

    const followingIds = new Set(
      (await this.followService.getFollowing(userId)).map((u) => u.id),
    );
    const playedTogetherIds = new Set(
      (await this.followService.getUsersPlayedTogether(userId)).map((u) => u.id),
    );
    const friendsOfFriends = await this.followService.getFriendsOfFriends(userId);

    const mySports = new Set<string>([
      ...(me.interestedSports || []),
      ...(me.participatedSports || []),
    ].filter(Boolean));
    const myLat = me.latitude != null ? Number(me.latitude) : null;
    const myLon = me.longitude != null ? Number(me.longitude) : null;
    const mySido = me.residenceSido || '';

    // 후보: ACTIVE 유저 중 자기 자신, 이미 팔로우 중인 유저 제외
    const candidates = await this.userRepository
      .createQueryBuilder('user')
      .where('user.id != :userId', { userId })
      .andWhere('user.status = :status', { status: UserStatus.ACTIVE })
      .getMany();

    const scored: Array<{ user: User; score: number; breakdown: { mutual: number; region: number; sport: number; distance: number } }> = [];

    for (const candidate of candidates) {
      if (followingIds.has(candidate.id)) continue;

      let mutualScore = 0;
      const mutualCount = friendsOfFriends.get(candidate.id) ?? 0;
      mutualScore = mutualCount * 30; // 친구의 친구 1명당 30점

      let regionScore = 0;
      if (candidate.residenceSido && mySido && candidate.residenceSido === mySido) {
        regionScore = 20; // 같은 시/도
      }

      let sportScore = 0;
      const candidateSports = new Set<string>([
        ...(candidate.interestedSports || []),
        ...(candidate.participatedSports || []),
      ].filter(Boolean));
      const commonSports = [...mySports].filter((s) => candidateSports.has(s));
      sportScore = commonSports.length * 15; // 공통 종목당 15점

      let distanceScore = 0;
      let distanceKm: number | null = null;
      const candLat = candidate.latitude != null ? Number(candidate.latitude) : null;
      const candLon = candidate.longitude != null ? Number(candidate.longitude) : null;
      if (myLat != null && myLon != null && candLat != null && candLon != null) {
        distanceKm = haversineDistance(myLat, myLon, candLat, candLon);
        if (distanceKm < 10) distanceScore = 15;
        else if (distanceKm < 30) distanceScore = 10;
        else if (distanceKm < 50) distanceScore = 5;
      }

      const totalScore = mutualScore + regionScore + sportScore + distanceScore;
      scored.push({
        user: candidate,
        score: totalScore,
        breakdown: { mutual: mutualScore, region: regionScore, sport: sportScore, distance: distanceScore },
      });
    }

    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, limit);

    return top.map(({ user, breakdown }) => ({
      id: user.id,
      nickname: user.nickname,
      tag: user.tag,
      profileImageUrl: user.profileImageUrl,
      isFollowing: false,
      totalScore: user.totalScore ?? 0,
      participatedSports: user.participatedSports || [],
      interestedSports: user.interestedSports || [],
      residenceSido: user.residenceSido || '',
      residenceSigungu: user.residenceSigungu || '',
      mutualCount: friendsOfFriends.get(user.id) ?? 0,
      distanceKm:
        me.latitude != null &&
        me.longitude != null &&
        user.latitude != null &&
        user.longitude != null
          ? Math.round(
              haversineDistance(
                Number(me.latitude),
                Number(me.longitude),
                Number(user.latitude),
                Number(user.longitude),
              ) * 10,
            ) / 10
          : null,
      commonSports: [...mySports].filter((s) =>
        [
          ...(user.interestedSports || []),
          ...(user.participatedSports || []),
        ].includes(s),
      ),
      scoreBreakdown: breakdown,
    }));
  }
}
