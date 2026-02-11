/**
 * 전술판 좌표(0-100, 0-100) → 포지션 코드(GK/DF/MF/FW) 및 슬롯 라벨 추천
 * y: 0 = 우리 골대, 100 = 상대 골대
 * x: 0 = 왼쪽, 100 = 오른쪽
 * 골키퍼 구역(25%)은 카드가 들어가기 좋도록 넉넉히 둠.
 */
const GK_Y_MAX = 25;   // y < 25 → GK (필드 하단 25%)
const DF_Y_MAX = 40;   // y < 40 → DF
const MF_Y_MAX = 62;   // y < 62 → MF
// else FW

export function coordsToPositionCode(x: number, y: number): 'GK' | 'DF' | 'MF' | 'FW' {
  if (y < GK_Y_MAX) return 'GK';
  if (y < DF_Y_MAX) return 'DF';
  if (y < MF_Y_MAX) return 'MF';
  return 'FW';
}

/** 포지션 코드 + x 좌표로 슬롯 라벨 추천 (예: CM, LW, RB) */
export function suggestSlotLabel(x: number, positionCode: string): string {
  const left = x < 25;
  const right = x > 75;
  const center = !left && !right;
  const leftCenter = x >= 25 && x < 45;
  const rightCenter = x >= 55 && x < 75;

  switch (positionCode) {
    case 'GK':
      return 'GK';
    case 'DF':
      if (left) return 'LB';
      if (leftCenter) return 'LCB';
      if (rightCenter) return 'RCB';
      if (right) return 'RB';
      return 'CB';
    case 'MF':
      if (left) return 'LM';
      if (leftCenter) return 'LCM';
      if (rightCenter) return 'RCM';
      if (right) return 'RM';
      return 'CM';
    case 'FW':
      if (left) return 'LW';
      if (right) return 'RW';
      return 'CF';
    default:
      return positionCode;
  }
}

export function coordsToPositionAndLabel(x: number, y: number): { positionCode: 'GK' | 'DF' | 'MF' | 'FW'; slotLabel: string } {
  const positionCode = coordsToPositionCode(x, y);
  const slotLabel = suggestSlotLabel(x, positionCode);
  return { positionCode, slotLabel };
}

/** positionCode + slotLabel으로 기본 좌표 추정 — 항상 세로형(vertical) 반환. y=전진도, x=좌우폭 */
export function positionToDefaultCoords(positionCode: string, slotLabel: string): { x: number; y: number } {
  const y =
    positionCode === 'GK' ? 12 :
    positionCode === 'DF' ? 32 :
    positionCode === 'MF' ? 50 : 78;
  const x =
    slotLabel === 'LB' || slotLabel === 'LM' || slotLabel === 'LW' ? 15 :
    slotLabel === 'LCB' || slotLabel === 'LCM' ? 32 :
    slotLabel === 'CB' || slotLabel === 'CM' || slotLabel === 'CF' || slotLabel === 'GK' ? 50 :
    slotLabel === 'RCB' || slotLabel === 'RCM' ? 68 :
    slotLabel === 'RB' || slotLabel === 'RM' || slotLabel === 'RW' ? 85 : 50;
  return { x, y };
}

/** 팀별 기본 좌표 — 세로형 그대로 반환 (가로 구장 변환은 컴포넌트에서) */
export function positionToDefaultCoordsForTeam(
  _team: 'red' | 'blue',
  positionCode: string,
  slotLabel: string
): { x: number; y: number } {
  return positionToDefaultCoords(positionCode, slotLabel);
}

/** 세로형(DB) → 가로형(화면). vx=좌우폭, vy=전진도(0=우리골). 레드=왼쪽진영, 블루=오른쪽진영 */
export function verticalToHorizontal(
  team: 'red' | 'blue',
  vx: number,
  vy: number
): { hx: number; hy: number } {
  const hy = Math.max(0, Math.min(100, vx)); // 세로 x(좌우) → 가로 y(위아래)
  if (team === 'red') {
    const hx = 5 + (vy / 100) * 40; // 세로 y 0→5%, 100→45%
    return { hx: Math.max(5, Math.min(45, hx)), hy };
  }
  const hx = 95 - (vy / 100) * 40; // 세로 y 0→95%, 100→55%
  return { hx: Math.max(55, Math.min(95, hx)), hy };
}

/** 가로형(화면 드롭) → 세로형(DB 저장). hx=left%, hy=top% */
export function horizontalToVertical(
  team: 'red' | 'blue',
  hx: number,
  hy: number
): { vx: number; vy: number } {
  const vx = Math.max(0, Math.min(100, hy)); // 가로 y → 세로 x
  if (team === 'red') {
    const vy = ((hx - 5) / 40) * 100;
    return { vx, vy: Math.max(0, Math.min(100, vy)) };
  }
  const vy = ((95 - hx) / 40) * 100;
  return { vx, vy: Math.max(0, Math.min(100, vy)) };
}
