import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UserScoreService } from './user-score.service';
import { UsersController } from './users.controller';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { User } from './entities/user.entity';
import { UserScoreHistory } from './entities/user-score-history.entity';
import { UserActivityLog } from './entities/user-activity-log.entity';
import { UserSportParticipation } from './entities/user-sport-participation.entity';
import { UserSeasonScore } from './entities/user-season-score.entity';
import { SocialAccount } from '../social-accounts/entities/social-account.entity';
import { GroupParticipant } from '../groups/entities/group-participant.entity';
import { Group } from '../groups/entities/group.entity';
import { GroupEvaluation } from '../groups/entities/group-evaluation.entity';
import { Follow } from './entities/follow.entity';
import { FollowService } from './follow.service';
import { RecommendedUsersService } from './recommended-users.service';
import { AthleteService } from './athlete.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      SocialAccount,
      UserScoreHistory,
      UserActivityLog,
      UserSportParticipation,
      UserSeasonScore,
      GroupParticipant,
      Group,
      GroupEvaluation,
      Follow,
    ]),
    forwardRef(() => AuthModule),
    NotificationsModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, UserScoreService, FollowService, RecommendedUsersService, AthleteService],
  exports: [UsersService, UserScoreService, FollowService],
})
export class UsersModule {}
