/**
 * 외부 이미지 없이 React + CSS만으로 그리는 전체 축구장(Full Pitch).
 * 비율 105:68. 골대는 좌·우(골라인), 터치라인은 위·아래.
 */
import React from 'react';

/** 잔디 줄무늬 — 터치라인과 평행(가로) */
const GRASS = {
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
};

const LINE = 'rgba(255,255,255,0.92)';
const LINE_WIDTH = 2;

/** FIFA 105m(골-골) x 68m(터치). 모든 %는 가로=105m, 세로=68m 기준.
 * 페널티: 골라인 따라 40.32m, 깊이 16.5m → 가로 15.71%, 세로 59.29%
 * 식스야드: 18.32m x 5.5m → 가로 5.24%, 세로 26.94%
 * 센터서클 직경 18.3m → 가로 17.4%, 세로 26.9%
 * 페널티 스팟: 골라인에서 11m → 10.48%
 * 페널티 아크 반경 9.15m → 가로 8.71%, 세로 13.46%
 */
const PA_DEPTH = 15.71;   // 16.5/105
const PA_HEIGHT = 59.29;  // 40.32/68
const PA_TOP = (100 - PA_HEIGHT) / 2;
const SIX_DEPTH = 5.24;   // 5.5/105
const SIX_HEIGHT = 26.94; // 18.32/68
const SIX_TOP = PA_TOP + (PA_HEIGHT - SIX_HEIGHT) / 2;
const SPOT_X_LEFT = 10.48;   // 11/105
const SPOT_X_RIGHT = 100 - 10.48;
const ARC_RX = 8.71;
const ARC_RY = 13.46;
/** 페널티 박스 경계와 아크(타원) 교점 — 박스 안쪽 아크는 그리지 않음 */
const PA_RIGHT_EDGE = PA_DEPTH;                    // 15.71 (왼쪽 박스 오른쪽 끝)
const PA_LEFT_EDGE = 100 - PA_DEPTH;              // 84.29 (오른쪽 박스 왼쪽 끝)
const ARC_AT_BOUNDARY = ARC_RY * Math.sqrt(1 - Math.pow((PA_RIGHT_EDGE - SPOT_X_LEFT) / ARC_RX, 2)); // ≈10.77
const LEFT_ARC_Y_TOP = 50 - ARC_AT_BOUNDARY;      // 39.23
const LEFT_ARC_Y_BOTTOM = 50 + ARC_AT_BOUNDARY;    // 60.77

export default function FullPitchCSS() {
  return (
    <div
      className="absolute inset-0 rounded-xl overflow-hidden"
      style={{
        ...GRASS,
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
      }}
      aria-hidden
    >
      {/* 테두리: 좌우=골라인, 위아래=터치라인 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          border: `${LINE_WIDTH}px solid ${LINE}`,
          borderRadius: 'inherit',
        }}
      />

      {/* 하프라인 (세로 중앙선) */}
      <div
        className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 pointer-events-none w-0"
        style={{ borderLeft: `${LINE_WIDTH}px solid ${LINE}` }}
      />

      {/* 센터 서클 */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none rounded-full border-2 border-white"
        style={{
          width: '17.4%',
          height: '26.9%',
          borderColor: LINE,
        }}
      />
      <div
        className="absolute left-1/2 top-1/2 w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
        style={{ background: LINE }}
      />

      {/* 왼쪽 페널티 에어리어 (골라인 쪽 왼쪽) */}
      <div
        className="absolute left-0 pointer-events-none border-r-2 border-t-2 border-b-2 border-white"
        style={{
          width: `${PA_DEPTH}%`,
          top: `${PA_TOP}%`,
          height: `${PA_HEIGHT}%`,
          borderColor: LINE,
        }}
      />
      {/* 왼쪽 식스야드 */}
      <div
        className="absolute left-0 pointer-events-none border-r-2 border-t-2 border-b-2 border-white"
        style={{
          width: `${SIX_DEPTH}%`,
          top: `${SIX_TOP}%`,
          height: `${SIX_HEIGHT}%`,
          borderColor: LINE,
        }}
      />
      {/* 왼쪽 페널티 스팟 */}
      <div
        className="absolute top-1/2 w-1.5 h-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none bg-white"
        style={{ left: `${SPOT_X_LEFT}%` }}
      />

      {/* 오른쪽 페널티 에어리어 */}
      <div
        className="absolute right-0 pointer-events-none border-l-2 border-t-2 border-b-2 border-white"
        style={{
          width: `${PA_DEPTH}%`,
          top: `${PA_TOP}%`,
          height: `${PA_HEIGHT}%`,
          borderColor: LINE,
        }}
      />
      {/* 오른쪽 식스야드 */}
      <div
        className="absolute right-0 pointer-events-none border-l-2 border-t-2 border-b-2 border-white"
        style={{
          width: `${SIX_DEPTH}%`,
          top: `${SIX_TOP}%`,
          height: `${SIX_HEIGHT}%`,
          borderColor: LINE,
        }}
      />
      {/* 오른쪽 페널티 스팟 */}
      <div
        className="absolute top-1/2 w-1.5 h-1.5 translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none bg-white"
        style={{ left: `${SPOT_X_RIGHT}%` }}
      />

      {/* 페널티 아크(D) — 박스 경계 밖만 그림(박스 안쪽 아크 비표시). 왼쪽=오른쪽 반원, 오른쪽=필드 쪽(왼쪽) 반원 */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ overflow: 'visible' }}
        aria-hidden
      >
        {/* 왼쪽: 박스 오른쪽 경계(x=15.71)에서만 시작·끝 — 박스 안 구간 제외 */}
        <path
          d={`M ${PA_RIGHT_EDGE} ${LEFT_ARC_Y_TOP} A ${ARC_RX} ${ARC_RY} 0 0 1 ${PA_RIGHT_EDGE} ${LEFT_ARC_Y_BOTTOM}`}
          fill="none"
          stroke={LINE}
          strokeWidth="0.7"
        />
        {/* 오른쪽: 왼쪽 아크를 박스 라인 기준 대칭 — 위→아래, 필드 쪽(왼쪽)으로 휘어짐 */}
        <path
          d={`M ${PA_LEFT_EDGE} ${LEFT_ARC_Y_TOP} A ${ARC_RX} ${ARC_RY} 0 0 0 ${PA_LEFT_EDGE} ${LEFT_ARC_Y_BOTTOM}`}
          fill="none"
          stroke={LINE}
          strokeWidth="0.7"
        />
      </svg>

      {/* 코너 아크 — 곡선이 구장 안쪽을 향하도록 (모서리에서 안쪽 정점으로 둥글게) */}
      <div
        className="absolute left-0 top-0 w-4 h-4 border-t-2 border-l-2 border-white rounded-tl-full pointer-events-none"
        style={{ borderColor: LINE }}
      />
      <div
        className="absolute right-0 top-0 w-4 h-4 border-t-2 border-r-2 border-white rounded-tr-full pointer-events-none"
        style={{ borderColor: LINE }}
      />
      <div
        className="absolute left-0 bottom-0 w-4 h-4 border-b-2 border-l-2 border-white rounded-bl-full pointer-events-none"
        style={{ borderColor: LINE }}
      />
      <div
        className="absolute right-0 bottom-0 w-4 h-4 border-b-2 border-r-2 border-white rounded-br-full pointer-events-none"
        style={{ borderColor: LINE }}
      />
    </div>
  );
}
