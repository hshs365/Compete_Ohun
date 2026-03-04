/** 바닥 재질 상수 (기획서 문서 기준) */
export const FLOOR_MATERIALS = [
  '우레탄',
  '인조잔디',
  '마루',
  '콘크리트',
  '모래',
  '천연잔디',
  '타일',
  '기타',
] as const;

export type FloorMaterial = (typeof FLOOR_MATERIALS)[number];
