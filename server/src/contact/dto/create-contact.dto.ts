import { IsIn, IsEmail, IsString, MinLength, MaxLength, IsOptional } from 'class-validator';
import { INQUIRY_TYPES, type InquiryType } from '../entities/contact.entity';

export class CreateContactDto {
  @IsIn(INQUIRY_TYPES as unknown as string[])
  type: InquiryType;

  @IsString()
  @MinLength(1, { message: '제목을 입력해주세요.' })
  @MaxLength(200)
  title: string;

  @IsString()
  @MinLength(1, { message: '내용을 입력해주세요.' })
  content: string;

  @IsOptional()
  @IsEmail({}, { message: '올바른 이메일을 입력해주세요.' })
  submitterEmail?: string;
}
