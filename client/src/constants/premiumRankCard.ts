/**
 * 전술판 프리미엄 랭크 카드 — 등급별 아이덴티티 (S~F)
 * S: 일렉트릭 블루/다이아몬드 화이트, A: 레드/골드, B: 퍼플/실버,
 * C~D: 에메랄드/스카이블루, E~F: 다크그레이/브론즈
 */
import type { AllcourtplayRank } from './allcourtplayRank';

export interface PremiumCardTheme {
  /** 카드 배경 그라데이션 */
  cardBg: string;
  /** 카드 테두리/강조 색상 */
  borderColor: string;
  /** 등급 글자 아우라/글로우 (box-shadow 등) */
  tierGlow: string;
  /** 등급 글자 색상 */
  tierColor: string;
  /** RP 텍스트 색상 */
  rpColor: string;
  /** 파티클(빛 가루) 색상 */
  particleColor: string;
}

export const PREMIUM_CARD_THEMES: Record<AllcourtplayRank, PremiumCardTheme> = {
  S: {
    cardBg: 'linear-gradient(145deg, rgba(30,58,138,0.95) 0%, rgba(15,23,42,0.98) 35%, rgba(147,197,253,0.15) 100%)',
    borderColor: 'rgba(147,197,253,0.6)',
    tierGlow: '0 0 20px rgba(147,197,253,0.9), 0 0 40px rgba(191,219,254,0.5), 0 0 60px rgba(255,255,255,0.25)',
    tierColor: '#e0f2fe',
    rpColor: 'rgba(224,242,254,0.95)',
    particleColor: 'rgba(147,197,253,0.9)',
  },
  A: {
    cardBg: 'linear-gradient(145deg, rgba(127,29,29,0.95) 0%, rgba(30,27,24,0.98) 35%, rgba(251,191,36,0.2) 100%)',
    borderColor: 'rgba(251,191,36,0.65)',
    tierGlow: '0 0 20px rgba(251,191,36,0.85), 0 0 40px rgba(245,158,11,0.45), 0 0 60px rgba(254,240,138,0.2)',
    tierColor: '#fef3c7',
    rpColor: 'rgba(254,243,199,0.95)',
    particleColor: 'rgba(251,191,36,0.9)',
  },
  B: {
    cardBg: 'linear-gradient(145deg, rgba(88,28,135,0.92) 0%, rgba(30,27,75,0.98) 35%, rgba(192,132,252,0.18) 100%)',
    borderColor: 'rgba(192,132,252,0.55)',
    tierGlow: '0 0 18px rgba(192,132,252,0.8), 0 0 36px rgba(167,139,250,0.4), 0 0 50px rgba(196,181,253,0.2)',
    tierColor: '#e9d5ff',
    rpColor: 'rgba(233,213,255,0.95)',
    particleColor: 'rgba(192,132,252,0.85)',
  },
  C: {
    cardBg: 'linear-gradient(145deg, rgba(6,95,70,0.9) 0%, rgba(19,78,74,0.97) 35%, rgba(52,211,153,0.18) 100%)',
    borderColor: 'rgba(52,211,153,0.5)',
    tierGlow: '0 0 16px rgba(52,211,153,0.7), 0 0 32px rgba(45,212,191,0.35), 0 0 48px rgba(94,234,212,0.15)',
    tierColor: '#ccfbf1',
    rpColor: 'rgba(204,251,241,0.95)',
    particleColor: 'rgba(52,211,153,0.8)',
  },
  D: {
    cardBg: 'linear-gradient(145deg, rgba(14,116,144,0.88) 0%, rgba(21,94,117,0.97) 35%, rgba(56,189,248,0.18) 100%)',
    borderColor: 'rgba(56,189,248,0.5)',
    tierGlow: '0 0 14px rgba(56,189,248,0.65), 0 0 28px rgba(125,211,252,0.3), 0 0 42px rgba(186,230,253,0.15)',
    tierColor: '#e0f2fe',
    rpColor: 'rgba(224,242,254,0.9)',
    particleColor: 'rgba(56,189,248,0.75)',
  },
  E: {
    cardBg: 'linear-gradient(145deg, rgba(68,64,60,0.92) 0%, rgba(41,37,36,0.98) 35%, rgba(180,83,9,0.12) 100%)',
    borderColor: 'rgba(180,83,9,0.45)',
    tierGlow: '0 0 12px rgba(217,119,6,0.5), 0 0 24px rgba(251,146,60,0.25), 0 0 36px rgba(254,215,170,0.1)',
    tierColor: '#fed7aa',
    rpColor: 'rgba(254,243,199,0.9)',
    particleColor: 'rgba(217,119,6,0.7)',
  },
  F: {
    cardBg: 'linear-gradient(145deg, rgba(41,37,36,0.95) 0%, rgba(23,23,23,0.98) 35%, rgba(120,113,108,0.12) 100%)',
    borderColor: 'rgba(120,113,108,0.4)',
    tierGlow: '0 0 10px rgba(161,161,170,0.45), 0 0 20px rgba(212,212,216,0.2), 0 0 30px rgba(228,228,231,0.08)',
    tierColor: '#d4d4d8',
    rpColor: 'rgba(212,212,216,0.9)',
    particleColor: 'rgba(161,161,170,0.6)',
  },
};

export function getPremiumCardTheme(grade: AllcourtplayRank): PremiumCardTheme {
  return PREMIUM_CARD_THEMES[grade];
}
