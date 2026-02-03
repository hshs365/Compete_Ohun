import { IsIn, IsString, IsBoolean, IsOptional, MinLength, MaxLength } from 'class-validator';
import { NOTICE_TYPES, type NoticeType } from '../entities/notice.entity';

export class CreateNoticeDto {
  @IsIn(NOTICE_TYPES as unknown as string[], { message: '유효한 공지 유형을 선택해주세요.' })
  type: NoticeType;

  @IsString()
  @MinLength(1, { message: '제목을 입력해주세요.' })
  @MaxLength(200)
  title: string;

  @IsString()
  @MinLength(1, { message: '내용을 입력해주세요.' })
  content: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  version?: string;

  @IsOptional()
  @IsBoolean()
  isImportant?: boolean;
}
