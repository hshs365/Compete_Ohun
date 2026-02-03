// 축구 4-4-2 포메이션: 포지션별 슬롯 수 (모임 상세/참가 시 사용)
export const FOOTBALL_FORMATION_442: Record<string, number> = {
  GK: 1,
  DF: 4,
  MF: 4,
  FW: 2,
};

/** 포지션 순서 (골라인 → 공격) */
export const FOOTBALL_POSITION_ORDER = ['GK', 'DF', 'MF', 'FW'] as const;

/** 11명 배치용 슬롯: API용 코드(GK/DF/MF/FW) + 영어 약어 (스쿼드 UI용) */
export const FOOTBALL_PITCH_SLOTS: { positionCode: string; label: string }[] = [
  { positionCode: 'GK', label: 'GK' },
  { positionCode: 'DF', label: 'LB' },
  { positionCode: 'DF', label: 'LCB' },
  { positionCode: 'DF', label: 'RCB' },
  { positionCode: 'DF', label: 'RB' },
  { positionCode: 'MF', label: 'LM' },
  { positionCode: 'MF', label: 'LCM' },
  { positionCode: 'MF', label: 'RCM' },
  { positionCode: 'MF', label: 'RM' },
  { positionCode: 'FW', label: 'LW' },
  { positionCode: 'FW', label: 'RW' },
];
