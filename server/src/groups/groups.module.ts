import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupsService } from './groups.service';
import { GroupsController } from './groups.controller';
import { GroupsGateway } from './groups.gateway';
import { GroupsSchedulerService } from './groups-scheduler.service';
import { Group } from './entities/group.entity';
import { GroupParticipant } from './entities/group-participant.entity';
import { GroupGameSettings } from './entities/group-game-settings.entity';
import { GroupEvaluation } from './entities/group-evaluation.entity';
import { GroupParticipantPosition } from './entities/group-participant-position.entity';
import { GroupReferee } from './entities/group-referee.entity';
import { GroupFavorite } from './entities/group-favorite.entity';
import { MatchReview } from './entities/match-review.entity';
import { GroupProvisionalFacility } from './entities/group-provisional-facility.entity';
import { GroupWaitlist } from './entities/group-waitlist.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';
import { FacilitiesModule } from '../facilities/facilities.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Group, GroupParticipant, GroupGameSettings, GroupEvaluation, GroupParticipantPosition, GroupReferee, GroupFavorite, MatchReview, GroupProvisionalFacility, GroupWaitlist]),
    NotificationsModule,
    UsersModule,
    FacilitiesModule,
  ],
  controllers: [GroupsController],
  providers: [GroupsService, GroupsGateway, GroupsSchedulerService],
  exports: [GroupsService],
})
export class GroupsModule {}

