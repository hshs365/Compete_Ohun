import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FacilityCourt } from './entities/facility-court.entity';
import { CreateFacilityCourtDto } from './dto/create-facility-court.dto';
import { UpdateFacilityCourtDto } from './dto/update-facility-court.dto';
import { FacilitiesService } from './facilities.service';

@Injectable()
export class FacilityCourtsService {
  constructor(
    @InjectRepository(FacilityCourt)
    private courtRepository: Repository<FacilityCourt>,
    private facilitiesService: FacilitiesService,
  ) {}

  /** 시설의 구장 목록 조회 (시설 소유자 확인 없이 공개용) */
  async findByFacilityId(facilityId: number): Promise<FacilityCourt[]> {
    return this.courtRepository.find({
      where: { facilityId },
      order: { sortOrder: 'ASC', id: 'ASC' },
    });
  }

  /** 시설 소유자 확인 후 구장 목록 조회 */
  async findByFacilityIdForOwner(facilityId: number, userId: number): Promise<FacilityCourt[]> {
    const facility = await this.facilitiesService.findOne(facilityId);
    if (facility.ownerId !== userId) {
      throw new ForbiddenException('시설을 수정할 권한이 없습니다.');
    }
    return this.findByFacilityId(facilityId);
  }

  /** 구장 단건 조회 (소유자 확인) */
  async findOne(courtId: number, userId: number): Promise<FacilityCourt> {
    const court = await this.courtRepository.findOne({
      where: { id: courtId },
      relations: ['facility'],
    });
    if (!court) {
      throw new NotFoundException('구장을 찾을 수 없습니다.');
    }
    const facility = await this.facilitiesService.findOne(court.facilityId);
    if (facility.ownerId !== userId) {
      throw new ForbiddenException('구장을 수정할 권한이 없습니다.');
    }
    return court;
  }

  /** 구장 생성 */
  async create(facilityId: number, dto: CreateFacilityCourtDto, userId: number): Promise<FacilityCourt> {
    const facility = await this.facilitiesService.findOne(facilityId);
    if (facility.ownerId !== userId) {
      throw new ForbiddenException('시설을 수정할 권한이 없습니다.');
    }

    const maxOrder = await this.courtRepository
      .createQueryBuilder('c')
      .select('COALESCE(MAX(c.sortOrder), 0)', 'max')
      .where('c.facility_id = :facilityId', { facilityId })
      .getRawOne();

    const court = this.courtRepository.create({
      ...dto,
      facilityId,
      sortOrder: dto.sortOrder ?? (Number(maxOrder?.max ?? 0) + 1),
    });

    return this.courtRepository.save(court);
  }

  /** 기존 구장 정보를 복사하여 새 구장 생성 */
  async createFromCopy(
    facilityId: number,
    sourceCourtId: number,
    overrides: Partial<CreateFacilityCourtDto>,
    userId: number,
  ): Promise<FacilityCourt> {
    const facility = await this.facilitiesService.findOne(facilityId);
    if (facility.ownerId !== userId) {
      throw new ForbiddenException('시설을 수정할 권한이 없습니다.');
    }

    const sourceCourt = await this.courtRepository.findOne({
      where: { id: sourceCourtId, facilityId },
    });
    if (!sourceCourt) {
      throw new NotFoundException('복사할 구장을 찾을 수 없습니다. 같은 시설의 구장만 복사할 수 있습니다.');
    }

    const baseDto: CreateFacilityCourtDto = {
      courtName: sourceCourt.courtName,
      floorLevel: sourceCourt.floorLevel ?? undefined,
      courtNumber: sourceCourt.courtNumber ?? undefined,
      floorMaterial: sourceCourt.floorMaterial,
      ceilingHeight: sourceCourt.ceilingHeight ? Number(sourceCourt.ceilingHeight) : undefined,
      officialSpec: sourceCourt.officialSpec ?? undefined,
      isExclusiveUse: sourceCourt.isExclusiveUse,
      images: sourceCourt.images ?? undefined,
      directionsGuide: sourceCourt.directionsGuide ?? undefined,
      indoorOutdoor: sourceCourt.indoorOutdoor,
    };

    return this.create(facilityId, { ...baseDto, ...overrides }, userId);
  }

  /** 구장 수정 */
  async update(
    facilityId: number,
    courtId: number,
    dto: UpdateFacilityCourtDto,
    userId: number,
  ): Promise<FacilityCourt> {
    const court = await this.findOne(courtId, userId);
    if (court.facilityId !== facilityId) {
      throw new NotFoundException('해당 시설의 구장이 아닙니다.');
    }

    Object.assign(court, dto);
    return this.courtRepository.save(court);
  }

  /** 구장 삭제 */
  async remove(facilityId: number, courtId: number, userId: number): Promise<void> {
    const court = await this.findOne(courtId, userId);
    if (court.facilityId !== facilityId) {
      throw new NotFoundException('해당 시설의 구장이 아닙니다.');
    }
    await this.courtRepository.remove(court);
  }
}
