// 운동 종류 목록 (현재 축구만 제공, 추후 종목 추가 예정)
// API에서 동적으로 가져올 수 있도록 확장 가능

export const SPORTS_LIST: readonly string[] = ['축구'];

// 명예의 전당·홈 등에서 사용하는 카테고리 목록 (전체 포함)
export const SPORTS_CATEGORIES: readonly string[] = ['전체', ...SPORTS_LIST];

// 홈 화면 카테고리 필터용 (현재는 SPORTS_CATEGORIES와 동일)
export const MAIN_CATEGORIES: readonly string[] = ['전체', '축구'];

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
