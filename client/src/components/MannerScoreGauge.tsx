import React from 'react';
import { getMannerGradeConfig } from '../utils/mannerGrade';

interface MannerScoreGaugeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const SIZE_MAP = { sm: 72, md: 96, lg: 120 };
const STROKE_MAP = { sm: 7, md: 9, lg: 11 };

/**
 * 매너 점수(0~100)를 원형 게이지로 시각화. 그린/옐로/레드 구간 색상 적용.
 */
const MannerScoreGauge: React.FC<MannerScoreGaugeProps> = ({
  score,
  size = 'md',
  showLabel = true,
  className = '',
}) => {
  const clamped = Math.min(100, Math.max(0, score));
  const config = getMannerGradeConfig(clamped);
  const dim = SIZE_MAP[size];
  const stroke = STROKE_MAP[size];
  const r = (dim - stroke) / 2 - 2;
  const cx = dim / 2;
  const cy = dim / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - clamped / 100);

  const colorMap: Record<string, string> = {
    green: 'var(--color-manner-green, #10b981)',
    yellow: 'var(--color-manner-yellow, #f59e0b)',
    red: 'var(--color-manner-red, #ef4444)',
  };
  const strokeColor = colorMap[config.grade] || colorMap.green;

  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      <div className="relative inline-flex" style={{ width: dim, height: dim }}>
        <svg width={dim} height={dim} className="rotate-[-90deg]" aria-hidden>
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            className="text-[var(--color-bg-secondary)]"
          />
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={strokeColor}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-[stroke-dashoffset] duration-500"
          />
        </svg>
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ fontSize: size === 'sm' ? '1rem' : size === 'md' ? '1.375rem' : '1.75rem' }}
        >
          <span className={`font-bold tabular-nums ${config.textColor || ''}`}>{Math.round(clamped)}</span>
        </div>
      </div>
      {showLabel && (
        <span className={`text-sm font-semibold px-2.5 py-1 rounded-full ${config.bg} ${config.border} border badge-text-contrast`}>
          {config.icon} {config.label}
        </span>
      )}
    </div>
  );
};

export default MannerScoreGauge;
