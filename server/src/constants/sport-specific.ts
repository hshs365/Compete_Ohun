/**
 * 종목별 sport_specific_data 스키마 정의.
 * 각 종목 ID에 따라 필수/선택 필드와 유효성 규칙을 정의.
 */
export type SportSpecificSchema = {
  /** 필수 필드: { key: 설명 } */
  required?: Record<string, string>;
  /** 선택 필드 */
  optional?: Record<string, string>;
};

export const SPORT_SPECIFIC_SCHEMAS: Record<string, SportSpecificSchema> = {
  배드민턴: {
    required: {
      levelCategory: '급수/종목 (A~D조 등). 예: A, B, C, D',
    },
    optional: {
      skillLevel: '실력 수준',
    },
  },
  축구: {
    optional: {
      positions: '모집 포지션 (GK, DF, MF, FW 등)',
    },
  },
  풋살: {
    optional: {
      positions: '모집 포지션',
    },
  },
  농구: {
    optional: {
      positions: '모집 포지션 (G, F, C 등)',
    },
  },
  야구: {
    optional: {
      positions: '모집 포지션 (투수, 포수, 내야수, 외야수 등)',
    },
  },
  테니스: {
    optional: {
      skillLevel: '실력 수준',
    },
  },
};

export function validateSportSpecificData(
  category: string,
  data: Record<string, unknown> | null | undefined,
): { valid: boolean; message?: string } {
  const schema = SPORT_SPECIFIC_SCHEMAS[category];
  if (!schema) return { valid: true }; // 스키마 없으면 검증 스킵

  const obj = data && typeof data === 'object' ? data : {};
  const required = schema.required ?? {};

  for (const [key, _desc] of Object.entries(required)) {
    const val = obj[key];
    if (val === undefined || val === null) {
      return { valid: false, message: `${key}는(은) 필수입니다.` };
    }
    // '' 또는 'all'은 "상관없음"으로 유효
    if (val === '' || val === 'all') continue;
    if (Array.isArray(val) && val.length === 0) {
      return { valid: false, message: `${key}는(은) 최소 1개 이상 선택해야 합니다.` };
    }
  }

  return { valid: true };
}
