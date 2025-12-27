import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GroupQueryDto {
  @IsOptional()
  @IsString()
  category?: string; // 카테고리 필터

  @IsOptional()
  @IsString()
  search?: string; // 검색어

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1; // 페이지 번호

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20; // 페이지당 항목 수
}




