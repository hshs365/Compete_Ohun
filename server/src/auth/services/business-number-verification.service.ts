import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * 국세청 사업자등록정보 진위확인 API 연동
 * 공공데이터포털(data.go.kr) "국세청_사업자등록정보 진위확인 및 상태조회" 활용
 * - 진위확인: 사업자번호 + 개업일자 + 대표자명으로 국세청 정보와 일치 여부 확인
 * - API 키 미설정 시 형식 검증만 수행(기존 동작 유지)
 */
@Injectable()
export class BusinessNumberVerificationService {
  private readonly serviceKey: string | undefined;
  private readonly baseUrl =
    'https://api.odcloud.kr/api/nts-businessman/v1/validate';

  constructor(private configService: ConfigService) {
    this.serviceKey = this.configService.get<string>('DATA_GO_KR_SERVICE_KEY');
  }

  /**
   * 사업자번호 10자리만 추출 (하이픈 제거)
   */
  private normalizeBusinessNumber(businessNumber: string): string {
    return businessNumber.replace(/\D/g, '').slice(0, 10);
  }

  /**
   * 개업일자를 YYYYMMDD 형식으로 변환
   */
  private normalizeOpeningDate(dateStr: string | undefined): string | undefined {
    if (!dateStr?.trim()) return undefined;
    const digits = dateStr.replace(/\D/g, '');
    if (digits.length === 8) return digits; // YYYYMMDD
    if (digits.length >= 6) return digits.slice(0, 8);
    return undefined;
  }

  /**
   * 국세청 API 호출 (진위확인)
   * - b_no, start_dt, p_nm 가 모두 있을 때만 API 호출
   * - API 키가 없거나 파라미터가 부족하면 null 반환(호출자에서 형식 검증만 사용)
   */
  async verifyWithNts(
    businessNumber: string,
    options?: { representativeName?: string; openingDate?: string },
  ): Promise<{ verified: boolean; message?: string; data?: unknown } | null> {
    if (!this.serviceKey?.trim()) {
      return null;
    }

    const bNo = this.normalizeBusinessNumber(businessNumber);
    if (bNo.length !== 10) {
      return { verified: false, message: '사업자번호는 10자리여야 합니다.' };
    }

    const startDt = this.normalizeOpeningDate(options?.openingDate);
    const pNm = options?.representativeName?.trim();

    // 진위확인 API는 b_no, start_dt, p_nm 세 값이 모두 필요
    if (!startDt || !pNm) {
      return null;
    }

    try {
      const params = new URLSearchParams({
        serviceKey: this.serviceKey,
        returnType: 'JSON',
        b_no: bNo,
        start_dt: startDt,
        p_nm: pNm,
      });
      const url = `${this.baseUrl}?${params.toString()}`;
      const res = await fetch(url, { method: 'GET' });
      const text = await res.text();

      if (!res.ok) {
        return {
          verified: false,
          message: '사업자등록정보 조회 서비스에 일시적인 오류가 있습니다. 잠시 후 다시 시도해 주세요.',
          data: text,
        };
      }

      let json: { data?: Array<{ valid?: string }>; valid_yn?: string; [k: string]: unknown };
      try {
        json = JSON.parse(text) as typeof json;
      } catch {
        return {
          verified: false,
          message: '사업자등록정보 조회 응답을 확인할 수 없습니다.',
          data: text,
        };
      }

      // 응답 형식: { data: [ { valid: "01" } ] } (01=유효, 02=무효) 또는 valid_yn: "Y"/"N"
      const dataList = json?.data;
      if (Array.isArray(dataList) && dataList.length > 0) {
        const first = dataList[0];
        const valid = first?.valid;
        if (valid === '01') {
          return { verified: true, data: first };
        }
        if (valid === '02') {
          return {
            verified: false,
            message: '사업자등록번호·개업일자·대표자명이 국세청 정보와 일치하지 않습니다. 입력 내용을 확인해 주세요.',
            data: first,
          };
        }
      }

      const validYn = (json?.valid_yn as string)?.toUpperCase();
      if (validYn === 'Y') {
        return { verified: true, data: json };
      }
      if (validYn === 'N') {
        return {
          verified: false,
          message: '사업자등록번호·개업일자·대표자명이 국세청 정보와 일치하지 않습니다.',
          data: json,
        };
      }

      return {
        verified: false,
        message: '사업자등록정보 진위확인 결과를 확인할 수 없습니다.',
        data: json,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        verified: false,
        message: `사업자등록정보 조회 중 오류가 발생했습니다. (${message})`,
      };
    }
  }

  /** API 키 설정 여부 (진위확인 API 사용 가능 여부) */
  isApiConfigured(): boolean {
    return !!this.serviceKey?.trim();
  }
}
