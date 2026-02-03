import { IsString, MinLength, IsEnum, IsOptional, IsArray, IsBoolean, Matches } from 'class-validator';
import { Gender, SkillLevel } from '../../users/entities/user.entity';

export class CompleteProfileDto {
  @IsString()
  @MinLength(2)
  nickname: string;

  @IsEnum(Gender)
  gender: Gender;

  @IsOptional()
  @IsString()
  ageRange?: string;

  @IsOptional()
  @IsString()
  birthDate?: string; // ISO date string

  @IsString()
  residenceSido: string;

  @IsString()
  residenceSigungu: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interestedSports?: string[];

  /** 스포츠별 포지션 (축구·풋살 등). [{ sport: '축구', positions: ['GK', 'FW'] }] */
  @IsOptional()
  @IsArray()
  sportPositions?: { sport: string; positions: string[] }[];

  @IsOptional()
  @IsEnum(SkillLevel)
  skillLevel?: SkillLevel;

  @IsBoolean()
  termsServiceAgreed: boolean;

  @IsBoolean()
  termsPrivacyAgreed: boolean;

  @IsOptional()
  @IsBoolean()
  marketingConsent?: boolean;

  @IsOptional()
  @IsBoolean()
  marketingEmailConsent?: boolean;

  @IsOptional()
  @IsBoolean()
  marketingSmsConsent?: boolean;
}


