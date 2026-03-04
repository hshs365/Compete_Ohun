import { IsOptional, IsIn, IsArray, ValidateNested, IsNumber, IsString, Matches, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

class TimeSlotDto {
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'timeSlot start must be HH:mm format' })
  start: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'timeSlot end must be HH:mm format' })
  end: string;
}

class AvailabilityDto {
  @IsNumber()
  dayOfWeek: number; // 0=일요일, 1=월요일, ..., 6=토요일

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeSlotDto)
  timeSlots: TimeSlotDto[];
}

export class UpdateMercenaryProfileDto {
  @IsOptional()
  @IsIn(['active', 'paused'])
  mercenaryActivityStatus?: 'active' | 'paused';

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AvailabilityDto)
  mercenaryAvailability?: AvailabilityDto[];

  @IsOptional()
  interestedSports?: string[];

  @IsOptional()
  sportPositions?: { sport: string; positions: string[] }[];

  @IsOptional()
  ohunRanks?: Record<string, string>;

  /** 종목별 용병 알림 수신 활성화. { "축구": true, "배드민턴": false } */
  @IsOptional()
  @IsObject()
  mercenaryActiveBySport?: Record<string, boolean>;
}
