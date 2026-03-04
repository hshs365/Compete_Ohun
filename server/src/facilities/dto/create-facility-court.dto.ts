import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber, IsArray, IsIn, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

const FLOOR_MATERIALS = ['우레탄', '인조잔디', '마루', '콘크리트', '모래', '천연잔디', '타일', '기타'] as const;

export class CreateFacilityCourtDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  courtName: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  floorLevel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  courtNumber?: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(FLOOR_MATERIALS)
  @MaxLength(30)
  floorMaterial: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  ceilingHeight?: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  officialSpec?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isExclusiveUse?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsString()
  directionsGuide?: string;

  @IsString()
  @IsIn(['indoor', 'outdoor'])
  indoorOutdoor: 'indoor' | 'outdoor';

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sortOrder?: number;
}
