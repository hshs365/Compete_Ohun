/** 업적 정의 (프론트 ACHIEVEMENTS와 동기화, 포인트 10배 적용) */
export interface AchievementDef {
  id: string;
  points: number;
  /** 달성 조건: joined = 참가 완료 건수, created = 생성 완료 건수 */
  check: (stats: { joined: number; created: number }) => boolean;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first-match', points: 1000, check: (s) => s.joined >= 1 },
  { id: 'first-creation', points: 500, check: (s) => s.created >= 1 },
  { id: 'active-participant', points: 1000, check: (s) => s.joined >= 5 || s.created >= 3 },
  { id: 'match-master', points: 2000, check: (s) => s.joined >= 10 },
];
