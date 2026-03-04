import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/** NCP OCR 문서 업로드 최대 허용 용량 (10MB). 가이드·API 제한에 맞춤 */
export const OCR_DOCUMENT_MAX_BYTES = 10 * 1024 * 1024;

/**
 * 사업자등록증 이미지에서 OCR로 데이터 추출
 * 네이버 클로바 OCR Document API (사업자등록증 특화) 연동
 * - NCP_OCR_SECRET, NCP_OCR_INVOKE_URL 미설정 시 null 반환 → 문서 검증 불가
 * - CLOVA OCR 콘솔: Domain > 사업자등록증(KR) 도메인 생성 → API Gateway 연동 후 Invoke URL·Secret 설정
 */
export interface BusinessRegistrationOcrResult {
  businessNumber: string; // XXX-XX-XXXXX
  representativeName?: string;
  openingDate?: string; // YYYYMMDD
  companyName?: string; // 상호
}

/** 클로바 OCR 응답 이미지 필드 (필드명은 문서 타입별로 상이할 수 있음) */
interface ClovaOcrField {
  name?: string;
  inferText?: string;
  value?: string;
}

interface ClovaOcrImage {
  fields?: ClovaOcrField[];
  /** Document API: 인식 결과가 JSON 문자열로 올 수 있음 */
  inferResult?: string;
  [key: string]: unknown;
}

interface ClovaOcrResponse {
  images?: ClovaOcrImage[];
  [key: string]: unknown;
}

@Injectable()
export class BusinessRegistrationOcrService {
  private readonly logger = new Logger(BusinessRegistrationOcrService.name);
  private readonly secret: string | undefined;
  private readonly invokeUrl: string | undefined;

  constructor(private configService: ConfigService) {
    this.secret = this.configService.get<string>('NCP_OCR_SECRET');
    this.invokeUrl = this.configService.get<string>('NCP_OCR_INVOKE_URL');
    if (!this.secret?.trim() || !this.invokeUrl?.trim()) {
      this.logger.log(
        'CLOVA OCR 미설정: NCP_OCR_SECRET, NCP_OCR_INVOKE_URL를 .env에 설정하고, NCP 콘솔에서 사업자등록증(KR) 도메인 Invoke URL을 넣어주세요. 서버에서 NCP로 나가는 HTTPS가 가능해야 합니다.',
      );
    }
  }

  isConfigured(): boolean {
    return !!(this.secret?.trim() && this.invokeUrl?.trim());
  }

  /**
   * 사업자번호를 XXX-XX-XXXXX 형식으로 정규화
   */
  private normalizeBusinessNumber(value: string | undefined): string {
    if (!value?.trim()) return '';
    const digits = value.replace(/\D/g, '').slice(0, 10);
    if (digits.length !== 10) return value.trim();
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
  }

  /**
   * 개업일자를 YYYYMMDD 형식으로 정규화
   */
  private normalizeOpeningDate(value: string | undefined): string | undefined {
    if (!value?.trim()) return undefined;
    const digits = value.replace(/\D/g, '').slice(0, 8);
    return digits.length === 8 ? digits : undefined;
  }

  /** 사업자등록증 필드명 매핑 (한글/영문/API 키) */
  private static readonly FIELD_ALIASES: Record<string, string[]> = {
    businessNumber: ['사업자등록번호', '사업자번호', 'businessNumber', 'bizNo', 'num'],
    representativeName: ['대표자명', '대표자', 'representativeName', 'ceo', 'p_nm'],
    openingDate: ['개업일자', '개업일', 'openingDate', 'start_dt', 'startDt'],
    companyName: ['상호', '회사명', 'companyName', 'corpNm'],
  };

  /**
   * 필드 배열을 맵으로 변환 (한글/영문 키 모두 처리)
   */
  private fieldsArrayToMap(fields: ClovaOcrField[] | undefined): Map<string, string> {
    const map = new Map<string, string>();
    if (!Array.isArray(fields)) return map;
    for (const f of fields) {
      const text = (f.inferText ?? f.value ?? '').toString().trim();
      if (!text) continue;
      const name = (f.name ?? '').toString().trim();
      for (const [key, aliases] of Object.entries(BusinessRegistrationOcrService.FIELD_ALIASES)) {
        if (aliases.some((a) => name.includes(a) || name === a)) {
          if (!map.has(key)) map.set(key, text);
          break;
        }
      }
    }
    return map;
  }

  /**
   * 키-값 객체를 맵으로 변환 (CLOVA가 fields를 객체로 주는 경우)
   */
  private fieldsObjectToMap(obj: Record<string, string> | undefined): Map<string, string> {
    const map = new Map<string, string>();
    if (!obj || typeof obj !== 'object') return map;
    for (const [key, aliases] of Object.entries(BusinessRegistrationOcrService.FIELD_ALIASES)) {
      for (const alias of aliases) {
        const value = obj[alias];
        if (value != null && String(value).trim()) {
          map.set(key, String(value).trim());
          break;
        }
      }
    }
    return map;
  }

  /**
   * 클로바 응답에서 필드 맵 생성
   * - images[].fields 배열 또는 images[].inferResult(JSON 문자열) 지원
   */
  private parseFields(images: ClovaOcrImage[] | undefined): Map<string, string> {
    const map = new Map<string, string>();
    if (!Array.isArray(images) || images.length === 0) return map;

    for (const img of images) {
      // 1) fields 배열이 있으면 사용
      const fields = img?.fields;
      if (Array.isArray(fields)) {
        const fromArray = this.fieldsArrayToMap(fields);
        fromArray.forEach((v, k) => { if (!map.has(k)) map.set(k, v); });
      }
      // 2) inferResult가 JSON 문자열인 경우 (Document API 일부 응답)
      const inferResult = img?.inferResult;
      if (typeof inferResult === 'string' && inferResult.trim()) {
        try {
          const parsed = JSON.parse(inferResult) as { fields?: ClovaOcrField[] } | Record<string, string>;
          if (Array.isArray(parsed.fields)) {
            const fromInfer = this.fieldsArrayToMap(parsed.fields);
            fromInfer.forEach((v, k) => { if (!map.has(k)) map.set(k, v); });
          } else if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            const fromObj = this.fieldsObjectToMap(parsed as Record<string, string>);
            fromObj.forEach((v, k) => { if (!map.has(k)) map.set(k, v); });
          }
        } catch {
          // inferResult 파싱 실패 시 무시
        }
      }
    }
    return map;
  }

  /**
   * 이미지 버퍼로 사업자등록증 OCR 수행
   * @returns 추출된 정보. OCR 미설정/실패 시 null
   */
  async extractFromBuffer(buffer: Buffer, mimeType: string): Promise<BusinessRegistrationOcrResult | null> {
    if (!this.isConfigured()) {
      return null;
    }

    const format = mimeType === 'image/png' ? 'png' : mimeType === 'image/jpeg' || mimeType === 'image/jpg' ? 'jpg' : 'jpg';
    const base64 = buffer.toString('base64');

    const body = {
      version: 'V2',
      requestId: crypto.randomUUID(),
      timestamp: Math.floor(Date.now() / 1000),
      images: [{ format, name: 'document', data: base64 }],
    };

    try {
      const res = await fetch(this.invokeUrl!, {
        method: 'POST',
        headers: {
          'X-OCR-SECRET': this.secret!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const text = await res.text();
      if (!res.ok) {
        this.logger.warn(
          `CLOVA OCR API error: status=${res.status} body=${text.slice(0, 300)}`,
        );
        // NCP OCR 가이드: 최대 허용 용량 초과 시 413 또는 400 등으로 응답할 수 있음
        const lowerBody = text.toLowerCase();
        const isSizeError =
          res.status === 413 ||
          (res.status === 400 && (
            lowerBody.includes('size') ||
            lowerBody.includes('large') ||
            lowerBody.includes('limit') ||
            lowerBody.includes('payload') ||
            lowerBody.includes('용량') ||
            lowerBody.includes('초과')
          ));
        if (isSizeError) {
          throw new BadRequestException(
            '이미지 용량이 OCR API 허용 한도를 초과했습니다. 10MB 이하로 압축하거나 리사이징 후 다시 올려주세요.',
          );
        }
        // 400 Request body invalid 등 NCP 공통 오류 메시지
        if (res.status === 400 && lowerBody.includes('request body')) {
          throw new BadRequestException(
            'OCR 요청 형식이 올바르지 않습니다. 이미지를 10MB 이하로 줄인 뒤 다시 시도해 주세요.',
          );
        }
        return null;
      }

      let json: ClovaOcrResponse;
      try {
        json = JSON.parse(text) as ClovaOcrResponse;
      } catch {
        this.logger.warn('CLOVA OCR: response JSON parse failed');
        return null;
      }

      const map = this.parseFields(json.images);
      const businessNumber = this.normalizeBusinessNumber(
        map.get('businessNumber') ?? '',
      );
      if (!businessNumber || businessNumber.length < 10) {
        if (map.size > 0) {
          this.logger.debug(
            `CLOVA OCR: 사업자번호 미추출. 추출필드: ${JSON.stringify(Object.fromEntries(map))}`,
          );
        }
        return null;
      }

      return {
        businessNumber,
        representativeName: map.get('representativeName')?.trim(),
        openingDate: this.normalizeOpeningDate(map.get('openingDate')),
        companyName: map.get('companyName')?.trim(),
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const cause = err instanceof Error && (err as Error & { cause?: unknown }).cause
        ? String((err as Error & { cause?: unknown }).cause)
        : '';
      const urlHint = this.invokeUrl
        ? ` (host: ${this.invokeUrl.replace(/^https?:\/\//, '').split('/')[0]})`
        : ' (NCP_OCR_INVOKE_URL 미설정)';
      this.logger.warn(
        `CLOVA OCR request failed: ${msg}${cause ? ` | cause: ${cause}` : ''}${urlHint}`,
      );
      return null;
    }
  }

  /**
   * Multer 파일로 OCR 수행 (memoryStorage 사용 시 file.buffer 필요)
   */
  async extractFromFile(file: Express.Multer.File): Promise<BusinessRegistrationOcrResult | null> {
    if (!file?.buffer?.length) {
      this.logger.warn('OCR: file.buffer is missing (use multer memoryStorage for document upload)');
      return null;
    }
    return this.extractFromBuffer(file.buffer, file.mimetype || 'image/jpeg');
  }
}
