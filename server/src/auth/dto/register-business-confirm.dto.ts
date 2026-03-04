import { IsString, Matches, IsOptional, MaxLength } from 'class-validator';

/**
 * 비즈니스 계정 전환 확인 (OCR 추출 결과 또는 직접입력으로 전환 확정)
 * - OCR 성공 후 대조 일치 시 또는 OCR 실패 후 직접입력 제출 시 사용
 */
export class RegisterBusinessConfirmDto {
  /** 사업자번호 XXX-XX-XXXXX */
  @IsString()
  @Matches(/^\d{3}-\d{2}-\d{5}$/, {
    message: '사업자번호는 XXX-XX-XXXXX 형식이어야 합니다.',
  })
  businessNumber: string;

  /** 대표자명 (가입자 실명과 일치해야 함) */
  @IsOptional()
  @IsString()
  @MaxLength(50)
  representativeName?: string;

  /** 개업일자 YYYYMMDD 또는 YYYY-MM-DD (국세청 진위확인용) */
  @IsOptional()
  @IsString()
  @MaxLength(10)
  openingDate?: string;
}
