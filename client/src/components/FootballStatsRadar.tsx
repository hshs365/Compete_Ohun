import React, { useMemo } from 'react';

/** 축구 스텟 6종: 멘탈/수비/공격/피지컬/스피드/테크닉 (각 1~10) */
export const FOOTBALL_STAT_KEYS = [
  '멘탈',
  '수비',
  '공격',
  '피지컬',
  '스피드',
  '테크닉',
] as const;

export type FootballStats = {
  [K in (typeof FOOTBALL_STAT_KEYS)[number]]: number;
};

const defaultStats: FootballStats = {
  멘탈: 0,
  수비: 0,
  공격: 0,
  피지컬: 0,
  스피드: 0,
  테크닉: 0,
};

const MAX_LEVEL = 10;
/** 위쪽부터 시계방향: 0° = 위, 60°, 120°, ... (도 단위, 수학 각도) */
const AXIS_ANGLES_DEG = [90, 30, -30, -90, -150, 150];

function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

type FootballStatsRadarProps = {
  stats?: Partial<FootballStats>;
  height?: number;
  fill?: string;
  theme?: 'light' | 'dark';
};

const FootballStatsRadar: React.FC<FootballStatsRadarProps> = ({
  stats = {},
  height = 340,
  fill = 'var(--color-blue-primary)',
  theme = 'dark',
}) => {
  const merged = useMemo(() => ({ ...defaultStats, ...stats }), [stats]);
  const values = useMemo(
    () =>
      FOOTBALL_STAT_KEYS.map((k) =>
        Math.min(MAX_LEVEL, Math.max(0, merged[k] ?? 0))
      ),
    [merged]
  );

  const size = 320;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.35;

  const isDark = theme === 'dark';
  const gridStroke = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.12)';
  const axisStroke = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)';
  const textFill = isDark ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.85)';

  const axisPoints = useMemo(() => {
    return AXIS_ANGLES_DEG.map((deg, i) => {
      const rad = degToRad(deg);
      return {
        x: cx + radius * Math.cos(rad),
        y: cy - radius * Math.sin(rad),
        label: FOOTBALL_STAT_KEYS[i],
      };
    });
  }, [cx, cy, radius]);

  const dataPoints = useMemo(() => {
    return AXIS_ANGLES_DEG.map((deg, i) => {
      const r = (values[i] / MAX_LEVEL) * radius;
      const rad = degToRad(deg);
      return {
        x: cx + r * Math.cos(rad),
        y: cy - r * Math.sin(rad),
      };
    });
  }, [cx, cy, radius, values]);

  const dataPolygonPoints = dataPoints.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div className="w-full flex flex-col items-center" style={{ height }}>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="w-full max-w-[320px]"
        style={{ height: Math.min(height, 320) }}
        preserveAspectRatio="xMidYMid meet"
        aria-label="축구 스텟 레이더 차트 (1~10단계)"
      >
        {/* 그리드: 10단계 동심 육각형 */}
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => {
          const r = (level / MAX_LEVEL) * radius;
          const pts = AXIS_ANGLES_DEG.map((deg) => {
            const rad = degToRad(deg);
            return `${cx + r * Math.cos(rad)},${cy - r * Math.sin(rad)}`;
          }).join(' ');
          return (
            <polygon
              key={level}
              points={pts}
              fill="none"
              stroke={gridStroke}
              strokeWidth="1"
            />
          );
        })}
        {/* 축 6개 */}
        {axisPoints.map((end, i) => (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={end.x}
            y2={end.y}
            stroke={axisStroke}
            strokeWidth="1"
          />
        ))}
        {/* 데이터 영역 */}
        <polygon
          points={dataPolygonPoints}
          fill={fill}
          fillOpacity="0.35"
          stroke={fill}
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* 축 라벨: 축 끝 바깥에 모두 중앙 정렬로 배치 */}
        {axisPoints.map((p, i) => {
          const deg = AXIS_ANGLES_DEG[i];
          const labelRadius = radius + 24;
          const rad = degToRad(deg);
          const lx = cx + labelRadius * Math.cos(rad);
          const ly = cy - labelRadius * Math.sin(rad);
          return (
            <text
              key={i}
              x={lx}
              y={ly}
              fill={textFill}
              fontSize="13"
              fontWeight="500"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {p.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
};

export default FootballStatsRadar;
