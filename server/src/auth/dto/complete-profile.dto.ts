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
  @IsString()
  residenceAddress?: string;

  /** 네이버 미제공 시 사용자가 직접 입력 */
  @IsOptional()
  @IsString()
  realName?: string;

  /** 휴대전화 (필수) - 가입자 구분용 */
  @IsString()
  @Matches(/^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/, {
    message: '올바른 전화번호 형식이 아닙니다. (예: 010-1234-5678)',
  })
  phone: string;

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


