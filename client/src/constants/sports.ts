// 운동 종류 목록 (홈·모임 생성 등에서 사용)
// API에서 동적으로 가져올 수 있도록 확장 가능

export const SPORTS_LIST: readonly string[] = ['축구', '풋살', '농구', '야구', '테니스', '배드민턴', '핸드볼', '배구', '탁구', '골프', '볼링'];

/** 종목별 아이콘 (이모지 — 지도 마커·종목 칩용) */
export const SPORT_ICONS: Record<string, string> = {
  축구: '⚽',
  풋살: '⚽',
  농구: '🏀',
  테니스: '🎾',
  야구: '⚾',
  배드민턴: '🏸',
  핸드볼: '🤾',
  배구: '🏐',
  탁구: '🏓',
  골프: '⛳',
  볼링: '🎳',
};

// 명예의 전당·홈 등에서 사용하는 카테고리 목록 (전체 포함)
export const SPORTS_CATEGORIES: readonly string[] = ['전체', ...SPORTS_LIST];

// 홈 화면 카테고리 필터용
export const MAIN_CATEGORIES: readonly string[] = ['전체', '축구', '풋살', '농구', '야구', '테니스', '배드민턴', '핸드볼', '배구', '탁구', '골프', '볼링'];

/** 스탯(레이더 차트) 제공 종목. 매치 리뷰 스텟이 있는 종목만 */
export const SPORT_STATS_SPORTS: readonly string[] = ['축구', '풋살', '농구', '테니스'];

/** 종목별 포인트 컬러 (Visual Hierarchy용) */
export const SPORT_POINT_COLORS: Record<string, string> = {
  전체: '#3b82f5',
  축구: '#22c55e',
  풋살: '#10b981',
  농구: '#f97316',
  테니스: '#8b5cf6',
  야구: '#f59e0b',
  배드민턴: '#14b8a6',
  핸드볼: '#e11d48',
  배구: '#0ea5e9',
  탁구: '#facc15',
  골프: '#22c55e',
  볼링: '#6366f1',
};

/** 종목별 칩 스타일 (화이트: 검정 텍스트 필수, 다크: 밝은 글자) */
export const SPORT_CHIP_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  전체: { bg: 'bg-slate-100 dark:bg-slate-500/25', border: 'border-slate-300 dark:border-slate-500/50', text: '!text-gray-900 dark:!text-slate-200' },
  축구: { bg: 'bg-emerald-100 dark:bg-emerald-600/30', border: 'border-emerald-400 dark:border-emerald-500/50', text: '!text-gray-900 dark:!text-emerald-300' },
  풋살: { bg: 'bg-teal-100 dark:bg-teal-500/30', border: 'border-teal-400 dark:border-teal-500/50', text: '!text-gray-900 dark:!text-teal-300' },
  농구: { bg: 'bg-orange-100 dark:bg-orange-500/30', border: 'border-orange-400 dark:border-orange-500/50', text: '!text-gray-900 dark:!text-orange-300' },
  테니스: { bg: 'bg-violet-100 dark:bg-violet-500/30', border: 'border-violet-400 dark:border-violet-500/50', text: '!text-gray-900 dark:!text-violet-300' },
  야구: { bg: 'bg-amber-100 dark:bg-amber-500/30', border: 'border-amber-400 dark:border-amber-500/50', text: '!text-gray-900 dark:!text-amber-300' },
  배드민턴: { bg: 'bg-teal-100 dark:bg-teal-500/30', border: 'border-teal-400 dark:border-teal-500/50', text: '!text-gray-900 dark:!text-teal-300' },
  핸드볼: { bg: 'bg-rose-100 dark:bg-rose-600/30', border: 'border-rose-400 dark:border-rose-500/50', text: '!text-gray-900 dark:!text-rose-300' },
  배구: { bg: 'bg-sky-100 dark:bg-sky-600/30', border: 'border-sky-400 dark:border-sky-500/50', text: '!text-gray-900 dark:!text-sky-300' },
  탁구: { bg: 'bg-amber-100 dark:bg-amber-500/30', border: 'border-amber-400 dark:border-amber-500/50', text: '!text-gray-900 dark:!text-amber-300' },
  골프: { bg: 'bg-emerald-100 dark:bg-emerald-500/30', border: 'border-emerald-400 dark:border-emerald-500/50', text: '!text-gray-900 dark:!text-emerald-300' },
  볼링: { bg: 'bg-indigo-100 dark:bg-indigo-500/30', border: 'border-indigo-400 dark:border-indigo-500/50', text: '!text-gray-900 dark:!text-indigo-300' },
};

/** 필터/폼 필드 타입 */
export type SportFilterFieldType = 'select' | 'multiselect' | 'text' | 'none';

export interface SportFilterFieldDef {
  key: string;
  label: string;
  type: SportFilterFieldType;
  options?: { value: string; label: string }[];
  placeholder?: string;
}

/** 종목별 검색 필터·작성 폼 스키마 */
export interface SportConfigSchema {
  filterFields: SportFilterFieldDef[];
  formFields: SportFilterFieldDef[];
}

/** SPORT_CONFIG: 종목별 동적 UI 스키마 */
export const SPORT_CONFIG: Record<string, SportConfigSchema> = {
  전체: {
    filterFields: [],
    formFields: [],
  },
  배드민턴: {
    filterFields: [
      {
        key: 'levelCategory',
        label: '급수',
        type: 'select',
        placeholder: '전체 급수',
        options: [
          { value: 'A', label: 'A조' },
          { value: 'B', label: 'B조' },
          { value: 'C', label: 'C조' },
          { value: 'D', label: 'D조' },
          { value: 'E', label: 'E조' },
        ],
      },
      {
        key: 'matchType',
        label: '경기 방식',
        type: 'select',
        placeholder: '전체 경기 방식',
        options: [
          { value: 'men', label: '남자복식' },
          { value: 'women', label: '여자복식' },
          { value: 'mixed', label: '혼합복식' },
          { value: 'all', label: '상관없음' },
        ],
      },
    ],
    formFields: [
      {
        key: 'levelCategory',
        label: '모집 급수',
        type: 'select',
        options: [
          { value: 'A', label: 'A조' },
          { value: 'B', label: 'B조' },
          { value: 'C', label: 'C조' },
          { value: 'D', label: 'D조' },
          { value: 'E', label: 'E조' },
        ],
      },
    ],
  },
  축구: {
    filterFields: [
      {
        key: 'positions',
        label: '포지션',
        type: 'multiselect',
        options: [
          { value: 'GK', label: 'GK' },
          { value: 'DF', label: 'DF' },
          { value: 'MF', label: 'MF' },
          { value: 'FW', label: 'FW' },
        ],
      },
    ],
    formFields: [
      {
        key: 'positions',
        label: '모집 포지션',
        type: 'multiselect',
        options: [
          { value: 'GK', label: 'GK' },
          { value: 'DF', label: 'DF' },
          { value: 'MF', label: 'MF' },
          { value: 'FW', label: 'FW' },
        ],
      },
    ],
  },
  풋살: {
    filterFields: [
      {
        key: 'positions',
        label: '포지션',
        type: 'multiselect',
        options: [
          { value: 'GK', label: 'GK' },
          { value: 'DF', label: 'DF' },
          { value: 'MF', label: 'MF' },
          { value: 'FW', label: 'FW' },
        ],
      },
    ],
    formFields: [
      {
        key: 'positions',
        label: '모집 포지션',
        type: 'multiselect',
        options: [
          { value: 'GK', label: 'GK' },
          { value: 'DF', label: 'DF' },
          { value: 'MF', label: 'MF' },
          { value: 'FW', label: 'FW' },
        ],
      },
    ],
  },
  농구: {
    filterFields: [
      {
        key: 'positions',
        label: '포지션',
        type: 'multiselect',
        options: [
          { value: 'PG', label: '포인트가드' },
          { value: 'SG', label: '슈팅가드' },
          { value: 'SF', label: '스몰포워드' },
          { value: 'PF', label: '파워포워드' },
          { value: 'C', label: '센터' },
        ],
      },
      {
        key: 'matchType',
        label: '경기 방식',
        type: 'select',
        placeholder: '전체 경기 방식',
        options: [
          { value: '3v3_half', label: '3:3 하프코트' },
          { value: '3v3_full', label: '3:3 풀코트' },
          { value: '5v5_full', label: '5:5 풀코트' },
          { value: 'street', label: '스트리트(길거리)' },
          { value: 'league', label: '리그/대회' },
        ],
      },
    ],
    formFields: [
      {
        key: 'positions',
        label: '모집 포지션',
        type: 'multiselect',
        options: [
          { value: 'PG', label: '포인트가드' },
          { value: 'SG', label: '슈팅가드' },
          { value: 'SF', label: '스몰포워드' },
          { value: 'PF', label: '파워포워드' },
          { value: 'C', label: '센터' },
        ],
      },
      {
        key: 'matchType',
        label: '경기 방식',
        type: 'select',
        options: [
          { value: '3v3_half', label: '3:3 하프코트' },
          { value: '3v3_full', label: '3:3 풀코트' },
          { value: '5v5_full', label: '5:5 풀코트' },
          { value: 'street', label: '스트리트(길거리)' },
          { value: 'league', label: '리그/대회' },
        ],
      },
    ],
  },
  테니스: {
    filterFields: [
      {
        key: 'skillLevel',
        label: '실력',
        type: 'select',
        options: [
          { value: 'beginner', label: '초급' },
          { value: 'intermediate', label: '중급' },
          { value: 'advanced', label: '고급' },
        ],
      },
      {
        key: 'matchType',
        label: '경기 방식',
        type: 'select',
        placeholder: '전체 경기 방식',
        options: [
          { value: 'singles', label: '단식' },
          { value: 'men', label: '남자복식' },
          { value: 'women', label: '여자복식' },
          { value: 'mixed', label: '혼합복식' },
          { value: 'all', label: '상관없음' },
        ],
      },
    ],
    formFields: [
      {
        key: 'skillLevel',
        label: '모집 실력',
        type: 'select',
        options: [
          { value: 'beginner', label: '초급' },
          { value: 'intermediate', label: '중급' },
          { value: 'advanced', label: '고급' },
        ],
      },
    ],
  },
  야구: {
    filterFields: [
      {
        key: 'positions',
        label: '포지션',
        type: 'multiselect',
        options: [
          { value: 'P', label: '투수' },
          { value: 'C', label: '포수' },
          { value: '1B', label: '1루수' },
          { value: '2B', label: '2루수' },
          { value: '3B', label: '3루수' },
          { value: 'SS', label: '유격수' },
          { value: 'LF', label: '좌익수' },
          { value: 'CF', label: '중견수' },
          { value: 'RF', label: '우익수' },
        ],
      },
      {
        key: 'matchType',
        label: '경기 방식',
        type: 'select',
        placeholder: '전체 경기 방식',
        options: [
          { value: 'full', label: '9회 정식' },
          { value: '7inning', label: '7회' },
          { value: 'softball', label: '소프트볼' },
          { value: 'practice', label: '연습/친선' },
        ],
      },
    ],
    formFields: [
      {
        key: 'positions',
        label: '모집 포지션',
        type: 'multiselect',
        options: [
          { value: 'P', label: '투수' },
          { value: 'C', label: '포수' },
          { value: '1B', label: '1루수' },
          { value: '2B', label: '2루수' },
          { value: '3B', label: '3루수' },
          { value: 'SS', label: '유격수' },
          { value: 'LF', label: '좌익수' },
          { value: 'CF', label: '중견수' },
          { value: 'RF', label: '우익수' },
        ],
      },
      {
        key: 'matchType',
        label: '경기 방식',
        type: 'select',
        options: [
          { value: 'full', label: '9회 정식' },
          { value: '7inning', label: '7회' },
          { value: 'softball', label: '소프트볼' },
          { value: 'practice', label: '연습/친선' },
        ],
      },
    ],
  },
  핸드볼: {
    filterFields: [
      {
        key: 'positions',
        label: '포지션',
        type: 'multiselect',
        options: [
          { value: 'GK', label: '골키퍼' },
          { value: 'LW', label: '레프트윙' },
          { value: 'RW', label: '라이트윙' },
          { value: 'PV', label: '피벗' },
          { value: 'CB', label: '센터백' },
        ],
      },
      {
        key: 'matchType',
        label: '경기 방식',
        type: 'select',
        placeholder: '전체 경기 방식',
        options: [
          { value: '7v7', label: '7:7 정식' },
          { value: 'practice', label: '연습/친선' },
        ],
      },
    ],
    formFields: [
      { key: 'positions', label: '모집 포지션', type: 'multiselect', options: [
        { value: 'GK', label: '골키퍼' },
        { value: 'LW', label: '레프트윙' },
        { value: 'RW', label: '라이트윙' },
        { value: 'PV', label: '피벗' },
        { value: 'CB', label: '센터백' },
      ]},
    ],
  },
  배구: {
    filterFields: [
      {
        key: 'positions',
        label: '포지션',
        type: 'multiselect',
        options: [
          { value: 'S', label: '세터' },
          { value: 'OH', label: '아웃사이드 히터' },
          { value: 'MB', label: '미들 블로커' },
          { value: 'OP', label: '오포지트' },
          { value: 'L', label: '리베로' },
        ],
      },
      {
        key: 'matchType',
        label: '경기 방식',
        type: 'select',
        placeholder: '전체 경기 방식',
        options: [
          { value: '6v6', label: '6:6 정식' },
          { value: '4v4', label: '4:4' },
          { value: 'practice', label: '연습/친선' },
        ],
      },
    ],
    formFields: [
      { key: 'positions', label: '모집 포지션', type: 'multiselect', options: [
        { value: 'S', label: '세터' },
        { value: 'OH', label: '아웃사이드 히터' },
        { value: 'MB', label: '미들 블로커' },
        { value: 'OP', label: '오포지트' },
        { value: 'L', label: '리베로' },
      ]},
    ],
  },
  탁구: {
    filterFields: [
      {
        key: 'matchType',
        label: '경기 방식',
        type: 'select',
        placeholder: '전체 경기 방식',
        options: [
          { value: 'singles', label: '단식' },
          { value: 'doubles', label: '복식' },
          { value: 'mixed', label: '혼합복식' },
          { value: 'all', label: '상관없음' },
        ],
      },
      {
        key: 'skillLevel',
        label: '실력',
        type: 'select',
        options: [
          { value: 'beginner', label: '초급' },
          { value: 'intermediate', label: '중급' },
          { value: 'advanced', label: '고급' },
        ],
      },
    ],
    formFields: [
      { key: 'skillLevel', label: '모집 실력', type: 'select', options: [
        { value: 'beginner', label: '초급' },
        { value: 'intermediate', label: '중급' },
        { value: 'advanced', label: '고급' },
      ]},
    ],
  },
  골프: {
    filterFields: [
      {
        key: 'matchType',
        label: '경기 방식',
        type: 'select',
        placeholder: '전체 경기 방식',
        options: [
          { value: 'stroke', label: '스트로크' },
          { value: 'match', label: '매치플레이' },
          { value: 'fourball', label: '포볼' },
          { value: 'practice', label: '연습라운드' },
        ],
      },
      {
        key: 'skillLevel',
        label: '실력',
        type: 'select',
        options: [
          { value: 'beginner', label: '초급' },
          { value: 'intermediate', label: '중급' },
          { value: 'advanced', label: '고급' },
        ],
      },
    ],
    formFields: [
      { key: 'skillLevel', label: '모집 실력', type: 'select', options: [
        { value: 'beginner', label: '초급' },
        { value: 'intermediate', label: '중급' },
        { value: 'advanced', label: '고급' },
      ]},
    ],
  },
  볼링: {
    filterFields: [
      {
        key: 'skillLevel',
        label: '실력',
        type: 'select',
        options: [
          { value: 'beginner', label: '초급' },
          { value: 'intermediate', label: '중급' },
          { value: 'advanced', label: '고급' },
        ],
      },
    ],
    formFields: [
      { key: 'skillLevel', label: '모집 실력', type: 'select', options: [
        { value: 'beginner', label: '초급' },
        { value: 'intermediate', label: '중급' },
        { value: 'advanced', label: '고급' },
      ]},
    ],
  },
};

/** 최소 매치 수: 이 미만이면 "데이터 수집 중" 표시 */
export const MIN_MATCHES_FOR_STATS = 3;

// 팀 게임으로 진행하는 운동 종목
export const TEAM_SPORTS: readonly string[] = ['축구'];

// 팀 페이지 종목 선택용 (웅장한 스케일)
export const TEAM_PAGE_SPORTS: readonly string[] = ['축구', '풋살', '농구', '야구'];

// 개인 운동 (1:1 또는 개인 단위) — 추후 종목 추가 시 확장
export const INDIVIDUAL_SPORTS: readonly string[] = [];

// 운동이 팀 게임인지 확인
export function isTeamSport(sport: string): boolean {
  return TEAM_SPORTS.includes(sport);
}

// 운동이 개인 운동인지 확인
export function isIndividualSport(sport: string): boolean {
  return INDIVIDUAL_SPORTS.includes(sport);
}

// 운동별 팀당 인원수 (팀 게임인 경우)
export const SPORT_TEAM_SIZE: Record<string, number> = {
  축구: 11,
};

// 운동별 최소 참가자 수 (매치 성사를 위한 최소 인원)
export const SPORT_MIN_PARTICIPANTS: Record<string, number> = {
  축구: 22, // 11vs11
};

// 운동별 최소 참가자 수 반환
export function getMinParticipantsForSport(sport: string): number | null {
  return SPORT_MIN_PARTICIPANTS[sport] ?? null;
}
