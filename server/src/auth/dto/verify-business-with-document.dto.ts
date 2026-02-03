import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

/**
 * 사업자등록증 이미지 업로드 검증용 DTO
 * multipart/form-data: document (파일) + realName (앞서 인증한 실명)
 * - OCR로 문서에서 대표자명·사업자번호·개업일자 추출 후, 대표자명 ↔ 실명 일치 여부로 본인 여부 확인
 */
export class VerifyBusinessWithDocumentDto {
  /** 앞서 인증한 실명 (Step 4 실명인증). OCR 대표자명과 일치해야 검증 통과 */
  @IsString()
  @IsNotEmpty({ message: '실명을 입력해 주세요.' })
  @MaxLength(50)
  realName: string;
}
