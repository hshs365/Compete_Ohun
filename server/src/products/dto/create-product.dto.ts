import { IsString, IsNotEmpty, IsNumber, IsOptional, MaxLength, Min, IsArray } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  brand: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  originalPrice?: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  category: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  sport?: string;

  @IsString()
  @IsOptional()
  description?: string;

  /** 다중 이미지 URL (정면·측면 등). image 없을 때 사용. 쿠팡 스타일 */
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  /** 단일 이미지(구 호환). images 없을 때 사용. images 또는 image 중 최소 1개 필수 */
  @IsString()
  @IsOptional()
  image?: string;
}
