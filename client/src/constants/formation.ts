// 축구 포메이션: 포지션별 슬롯 수 (모임 상세/참가 시 사용)

/** 4-4-2 */
export const FOOTBALL_FORMATION_442: Record<string, number> = {
  GK: 1,
  DF: 4,
  MF: 4,
  FW: 2,
};

/** 4-3-3 */
export const FOOTBALL_FORMATION_433: Record<string, number> = {
  GK: 1,
  DF: 4,
  MF: 3,
  FW: 3,
};

/** 3-5-2 */
export const FOOTBALL_FORMATION_352: Record<string, number> = {
  GK: 1,
  DF: 3,
  MF: 5,
  FW: 2,
};

/** 4-2-3-1 */
export const FOOTBALL_FORMATION_4231: Record<string, number> = {
  GK: 1,
  DF: 4,
  MF: 5,
  FW: 1,
};

/** 3-4-3 */
export const FOOTBALL_FORMATION_343: Record<string, number> = {
  GK: 1,
  DF: 3,
  MF: 4,
  FW: 3,
};

/** 5-3-2 */
export const FOOTBALL_FORMATION_532: Record<string, number> = {
  GK: 1,
  DF: 5,
  MF: 3,
  FW: 2,
};

/** 4-5-1 */
export const FOOTBALL_FORMATION_451: Record<string, number> = {
  GK: 1,
  DF: 4,
  MF: 5,
  FW: 1,
};

/** 포지션 순서 (골라인 → 공격) */
export const FOOTBALL_POSITION_ORDER = ['GK', 'DF', 'MF', 'FW'] as const;

/** 포메이션 ID (UI 선택용) */
export type FormationId = '442' | '433' | '352' | '4231' | '343' | '532' | '451';

/** 4-4-2 슬롯 */
export const FOOTBALL_PITCH_SLOTS_442: { positionCode: string; label: string }[] = [
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

/** 4-3-3 슬롯 */
export const FOOTBALL_PITCH_SLOTS_433: { positionCode: string; label: string }[] = [
  { positionCode: 'GK', label: 'GK' },
  { positionCode: 'DF', label: 'LB' },
  { positionCode: 'DF', label: 'LCB' },
  { positionCode: 'DF', label: 'RCB' },
  { positionCode: 'DF', label: 'RB' },
  { positionCode: 'MF', label: 'LCM' },
  { positionCode: 'MF', label: 'CM' },
  { positionCode: 'MF', label: 'RCM' },
  { positionCode: 'FW', label: 'LW' },
  { positionCode: 'FW', label: 'CF' },
  { positionCode: 'FW', label: 'RW' },
];

/** 3-5-2 슬롯 */
export const FOOTBALL_PITCH_SLOTS_352: { positionCode: string; label: string }[] = [
  { positionCode: 'GK', label: 'GK' },
  { positionCode: 'DF', label: 'LCB' },
  { positionCode: 'DF', label: 'CB' },
  { positionCode: 'DF', label: 'RCB' },
  { positionCode: 'MF', label: 'LM' },
  { positionCode: 'MF', label: 'LCM' },
  { positionCode: 'MF', label: 'CM' },
  { positionCode: 'MF', label: 'RCM' },
  { positionCode: 'MF', label: 'RM' },
  { positionCode: 'FW', label: 'LW' },
  { positionCode: 'FW', label: 'RW' },
];

/** 4-2-3-1 슬롯 */
export const FOOTBALL_PITCH_SLOTS_4231: { positionCode: string; label: string }[] = [
  { positionCode: 'GK', label: 'GK' },
  { positionCode: 'DF', label: 'LB' },
  { positionCode: 'DF', label: 'LCB' },
  { positionCode: 'DF', label: 'RCB' },
  { positionCode: 'DF', label: 'RB' },
  { positionCode: 'MF', label: 'LDM' },
  { positionCode: 'MF', label: 'RDM' },
  { positionCode: 'MF', label: 'LW' },
  { positionCode: 'MF', label: 'CAM' },
  { positionCode: 'MF', label: 'RW' },
  { positionCode: 'FW', label: 'CF' },
];

/** 3-4-3 슬롯 */
export const FOOTBALL_PITCH_SLOTS_343: { positionCode: string; label: string }[] = [
  { positionCode: 'GK', label: 'GK' },
  { positionCode: 'DF', label: 'LCB' },
  { positionCode: 'DF', label: 'CB' },
  { positionCode: 'DF', label: 'RCB' },
  { positionCode: 'MF', label: 'LM' },
  { positionCode: 'MF', label: 'LCM' },
  { positionCode: 'MF', label: 'RCM' },
  { positionCode: 'MF', label: 'RM' },
  { positionCode: 'FW', label: 'LW' },
  { positionCode: 'FW', label: 'CF' },
  { positionCode: 'FW', label: 'RW' },
];

/** 5-3-2 슬롯 */
export const FOOTBALL_PITCH_SLOTS_532: { positionCode: string; label: string }[] = [
  { positionCode: 'GK', label: 'GK' },
  { positionCode: 'DF', label: 'LWB' },
  { positionCode: 'DF', label: 'LCB' },
  { positionCode: 'DF', label: 'CB' },
  { positionCode: 'DF', label: 'RCB' },
  { positionCode: 'DF', label: 'RWB' },
  { positionCode: 'MF', label: 'LCM' },
  { positionCode: 'MF', label: 'CM' },
  { positionCode: 'MF', label: 'RCM' },
  { positionCode: 'FW', label: 'LW' },
  { positionCode: 'FW', label: 'RW' },
];

/** 4-5-1 슬롯 */
export const FOOTBALL_PITCH_SLOTS_451: { positionCode: string; label: string }[] = [
  { positionCode: 'GK', label: 'GK' },
  { positionCode: 'DF', label: 'LB' },
  { positionCode: 'DF', label: 'LCB' },
  { positionCode: 'DF', label: 'RCB' },
  { positionCode: 'DF', label: 'RB' },
  { positionCode: 'MF', label: 'LM' },
  { positionCode: 'MF', label: 'LCM' },
  { positionCode: 'MF', label: 'CM' },
  { positionCode: 'MF', label: 'RCM' },
  { positionCode: 'MF', label: 'RM' },
  { positionCode: 'FW', label: 'CF' },
];

/** 레거시: 4-4-2 슬롯 (기본값) */
export const FOOTBALL_PITCH_SLOTS = FOOTBALL_PITCH_SLOTS_442;

const FORMATION_MAP: Record<FormationId, { formation: Record<string, number>; slots: { positionCode: string; label: string }[] }> = {
  '442': { formation: FOOTBALL_FORMATION_442, slots: FOOTBALL_PITCH_SLOTS_442 },
  '433': { formation: FOOTBALL_FORMATION_433, slots: FOOTBALL_PITCH_SLOTS_433 },
  '352': { formation: FOOTBALL_FORMATION_352, slots: FOOTBALL_PITCH_SLOTS_352 },
  '4231': { formation: FOOTBALL_FORMATION_4231, slots: FOOTBALL_PITCH_SLOTS_4231 },
  '343': { formation: FOOTBALL_FORMATION_343, slots: FOOTBALL_PITCH_SLOTS_343 },
  '532': { formation: FOOTBALL_FORMATION_532, slots: FOOTBALL_PITCH_SLOTS_532 },
  '451': { formation: FOOTBALL_FORMATION_451, slots: FOOTBALL_PITCH_SLOTS_451 },
};

export function getFormation(formationId: FormationId) {
  return FORMATION_MAP[formationId] ?? FORMATION_MAP['442'];
}

export const FORMATION_LABELS: Record<FormationId, string> = {
  '442': '4-4-2',
  '433': '4-3-3',
  '352': '3-5-2',
  '4231': '4-2-3-1',
  '343': '3-4-3',
  '532': '5-3-2',
  '451': '4-5-1',
};
