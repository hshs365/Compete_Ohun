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
}

