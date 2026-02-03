// 운동별 준비물 목록 (현재 축구만 제공, 추후 종목별 확장)

export interface EquipmentList {
  [sport: string]: string[];
}

export const EQUIPMENT_BY_SPORT: EquipmentList = {
  축구: [
    '축구화',
    '축구공',
    '운동복',
    '수건',
    '물',
  ],
  기타: [
    '운동복',
    '운동화',
    '물',
  ],
};

export function getEquipmentBySport(sport: string): string[] {
  return EQUIPMENT_BY_SPORT[sport] ?? EQUIPMENT_BY_SPORT['기타'];
}
