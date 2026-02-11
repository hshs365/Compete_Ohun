import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

/** 공공데이터포털 전국 체육시설 API 쿼리 (프록시용) */
export class PublicFacilityQueryDto {
  @IsOptional()
  @IsString()
  search?: string; // 시설명 검색

  @IsOptional()
  @IsString()
  category?: string; // 종목 (축구, 농구 등) - 시설 유형/업종 매핑

  @IsOptional()
  @IsString()
  type?: string; // 시설 종류 (체육관, 축구장 등)

  @IsOptional()
  @IsString()
  area?: string; // 지역 (시도명: 서울특별시, 경기도 등)

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
