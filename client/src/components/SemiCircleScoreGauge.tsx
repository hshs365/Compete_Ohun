import React from 'react';
import { getMannerGradeConfig } from '../utils/mannerGrade';

/** 0–100 매너 점수를 세미서클 게이지로 표시. 그린/옐로/레드 색상 반영 */
const SemiCircleScoreGauge: React.FC<{
  score: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}> = ({ score, size = 80, strokeWidth = 8, className = '' }) => {
  const clamped = Math.min(100, Math.max(0, score));
  const config = getMannerGradeConfig(score);
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = Math.PI * r;
  const offset = circumference * (1 - clamped / 100);
  const svgHeight = size / 2 + r + strokeWidth;

  const trackPath = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
  const fillPath = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;

  const gradeColors: Record<string, string> = {
    green: '#22c55e',
    yellow: '#eab308',
    red: '#ef4444',
  };
  const fillColor = gradeColors[config.grade] ?? gradeColors.green;

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <svg width={size} height={svgHeight} className="overflow-visible" aria-hidden>
        <defs>
          <linearGradient id="gauge-glow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={fillColor} stopOpacity={0.9} />
            <stop offset="100%" stopColor={fillColor} stopOpacity={0.6} />
          </linearGradient>
        </defs>
        {/* Track */}
        <path
          d={trackPath}
          fill="none"
          stroke="var(--color-bg-secondary)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Filled arc */}
        <path
          d={fillPath}
          fill="none"
          stroke={fillColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="flex flex-col items-center -mt-2">
        <span className="text-lg font-bold text-[var(--color-text-primary)] tabular-nums">{score}</span>
        <span className="text-xs font-medium text-[var(--color-text-secondary)]">{config.label}</span>
      </div>
    </div>
  );
};

export default SemiCircleScoreGauge;
