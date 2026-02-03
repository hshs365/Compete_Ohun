import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { ReservationStatus } from './entities/facility-reservation.entity';

@Controller('api/reservations')
@UseGuards(JwtAuthGuard)
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  /**
   * 새 예약 생성
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createDto: CreateReservationDto, @CurrentUser() user: User) {
    return this.reservationsService.createReservation(createDto, user.id);
  }

  /**
   * 내 예약 목록 조회
   */
  @Get('my')
  findMyReservations(@CurrentUser() user: User) {
    return this.reservationsService.findByUser(user.id);
  }

  /**
   * 사업자의 모든 시설 예약 목록 조회
   */
  @Get('owner')
  findOwnerReservations(@CurrentUser() user: User) {
    return this.reservationsService.findByOwner(user.id);
  }

  /**
   * 사업자의 특정 기간 예약 조회 (캘린더용)
   */
  @Get('owner/calendar')
  findOwnerCalendar(
    @CurrentUser() user: User,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reservationsService.findByOwnerAndDateRange(user.id, startDate, endDate);
  }

  /**
   * 시설별 예약 목록 조회 (시설 소유자용)
   */
  @Get('facility/:facilityId')
  findFacilityReservations(
    @Param('facilityId', ParseIntPipe) facilityId: number,
    @CurrentUser() user: User,
  ) {
    return this.reservationsService.findByFacility(facilityId, user.id);
  }

  /**
   * 시설의 특정 날짜 예약 현황 (예약 가능 시간 확인용)
   */
  @Get('facility/:facilityId/date/:date')
  getDateReservations(
    @Param('facilityId', ParseIntPipe) facilityId: number,
    @Param('date') date: string,
  ) {
    return this.reservationsService.getReservationsByDate(facilityId, date);
  }

  /**
   * 시설의 특정 날짜 예약 가능 시간대 (매치 생성 시 시설 예약용)
   */
  @Get('facility/:facilityId/available-slots')
  getAvailableSlots(
    @Param('facilityId', ParseIntPipe) facilityId: number,
    @Query('date') date: string,
  ) {
    return this.reservationsService.getAvailableSlots(facilityId, date);
  }

  /**
   * 예약 상세 조회
   */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.reservationsService.findOne(id);
  }

  /**
   * 예약 확정 (시설 소유자)
   */
  @Patch(':id/confirm')
  confirm(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.reservationsService.updateStatus(id, user.id, ReservationStatus.CONFIRMED);
  }

  /**
   * 예약 취소
   */
  @Patch(':id/cancel')
  cancel(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.reservationsService.updateStatus(id, user.id, ReservationStatus.CANCELLED);
  }

  /**
   * 이용 완료 처리 (시설 소유자)
   */
  @Patch(':id/complete')
  complete(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.reservationsService.updateStatus(id, user.id, ReservationStatus.COMPLETED);
  }

  /**
   * 노쇼 처리 (시설 소유자)
   */
  @Patch(':id/no-show')
  noShow(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.reservationsService.updateStatus(id, user.id, ReservationStatus.NO_SHOW);
  }
}
