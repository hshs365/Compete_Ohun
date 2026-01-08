import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsArray,
  IsOptional,
  IsLatitude,
  IsLongitude,
  MaxLength,
  MinLength,
  IsBoolean,
  IsIn,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

// GameSettingsDto를 먼저 선언
export class GameSettingsDto {
  @IsString()
  @IsIn(['team', 'individual'])
  @IsOptional()
  gameType?: 'team' | 'individual';

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  positions?: string[]; // 모집할 포지션 목록

  @IsNumber()
  @IsOptional()
  minPlayersPerTeam?: number; // 팀당 최소 인원

  @IsBoolean()
  @IsOptional()
  balanceByExperience?: boolean; // 선수 출신 여부 고려

  @IsBoolean()
  @IsOptional()
  balanceByRank?: boolean; // 랭커 여부 고려
}

export class CreateGroupDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  location: string;

  @IsNumber()
  @IsLatitude()
  latitude: number;

  @IsNumber()
  @IsLongitude()
  longitude: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  category: string;

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
  equipment?: string[]; // 준비물 목록

  @IsNumber()
  @IsOptional()
  maxParticipants?: number; // 최대 참여자 수

  @IsNumber()
  @IsOptional()
  minParticipants?: number; // 최소 참여자 수

  @IsOptional()
  meetingDateTime?: Date | string; // 실제 모임 일시

  @IsOptional()
  @IsBoolean()
  hasFee?: boolean; // 참가비 여부

  @IsOptional()
  @IsNumber()
  feeAmount?: number; // 참가비 금액 (원 단위)

  @IsOptional()
  @IsNumber()
  facilityId?: number; // 선택된 시설 ID

  @IsOptional()
  @IsString()
  @IsIn(['male', 'female'])
  genderRestriction?: 'male' | 'female'; // 성별 제한 (남자만/여자만)

  // 게임 설정 (선택사항)
  @IsOptional()
  @ValidateNested()
  @Type(() => GameSettingsDto)
  gameSettings?: GameSettingsDto;

  @IsOptional()
  @IsString()
  @IsIn(['normal', 'event'])
  type?: 'normal' | 'event'; // 모임 타입 (기본값: 'normal')
}





