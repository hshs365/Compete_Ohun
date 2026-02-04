/**
 * 매치 종료 후 참가자 간 리뷰 항목 (종목별).
 * 레이더차트(FootballStatsRadar) 축과 매핑: 테크닉, 스피드, 피지컬, 멘탈, 수비, 공격
 */
export const MATCH_REVIEW_CATEGORIES: Record<string, { key: string; label: string }[]> = {
  축구: [
    { key: '테크닉', label: '가장 기술이 좋은 선수는 누구였나요?' },
    { key: '스피드', label: '가장 빠른 선수는 누구였나요?' },
    { key: '피지컬', label: '가장 피지컬이 좋은 선수는 누구였나요?' },
    { key: '멘탈', label: '가장 멘탈이 좋은 선수는 누구였나요?' },
    { key: '수비', label: '가장 수비가 좋은 선수는 누구였나요?' },
    { key: '공격', label: '가장 공격이 좋은 선수는 누구였나요?' },
  ],
};

/** 축구 레이더차트 스텟 키 순서 (FootballStatsRadar와 동일) */
export const FOOTBALL_STAT_KEYS = [
  '멘탈',
  '수비',
  '공격',
  '피지컬',
  '스피드',
  '테크닉',
] as const;

/** 선수 리뷰 작성 완료 시 지급 포인트 */
export const REVIEW_COMPLETE_POINTS = 500;

/** 시설 리뷰 작성 완료 시 지급 포인트 */
export const FACILITY_REVIEW_POINTS = 500;
