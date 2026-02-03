import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FacilitiesService } from './facilities.service';
import { FacilitiesController } from './facilities.controller';
import { ReservationsService } from './reservations.service';
import { ReservationsController } from './reservations.controller';
import { Facility } from './entities/facility.entity';
import { FacilityReservation } from './entities/facility-reservation.entity';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Facility, FacilityReservation]),
    UsersModule,
    NotificationsModule,
  ],
  controllers: [FacilitiesController, ReservationsController],
  providers: [FacilitiesService, ReservationsService],
  exports: [FacilitiesService, ReservationsService],
})
export class FacilitiesModule {}

