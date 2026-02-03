/**
 * 타이틀 뱃지: 활동 기반 획득 타이틀 계산
 * 참여/생성 매치 종목별 횟수로 타이틀 부여 (일반, ○○ 애호가, ○○ 마스터)
 */

/** 종목별 참여+생성 횟수 → 획득한 타이틀 라벨 목록 */
export function getEarnedTitles(
  countByCategory: Record<string, number>
): string[] {
  const titles: string[] = ['일반']; // 기본 타이틀

  const THRESHOLD_LOVER = 5;   // N회 이상 → "○○ 애호가"
  const THRESHOLD_MASTER = 10; // N회 이상 → "○○ 마스터" (애호가 대체)

  for (const [category, count] of Object.entries(countByCategory)) {
    if (category === '전체') continue;
    if (count >= THRESHOLD_MASTER) {
      titles.push(`${category} 마스터`);
    } else if (count >= THRESHOLD_LOVER) {
      titles.push(`${category} 애호가`);
    }
  }

  return titles;
}

/** 참여·생성 목록에서 종목별 횟수 계산 */
export function getCountByCategory(
  participations: Array<{ category: string }>,
  creations: Array<{ category: string }>
): Record<string, number> {
  const countByCategory: Record<string, number> = {};
  participations.forEach((g) => {
    countByCategory[g.category] = (countByCategory[g.category] || 0) + 1;
  });
  creations.forEach((g) => {
    countByCategory[g.category] = (countByCategory[g.category] || 0) + 1;
  });
  return countByCategory;
}
