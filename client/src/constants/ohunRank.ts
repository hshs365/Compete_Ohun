/** 오운 랭크: S(최고) ~ F(기본). 선수 등록 유저는 기본 C랭크 */
export const OHUN_RANKS = ['S', 'A', 'B', 'C', 'D', 'E', 'F'] as const;
export type OhunRank = (typeof OHUN_RANKS)[number];

export const OHUN_RANK_LABELS: Record<OhunRank, string> = {
  S: 'S 랭크',
  A: 'A 랭크',
  B: 'B 랭크',
  C: 'C 랭크',
  D: 'D 랭크',
  E: 'E 랭크',
  F: 'F 랭크',
};

/** 랭크별 강조 색상 (프로필·뱃지용) */
export const OHUN_RANK_STYLES: Record<OhunRank, string> = {
  S: 'from-amber-400 to-yellow-600 text-white shadow-md',
  A: 'from-purple-500 to-violet-600 text-white',
  B: 'from-blue-500 to-indigo-600 text-white',
  C: 'from-emerald-500 to-teal-600 text-white',
  D: 'from-cyan-500 to-sky-600 text-white',
  E: 'from-orange-400 to-amber-500 text-white',
  F: 'from-slate-400 to-slate-600 text-white',
};

export function getOhunRankStyle(rank: string): string {
  const r = rank?.toUpperCase();
  if (r && r in OHUN_RANK_STYLES) return OHUN_RANK_STYLES[r as OhunRank];
  return OHUN_RANK_STYLES.F;
}
