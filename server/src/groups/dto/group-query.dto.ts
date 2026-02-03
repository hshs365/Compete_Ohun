import { IsOptional, IsString, IsInt, Min, IsIn } from 'class-validator';
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

  @IsOptional()
  @Type(() => Boolean)
  hideClosed?: boolean; // 마감된 모임 가리기

  @IsOptional()
  @Type(() => Boolean)
  onlyRanker?: boolean; // 선수출신 경기만 보기

  @IsOptional()
  @IsString()
  @IsIn(['male', 'female'])
  gender?: 'male' | 'female'; // 성별 필터 (남자만/여자만)

  @IsOptional()
  @Type(() => Boolean)
  includeCompleted?: boolean; // 종료된 모임 포함 여부

  @IsOptional()
  @IsString()
  @IsIn(['normal', 'rank', 'event'])
  type?: 'normal' | 'rank' | 'event'; // 매치 유형 필터 (일반/랭크/이벤트)
}





