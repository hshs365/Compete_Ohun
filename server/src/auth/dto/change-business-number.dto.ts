import { IsString, IsNotEmpty, MinLength, Matches } from 'class-validator';

export class ChangeBusinessNumberDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1, { message: '비밀번호를 입력해주세요.' })
  password: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{3}-\d{2}-\d{5}$/, {
    message: '사업자번호는 XXX-XX-XXXXX 형식이어야 합니다.',
  })
  newBusinessNumber: string;
}
