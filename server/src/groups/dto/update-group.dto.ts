import { IsString, IsNumber, IsArray, IsOptional, IsLatitude, IsLongitude, MaxLength, MinLength, IsBoolean } from 'class-validator';

export class UpdateGroupDto {
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  location?: string;

  @IsNumber()
  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  @IsLongitude()
  longitude?: number;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  category?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  meetingTime?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  contact?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  equipment?: string[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  isClosed?: boolean;
}





