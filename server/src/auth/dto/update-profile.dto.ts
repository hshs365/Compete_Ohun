import { IsOptional, IsString, IsArray, IsEnum, IsBoolean } from 'class-validator';
import { SkillLevel } from '../../users/entities/user.entity';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  nickname?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  /** 연락처 수정 시 SMS 인증번호 (phone 변경 시 필수) */
  @IsOptional()
  @IsString()
  verificationCode?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interestedSports?: string[];

  @IsOptional()
  @IsArray()
  sportPositions?: { sport: string; positions: string[] }[];

  @IsOptional()
  @IsEnum(SkillLevel)
  skillLevel?: SkillLevel;

  /** 내 지역 랭크매치 생성 시 심판 신청 알림 받기 */
  @IsOptional()
  @IsBoolean()
  notifyRefereeRankMatchInRegion?: boolean;
}




