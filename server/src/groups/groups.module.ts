import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupsService } from './groups.service';
import { GroupsController } from './groups.controller';
import { GroupsSchedulerService } from './groups-scheduler.service';
import { Group } from './entities/group.entity';
import { GroupParticipant } from './entities/group-participant.entity';
import { GroupGameSettings } from './entities/group-game-settings.entity';
import { GroupEvaluation } from './entities/group-evaluation.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Group, GroupParticipant, GroupGameSettings, GroupEvaluation]),
    NotificationsModule,
    UsersModule,
  ],
  controllers: [GroupsController],
  providers: [GroupsService, GroupsSchedulerService],
  exports: [GroupsService],
})
export class GroupsModule {}

