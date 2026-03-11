import React from 'react';
import { SPORT_ICONS, SPORT_POINT_COLORS } from '../constants/sports';

/** 종목별 일러스트 이모지 (재미있는 표현) */
const SPORT_ILLUSTRATIONS: Record<string, string> = {
  전체: '🏃',
  축구: '⚽',
  풋살: '🥅',
  농구: '🏀',
  테니스: '🎾',
  배드민턴: '🏸',
};

const EMPTY_MESSAGES: Record<string, string> = {
  전체: '현재 주변에 용병 매치가 없어요. 직접 구해보시겠어요?',
  축구: '현재 주변에 축구 용병이 없어요. 직접 구해보시겠어요?',
  풋살: '현재 주변에 풋살 용병이 없어요. 직접 구해보시겠어요?',
  농구: '현재 주변에 농구 용병이 없어요. 직접 구해보시겠어요?',
  테니스: '현재 주변에 테니스 용병이 없어요. 직접 구해보시겠어요?',
  배드민턴: '현재 주변에 배드민턴 용병이 없어요. 직접 구해보시겠어요?',
};

interface MercenaryEmptyStateProps {
  /** 선택된 종목 (null이면 '전체') */
  selectedSport: string | null;
  onWriteClick: () => void;
  /** 비로그인 시 버튼 숨김 (기본 true) */
  showWriteButton?: boolean;
}

const MercenaryEmptyState: React.FC<MercenaryEmptyStateProps> = ({ selectedSport, onWriteClick, showWriteButton = true }) => {
  const sport = selectedSport || '전체';
  const icon = SPORT_ILLUSTRATIONS[sport] ?? SPORT_ILLUSTRATIONS['전체'];
  const message = EMPTY_MESSAGES[sport] ?? EMPTY_MESSAGES['전체'];
  const pointColor = SPORT_POINT_COLORS[sport] ?? SPORT_POINT_COLORS['전체'];

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div
        className="w-24 h-24 flex items-center justify-center rounded-full text-5xl mb-4 opacity-90"
        style={{ backgroundColor: `${pointColor}20` }}
      >
        {icon}
      </div>
      <p className="text-base text-[var(--color-text-secondary)] mb-6 max-w-[280px]">
        {message}
      </p>
      {showWriteButton && (
        <button
          type="button"
          onClick={onWriteClick}
          className="px-6 py-3 rounded-xl font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: pointColor }}
        >
          용병 구하기 작성
        </button>
      )}
    </div>
  );
};

export default MercenaryEmptyState;
