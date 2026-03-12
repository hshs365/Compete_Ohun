/** 종목별 장비 (플레이어 참가 시 필요 품목) — 프로필 편집·플레이어 구하기 양쪽에서 사용 */
export const EQUIPMENT_OPTIONS: Record<string, { value: string; label: string }[]> = {
  축구: [
    { value: '축구화', label: '축구화' },
    { value: '아대', label: '아대' },
    { value: '골키퍼장갑', label: '골키퍼장갑' },
    { value: '트레이닝복', label: '트레이닝복' },
  ],
  풋살: [
    { value: '풋살화', label: '풋살화' },
    { value: '아대', label: '아대' },
    { value: '골키퍼장갑', label: '골키퍼장갑' },
    { value: '트레이닝복', label: '트레이닝복' },
  ],
  농구: [
    { value: '농구화', label: '농구화' },
    { value: '농구복', label: '농구복' },
  ],
  테니스: [
    { value: '테니스라켓', label: '테니스 라켓' },
    { value: '테니스화', label: '테니스화' },
    { value: '테니스공', label: '테니스공' },
  ],
  배드민턴: [
    { value: '배드민턴라켓', label: '배드민턴 라켓' },
    { value: '배드민턴화', label: '배드민턴화' },
    { value: '셔틀콕', label: '셔틀콕' },
  ],
  핸드볼: [
    { value: '핸드볼화', label: '핸드볼화' },
    { value: '핸드볼공', label: '핸드볼공' },
    { value: '골키퍼장갑', label: '골키퍼장갑' },
  ],
  배구: [
    { value: '배구화', label: '배구화' },
    { value: '배구복', label: '배구복' },
    { value: '리베로용저지', label: '리베로용 저지' },
  ],
  탁구: [
    { value: '탁구라켓', label: '탁구 라켓' },
    { value: '탁구화', label: '탁구화' },
    { value: '탁구공', label: '탁구공' },
  ],
  야구: [
    { value: '야구글러브', label: '야구 글러브' },
    { value: '야구배트', label: '야구 배트' },
    { value: '야구화', label: '야구화' },
    { value: '야구복', label: '야구복' },
  ],
  골프: [
    { value: '골프채', label: '골프채' },
    { value: '골프화', label: '골프화' },
    { value: '골프공', label: '골프공' },
    { value: '골프장갑', label: '골프장갑' },
  ],
};

/** 종목에 해당하는 장비(준비물) 값 배열 반환. Step4Equipment, CreateGroupModal 등에서 사용 */
export function getEquipmentBySport(sport: string): string[] {
  const opts = EQUIPMENT_OPTIONS[sport] ?? [];
  return opts.map((o) => o.value);
}
