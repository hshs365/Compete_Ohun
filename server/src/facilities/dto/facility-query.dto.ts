import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class FacilityQueryDto {
  @IsOptional()
  @IsString()
  type?: string; // 시설 종류

  @IsOptional()
  @IsString()
  search?: string; // 검색어

  @IsOptional()
  @IsString()
  area?: string; // 지역

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @IsOptional()
  @Type(() => Number)
  latitude?: number; // 위도 (거리 계산용)

  @IsOptional()
  @Type(() => Number)
  longitude?: number; // 경도 (거리 계산용)

  @IsOptional()
  @IsString()
  category?: string; // 모임 카테고리 (시설 타입 추천용)

  /** 해당 날짜에 예약 가능한 시설만 조회 (YYYY-MM-DD) */
  @IsOptional()
  @IsString()
  availableDate?: string;

  /** 해당 시작 시간에 예약 가능한 시설만 조회 (HH:mm). availableDate와 함께 사용 */
  @IsOptional()
  @IsString()
  availableTime?: string;

  /** 종료 시간 (HH:mm). 있으면 해당 구간에 예약 가능한 시설만 조회 */
  @IsOptional()
  @IsString()
  availableEndTime?: string;

  /** 종료 일자 (YYYY-MM-DD). 야간(익일) 매치 시 availableEndTime과 함께 사용 */
  @IsOptional()
  @IsString()
  availableEndDate?: string;
}

