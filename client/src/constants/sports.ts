// 운동 종류 목록 (확장 가능한 구조)
// 추후 API에서 동적으로 가져올 수 있도록 설계

export const SPORTS_LIST: readonly string[] = [
  // 구기 종목
  '배드민턴',
  '축구',
  '풋살',
  '농구',
  '테니스',
  '야구',
  '배구',
  '탁구',
  '볼링',
  '당구',

  // 개인 운동
  '골프',

  // 익스트림/신세대 스포츠
  '서바이벌',
  'CQB',

  // 기타
  '기타',
];

// 명예의 전당 등에서 사용하는 카테고리 목록 (전체 포함)
export const SPORTS_CATEGORIES: readonly string[] = ['전체', ...SPORTS_LIST];

// 홈 화면 카테고리 필터용 (주요 종목만)
export const MAIN_CATEGORIES: readonly string[] = [
  '전체',
  '배드민턴',
  '축구',
  '풋살',
  '농구',
  '테니스',
  '야구',
  '배구',
  '탁구',
  '골프',
];

// 팀 게임으로 진행하는 운동 종목
export const TEAM_SPORTS: readonly string[] = [
  '축구',
  '풋살',
  '농구',
  '야구',
  '배구',
  '볼링', // 팀전 가능
];

// 개인 운동 (1:1 또는 개인 단위)
export const INDIVIDUAL_SPORTS: readonly string[] = [
  '배드민턴',
  '테니스',
  '탁구',
  '당구',
  '골프',
  '서바이벌',
  'CQB',
  '기타',
];

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
  '축구': 11,      // 각 팀당 11명
  '풋살': 5,       // 각 팀당 5명
  '농구': 5,       // 각 팀당 5명 (풀코트 기준, 하지만 일반적으로는 3대3, 4대4 반코트가 많음)
  '야구': 9,       // 각 팀당 9명
  '배구': 6,       // 각 팀당 6명
  '볼링': 4,       // 각 팀당 4명 (팀전 기준)
};

// 운동별 최소 참가자 수 (매치 성사를 위한 최소 인원)
// 팀 게임: 팀당 인원수 * 2 (예: 축구 11vs11 = 22명)
// 개인 운동: 해당 운동의 일반적인 최소 인원 (예: 배드민턴 1vs1 = 2명, 복식 = 4명)
export const SPORT_MIN_PARTICIPANTS: Record<string, number> = {
  // 팀 게임
  '축구': 22,      // 11vs11
  '풋살': 10,      // 5vs5
  '농구': 6,       // 3vs3 반코트 (일반적으로 가장 흔함), 4vs4 = 8명, 5vs5 = 10명도 가능
  '야구': 18,      // 9vs9
  '배구': 12,      // 6vs6
  '볼링': 8,       // 4vs4 팀전
  
  // 개인 운동 (1vs1 또는 복식)
  '배드민턴': 2,   // 1vs1 (단식), 복식은 4명
  '테니스': 2,     // 1vs1 (단식), 복식은 4명
  '탁구': 2,       // 1vs1, 복식은 4명
  '당구': 2,       // 1vs1
  
  // 그룹 활동
  '등산': 2,       // 최소 2명 (안전을 위해)
  '러닝': 2,       // 최소 2명
  '수영': 2,       // 최소 2명
  '골프': 2,       // 최소 2명 (4명 그룹도 가능)
  '클라이밍': 2,   // 최소 2명 (안전을 위해)
  '서바이벌': 4,   // 팀 활동
  'CQB': 4,        // 팀 활동
  
  // 기타는 제한 없음 (null)
};

// 운동별 최소 참가자 수 반환
export function getMinParticipantsForSport(sport: string): number | null {
  return SPORT_MIN_PARTICIPANTS[sport] || null;
}
