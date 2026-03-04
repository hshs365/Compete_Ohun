// 운동 종류 목록 (현재 축구만 제공, 추후 종목 추가 예정)
// API에서 동적으로 가져올 수 있도록 확장 가능

export const SPORTS_LIST: readonly string[] = ['축구'];

/** 종목별 아이콘 (이모지 — 지도 마커·종목 칩용) */
export const SPORT_ICONS: Record<string, string> = {
  축구: '⚽',
  풋살: '⚽',
  농구: '🏀',
  테니스: '🎾',
  야구: '⚾',
  배드민턴: '🏸',
};

// 명예의 전당·홈 등에서 사용하는 카테고리 목록 (전체 포함)
export const SPORTS_CATEGORIES: readonly string[] = ['전체', ...SPORTS_LIST];

// 홈 화면 카테고리 필터용
export const MAIN_CATEGORIES: readonly string[] = ['전체', '축구', '풋살', '농구', '테니스', '배드민턴'];

/** 스탯(레이더 차트) 제공 종목. 매치 리뷰 스텟이 있는 종목만 */
export const SPORT_STATS_SPORTS: readonly string[] = ['축구', '풋살', '농구', '테니스'];

/** 종목별 포인트 컬러 (Visual Hierarchy용) */
export const SPORT_POINT_COLORS: Record<string, string> = {
  전체: '#3b82f5',
  축구: '#22c55e',
  풋살: '#10b981',
  농구: '#f97316',
  테니스: '#8b5cf6',
  배드민턴: '#14b8a6',
};

/** 종목별 칩 스타일 (셔틀콕 화이트/민트, 잔디 그린 등 상징 컬러) */
export const SPORT_CHIP_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  전체: { bg: 'bg-slate-500/20', border: 'border-slate-500/40', text: 'text-slate-200' },
  축구: { bg: 'bg-emerald-600/30', border: 'border-emerald-500/50', text: 'text-emerald-300' },
  풋살: { bg: 'bg-teal-500/25', border: 'border-teal-500/50', text: 'text-teal-300' },
  농구: { bg: 'bg-orange-500/25', border: 'border-orange-500/50', text: 'text-orange-300' },
  테니스: { bg: 'bg-violet-500/25', border: 'border-violet-500/50', text: 'text-violet-300' },
  배드민턴: { bg: 'bg-teal-300/15', border: 'border-teal-300/45', text: 'text-teal-100' },
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
          { value: 'all', label: '복식 상관없음' },
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
      {
        key: 'matchSize',
        label: '경기 방식',
        type: 'select',
        placeholder: '전체 경기 방식',
        options: [
          { value: '5', label: '5:5' },
          { value: '7', label: '7:7' },
          { value: '11', label: '11:11' },
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
      {
        key: 'matchSize',
        label: '경기 방식',
        type: 'select',
        placeholder: '전체 경기 방식',
        options: [
          { value: '5', label: '5:5' },
          { value: '7', label: '7:7' },
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
          { value: 'G', label: '가드' },
          { value: 'F', label: '포워드' },
          { value: 'C', label: '센터' },
        ],
      },
    ],
    formFields: [
      {
        key: 'positions',
        label: '모집 포지션',
        type: 'multiselect',
        options: [
          { value: 'G', label: '가드' },
          { value: 'F', label: '포워드' },
          { value: 'C', label: '센터' },
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
