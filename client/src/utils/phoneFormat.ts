/**
 * 전화번호 입력 시 하이픈 자동 추가
 * 숫자만 입력해도 010-1234-5678 형식으로 변환
 */
export function formatPhoneNumber(value: string): string {
  const numbers = value.replace(/[^\d]/g, '');
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
}

/** 전화번호 입력 placeholder - 앱 전체 공통 */
export const PHONE_PLACEHOLDER = '- 없이 입력';
