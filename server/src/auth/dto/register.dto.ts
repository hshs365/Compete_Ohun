import { IsEmail, IsString, MinLength, IsEnum, IsOptional, IsArray, IsBoolean, Matches } from 'class-validator';
import { Gender, SkillLevel } from '../../users/entities/user.entity';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: '비밀번호는 최소 8자 이상이며 대문자, 소문자, 숫자를 포함해야 합니다.',
  })
  password: string;

  @IsString()
  @Matches(/^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/, {
    message: '올바른 전화번호 형식이 아닙니다. (예: 010-1234-5678)',
  })
  phone: string; // 연락처 (필수)

  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{6}$/, {
    message: '인증번호는 6자리 숫자입니다.',
  })
  verificationCode?: string; // 본인인증 번호 (SMS 인증 활성화 시 필수)

  @IsString()
  @MinLength(2)
  nickname: string;

  @IsString()
  @MinLength(2)
  @Matches(/^[가-힣a-zA-Z\s]+$/, {
    message: '이름은 한글 또는 영문만 입력 가능합니다.',
  })
  realName: string; // 실명 (필수)

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

  @IsEnum(['individual', 'business'])
  memberType: 'individual' | 'business'; // 회원 유형

  @IsOptional()
  @IsString()
  @Matches(/^\d{3}-\d{2}-\d{5}$/, {
    message: '사업자번호는 XXX-XX-XXXXX 형식이어야 합니다.',
  })
  businessNumber?: string; // 사업자번호 (사업자 회원인 경우 필수)
}


