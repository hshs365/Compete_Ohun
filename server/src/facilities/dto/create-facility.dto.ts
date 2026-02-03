import { IsString, IsNotEmpty, IsNumber, IsArray, IsOptional, IsLatitude, IsLongitude, MaxLength, MinLength } from 'class-validator';

export class CreateFacilityDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  type: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  address: string;

  @IsNumber()
  @IsLatitude()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsLongitude()
  @IsOptional()
  longitude?: number;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  operatingHours?: string;

  /** 예약 단위(시간). 1, 2, 3, 4 등 (기본 2) */
  @IsOptional()
  @IsNumber()
  reservationSlotHours?: number;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  price?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  amenities?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  availableSports?: string[];

  @IsString()
  @IsOptional()
  image?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];
}

