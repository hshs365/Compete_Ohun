import React, { useState } from 'react';
import { TrophyIcon, StarIcon, FireIcon } from '@heroicons/react/24/solid';
import { TrophyIcon as TrophyOutlineIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { SPORTS_CATEGORIES } from '../constants/sports';

interface Ranker {
  id: number;
  rank: number;
  nickname: string;
  score: number;
  sportCategory: string; // 운동 카테고리 추가
  badge?: string;
  avatar?: string;
}

const HallOfFamePage = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'weekly' | 'monthly' | 'all'>('monthly');
  const [selectedSport, setSelectedSport] = useState<string>('전체');

  // 샘플 데이터 (운동 카테고리 추가)
  const rankings: Ranker[] = [
    { id: 1, rank: 1, nickname: '배드민턴킹', score: 12500, sportCategory: '배드민턴', badge: '🥇' },
    { id: 2, rank: 2, nickname: '축구마스터', score: 11200, sportCategory: '축구', badge: '🥈' },
    { id: 3, rank: 3, nickname: '야구프로', score: 10800, sportCategory: '야구', badge: '🥉' },
    { id: 4, rank: 4, nickname: '테니스프로', score: 9500, sportCategory: '테니스' },
    { id: 5, rank: 5, nickname: '농구왕', score: 8900, sportCategory: '농구' },
    { id: 6, rank: 6, nickname: '클라이밍고수', score: 8200, sportCategory: '클라이밍' },
    { id: 7, rank: 7, nickname: '골프마스터', score: 7800, sportCategory: '골프' },
    { id: 8, rank: 8, nickname: '탁구킹', score: 7300, sportCategory: '탁구' },
    { id: 9, rank: 9, nickname: '배구선수', score: 6800, sportCategory: '배구' },
    { id: 10, rank: 10, nickname: '당구고수', score: 6500, sportCategory: '당구' },
    { id: 11, rank: 11, nickname: '서바이벌전문가', score: 6200, sportCategory: '서바이벌' },
    { id: 12, rank: 12, nickname: 'CQB마스터', score: 5800, sportCategory: 'CQB' },
    { id: 13, rank: 13, nickname: '러닝러버', score: 5600, sportCategory: '러닝' },
    { id: 14, rank: 14, nickname: '등산고수', score: 5400, sportCategory: '등산' },
    { id: 15, rank: 15, nickname: '볼링왕', score: 5200, sportCategory: '볼링' },
  ];

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <TrophyIcon className="w-6 h-6 text-yellow-400" />;
    if (rank === 2) return <TrophyIcon className="w-6 h-6 text-gray-300" />;
    if (rank === 3) return <TrophyIcon className="w-6 h-6 text-orange-400" />;
    return <span className="text-[var(--color-text-secondary)] font-bold">{rank}</span>;
  };

  const getRankBackground = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400/20 to-yellow-600/20 border-yellow-400/50';
    if (rank === 2) return 'bg-gradient-to-r from-gray-300/20 to-gray-400/20 border-gray-300/50';
    if (rank === 3) return 'bg-gradient-to-r from-orange-400/20 to-orange-600/20 border-orange-400/50';
    return 'bg-[var(--color-bg-primary)] border-[var(--color-border-card)]';
  };

  // 운동 카테고리별 필터링
  const filteredRankings = rankings.filter((ranker) => {
    if (selectedSport === '전체') return true;
    return ranker.sportCategory === selectedSport;
  });

  // 선택된 카테고리 내에서 순위 재계산
  const rankedResults = filteredRankings
    .sort((a, b) => b.score - a.score)
    .map((ranker, index) => ({
      ...ranker,
      rank: index + 1,
    }));

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto w-full pb-12">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] mb-2">
          명예의 전당
        </h1>
        <p className="text-[var(--color-text-secondary)]">
          가장 활동적인 운동인들을 만나보세요
        </p>
      </div>

      {/* 필터 */}
      <div className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-card)] p-4 md:p-6 mb-6">
        {/* 기간 필터 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
            기간
          </label>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedPeriod('weekly')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedPeriod === 'weekly'
                  ? 'bg-[var(--color-blue-primary)] text-white'
                  : 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] border border-[var(--color-border-card)] hover:bg-[var(--color-bg-secondary)]'
              }`}
            >
              주간
            </button>
            <button
              onClick={() => setSelectedPeriod('monthly')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedPeriod === 'monthly'
                  ? 'bg-[var(--color-blue-primary)] text-white'
                  : 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] border border-[var(--color-border-card)] hover:bg-[var(--color-bg-secondary)]'
              }`}
            >
              월간
            </button>
            <button
              onClick={() => setSelectedPeriod('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedPeriod === 'all'
                  ? 'bg-[var(--color-blue-primary)] text-white'
                  : 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] border border-[var(--color-border-card)] hover:bg-[var(--color-bg-secondary)]'
              }`}
            >
              전체
            </button>
          </div>
        </div>

        {/* 운동 카테고리 필터 */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
            <FunnelIcon className="w-4 h-4 inline mr-1" />
            운동 카테고리
          </label>
          <div className="flex flex-wrap gap-2">
            {SPORTS_CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedSport(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedSport === category
                    ? 'bg-[var(--color-blue-primary)] text-white'
                    : 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] border border-[var(--color-border-card)] hover:bg-[var(--color-bg-secondary)]'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 랭킹 목록 */}
      {rankedResults.length === 0 ? (
        <div className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-card)] p-12 text-center">
          <TrophyOutlineIcon className="w-16 h-16 mx-auto text-[var(--color-text-secondary)] mb-4" />
          <p className="text-[var(--color-text-secondary)] text-lg">
            선택한 카테고리에 해당하는 랭킹 데이터가 없습니다.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rankedResults.map((ranker) => (
            <div
              key={ranker.id}
              className={`flex items-center gap-4 p-4 rounded-xl border-2 ${getRankBackground(ranker.rank)} transition-all hover:scale-[1.02]`}
            >
              {/* 순위 */}
              <div className="flex-shrink-0 w-12 text-center">
                {getRankIcon(ranker.rank)}
              </div>

              {/* 프로필 */}
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                  {ranker.nickname.charAt(0)}
                </div>
              </div>

              {/* 정보 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
                    {ranker.nickname}
                  </h3>
                  {ranker.badge && <span className="text-2xl">{ranker.badge}</span>}
                  {ranker.rank <= 3 && (
                    <FireIcon className="w-5 h-5 text-orange-500" />
                  )}
                  <span className="px-2 py-1 bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] text-xs rounded">
                    {ranker.sportCategory}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-[var(--color-text-secondary)]">
                  <span>활동 점수: {ranker.score.toLocaleString()}</span>
                </div>
              </div>

              {/* 점수 */}
              <div className="flex-shrink-0 text-right">
                <div className="text-2xl font-bold text-[var(--color-text-primary)]">
                  {ranker.score.toLocaleString()}
                </div>
                <div className="text-xs text-[var(--color-text-secondary)]">점</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 내 순위 표시 (샘플) */}
      <div className="mt-8 p-4 bg-[var(--color-bg-card)] rounded-2xl border-2 border-[var(--color-blue-primary)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[var(--color-text-secondary)] mb-1">나의 순위</p>
            <p className="text-2xl font-bold text-[var(--color-text-primary)]">
              25위 <span className="text-base font-normal text-[var(--color-text-secondary)]">(4,200점)</span>
            </p>
          </div>
          <TrophyOutlineIcon className="w-12 h-12 text-[var(--color-blue-primary)]" />
        </div>
      </div>
    </div>
  );
};

export default HallOfFamePage;

