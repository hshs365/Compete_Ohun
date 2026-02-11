/** 팔로워 등급: 1.0K+ 스타터, 3K+ 파트너, 5.0K+ 베테랑, 10K+ 디렉터, 100K+ 마스터 */
export const FOLLOWER_GRADES = ['스타터', '파트너', '베테랑', '디렉터', '마스터'] as const;
export type FollowerGrade = (typeof FOLLOWER_GRADES)[number];

const THRESHOLDS: { min: number; grade: FollowerGrade }[] = [
  { min: 100_000, grade: '마스터' },
  { min: 10_000, grade: '디렉터' },
  { min: 5_000, grade: '베테랑' },
  { min: 3_000, grade: '파트너' },
  { min: 1_000, grade: '스타터' },
];

export function getFollowerGrade(followersCount: number): FollowerGrade | null {
  for (const { min, grade } of THRESHOLDS) {
    if (followersCount >= min) return grade;
  }
  return null;
}

/**
 * 등급별 뱃지 스타일 (라이트/다크 공통, 은은한 그라데이션 카드)
 * Tailwind 클래스: 카드형 뱃지 + 라이트/다크 각각 대비되는 텍스트·배경
 */
export const FOLLOWER_GRADE_BADGE_STYLES: Record<FollowerGrade, string> = {
  스타터:
    'bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/50 dark:to-teal-900/50 text-emerald-800 dark:text-emerald-200 border border-emerald-200/80 dark:border-emerald-600/50',
  파트너:
    'bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 text-blue-800 dark:text-blue-200 border border-blue-200/80 dark:border-blue-600/50',
  베테랑:
    'bg-gradient-to-r from-violet-100 to-purple-100 dark:from-violet-900/50 dark:to-purple-900/50 text-violet-800 dark:text-violet-200 border border-violet-200/80 dark:border-violet-600/50',
  디렉터:
    'bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/50 dark:to-yellow-900/50 text-amber-800 dark:text-amber-200 border border-amber-200/80 dark:border-amber-600/50',
  마스터:
    'bg-gradient-to-r from-rose-100 to-pink-100 dark:from-rose-900/50 dark:to-pink-900/50 text-rose-800 dark:text-rose-200 border border-rose-200/80 dark:border-rose-600/50',
};

export function getFollowerGradeBadgeStyle(grade: FollowerGrade): string {
  return FOLLOWER_GRADE_BADGE_STYLES[grade];
}
