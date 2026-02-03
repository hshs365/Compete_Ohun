import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, LessThan, MoreThan } from 'typeorm';
import { FacilityReservation, ReservationStatus } from './entities/facility-reservation.entity';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { FacilitiesService } from './facilities.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectRepository(FacilityReservation)
    private reservationRepository: Repository<FacilityReservation>,
    private facilitiesService: FacilitiesService,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * 새 예약 생성
   */
  async createReservation(createDto: CreateReservationDto, userId: number): Promise<FacilityReservation> {
    // 시설 확인
    const facility = await this.facilitiesService.findOne(createDto.facilityId);
    if (!facility) {
      throw new NotFoundException('시설을 찾을 수 없습니다.');
    }

    // 시간 유효성 검사
    const startTime = createDto.startTime;
    const endTime = createDto.endTime;
    if (startTime >= endTime) {
      throw new BadRequestException('종료 시간은 시작 시간보다 늦어야 합니다.');
    }

    // 중복 예약 확인
    const overlapping = await this.reservationRepository
      .createQueryBuilder('r')
      .where('r.facilityId = :facilityId', { facilityId: createDto.facilityId })
      .andWhere('r.reservationDate = :date', { date: createDto.reservationDate })
      .andWhere('r.status IN (:...statuses)', { 
        statuses: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED] 
      })
      .andWhere(
        '(r.startTime < :endTime AND r.endTime > :startTime)',
        { startTime, endTime }
      )
      .getOne();

    if (overlapping) {
      throw new BadRequestException('해당 시간에 이미 예약이 있습니다.');
    }

    // 예약 생성
    const reservation = this.reservationRepository.create({
      ...createDto,
      userId,
      numberOfPeople: createDto.numberOfPeople || 1,
      status: ReservationStatus.PENDING,
      totalAmount: 0, // TODO: 가격 계산 로직
      isPaid: false,
    });

    const saved = await this.reservationRepository.save(reservation);

    // 시설 소유자에게 알림 발송
    try {
      await this.notificationsService.createNotification(
        facility.ownerId,
        NotificationType.FACILITY_RESERVATION,
        '새 예약 요청',
        `${facility.name}에 새로운 예약 요청이 있습니다. (${createDto.reservationDate} ${createDto.startTime}~${createDto.endTime})`,
        { reservationId: saved.id, facilityId: facility.id },
      );
    } catch (error) {
      console.error('알림 발송 실패:', error);
    }

    return saved;
  }

  /**
   * 예약 상세 조회
   */
  async findOne(id: number): Promise<FacilityReservation> {
    const reservation = await this.reservationRepository.findOne({
      where: { id },
      relations: ['facility', 'user'],
    });
    if (!reservation) {
      throw new NotFoundException('예약을 찾을 수 없습니다.');
    }
    return reservation;
  }

  /**
   * 사용자의 예약 목록 조회
   */
  async findByUser(userId: number): Promise<FacilityReservation[]> {
    return this.reservationRepository.find({
      where: { userId },
      relations: ['facility'],
      order: { reservationDate: 'DESC', startTime: 'DESC' },
    });
  }

  /**
   * 시설의 예약 목록 조회 (시설 소유자용)
   */
  async findByFacility(facilityId: number, userId: number): Promise<FacilityReservation[]> {
    // 시설 소유자인지 확인
    const facility = await this.facilitiesService.findOne(facilityId);
    if (facility.ownerId !== userId) {
      throw new ForbiddenException('이 시설의 예약 목록을 볼 권한이 없습니다.');
    }

    return this.reservationRepository.find({
      where: { facilityId },
      relations: ['user'],
      order: { reservationDate: 'DESC', startTime: 'DESC' },
    });
  }

  /**
   * 사업자의 모든 시설 예약 목록 조회
   */
  async findByOwner(ownerId: number): Promise<FacilityReservation[]> {
    return this.reservationRepository
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.facility', 'facility')
      .leftJoinAndSelect('r.user', 'user')
      .where('facility.ownerId = :ownerId', { ownerId })
      .orderBy('r.reservationDate', 'DESC')
      .addOrderBy('r.startTime', 'ASC')
      .getMany();
  }

  /**
   * 특정 기간의 시설 예약 조회 (사업자 스케줄용)
   */
  async findByOwnerAndDateRange(
    ownerId: number,
    startDate: string,
    endDate: string,
  ): Promise<FacilityReservation[]> {
    return this.reservationRepository
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.facility', 'facility')
      .leftJoinAndSelect('r.user', 'user')
      .where('facility.ownerId = :ownerId', { ownerId })
      .andWhere('r.reservationDate >= :startDate', { startDate })
      .andWhere('r.reservationDate <= :endDate', { endDate })
      .andWhere('r.status IN (:...statuses)', {
        statuses: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED, ReservationStatus.COMPLETED],
      })
      .orderBy('r.reservationDate', 'ASC')
      .addOrderBy('r.startTime', 'ASC')
      .getMany();
  }

  /**
   * 예약 상태 변경 (확정/취소)
   */
  async updateStatus(
    id: number,
    userId: number,
    newStatus: ReservationStatus,
  ): Promise<FacilityReservation> {
    const reservation = await this.findOne(id);
    
    // 시설 소유자 또는 예약자만 상태 변경 가능
    const facility = await this.facilitiesService.findOne(reservation.facilityId);
    const isOwner = facility.ownerId === userId;
    const isReserver = reservation.userId === userId;

    if (!isOwner && !isReserver) {
      throw new ForbiddenException('예약 상태를 변경할 권한이 없습니다.');
    }

    // 예약자는 취소만 가능
    if (isReserver && !isOwner && newStatus !== ReservationStatus.CANCELLED) {
      throw new ForbiddenException('예약자는 취소만 가능합니다.');
    }

    reservation.status = newStatus;
    const updated = await this.reservationRepository.save(reservation);

    // 알림 발송
    try {
      const statusText = {
        [ReservationStatus.CONFIRMED]: '확정',
        [ReservationStatus.CANCELLED]: '취소',
        [ReservationStatus.COMPLETED]: '완료',
        [ReservationStatus.NO_SHOW]: '노쇼 처리',
        [ReservationStatus.PENDING]: '대기',
      };

      // 상태 변경한 사람이 소유자면 예약자에게, 예약자면 소유자에게 알림
      const targetUserId = isOwner ? reservation.userId : facility.ownerId;
      await this.notificationsService.createNotification(
        targetUserId,
        NotificationType.FACILITY_RESERVATION,
        `예약 ${statusText[newStatus]}`,
        `${facility.name} 예약이 ${statusText[newStatus]}되었습니다. (${reservation.reservationDate} ${reservation.startTime})`,
        { reservationId: reservation.id, facilityId: facility.id },
      );
    } catch (error) {
      console.error('알림 발송 실패:', error);
    }

    return updated;
  }

  /**
   * 시설의 특정 날짜 예약 현황 조회 (예약 가능 시간 확인용)
   */
  async getReservationsByDate(facilityId: number, date: string): Promise<FacilityReservation[]> {
    return this.reservationRepository.find({
      where: {
        facilityId,
        reservationDate: date,
        status: ReservationStatus.CONFIRMED,
      },
      order: { startTime: 'ASC' },
    });
  }

  /**
   * 시설의 특정 날짜 예약 가능 시간대 조회 (매치 생성 시 시설 예약용)
   * 운영시간 기준 2시간 단위 슬롯 중, 기존 예약(PENDING/CONFIRMED)과 겹치지 않는 구간 반환
   */
  async getAvailableSlots(
    facilityId: number,
    date: string,
  ): Promise<{ startTime: string; endTime: string }[]> {
    const facility = await this.facilitiesService.findOne(facilityId);
    if (!facility) {
      return [];
    }

    // 운영시간 파싱 (예: "06:00 - 22:00" 또는 "06:00-22:00"), 기본 06:00~22:00
    let openHour = 6;
    let openMin = 0;
    let closeHour = 22;
    let closeMin = 0;
    if (facility.operatingHours) {
      const match = facility.operatingHours.match(
        /(\d{1,2}):(\d{2})\s*[-~]\s*(\d{1,2}):(\d{2})/,
      );
      if (match) {
        openHour = parseInt(match[1], 10);
        openMin = parseInt(match[2], 10);
        closeHour = parseInt(match[3], 10);
        closeMin = parseInt(match[4], 10);
      }
    }

    const openMinutes = openHour * 60 + openMin;
    const closeMinutes = closeHour * 60 + closeMin;
    const slotHours = (facility as any).reservationSlotHours != null
      ? Math.min(8, Math.max(1, Math.floor(Number((facility as any).reservationSlotHours))))
      : 2;
    const slotDurationMinutes = slotHours * 60;

    // 해당 날짜의 PENDING, CONFIRMED 예약 조회 (겹치는 시간 제외용)
    const booked = await this.reservationRepository.find({
      where: {
        facilityId,
        reservationDate: date,
        status: In([ReservationStatus.PENDING, ReservationStatus.CONFIRMED]),
      },
      order: { startTime: 'ASC' },
    });
    const bookedRanges = booked.map((r) => {
      const [sh, sm] = r.startTime.split(':').map(Number);
      const [eh, em] = r.endTime.split(':').map(Number);
      return { start: sh * 60 + sm, end: eh * 60 + em };
    });

    const slots: { startTime: string; endTime: string }[] = [];
    for (let start = openMinutes; start + slotDurationMinutes <= closeMinutes; start += slotDurationMinutes) {
      const end = start + slotDurationMinutes;
      const overlaps = bookedRanges.some(
        (range) => start < range.end && end > range.start,
      );
      if (!overlaps) {
        const sh = Math.floor(start / 60);
        const sm = start % 60;
        const eh = Math.floor(end / 60);
        const em = end % 60;
        slots.push({
          startTime: `${String(sh).padStart(2, '0')}:${String(sm).padStart(2, '0')}`,
          endTime: `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`,
        });
      }
    }
    return slots;
  }
}
