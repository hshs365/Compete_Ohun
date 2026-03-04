import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FacilitiesService } from './facilities.service';
import { PublicFacilitiesService } from './public-facilities.service';
import { FacilitiesController } from './facilities.controller';
import { ReservationsService } from './reservations.service';
import { ReservationsController } from './reservations.controller';
import { FacilityReviewsService } from './facility-reviews.service';
import { Facility } from './entities/facility.entity';
import { FacilityCourt } from './entities/facility-court.entity';
import { FacilityReservation } from './entities/facility-reservation.entity';
import { FacilityReview } from './entities/facility-review.entity';
import { FacilityCourtsService } from './facility-courts.service';
import { FacilityCourtsController } from './facility-courts.controller';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Facility, FacilityCourt, FacilityReservation, FacilityReview]),
    UsersModule,
    NotificationsModule,
  ],
  controllers: [FacilitiesController, FacilityCourtsController, ReservationsController],
  providers: [FacilitiesService, FacilityCourtsService, PublicFacilitiesService, ReservationsService, FacilityReviewsService],
  exports: [FacilitiesService, ReservationsService, FacilityReviewsService],
})
export class FacilitiesModule {}

