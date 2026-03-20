import React from 'react';
import { getMannerGradeConfig } from '../utils/mannerGrade';

interface MannerScoreGaugeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const HEIGHT_MAP = { sm: 'h-2', md: 'h-3', lg: 'h-4' };

/**
 * 매너 점수(0~100)를 가로 막대(바) 형태로 시각화. 그린/옐로/레드 구간 색상 적용.
 * 모바일 환경에 맞게 전체 너비 사용, 터치 영역 확보.
 */
const MannerScoreGauge: React.FC<MannerScoreGaugeProps> = ({
  score,
  size = 'md',
  showLabel = true,
  className = '',
}) => {
  const clamped = Math.min(100, Math.max(0, score));
  const config = getMannerGradeConfig(clamped);

  const colorMap: Record<string, string> = {
    green: 'var(--color-manner-green, #10b981)',
    yellow: 'var(--color-manner-yellow, #f59e0b)',
    red: 'var(--color-manner-red, #ef4444)',
  };
  const fillColor = colorMap[config.grade] || colorMap.green;

  return (
    <div className={`flex flex-col gap-1.5 w-full min-w-0 ${className}`}>
      <div className="flex items-center gap-3 w-full min-w-0">
        <div
          className={`flex-1 min-w-0 rounded-full overflow-hidden bg-[var(--color-bg-secondary)] ${HEIGHT_MAP[size]}`}
          role="progressbar"
          aria-valuenow={Math.round(clamped)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`매너점수 ${Math.round(clamped)}점`}
        >
          <div
            className="h-full rounded-full transition-all duration-500 min-w-0"
            style={{ width: `${clamped}%`, backgroundColor: fillColor }}
          />
        </div>
        <span className="font-bold tabular-nums text-[var(--color-text-primary)] shrink-0 text-sm md:text-base">
          {Math.round(clamped)}
        </span>
      </div>
      {showLabel && (
        <span
          className={`inline-flex items-center gap-1 w-fit text-xs font-semibold px-2.5 py-1 rounded-full border ${config.bg} ${config.border} badge-text-contrast`}
        >
          {config.icon} {config.label}
        </span>
      )}
    </div>
  );
};

export default MannerScoreGauge;
