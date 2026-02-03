import React from 'react';
import { SPORTS_LIST } from '../constants/sports';

/** 종목별 카드 테마 — 스포티·날렵한 톤 (추후 카드 배경 디자인 추가 시 사용) */
const SPORT_CARD_THEME: Record<string, { bg: string; border: string; text: string }> = {
  축구: {
    bg: 'from-green-900 to-green-950',
    border: 'border-green-400 hover:border-green-300',
    text: 'text-green-100',
  },
  // 추후 종목 추가 시 여기에 추가
};

const DEFAULT_CARD_THEME = {
  bg: 'from-gray-800 to-gray-900',
  border: 'border-gray-400 hover:border-gray-300',
  text: 'text-gray-100',
};

interface HomeCategoryChoiceProps {
  onSelect: (category: string) => void;
}

/**
 * 종목 선택 화면 — 3분할 화면처럼 카드형으로 표시.
 * 카드 클릭 시 해당 종목 선택 후 다음 단계(매치 종류 선택)로 진행.
 * 추후 각 종목 카드에 백그라운드 디자인(예: 축구 일러스트) 추가 가능.
 */
const HomeCategoryChoice: React.FC<HomeCategoryChoiceProps> = ({ onSelect }) => {
  const sports = SPORTS_LIST;

  const handleCardClick = (sport: string) => {
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
          const theme = SPORT_CARD_THEME[sport] ?? DEFAULT_CARD_THEME;
          return (
            <button
              key={sport}
              type="button"
              onClick={() => handleCardClick(sport)}
              className={`
                w-[160px] min-h-[120px] md:w-[180px] md:min-h-[130px]
                flex flex-col items-center justify-center gap-2 p-4
                bg-gradient-to-b ${theme.bg} border-2 ${theme.border}
                rounded-lg md:rounded-xl
                transition-all duration-200 hover:scale-[1.02] hover:shadow-2xl hover:brightness-110
                relative overflow-hidden
              `}
              data-sport-card
              data-sport={sport}
            >
              {/* 추후 종목별 배경 디자인(예: 축구 공·피치)을 여기 배경으로 넣을 수 있음 */}
              <span className={`text-xl md:text-2xl font-bold ${theme.text} relative z-10`}>
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
