import React, { useMemo } from 'react';

/** 레이더 차트용 공통 Props */
export interface SportStatsRadarProps {
  stats?: Record<string, number>;
  statKeys: readonly string[];
  overall?: number;
  prevMonthStats?: Record<string, number>;
  height?: number;
  fill?: string;
  theme?: 'light' | 'dark';
}

const MAX_LEVEL = 10;
/** 위쪽부터 시계방향: 0° = 위, 60°, 120°, ... (도 단위) */
function getAxisAngles(count: number): number[] {
  const step = 360 / count;
  return Array.from({ length: count }, (_, i) => 90 - i * step);
}

function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

const SportStatsRadar: React.FC<SportStatsRadarProps> = ({
  stats = {},
  statKeys,
  overall = 0,
  prevMonthStats,
  height = 340,
  fill = 'var(--color-blue-primary)',
  theme = 'dark',
}) => {
  const axisAngles = useMemo(() => getAxisAngles(statKeys.length), [statKeys.length]);
  const values = useMemo(
    () =>
      statKeys.map((k) =>
        Math.min(MAX_LEVEL, Math.max(0, stats[k] ?? 0))
      ),
    [stats, statKeys]
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
    return axisAngles.map((deg, i) => {
      const rad = degToRad(deg);
      return {
        x: cx + radius * Math.cos(rad),
        y: cy - radius * Math.sin(rad),
        label: statKeys[i],
      };
    });
  }, [axisAngles, cx, cy, radius, statKeys]);

  const dataPoints = useMemo(() => {
    return axisAngles.map((deg, i) => {
      const r = (values[i] / MAX_LEVEL) * radius;
      const rad = degToRad(deg);
      return {
        x: cx + r * Math.cos(rad),
        y: cy - r * Math.sin(rad),
      };
    });
  }, [axisAngles, cx, cy, radius, values]);

  const dataPolygonPoints = dataPoints.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div className="w-full flex flex-col items-center" style={{ height }}>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="w-full max-w-[320px]"
        style={{ height: Math.min(height, 320) }}
        preserveAspectRatio="xMidYMid meet"
        aria-label={`스탯 레이더 차트 (1~10단계)`}
      >
        {/* 그리드: 10단계 동심 다각형 */}
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => {
          const r = (level / MAX_LEVEL) * radius;
          const pts = axisAngles
            .map((deg) => {
              const rad = degToRad(deg);
              return `${cx + r * Math.cos(rad)},${cy - r * Math.sin(rad)}`;
            })
            .join(' ');
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
        {/* 축 */}
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
        {/* 축 라벨 */}
        {axisPoints.map((p, i) => {
          const deg = axisAngles[i];
          const labelRadius = radius + 24;
          const rad = degToRad(deg);
          const lx = cx + labelRadius * Math.cos(rad);
          const ly = cy - labelRadius * Math.sin(rad);
          const prevVal = prevMonthStats?.[p.label];
          const currVal = values[i];
          const arrow = prevVal != null && prevVal !== currVal ? (currVal > prevVal ? '↑' : '↓') : null;
          return (
            <g key={i}>
              <text
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
              {arrow && (
                <text
                  x={lx}
                  y={ly + 14}
                  fill={currVal > (prevVal ?? 0) ? '#22c55e' : '#ef4444'}
                  fontSize="10"
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {arrow}
                </text>
              )}
            </g>
          );
        })}
        {/* 중앙 Overall 점수 */}
        <text
          x={cx}
          y={cy}
          fill={textFill}
          fontSize="28"
          fontWeight="bold"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {Math.round(overall * 10) / 10}
        </text>
        <text
          x={cx}
          y={cy + 22}
          fill={isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)'}
          fontSize="11"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          Overall
        </text>
      </svg>
    </div>
  );
};

export default SportStatsRadar;
