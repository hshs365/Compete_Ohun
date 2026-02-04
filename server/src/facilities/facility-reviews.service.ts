import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FacilityReview } from './entities/facility-review.entity';
import { Facility } from './entities/facility.entity';
import { PointsService } from '../users/points.service';
import { PointTransactionType } from '../users/entities/point-transaction.entity';
import { FACILITY_REVIEW_POINTS } from '../constants/match-review';

export type FacilityReviewDto = {
  cleanliness: number;
  suitableForGame: number;
  overall: number;
};

@Injectable()
export class FacilityReviewsService {
  constructor(
    @InjectRepository(FacilityReview)
    private facilityReviewRepository: Repository<FacilityReview>,
    @InjectRepository(Facility)
    private facilityRepository: Repository<Facility>,
    private pointsService: PointsService,
  ) {}

  async submitForGroup(
    groupId: number,
    facilityId: number,
    userId: number,
    dto: FacilityReviewDto,
  ): Promise<{ success: boolean; message: string; pointsEarned: number }> {
    const isValid = (v: number) =>
      typeof v === 'number' && !Number.isNaN(v) && v >= 0.5 && v <= 5 && Number.isInteger(v * 2);
    if (!isValid(dto.cleanliness) || !isValid(dto.suitableForGame) || !isValid(dto.overall)) {
      throw new BadRequestException('각 항목은 0.5~5점 (0.5 단위)로 입력해 주세요.');
    }

    const existing = await this.facilityReviewRepository.findOne({
      where: { groupId, reviewerId: userId },
    });
    if (existing) {
      throw new BadRequestException('이미 시설 리뷰를 작성하셨습니다.');
    }

    const facility = await this.facilityRepository.findOne({ where: { id: facilityId } });
    if (!facility) {
      throw new NotFoundException('시설을 찾을 수 없습니다.');
    }

    await this.facilityReviewRepository.save(
      this.facilityReviewRepository.create({
        groupId,
        facilityId,
        reviewerId: userId,
        cleanliness: dto.cleanliness,
        suitableForGame: dto.suitableForGame,
        overall: dto.overall,
      }),
    );

    await this.pointsService.addTransaction(
      userId,
      FACILITY_REVIEW_POINTS,
      PointTransactionType.FACILITY_REVIEW,
      `시설 리뷰: ${facility.name}`,
    );

    await this.updateFacilityRating(facilityId);

    return {
      success: true,
      message: '시설 리뷰가 저장되었습니다.',
      pointsEarned: FACILITY_REVIEW_POINTS,
    };
  }

  async hasReviewed(groupId: number, userId: number): Promise<boolean> {
    const count = await this.facilityReviewRepository.count({
      where: { groupId, reviewerId: userId },
    });
    return count > 0;
  }

  private async updateFacilityRating(facilityId: number): Promise<void> {
    const reviews = await this.facilityReviewRepository.find({
      where: { facilityId },
      select: ['cleanliness', 'suitableForGame', 'overall'],
    });
    if (reviews.length === 0) return;
    const avg =
      reviews.reduce((s, r) => s + Number(r.cleanliness) + Number(r.suitableForGame) + Number(r.overall), 0) /
      (reviews.length * 3);
    await this.facilityRepository.update(facilityId, {
      rating: Math.round(avg * 100) / 100,
      reviewCount: reviews.length,
    });
  }
}
