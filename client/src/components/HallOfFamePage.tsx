import React, { useState, useEffect } from 'react';
import { TrophyIcon, StarIcon, FireIcon, SparklesIcon } from '@heroicons/react/24/solid';
import { TrophyIcon as TrophyOutlineIcon, FunnelIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { SPORTS_CATEGORIES } from '../constants/sports';
import { KOREAN_CITIES, getRegionDisplayName } from '../utils/locationUtils';
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
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
    return <span className="text-[var(--color-text-secondary)] font-bold text-lg">{rank}</span>;
  };

  const getRankBackground = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400/10 to-yellow-600/10 border-yellow-400/30';
    if (rank === 2) return 'bg-gradient-to-r from-gray-300/10 to-gray-400/10 border-gray-300/30';
    if (rank === 3) return 'bg-gradient-to-r from-orange-400/10 to-orange-600/10 border-orange-400/30';
    return 'bg-[var(--color-bg-card)] border-[var(--color-border-card)]';
  };

  return (
    <div className="flex flex-col flex-1 w-full min-h-0 bg-[var(--color-bg-primary)]">
      {/* 히어로 섹션 (스포츠용품 스타일) */}
      <header className="flex-shrink-0 bg-[var(--color-bg-card)] border-b border-[var(--color-border-card)]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl">
              <TrophyIcon className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)]">
              명예의 전당
            </h1>
          </div>
          <p className="text-[var(--color-text-secondary)] mb-6 max-w-2xl">
            가장 활동적이고 뛰어난 운동인들의 기록을 확인하세요. 당신도 명예의 전당에 이름을 올릴 수 있습니다.
          </p>
          {/* 내 순위 표시 (히어로 내부) */}
          {myRank && myRank.rank !== null && (
            <div className="inline-flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-400/30 rounded-xl">
              <TrophyOutlineIcon className="w-6 h-6 text-[var(--color-blue-primary)]" />
              <div>
                <p className="text-xs text-[var(--color-text-secondary)]">나의 순위</p>
                <p className="text-lg font-bold text-[var(--color-text-primary)]">
                  {myRank.rank}위{' '}
                  <span className="text-sm font-normal text-[var(--color-text-secondary)]">
                    ({myRank.score.toLocaleString()}점)
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* 메인: 좌측 사이드바 + 랭킹 그리드 */}
      <div className="flex flex-1 min-h-0 max-w-7xl mx-auto w-full px-4 md:px-6 py-6">
        {/* 좌측 필터 사이드바 (스포츠용품 스타일) */}
        <aside
          className={`flex-shrink-0 border-r border-[var(--color-border-card)] pr-6 transition-all duration-200 ${
            sidebarOpen ? 'w-56 min-w-[14rem] md:w-64 md:min-w-[16rem]' : 'w-0 overflow-hidden pr-0 opacity-0'
          }`}
        >
          <div className="sticky top-4 space-y-6">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
              필터 <span className="text-[var(--color-text-secondary)] font-normal">({rankings.length})</span>
            </h2>

            {/* 연도 필터 (드롭다운) */}
            <div>
              <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">연도</p>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full py-2.5 pl-3 pr-8 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)] appearance-none bg-no-repeat bg-[length:1rem_1rem] bg-[right_0.5rem_center]"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")` }}
              >
                {years.map((year) => (
                  <option key={year} value={year}>{year}년</option>
                ))}
              </select>
            </div>

            {/* 지역 필터 */}
            <div className="pt-4 border-t border-[var(--color-border-card)] min-w-0">
              <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">지역</p>
              <div className="space-y-1 max-h-64 overflow-y-auto overflow-x-hidden min-w-0">
                {KOREAN_CITIES.map((city) => {
                  const displayName = city === '전체' ? '전국' : getRegionDisplayName(city);
                  const regionValue = city === '전체' ? '전국' : city;
                  return (
                    <button
                      key={city}
                      type="button"
                      onClick={() => setSelectedRegion(regionValue)}
                      className={`block w-full min-w-0 text-left py-2 px-3 text-sm rounded-lg transition-colors break-words whitespace-normal ${
                        selectedRegion === regionValue
                          ? 'font-semibold text-[var(--color-blue-primary)] bg-[var(--color-blue-primary)]/10'
                          : 'text-[var(--color-text-primary)] hover:text-[var(--color-blue-primary)] hover:bg-[var(--color-bg-secondary)]'
                      }`}
                    >
                      {displayName}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 운동 카테고리 필터 */}
            <div className="pt-4 border-t border-[var(--color-border-card)]">
              <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">
                <FunnelIcon className="w-3.5 h-3.5 inline mr-1" />
                운동 종목
              </p>
              <div className="space-y-1">
                {SPORTS_CATEGORIES.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setSelectedSport(category)}
                    className={`block w-full text-left py-2 px-3 text-sm rounded-lg transition-colors ${
                      selectedSport === category
                        ? 'font-semibold text-[var(--color-blue-primary)] bg-[var(--color-blue-primary)]/10'
                        : 'text-[var(--color-text-primary)] hover:text-[var(--color-blue-primary)] hover:bg-[var(--color-bg-secondary)]'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* 메인 콘텐츠: 툴바 + 랭킹 그리드 */}
        <main className="flex-1 min-w-0 pl-6">
          {/* 툴바: 필터 숨기기 / 정보 */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-primary)] hover:text-[var(--color-blue-primary)] transition-colors"
            >
              {sidebarOpen ? (
                <>
                  <XMarkIcon className="w-4 h-4" />
                  필터 숨기기
                </>
              ) : (
                <>
                  <Bars3Icon className="w-4 h-4" />
                  필터 보기
                </>
              )}
            </button>
            <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
              <SparklesIcon className="w-4 h-4" />
              <span>{selectedYear}년 · {getRegionDisplayName(selectedRegion)} · {selectedSport}</span>
            </div>
          </div>

          {/* 랭킹 그리드 */}
          {loading ? (
            <div className="py-16 text-center text-[var(--color-text-secondary)]">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[var(--color-border-card)] border-t-[var(--color-blue-primary)] mb-4"></div>
              <p className="text-lg">로딩 중...</p>
            </div>
          ) : rankings.length === 0 ? (
            <div className="py-16 text-center text-[var(--color-text-secondary)]">
              <TrophyOutlineIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg">선택한 카테고리에 해당하는 랭킹 데이터가 없습니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {rankings.map((ranker) => (
                <div
                  key={ranker.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedRanker(ranker)}
                  onKeyDown={(e) => e.key === 'Enter' && setSelectedRanker(ranker)}
                  className={`group flex items-center gap-4 p-4 md:p-5 rounded-xl border-2 ${getRankBackground(ranker.rank)} transition-all hover:shadow-lg hover:scale-[1.01] cursor-pointer`}
                >
                  {/* 순위 */}
                  <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
                    {getRankIcon(ranker.rank)}
                  </div>

                  {/* 프로필 */}
                  <div className="flex-shrink-0">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                      {ranker.nickname.charAt(0)}
                    </div>
                  </div>

                  {/* 정보 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-lg font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-blue-primary)] transition-colors">
                        {ranker.nickname}
                      </h3>
                      {ranker.tag && (
                        <span className="text-sm font-normal text-[var(--color-text-secondary)]">{ranker.tag}</span>
                      )}
                      {ranker.badge && <span className="text-2xl">{ranker.badge}</span>}
                      {ranker.rank <= 3 && (
                        <FireIcon className="w-5 h-5 text-orange-500 animate-pulse" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-1 bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] text-xs rounded-lg font-medium">
                        {ranker.sportCategory}
                      </span>
                      <span className="px-2.5 py-1 bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] text-xs rounded-lg font-medium">
                        {getRegionDisplayName(ranker.region)}
                      </span>
                      <span className="text-xs text-[var(--color-text-secondary)]">
                        {selectedYear}년
                      </span>
                    </div>
                  </div>

                  {/* 점수 */}
                  <div className="flex-shrink-0 text-right">
                    <div className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)]">
                      {ranker.score.toLocaleString()}
                    </div>
                    <div className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wider">점수</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

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
