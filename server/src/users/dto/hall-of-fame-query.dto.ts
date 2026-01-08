import { IsOptional, IsInt, Min, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class HallOfFameQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2020)
  year?: number; // 연도 (기본값: 현재 연도)

  @IsOptional()
  @IsString()
  region?: string; // 지역 (예: '서울', '대전', '부산', '전국')

  @IsOptional()
  @IsString()
  sport?: string; // 운동 종목 (예: '배드민턴', '축구', '전체')

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1; // 페이지 번호

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 50; // 페이지당 항목 수
}
