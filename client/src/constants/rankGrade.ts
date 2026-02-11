/**
 * 랭크 포인트(RP) → 등급(S,A,B,C,D,E,F).
 * 서버 rank-grade.ts와 동일한 구간 사용.
 */
import type { AllcourtplayRank } from './allcourtplayRank';

/** RP 구간: S=2600+, A=2200+, B=1800+, C=1400+, D=1000+, E=600+, F=0+ */
const GRADE_BOUNDS: { grade: AllcourtplayRank; min: number }[] = [
  { grade: 'S', min: 2600 },
  { grade: 'A', min: 2200 },
  { grade: 'B', min: 1800 },
  { grade: 'C', min: 1400 },
  { grade: 'D', min: 1000 },
  { grade: 'E', min: 600 },
  { grade: 'F', min: 0 },
];

/**
 * RP(랭크 포인트) → 등급 (S,A,B,C,D,E,F).
 */
export function rpToGrade(rp: number): AllcourtplayRank {
  const p = Math.round(Math.max(0, rp));
  for (const { grade, min } of GRADE_BOUNDS) {
    if (p >= min) return grade;
  }
  return 'F';
}
