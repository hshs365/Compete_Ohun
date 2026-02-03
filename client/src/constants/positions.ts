// 스포츠별 포지션 목록 (현재 축구만 제공, 추후 종목 추가 예정)

export const FOOTBALL_POSITIONS = [
  'GK',
  'SW',
  'CB',
  'LB',
  'RB',
  'LWB',
  'RWB',
  'CDM',
  'CM',
  'CAM',
  'LM',
  'RM',
  'LW',
  'RW',
  'CF',
  'ST',
] as const;

export const FOOTBALL_POSITION_LABELS: Record<string, string> = {
  GK: '골키퍼',
  SW: '스위퍼',
  CB: '센터백',
  LB: '왼쪽 풀백',
  RB: '오른쪽 풀백',
  LWB: '왼쪽 윙백',
  RWB: '오른쪽 윙백',
  CDM: '수비형 미드필더',
  CM: '중앙 미드필더',
  CAM: '공격형 미드필더',
  LM: '왼쪽 미드필더',
  RM: '오른쪽 미드필더',
  LW: '왼쪽 윙',
  RW: '오른쪽 윙',
  CF: '센터포워드',
  ST: '스트라이커',
};

/** 포지션이 정의된 종목 (현재 축구만) */
export const SPORTS_WITH_POSITIONS: readonly string[] = ['축구'];

/** 종목별 포지션 목록 반환 */
export function getPositionsBySport(sport: string): readonly string[] {
  if (sport === '축구') return FOOTBALL_POSITIONS;
  return [];
}

/** 종목별 포지션 라벨 반환 */
export function getPositionLabel(sport: string, position: string): string {
  if (sport === '축구') return FOOTBALL_POSITION_LABELS[position] ?? position;
  return position;
}
