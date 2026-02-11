/**
 * 랭크매치 등급: D급 1000점부터 시작, 구간당 400점.
 * 승 +25 / 패 -25 적용 후 점수로 S~F 등급 부여.
 */
export const RANK_INITIAL_POINTS = 1000; // D급 시작 점수 (신규 참가 시 기본)
export const RANK_POINTS_WIN = 25;
export const RANK_POINTS_LOSS = -25;
export const RANK_GRADE_INTERVAL = 400;

export const RANK_GRADES = ['S', 'A', 'B', 'C', 'D', 'E', 'F'] as const;
export type RankGrade = (typeof RANK_GRADES)[number];

/** 점수 구간: D=1000~1399, C=1400~1799, B=1800~2199, A=2200~2599, S=2600+ / E=600~999, F=0~599 */
const GRADE_BOUNDS: { grade: RankGrade; min: number }[] = [
  { grade: 'S', min: 2600 },
  { grade: 'A', min: 2200 },
  { grade: 'B', min: 1800 },
  { grade: 'C', min: 1400 },
  { grade: 'D', min: 1000 },
  { grade: 'E', min: 600 },
  { grade: 'F', min: 0 },
];

/**
 * 랭크 점수 → 등급 (S,A,B,C,D,E,F).
 * 1000 미만은 E, 600 미만은 F.
 */
export function pointsToGrade(points: number): RankGrade {
  const p = Math.round(points);
  for (const { grade, min } of GRADE_BOUNDS) {
    if (p >= min) return grade;
  }
  return 'F';
}
