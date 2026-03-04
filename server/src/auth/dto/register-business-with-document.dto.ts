import { IsString, IsOptional, MaxLength } from 'class-validator';

/**
 * 로그인 사용자 비즈니스 전환 - 사업자등록증 이미지 업로드용 DTO
 * multipart/form-data: document (파일) + realName (선택, 프로필에 없을 때만)
 * - realName 미입력 시: 프로필의 realName 사용
 * - 프로필에 realName 없으면 요청 시 필수
 */
export class RegisterBusinessWithDocumentDto {
  /** 실명 (프로필에 없을 때만 입력) - OCR 대표자명과 일치해야 검증 통과 */
  @IsOptional()
  @IsString()
  @MaxLength(50)
  realName?: string;
}
