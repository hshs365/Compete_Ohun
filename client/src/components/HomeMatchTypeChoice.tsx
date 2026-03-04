import React, { useEffect, useState } from 'react';
import type { MatchType } from './GroupListPanel';
import { UserGroupIcon, TrophyIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import { getMannerGrade } from '../utils/mannerGrade';
import { rpToGrade } from '../constants/rankGrade';
import { ALLCOURTPLAY_RANK_STYLES, type AllcourtplayRank } from '../constants/allcourtplayRank';

/** 매치 종류별 테마 (선택 화면·목록 패널 공통) — 스포티·날렵한 톤 */
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
    label: '랭크 매치',
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

/** 그라데이션·보더 강화 — 배경과 분리되는 시각적 구분 */
const MATCH_CARD_STYLES: Record<MatchType, { gradient: string; border: string; glow: string }> = {
  general: {
    gradient: 'bg-gradient-to-br from-blue-600/95 via-blue-800 to-blue-950 dark:from-blue-700/40 dark:via-blue-800/50 dark:to-blue-950/90',
    border: 'border-2 border-blue-300/70 dark:border-blue-400/60 shadow-lg shadow-blue-900/30',
    glow: 'hover:shadow-[0_0_24px_rgba(59,130,246,0.3)]',
  },
  rank: {
    gradient: 'bg-gradient-to-br from-amber-500/95 via-amber-700 to-amber-950 dark:from-amber-600/50 dark:via-amber-700/60 dark:to-amber-950/90',
    border: 'border-2 border-amber-300/80 dark:border-amber-400/70 shadow-lg shadow-amber-900/40',
    glow: 'hover:shadow-[0_0_28px_rgba(245,158,11,0.4)]',
  },
  event: {
    gradient: 'bg-gradient-to-br from-violet-600/95 via-violet-800 to-violet-950 dark:from-violet-700/40 dark:via-violet-800/50 dark:to-violet-950/90',
    border: 'border-2 border-violet-300/70 dark:border-violet-400/60 shadow-lg shadow-violet-900/30',
    glow: 'hover:shadow-[0_0_24px_rgba(139,92,246,0.3)]',
  },
};

const DESCRIPTIONS: Record<MatchType, string> = {
  general: '누구나 참여할 수 있는 일반 운동 매치',
  rank: '올코트플레이 랭크를 나누는 실력 기반 매치',
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
  const { user } = useAuth();
  const [mannerScore, setMannerScore] = useState<number | null>(null);
  const [totalScore, setTotalScore] = useState<number | null>(null);

  const isGreenCard = mannerScore !== null && getMannerGrade(mannerScore) === 'green';
  const canJoinRankMatch = user && isGreenCard;
  const rankGrade: AllcourtplayRank | null = totalScore != null ? rpToGrade(totalScore) : null;

  useEffect(() => {
    if (!user?.id) return;
    api
      .get<{ mannerScore?: number; totalScore?: number }>(`/api/users/${user.id}/profile-summary`)
      .then((res) => {
        setMannerScore(res.mannerScore ?? null);
        setTotalScore(res.totalScore ?? null);
      })
      .catch(() => {});
  }, [user?.id]);

  const types: MatchType[] = ['general', 'rank', 'event'];

  const handleSelect = (type: MatchType) => {
    if (type === 'rank' && !canJoinRankMatch) return;
    if (navigator.vibrate) navigator.vibrate(8);
    onSelect(type);
  };

  return (
    <div className="flex-1 w-full flex items-center justify-center p-4 md:p-6 overflow-auto">
      <div className="flex flex-wrap justify-center items-stretch gap-6 md:gap-8">
        {types.map((type) => {
          const theme = MATCH_TYPE_THEME[type];
          const style = MATCH_CARD_STYLES[type];
          const Icon = ICONS[type];
          const isRank = type === 'rank';
          const disabled = isRank && !canJoinRankMatch;

          return (
            <button
              key={type}
              type="button"
              onClick={() => handleSelect(type)}
              disabled={disabled}
              className={`
                w-[360px] min-w-[320px] max-w-[calc(100vw-2rem)] h-[400px] md:h-[440px]
                flex flex-col items-center justify-center gap-7 p-6
                ${style.gradient} ${style.border}
                rounded-xl md:rounded-2xl
                transition-all duration-200
                ${disabled ? 'opacity-60 cursor-not-allowed' : `hover:scale-[1.02] active:scale-[0.98] hover:shadow-2xl hover:brightness-110 ${style.glow}`}
              `}
            >
              <span className={`text-2xl md:text-3xl font-bold tracking-tight ${theme.text}`}>
                {theme.label}
              </span>
              <p className="text-sm md:text-base text-gray-300 text-center w-full px-1 break-words">
                {DESCRIPTIONS[type]}
              </p>

              <div className="flex items-center gap-4">
                <Icon className={`w-12 h-12 md:w-14 md:h-14 ${theme.text} opacity-90 flex-shrink-0`} />
                {isRank && rankGrade && (
                  <span
                    className={`
                      inline-flex items-center justify-center w-12 h-12 md:w-14 md:h-14
                      rounded-xl font-black text-lg md:text-xl
                      bg-gradient-to-br ${ALLCOURTPLAY_RANK_STYLES[rankGrade]}
                    `}
                    title={`${rankGrade} 랭크`}
                  >
                    {rankGrade}
                  </span>
                )}
              </div>

              {isRank && !canJoinRankMatch && user && (
                <p className="text-xs text-amber-200/90 text-center max-w-[280px]">
                  그린카드 유저만 참여할 수 있습니다.
                  <br />
                  매너 점수 60점 이상이 되어야 합니다.
                </p>
              )}
              {isRank && !user && (
                <p className="text-xs text-amber-200/90 text-center max-w-[280px]">
                  로그인 후 그린카드 유저만 참여 가능합니다.
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default HomeMatchTypeChoice;
