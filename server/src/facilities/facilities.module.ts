import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FacilitiesService } from './facilities.service';
import { FacilitiesController } from './facilities.controller';
import { ReservationsService } from './reservations.service';
import { ReservationsController } from './reservations.controller';
import { FacilityReviewsService } from './facility-reviews.service';
import { Facility } from './entities/facility.entity';
import { FacilityReservation } from './entities/facility-reservation.entity';
import { FacilityReview } from './entities/facility-review.entity';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Facility, FacilityReservation, FacilityReview]),
    UsersModule,
    NotificationsModule,
  ],
  controllers: [FacilitiesController, ReservationsController],
  providers: [FacilitiesService, ReservationsService, FacilityReviewsService],
  exports: [FacilitiesService, ReservationsService, FacilityReviewsService],
})
export class FacilitiesModule {}

