import React, { useState, useEffect } from 'react';
import { TrophyIcon, StarIcon, FireIcon } from '@heroicons/react/24/solid';
import { TrophyIcon as TrophyOutlineIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { SPORTS_CATEGORIES } from '../constants/sports';
import { KOREAN_CITIES } from '../utils/locationUtils';
import { api } from '../utils/api';
import RankerDetail from './RankerDetail';

interface Ranker {
  id: number;
  rank: number;
  nickname: string;
  tag?: string;
  score: number;
  sportCategory: string;
  region: string;
  year: number;
  badge?: string;
  avatar?: string;
}

const HallOfFamePage = () => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedRegion, setSelectedRegion] = useState<string>('전국');
  const [selectedSport, setSelectedSport] = useState<string>('전체');
  const [selectedRanker, setSelectedRanker] = useState<Ranker | null>(null);
  const [rankings, setRankings] = useState<Ranker[]>([]);
  const [myRank, setMyRank] = useState<{ rank: number | null; score: number } | null>(null);
  const [loading, setLoading] = useState(false);

  // 연도 목록 생성 (현재 연도부터 5년 전까지)
  const years = Array.from({ length: 6 }, (_, i) => currentYear - i);

  // 랭킹 데이터 가져오기
  useEffect(() => {
    const fetchRankings = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          year: selectedYear.toString(),
          region: selectedRegion,
          sport: selectedSport,
          page: '1',
          limit: '50',
        });

        const response = await api.get(`/api/users/hall-of-fame?${params.toString()}`);
        const data = response.data;

        // 랭킹 데이터 포맷팅
        const formattedRankings: Ranker[] = data.rankings.map((r: any, index: number) => ({
          id: r.id,
          rank: r.rank,
          nickname: r.nickname,
          tag: r.tag,
          score: r.score,
          sportCategory: r.sportCategory,
          region: r.region,
          year: r.year,
          badge: r.rank === 1 ? '🥇' : r.rank === 2 ? '🥈' : r.rank === 3 ? '🥉' : undefined,
        }));

        setRankings(formattedRankings);

        // 내 순위 가져오기
        try {
          const myRankResponse = await api.get(
            `/api/users/hall-of-fame/my-rank?${params.toString()}`,
          );
          setMyRank({
            rank: myRankResponse.data.rank,
            score: myRankResponse.data.score,
          });
        } catch (error) {
          // 로그인하지 않은 경우 무시
          setMyRank(null);
        }
      } catch (error) {
        console.error('랭킹 데이터 가져오기 실패:', error);
        setRankings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRankings();
  }, [selectedYear, selectedRegion, selectedSport]);

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

  // 지역명 간소화 (API는 시/도만 사용)
  const getRegionDisplayName = (region: string) => {
    if (region === '전국') return '전국';
    // '서울특별시' -> '서울' 등으로 변환
    return region.replace('특별시', '').replace('광역시', '').replace('특별자치시', '').replace('도', '');
  };

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
        {/* 연도 필터 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
            연도
          </label>
          <div className="flex gap-2 flex-wrap">
            {years.map((year) => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedYear === year
                    ? 'bg-[var(--color-blue-primary)] text-white'
                    : 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] border border-[var(--color-border-card)] hover:bg-[var(--color-bg-secondary)]'
                }`}
              >
                {year}년
              </button>
            ))}
          </div>
        </div>

        {/* 지역 필터 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
            지역
          </label>
          <div className="flex gap-2 flex-wrap">
            {KOREAN_CITIES.map((city) => {
              const displayName = city === '전체' ? '전국' : getRegionDisplayName(city);
              return (
                <button
                  key={city}
                  onClick={() => setSelectedRegion(city === '전체' ? '전국' : city)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedRegion === (city === '전체' ? '전국' : city)
                      ? 'bg-[var(--color-blue-primary)] text-white'
                      : 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] border border-[var(--color-border-card)] hover:bg-[var(--color-bg-secondary)]'
                  }`}
                >
                  {displayName}
                </button>
              );
            })}
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
      {loading ? (
        <div className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-card)] p-12 text-center">
          <p className="text-[var(--color-text-secondary)] text-lg">로딩 중...</p>
        </div>
      ) : rankings.length === 0 ? (
        <div className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-card)] p-12 text-center">
          <TrophyOutlineIcon className="w-16 h-16 mx-auto text-[var(--color-text-secondary)] mb-4" />
          <p className="text-[var(--color-text-secondary)] text-lg">
            선택한 카테고리에 해당하는 랭킹 데이터가 없습니다.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rankings.map((ranker) => (
            <div
              key={ranker.id}
              onClick={() => setSelectedRanker(ranker)}
              className={`flex items-center gap-4 p-4 rounded-xl border-2 ${getRankBackground(ranker.rank)} transition-all hover:scale-[1.02] cursor-pointer`}
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
                    {ranker.tag && <span className="text-sm font-normal text-[var(--color-text-secondary)]">{ranker.tag}</span>}
                  </h3>
                  {ranker.badge && <span className="text-2xl">{ranker.badge}</span>}
                  {ranker.rank <= 3 && (
                    <FireIcon className="w-5 h-5 text-orange-500" />
                  )}
                  <span className="px-2 py-1 bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] text-xs rounded">
                    {ranker.sportCategory}
                  </span>
                  <span className="px-2 py-1 bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] text-xs rounded">
                    {getRegionDisplayName(ranker.region)}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-[var(--color-text-secondary)]">
                  <span>{selectedYear}년</span>
                  <span>총점: {ranker.score.toLocaleString()}점</span>
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

      {/* 내 순위 표시 */}
      {myRank && myRank.rank !== null && (
        <div className="mt-8 p-4 bg-[var(--color-bg-card)] rounded-2xl border-2 border-[var(--color-blue-primary)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--color-text-secondary)] mb-1">나의 순위</p>
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                {myRank.rank}위{' '}
                <span className="text-base font-normal text-[var(--color-text-secondary)]">
                  ({myRank.score.toLocaleString()}점)
                </span>
              </p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                {selectedYear}년 · {getRegionDisplayName(selectedRegion)} · {selectedSport === '전체' ? '전체' : selectedSport}
              </p>
            </div>
            <TrophyOutlineIcon className="w-12 h-12 text-[var(--color-blue-primary)]" />
          </div>
        </div>
      )}

      {/* 랭커 상세 정보 모달 */}
      {selectedRanker && (
        <RankerDetail
          ranker={selectedRanker}
          onClose={() => setSelectedRanker(null)}
        />
      )}
    </div>
  );
};

export default HallOfFamePage;

