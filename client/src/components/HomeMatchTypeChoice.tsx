import React from 'react';
import type { MatchType } from './GroupListPanel';
import { UserGroupIcon, TrophyIcon, SparklesIcon } from '@heroicons/react/24/outline';

/** 매치 종류별 테마 색 (선택 화면·목록 패널 공통) — 스포티·날렵한 톤 */
export const MATCH_TYPE_THEME: Record<MatchType, {
  bg: string;
  border: string;
  text: string;
  label: string;
  accentHex: string;
  accentRgba: string;
}> = {
  general: {
    bg: 'from-blue-900 to-blue-950',
    border: 'border-blue-400 hover:border-blue-300',
    text: 'text-blue-100',
    label: '일반 매치',
    accentHex: '#60a5fa',
    accentRgba: 'rgba(96,165,250,0.15)',
  },
  rank: {
    bg: 'from-amber-900 to-amber-950',
    border: 'border-amber-400 hover:border-amber-300',
    text: 'text-amber-100',
    label: '랭크매치',
    accentHex: '#d97706',
    accentRgba: 'rgba(217,119,6,0.15)',
  },
  event: {
    bg: 'from-violet-900 to-violet-950',
    border: 'border-violet-400 hover:border-violet-300',
    text: 'text-violet-100',
    label: '이벤트매치',
    accentHex: '#7c3aed',
    accentRgba: 'rgba(124,58,237,0.15)',
  },
};

const DESCRIPTIONS: Record<MatchType, string> = {
  general: '누구나 참여할 수 있는 일반 운동 매치',
  rank: '오운 랭크를 나누는 실력 기반 매치',
  event: '경품, 촬영 등 특별한 목적의 이벤트 매치',
};

const ICONS: Record<MatchType, React.ComponentType<{ className?: string }>> = {
  general: UserGroupIcon,
  rank: TrophyIcon,
  event: SparklesIcon,
};

interface HomeMatchTypeChoiceProps {
  onSelect: (type: MatchType) => void;
}

const HomeMatchTypeChoice: React.FC<HomeMatchTypeChoiceProps> = ({ onSelect }) => {
  const types: MatchType[] = ['general', 'rank', 'event'];

  return (
    <div className="flex-1 w-full flex items-center justify-center p-4 md:p-6 overflow-auto">
      <div className="flex flex-wrap justify-center items-stretch gap-6 md:gap-8">
        {types.map((type) => {
          const theme = MATCH_TYPE_THEME[type];
          const Icon = ICONS[type];
          return (
            <button
              key={type}
              type="button"
              onClick={() => onSelect(type)}
              className={`
                w-[360px] min-w-[320px] max-w-[calc(100vw-2rem)] h-[400px] md:h-[440px]
                flex flex-col items-center justify-center gap-7 p-6
                bg-gradient-to-b ${theme.bg} border-2 ${theme.border}
                rounded-xl md:rounded-2xl
                transition-all duration-200 hover:scale-[1.02] hover:shadow-2xl hover:brightness-110
              `}
            >
              <span className={`text-2xl md:text-3xl font-bold tracking-tight ${theme.text}`}>
                {theme.label}
              </span>
              <p className="text-sm md:text-base text-gray-300 text-center w-full px-1 break-words">
                {DESCRIPTIONS[type]}
              </p>
              <Icon className={`w-12 h-12 md:w-14 md:h-14 ${theme.text} opacity-90 flex-shrink-0`} />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default HomeMatchTypeChoice;
