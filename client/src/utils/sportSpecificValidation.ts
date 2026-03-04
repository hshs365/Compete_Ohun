/**
 * 클라이언트용 sport_specific_data 유효성 검사.
 * SPORT_CONFIG의 formFields와 동기화하여 종목별 필수값 체크.
 */
import { SPORT_CONFIG } from '../constants/sports';

export function validateSportSpecificDataClient(
  category: string,
  data: Record<string, unknown> | null | undefined
): { valid: boolean; message?: string } {
  const config = SPORT_CONFIG[category];
  if (!config?.formFields) return { valid: true };

  const obj = data && typeof data === 'object' ? data : {};

  for (const field of config.formFields) {
    // required 체크는 SPORT_SPECIFIC_SCHEMAS의 required와 동기화 필요.
    // 배드민턴 levelCategory, 그 외는 optional로 처리.
    if (category === '배드민턴' && field.key === 'levelCategory') {
      const val = obj[field.key];
      if (val === undefined || val === null || val === '') {
        return { valid: false, message: `${field.label}을(를) 선택해 주세요.` };
      }
    }
  }

  return { valid: true };
}
