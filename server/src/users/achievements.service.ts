import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserAchievement } from './entities/user-achievement.entity';
import { PointsService } from './points.service';
import { PointTransactionType } from './entities/point-transaction.entity';
import { GroupsService } from '../groups/groups.service';
import { ACHIEVEMENTS } from './constants/achievements';

export interface SyncAchievementsResult {
  granted: { achievementId: string; points: number }[];
  totalGranted: number;
}

@Injectable()
export class AchievementsService {
  constructor(
    @InjectRepository(UserAchievement)
    private userAchievementRepository: Repository<UserAchievement>,
    private pointsService: PointsService,
    @Inject(forwardRef(() => GroupsService))
    private groupsService: GroupsService,
  ) {}

  /**
   * 사용자 참가/생성 건수 기준으로 미지급 업적을 확인하고 포인트 지급
   */
  async syncAchievements(userId: number): Promise<SyncAchievementsResult> {
    const [participations, creations] = await Promise.all([
      this.groupsService.findMyParticipations(userId),
      this.groupsService.findMyCreationsCompleted(userId),
    ]);
    const joined = participations.length;
    const created = creations.length;
    const stats = { joined, created };

    const alreadyGranted = await this.userAchievementRepository.find({
      where: { userId },
      select: ['achievementId'],
    });
    const grantedSet = new Set(alreadyGranted.map((a) => a.achievementId));

    const granted: { achievementId: string; points: number }[] = [];
    for (const achievement of ACHIEVEMENTS) {
      if (grantedSet.has(achievement.id)) continue;
      if (!achievement.check(stats)) continue;

      try {
        await this.pointsService.addTransaction(
          userId,
          achievement.points,
          PointTransactionType.ACHIEVEMENT,
          `업적: ${achievement.id}`,
        );
        await this.userAchievementRepository.insert({
          userId,
          achievementId: achievement.id,
        });
        granted.push({ achievementId: achievement.id, points: achievement.points });
        grantedSet.add(achievement.id);
      } catch (err) {
        console.error(`[AchievementsService] 업적 지급 실패 userId=${userId} achievementId=${achievement.id}`, err);
      }
    }

    const totalGranted = granted.reduce((sum, g) => sum + g.points, 0);
    return { granted, totalGranted };
  }
}
