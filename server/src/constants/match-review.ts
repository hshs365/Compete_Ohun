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
    { key: '매너', label: '매너가 좋았던 선수는 누구였나요?' },
    { key: '신고', label: '불량한 태도나 좋지 않은 성격의 유저를 신고해 주세요.' },
  ],
  풋살: [
    { key: '테크닉', label: '가장 기술이 좋은 선수는 누구였나요?' },
    { key: '스피드', label: '가장 빠른 선수는 누구였나요?' },
    { key: '피지컬', label: '가장 피지컬이 좋은 선수는 누구였나요?' },
    { key: '멘탈', label: '가장 멘탈이 좋은 선수는 누구였나요?' },
    { key: '수비', label: '가장 수비가 좋은 선수는 누구였나요?' },
    { key: '공격', label: '가장 공격이 좋은 선수는 누구였나요?' },
    { key: '매너', label: '매너가 좋았던 선수는 누구였나요?' },
    { key: '신고', label: '불량한 태도나 좋지 않은 성격의 유저를 신고해 주세요.' },
  ],
  농구: [
    { key: '슈팅', label: '가장 슈팅이 좋은 선수는 누구였나요?' },
    { key: '수비', label: '가장 수비가 좋은 선수는 누구였나요?' },
    { key: '패스', label: '가장 패스가 좋은 선수는 누구였나요?' },
    { key: '리바운드', label: '가장 리바운드가 좋은 선수는 누구였나요?' },
    { key: '스피드', label: '가장 빠른 선수는 누구였나요?' },
    { key: '멘탈', label: '가장 멘탈이 좋은 선수는 누구였나요?' },
    { key: '매너', label: '매너가 좋았던 선수는 누구였나요?' },
    { key: '신고', label: '불량한 태도나 좋지 않은 성격의 유저를 신고해 주세요.' },
  ],
  테니스: [
    { key: '서브', label: '가장 서브가 좋은 선수는 누구였나요?' },
    { key: '포핸드', label: '가장 포핸드가 좋은 선수는 누구였나요?' },
    { key: '백핸드', label: '가장 백핸드가 좋은 선수는 누구였나요?' },
    { key: '발리', label: '가장 발리가 좋은 선수는 누구였나요?' },
    { key: '스피드', label: '가장 빠른 선수는 누구였나요?' },
    { key: '멘탈', label: '가장 멘탈이 좋은 선수는 누구였나요?' },
    { key: '매너', label: '매너가 좋았던 선수는 누구였나요?' },
    { key: '신고', label: '불량한 태도나 좋지 않은 성격의 유저를 신고해 주세요.' },
  ],
};

/** 선수 리뷰에서 선택 항목(해당 없음 가능) */
export const OPTIONAL_REVIEW_CATEGORY_KEYS = ['신고'];

/** 축구 레이더차트 스텟 키 순서 (FootballStatsRadar와 동일) */
export const FOOTBALL_STAT_KEYS = [
  '멘탈',
  '수비',
  '공격',
  '피지컬',
  '스피드',
  '테크닉',
] as const;

/** 종목별 레이더차트 스텟 키 (매너·신고 제외). 종목 추가 시 여기만 확장 */
export const SPORT_RADAR_STAT_KEYS: Record<string, readonly string[]> = {
  축구: FOOTBALL_STAT_KEYS,
  풋살: FOOTBALL_STAT_KEYS,
  농구: ['멘탈', '스피드', '리바운드', '패스', '수비', '슈팅'] as const,
  테니스: ['멘탈', '스피드', '발리', '백핸드', '포핸드', '서브'] as const,
};

/** 최소 매치 수: 이 미만이면 "데이터 수집 중" 표시 */
export const MIN_MATCHES_FOR_STATS = 3;

/** 최근 N경기 평균 계산에 사용 */
export const RECENT_MATCHES_LIMIT = 20;

/** 선수 리뷰 작성 완료 시 지급 포인트 */
export const REVIEW_COMPLETE_POINTS = 500;

/** 시설 리뷰 작성 완료 시 지급 포인트 */
export const FACILITY_REVIEW_POINTS = 500;
