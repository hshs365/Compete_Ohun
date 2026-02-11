/**
 * 매치 생성·상세보기 전술판 공통 디자인 (잔디 텍스처 + 미세 구역선)
 */

/** 스타디움: 잔디 결 다크 텍스처 (TacticalPitch·FootballPitch 동일) */
export const STADIUM_BG = {
  background: `
    linear-gradient(135deg, rgba(0,0,0,0.35) 0%, transparent 45%),
    linear-gradient(225deg, rgba(0,0,0,0.3) 0%, transparent 45%),
    repeating-linear-gradient(
      90deg,
      transparent 0,
      transparent 3px,
      rgba(0,28,0,0.12) 3px,
      rgba(0,28,0,0.12) 6px
    ),
    repeating-linear-gradient(
      0deg,
      transparent 0,
      transparent 4px,
      rgba(0,22,0,0.08) 4px,
      rgba(0,22,0,0.08) 8px
    ),
    linear-gradient(180deg, #071407 0%, #051005 20%, #040a04 50%, #030803 85%, #020602 100%)
  `,
  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.04)',
};

/** 팀 컬러 오버레이 (상세보기 구장에서 레드/블루 구분 유지) */
export const PITCH_TEAM_OVERLAY: Record<'red' | 'blue', string> = {
  red: 'linear-gradient(180deg, rgba(199,54,54,0.08) 0%, transparent 40%, transparent 60%, rgba(199,54,54,0.06) 100%)',
  blue: 'linear-gradient(180deg, rgba(59,108,184,0.08) 0%, transparent 40%, transparent 60%, rgba(59,108,184,0.06) 100%)',
};

/** 전술판 공통 aspect ratio (FIFA 반코트) */
export const PITCH_ASPECT_RATIO = '68 / 52.5';

/** 랭크 매치 생성 모달용: 입체적 다크 스타디움 (격자+사선 잔디, 역동적 공간) */
export const STADIUM_THEME_BG = {
  background: `
    linear-gradient(135deg, rgba(0,0,0,0.55) 0%, transparent 48%),
    linear-gradient(225deg, rgba(0,0,0,0.5) 0%, transparent 48%),
    repeating-linear-gradient(
      90deg,
      transparent 0,
      transparent 2px,
      rgba(0,36,0,0.22) 2px,
      rgba(0,36,0,0.22) 4px
    ),
    repeating-linear-gradient(
      0deg,
      transparent 0,
      transparent 2px,
      rgba(0,28,0,0.14) 2px,
      rgba(0,28,0,0.14) 4px
    ),
    linear-gradient(135deg, rgba(0,24,0,0.28) 0%, transparent 38%),
    linear-gradient(225deg, rgba(0,22,0,0.22) 0%, transparent 38%),
    linear-gradient(180deg, #051305 0%, #041004 22%, #030903 48%, #020702 78%, #010401 100%)
  `,
  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.07)',
};

/** 스타디움 플러드라이트 — 필드 가장자리에서 중앙으로 은은하게 퍼지는 서치라이트 */
export const STADIUM_FLOODLIGHT = `
  radial-gradient(ellipse 95% 50% at 0% 0%, rgba(255,255,255,0.14) 0%, transparent 52%),
  radial-gradient(ellipse 95% 50% at 100% 0%, rgba(255,255,255,0.14) 0%, transparent 52%),
  radial-gradient(ellipse 100% 60% at 50% -8%, rgba(255,255,255,0.1) 0%, transparent 48%)
`;

/** 팀별 스타디움 구장 배경 이미지 (레드/블루 컬러) — public에 stadium-red.png, stadium-blue.png 배치 시 사용 */
export const STADIUM_IMAGE_URL: Record<'red' | 'blue', string> = {
  red: '/stadium-red.png',
  blue: '/stadium-blue.png',
};

/** 풀필드 구장 — 세로 줄무늬 잔디 + 흰색 라인 (한 장의 구장에 레드/블루 전원 표시용) */
export const FULL_FIELD_STRIPED_BG = {
  background: `
    repeating-linear-gradient(
      90deg,
      #2d5a2d 0px,
      #2d5a2d 40px,
      #274f27 40px,
      #274f27 80px
    ),
    linear-gradient(180deg, #1a3d1a 0%, #153015 50%, #1a3d1a 100%)
  `,
  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
};
