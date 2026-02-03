import { IsString, IsNotEmpty, Matches, IsOptional, MaxLength } from 'class-validator';

export class VerifyBusinessNumberDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{3}-\d{2}-\d{5}$/, {
    message: '사업자번호는 XXX-XX-XXXXX 형식이어야 합니다.',
  })
  businessNumber: string; // XXX-XX-XXXXX 형식

  /** 대표자명 (국세청 진위확인 시 필요, 있으면 API로 일치 여부 확인) */
  @IsString()
  @IsOptional()
  @MaxLength(50)
  representativeName?: string;

  /** 개업일자 YYYYMMDD 또는 YYYY-MM-DD (국세청 진위확인 시 필요) */
  @IsString()
  @IsOptional()
  @MaxLength(10)
  openingDate?: string;
}

