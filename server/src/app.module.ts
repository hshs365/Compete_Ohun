import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { GroupsModule } from './groups/groups.module';
import { FacilitiesModule } from './facilities/facilities.module';
import { NotificationsModule } from './notifications/notifications.module';
import { TeamsModule } from './teams/teams.module';
import { User } from './users/entities/user.entity';
import { SocialAccount } from './social-accounts/entities/social-account.entity';
import { Group } from './groups/entities/group.entity';
import { GroupParticipant } from './groups/entities/group-participant.entity';
import { GroupGameSettings } from './groups/entities/group-game-settings.entity';
import { GroupParticipantPosition } from './groups/entities/group-participant-position.entity';
import { GroupEvaluation } from './groups/entities/group-evaluation.entity';
import { Facility } from './facilities/entities/facility.entity';
import { Notification } from './notifications/entities/notification.entity';
import { PhoneVerification } from './auth/entities/phone-verification.entity';
import { UserScoreHistory } from './users/entities/user-score-history.entity';
import { UserActivityLog } from './users/entities/user-activity-log.entity';
import { UserSportParticipation } from './users/entities/user-sport-participation.entity';
import { UserSeasonScore } from './users/entities/user-season-score.entity';
import { Follow } from './users/entities/follow.entity';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        entities: [
          User,
          SocialAccount,
          Group,
          GroupParticipant,
          GroupGameSettings,
          GroupParticipantPosition,
          GroupEvaluation,
          Facility,
          Notification,
          PhoneVerification,
          UserScoreHistory,
          UserActivityLog,
          UserSportParticipation,
          UserSeasonScore,
          Follow,
        ],
        synchronize: true, // In development, auto-creates DB schema. Disable for production.
        dropSchema: false, // Set to true to drop all tables on startup (WARNING: deletes all data!)
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    AuthModule,
    GroupsModule,
    FacilitiesModule,
    NotificationsModule,
    TeamsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
