/**
 * 1,000 이상 → "1.0K", 1,000,000 이상 → "1.0M" 형식으로 변환
 */
export function formatNumber(value: number): string {
  if (value >= 1_000_000) {
    return (value / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (value >= 1_000) {
    return (value / 1_000).toFixed(1) + 'K';
  }
  return String(value);
}

/** 단위(K/M)가 붙었는지 여부 */
export function formatNumberHasUnit(value: number): boolean {
  return value >= 1_000;
}
