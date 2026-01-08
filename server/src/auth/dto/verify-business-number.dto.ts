import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class VerifyBusinessNumberDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{3}-\d{2}-\d{5}$/, {
    message: '사업자번호는 XXX-XX-XXXXX 형식이어야 합니다.',
  })
  businessNumber: string; // XXX-XX-XXXXX 형식
}

