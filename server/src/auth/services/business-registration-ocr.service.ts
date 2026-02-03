import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * 사업자등록증 이미지에서 OCR로 데이터 추출
 * 네이버 클로바 OCR Document API (사업자등록증 특화) 연동
 * - NCP_OCR_SECRET, NCP_OCR_INVOKE_URL 미설정 시 null 반환 → 문서 검증 불가
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
  inferResult?: string;
  [key: string]: unknown;
}

interface ClovaOcrResponse {
  images?: ClovaOcrImage[];
  [key: string]: unknown;
}

@Injectable()
export class BusinessRegistrationOcrService {
  private readonly secret: string | undefined;
  private readonly invokeUrl: string | undefined;

  constructor(private configService: ConfigService) {
    this.secret = this.configService.get<string>('NCP_OCR_SECRET');
    this.invokeUrl = this.configService.get<string>('NCP_OCR_INVOKE_URL');
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

  /**
   * 클로바 응답에서 필드 맵 생성 (한글/영문 키 모두 처리)
   */
  private parseFields(images: ClovaOcrImage[] | undefined): Map<string, string> {
    const map = new Map<string, string>();
    if (!Array.isArray(images) || images.length === 0) return map;

    const fieldKeys: Record<string, string[]> = {
      businessNumber: ['사업자등록번호', '사업자번호', 'businessNumber', 'bizNo', 'num'],
      representativeName: ['대표자명', '대표자', 'representativeName', 'ceo', 'p_nm'],
      openingDate: ['개업일자', '개업일', 'openingDate', 'start_dt', 'startDt'],
      companyName: ['상호', '회사명', 'companyName', 'corpNm'],
    };

    for (const img of images) {
      const fields = img?.fields;
      if (!Array.isArray(fields)) continue;
      for (const f of fields) {
        const text = (f.inferText ?? f.value ?? '').toString().trim();
        if (!text) continue;
        const name = (f.name ?? '').toString().trim();
        for (const [key, aliases] of Object.entries(fieldKeys)) {
          if (aliases.some((a) => name.includes(a) || name === a)) {
            if (!map.has(key)) map.set(key, text);
            break;
          }
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
        return null;
      }

      let json: ClovaOcrResponse;
      try {
        json = JSON.parse(text) as ClovaOcrResponse;
      } catch {
        return null;
      }

      const map = this.parseFields(json.images);
      const businessNumber = this.normalizeBusinessNumber(
        map.get('businessNumber') ?? '',
      );
      if (!businessNumber || businessNumber.length < 10) {
        return null;
      }

      return {
        businessNumber,
        representativeName: map.get('representativeName')?.trim(),
        openingDate: this.normalizeOpeningDate(map.get('openingDate')),
        companyName: map.get('companyName')?.trim(),
      };
    } catch {
      return null;
    }
  }

  /**
   * Multer 파일로 OCR 수행
   */
  async extractFromFile(file: Express.Multer.File): Promise<BusinessRegistrationOcrResult | null> {
    return this.extractFromBuffer(file.buffer, file.mimetype);
  }
}
