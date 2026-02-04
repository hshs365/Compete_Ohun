import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { MulterModule } from '@nestjs/platform-express';
import * as multer from 'multer';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { GroupsModule } from './groups/groups.module';
import { FacilitiesModule } from './facilities/facilities.module';
import { NotificationsModule } from './notifications/notifications.module';
import { TeamsModule } from './teams/teams.module';
import { ContactModule } from './contact/contact.module';
import { ProductsModule } from './products/products.module';
import { User } from './users/entities/user.entity';
import { SocialAccount } from './social-accounts/entities/social-account.entity';
import { Group } from './groups/entities/group.entity';
import { GroupParticipant } from './groups/entities/group-participant.entity';
import { GroupGameSettings } from './groups/entities/group-game-settings.entity';
import { GroupParticipantPosition } from './groups/entities/group-participant-position.entity';
import { GroupEvaluation } from './groups/entities/group-evaluation.entity';
import { GroupReferee } from './groups/entities/group-referee.entity';
import { GroupFavorite } from './groups/entities/group-favorite.entity';
import { MatchReview } from './groups/entities/match-review.entity';
import { GroupProvisionalFacility } from './groups/entities/group-provisional-facility.entity';
import { Facility } from './facilities/entities/facility.entity';
import { FacilityReservation } from './facilities/entities/facility-reservation.entity';
import { FacilityReview } from './facilities/entities/facility-review.entity';
import { Notification } from './notifications/entities/notification.entity';
import { PhoneVerification } from './auth/entities/phone-verification.entity';
import { UserScoreHistory } from './users/entities/user-score-history.entity';
import { UserActivityLog } from './users/entities/user-activity-log.entity';
import { UserSportParticipation } from './users/entities/user-sport-participation.entity';
import { UserSeasonScore } from './users/entities/user-season-score.entity';
import { Follow } from './users/entities/follow.entity';
import { Contact } from './contact/entities/contact.entity';
import { Product } from './products/entities/product.entity';
import { NoticesModule } from './notices/notices.module';
import { Notice } from './notices/entities/notice.entity';

@Module({
  imports: [
    ScheduleModule.forRoot(),
ConfigModule.forRoot({
        isGlobal: true,
        envFilePath: '.env',
      }),
    MulterModule.register({
      storage: multer.memoryStorage(),
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
          GroupReferee,
          GroupFavorite,
          MatchReview,
          GroupProvisionalFacility,
          Facility,
          FacilityReservation,
          FacilityReview,
          Notification,
          PhoneVerification,
          UserScoreHistory,
          UserActivityLog,
          UserSportParticipation,
          UserSeasonScore,
          Follow,
          Contact,
          Product,
          Notice,
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
    ContactModule,
    ProductsModule,
    NoticesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
