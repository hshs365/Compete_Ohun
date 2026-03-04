import React from 'react';
import { SPORTS_LIST, SPORT_ICONS } from '../constants/sports';

/** 종목별 칩 테마 — 다크/라이트 모드 배경에서 분리되는 그라데이션·보더 */
const SPORT_CHIP_THEME: Record<string, { gradient: string; border: string; text: string; activeGlow: string }> = {
  축구: {
    gradient: 'bg-gradient-to-br from-emerald-600/90 to-emerald-800/95 dark:from-emerald-500/30 dark:to-emerald-700/40',
    border: 'border-2 border-emerald-400/60 dark:border-emerald-400/50',
    text: 'text-white dark:text-emerald-100',
    activeGlow: 'shadow-[0_0_12px_rgba(52,211,153,0.5)] dark:shadow-[0_0_16px_rgba(52,211,153,0.4)]',
  },
  풋살: {
    gradient: 'bg-gradient-to-br from-teal-600/90 to-teal-800/95 dark:from-teal-500/30 dark:to-teal-700/40',
    border: 'border-2 border-teal-400/60 dark:border-teal-400/50',
    text: 'text-white dark:text-teal-100',
    activeGlow: 'shadow-[0_0_12px_rgba(45,212,191,0.5)] dark:shadow-[0_0_16px_rgba(45,212,191,0.4)]',
  },
  농구: {
    gradient: 'bg-gradient-to-br from-orange-600/90 to-orange-800/95 dark:from-orange-500/30 dark:to-orange-700/40',
    border: 'border-2 border-orange-400/60 dark:border-orange-400/50',
    text: 'text-white dark:text-orange-100',
    activeGlow: 'shadow-[0_0_12px_rgba(251,146,60,0.5)] dark:shadow-[0_0_16px_rgba(251,146,60,0.4)]',
  },
  테니스: {
    gradient: 'bg-gradient-to-br from-lime-600/90 to-lime-800/95 dark:from-lime-500/30 dark:to-lime-700/40',
    border: 'border-2 border-lime-400/60 dark:border-lime-400/50',
    text: 'text-white dark:text-lime-100',
    activeGlow: 'shadow-[0_0_12px_rgba(132,204,22,0.5)] dark:shadow-[0_0_16px_rgba(132,204,22,0.4)]',
  },
};

const DEFAULT_CHIP_THEME = {
  gradient: 'bg-gradient-to-br from-slate-600/90 to-slate-800/95 dark:from-slate-500/30 dark:to-slate-700/40',
  border: 'border-2 border-slate-400/60 dark:border-slate-400/50',
  text: 'text-white dark:text-slate-100',
  activeGlow: 'shadow-[0_0_12px_rgba(148,163,184,0.4)] dark:shadow-[0_0_16px_rgba(148,163,184,0.3)]',
};

interface HomeCategoryChoiceProps {
  onSelect: (category: string) => void;
}

/**
 * 종목 선택 화면 — 이미지(아이콘) + 텍스트 칩 형태.
 * 그라데이션·보더로 배경과 분리, 탭 시 스케일 애니메이션.
 */
const HomeCategoryChoice: React.FC<HomeCategoryChoiceProps> = ({ onSelect }) => {
  const sports = [...SPORTS_LIST];

  const handleCardClick = (sport: string) => {
    if (navigator.vibrate) navigator.vibrate(8);
    onSelect(sport);
  };

  return (
    <div className="flex flex-col flex-1 w-full overflow-hidden">
      <div className="flex-shrink-0 px-4 pt-6 pb-4 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)]">
          종목을 선택하세요
        </h2>
      </div>
      <div className="flex flex-wrap justify-center gap-4 p-4 overflow-auto max-w-2xl md:max-w-3xl mx-auto">
        {sports.map((sport) => {
          const theme = SPORT_CHIP_THEME[sport] ?? DEFAULT_CHIP_THEME;
          const icon = SPORT_ICONS[sport] ?? '●';
          return (
            <button
              key={sport}
              type="button"
              onClick={() => handleCardClick(sport)}
              className={`
                flex items-center gap-3 px-6 py-4 rounded-xl md:rounded-2xl
                ${theme.gradient} ${theme.border}
                transition-all duration-200
                hover:scale-[1.03] active:scale-[0.98]
                hover:shadow-xl ${theme.activeGlow}
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-400/60
              `}
              data-sport-chip
              data-sport={sport}
            >
              <span className="text-3xl md:text-4xl" aria-hidden>
                {icon}
              </span>
              <span className={`text-lg md:text-xl font-bold ${theme.text}`}>
                {sport}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default HomeCategoryChoice;
