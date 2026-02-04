import { Injectable, Inject, forwardRef, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { Facility } from './entities/facility.entity';
import { CreateFacilityDto } from './dto/create-facility.dto';
import { FacilityQueryDto } from './dto/facility-query.dto';
import { UsersService } from '../users/users.service';
import { ReservationsService } from './reservations.service';
import { SPORT_FACILITY_TYPES_MAP } from '../constants/sports';
import { uploadConfig } from '../config/upload.config';

@Injectable()
export class FacilitiesService {
  constructor(
    @InjectRepository(Facility)
    private facilityRepository: Repository<Facility>,
    private usersService: UsersService,
    @Inject(forwardRef(() => ReservationsService))
    private reservationsService: ReservationsService,
  ) {}

  async uploadFacilityImage(ownerId: number, file: Express.Multer.File): Promise<string> {
    const owner = await this.usersService.findOne(ownerId);
    if (!owner.isAdmin) {
      if (owner.memberType !== 'business') {
        throw new ForbiddenException('사업자 회원만 시설 이미지를 업로드할 수 있습니다.');
      }
      if (!owner.businessNumberVerified) {
        throw new ForbiddenException('사업자번호 검증이 완료된 사용자만 업로드할 수 있습니다.');
      }
    }
    const uploadDir = uploadConfig.facilityImageDir ?? path.join(process.cwd(), 'uploads', 'facility');
    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }
    const ext = path.extname(file.originalname) || '.jpg';
    const filename = `${ownerId}_${Date.now()}_${crypto.randomBytes(8).toString('hex')}${ext}`;
    const filepath = path.join(uploadDir, filename);
    await fs.writeFile(filepath, file.buffer);
    return `/uploads/facility/${filename}`;
  }

  async create(createFacilityDto: CreateFacilityDto, ownerId: number): Promise<Facility> {
    const owner = await this.usersService.findOne(ownerId);
    if (!owner.isAdmin) {
      if (owner.memberType !== 'business') {
        throw new ForbiddenException('사업자 회원만 시설을 등록할 수 있습니다.');
      }
      if (!owner.businessNumberVerified) {
        throw new ForbiddenException('사업자번호 검증이 완료된 사용자만 시설을 등록할 수 있습니다.');
      }
    }

    const images = createFacilityDto.images?.length
      ? createFacilityDto.images
      : createFacilityDto.image
        ? [createFacilityDto.image]
        : null;
    const image = images?.length ? images[0] : createFacilityDto.image ?? null;

    const slotHours = createFacilityDto.reservationSlotHours != null
      ? Math.min(8, Math.max(1, Math.floor(Number(createFacilityDto.reservationSlotHours))))
      : 2;
    const facility = this.facilityRepository.create({
      ...createFacilityDto,
      images,
      image,
      ownerId,
      amenities: createFacilityDto.amenities || [],
      availableSports: createFacilityDto.availableSports || [],
      reservationSlotHours: slotHours,
    });

    return this.facilityRepository.save(facility);
  }

  /**
   * 운영시간 문자열이 요청한 시간대를 수용 가능한지 확인
   * @param operatingHours "HH:mm - HH:mm" 형식 (예: 21:00 - 00:00). 00:00은 자정(24:00)으로 처리
   */
  private facilityCoversTimeRange(
    operatingHours: string | null,
    matchStartMinutes: number,
    matchEndMinutes: number,
  ): boolean {
    if (!operatingHours?.trim()) return true;
    const match = operatingHours.match(/(\d{1,2}):(\d{2})\s*[-~]\s*(\d{1,2}):(\d{2})/);
    if (!match) return true;
    const openM = parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
    let closeM = parseInt(match[3], 10) * 60 + parseInt(match[4], 10);
    if (closeM <= openM) closeM += 24 * 60; // 00:00 = 자정
    return openM <= matchStartMinutes && closeM >= matchEndMinutes;
  }

  async findAll(queryDto: FacilityQueryDto): Promise<{ facilities: Facility[]; total: number }> {
    const { type, search, area, page = 1, limit = 20, latitude, longitude, category, availableDate, availableTime, availableEndTime, availableEndDate } = queryDto;
    const skip = (page - 1) * limit;

    // 해당 시간대에 예약 가능한 시설만 보기: 그 구간에 이미 예약된 시설 ID 제외
    let occupiedFacilityIds: number[] = [];
    if (availableDate && availableTime) {
      let endTime: string;
      if (availableEndTime && availableEndTime.length >= 5) {
        endTime = availableEndTime.slice(0, 5);
      } else {
        const [sh, sm] = availableTime.split(':').map(Number);
        const endMinutes = (sh * 60 + (sm || 0)) + 120;
        const eh = Math.floor(endMinutes / 60);
        const em = endMinutes % 60;
        endTime = `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;
      }
      const startTime = availableTime.length >= 5 ? availableTime.slice(0, 5) : availableTime;
      occupiedFacilityIds = await this.reservationsService.getFacilityIdsWithOccupiedSlot(
        availableDate,
        startTime,
        endTime,
      );
    }

    const queryBuilder = this.facilityRepository
      .createQueryBuilder('facility')
      .leftJoinAndSelect('facility.owner', 'owner')
      .where('facility.isActive = :isActive', { isActive: true })
      .andWhere('facility.latitude IS NOT NULL')
      .andWhere('facility.longitude IS NOT NULL');

    if (occupiedFacilityIds.length > 0) {
      queryBuilder.andWhere('facility.id NOT IN (:...occupiedIds)', { occupiedIds: occupiedFacilityIds });
    }

    // 카테고리(종목)에 따른 시설 필터링: 타입 매핑 또는 availableSports 포함
    if (category && SPORT_FACILITY_TYPES_MAP[category]) {
      const allowedTypes = SPORT_FACILITY_TYPES_MAP[category];
      if (allowedTypes.length > 0) {
        queryBuilder.andWhere(
          "(facility.type IN (:...allowedTypes) OR :category = ANY(COALESCE(facility.availableSports, '{}')))",
          { allowedTypes, category },
        );
      }
    }
    if (type && type !== '전체') {
      queryBuilder.andWhere('facility.type = :type', { type });
    }

    // 검색어 필터
    if (search) {
      queryBuilder.andWhere(
        '(facility.name ILIKE :search OR facility.address ILIKE :search OR facility.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // 지역 필터: API는 '대전광역시' 등 전체명을 받고, 주소는 '대전 대덕구...' 형태이므로 검색어로 변환
    if (area && area !== '전체') {
      const areaSearchTerm = area
        .replace(/특별자치도$/, '')
        .replace(/특별시$/, '')
        .replace(/광역시$/, '')
        .replace(/특별자치시$/, '')
        .replace(/도$/, '');
      if (areaSearchTerm) {
        queryBuilder.andWhere('facility.address ILIKE :area', { area: `%${areaSearchTerm}%` });
      }
    }

    // 거리 계산 및 정렬
    if (latitude && longitude) {
      // 하버사인 공식을 사용한 거리 계산 (km 단위)
      queryBuilder
        .addSelect(
          `(
            6371 * acos(
              cos(radians(:lat)) * 
              cos(radians(facility.latitude)) * 
              cos(radians(facility.longitude) - radians(:lng)) + 
              sin(radians(:lat)) * 
              sin(radians(facility.latitude))
            )
          )`,
          'distance',
        )
        .setParameter('lat', latitude)
        .setParameter('lng', longitude)
        .orderBy('distance', 'ASC');
    } else {
      // 거리 정보가 없으면 최신순
      queryBuilder.orderBy('facility.createdAt', 'DESC');
    }

    // 페이지네이션
    let [facilities, total] = await queryBuilder.skip(skip).take(limit).getManyAndCount();

    // 운영시간 필터: 예약 불가능한 시설(운영시간 미달) 제외
    if (availableDate && availableTime && facilities.length > 0) {
      const [sh, sm] = availableTime.slice(0, 5).split(':').map(Number);
      const matchStartM = (sh ?? 0) * 60 + (sm ?? 0);
      let matchEndM: number;
      if (availableEndTime && availableEndTime.length >= 5) {
        const [eh, em] = availableEndTime.slice(0, 5).split(':').map(Number);
        matchEndM = (eh ?? 0) * 60 + (em ?? 0);
        if (availableEndDate && availableEndDate !== availableDate) {
          matchEndM += 24 * 60; // 야간(익일): 00:00을 24:00으로
        }
      } else {
        matchEndM = matchStartM + 120;
      }
      facilities = facilities.filter((f) =>
        this.facilityCoversTimeRange(f.operatingHours, matchStartM, matchEndM),
      );
    }

    return { facilities, total };
  }

  async findByOwner(ownerId: number): Promise<Facility[]> {
    const facilities = await this.facilityRepository.find({
      where: { ownerId, isActive: true },
      relations: ['owner'],
      order: { createdAt: 'DESC' },
    });
    for (const f of facilities) {
      if (!f.images?.length && f.image) f.images = [f.image];
    }
    return facilities;
  }

  async findOne(id: number): Promise<Facility> {
    const facility = await this.facilityRepository.findOne({
      where: { id },
      relations: ['owner'],
    });

    if (!facility) {
      throw new NotFoundException('시설을 찾을 수 없습니다.');
    }

    if (!facility.images?.length && facility.image) {
      facility.images = [facility.image];
    }
    return facility;
  }

  async update(id: number, updateData: Partial<CreateFacilityDto>, userId: number): Promise<Facility> {
    const facility = await this.findOne(id);

    // 등록자만 수정 가능
    if (facility.ownerId !== userId) {
      throw new ForbiddenException('시설을 수정할 권한이 없습니다.');
    }

    Object.assign(facility, updateData);
    return this.facilityRepository.save(facility);
  }

  async remove(id: number, userId: number): Promise<void> {
    const facility = await this.findOne(id);

    // 등록자만 삭제 가능
    if (facility.ownerId !== userId) {
      throw new ForbiddenException('시설을 삭제할 권한이 없습니다.');
    }

    // 실제 삭제 대신 비활성화
    facility.isActive = false;
    await this.facilityRepository.save(facility);
  }
}

