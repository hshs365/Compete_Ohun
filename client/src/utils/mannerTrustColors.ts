/**
 * 신뢰도(매너 점수) 기반 포인트 컬러
 * - 높음: 일렉트릭 블루 / 에메랄드 그린
 * - 낮음·노쇼: 앰버 / 뮤트 레드
 */
export interface MannerTrustColors {
  point: string;
  bg: string;
  border: string;
  text: string;
  badgeClass: string;
}

export function getMannerTrustColors(
  mannerScore: number,
  noShowCount: number
): MannerTrustColors {
  const hasNoShow = noShowCount > 0;
  const isLow = mannerScore < 40;
  const isMid = mannerScore >= 40 && mannerScore < 60;
  const isHigh = mannerScore >= 60;

  if (hasNoShow || isLow) {
    return {
      point: '#b91c1c',
      bg: 'bg-red-900/30',
      border: 'border-red-700/50',
      text: 'text-red-400',
      badgeClass: 'bg-red-900/30 text-red-300 border border-red-700/50',
    };
  }
  if (isMid) {
    return {
      point: '#d97706',
      bg: 'bg-amber-900/30',
      border: 'border-amber-600/50',
      text: 'text-amber-400',
      badgeClass: 'bg-amber-900/30 text-amber-300 border border-amber-600/50',
    };
  }
  if (isHigh) {
    return {
      point: '#10b981',
      bg: 'bg-emerald-900/30',
      border: 'border-emerald-500/50',
      text: 'text-emerald-400',
      badgeClass: 'bg-emerald-900/30 text-emerald-300 border border-emerald-500/50',
    };
  }
  return {
    point: '#0ea5e9',
    bg: 'bg-sky-900/30',
    border: 'border-sky-500/50',
    text: 'text-sky-400',
    badgeClass: 'bg-sky-900/30 text-sky-300 border border-sky-500/50',
  };
}
