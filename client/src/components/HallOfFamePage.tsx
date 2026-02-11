import React, { useState, useEffect } from 'react';
import { TrophyIcon, SparklesIcon, UserCircleIcon } from '@heroicons/react/24/solid';
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

  const years = Array.from({ length: 6 }, (_, i) => currentYear - i);

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
        const formattedRankings: Ranker[] = data.rankings.map((r: any, index: number) => ({
          id: r.id,
          rank: r.rank,
          nickname: r.nickname,
          tag: r.tag,
          score: r.score,
          sportCategory: r.sportCategory,
          region: r.region,
          year: r.year,
          avatar: r.avatar,
        }));
        setRankings(formattedRankings);
        try {
          const myRankResponse = await api.get(`/api/users/hall-of-fame/my-rank?${params.toString()}`);
          setMyRank({ rank: myRankResponse.data.rank, score: myRankResponse.data.score });
        } catch {
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

  const topThree = rankings.slice(0, 3);
  const restRankings = rankings.slice(3);
  const first = topThree[0];
  const second = topThree[1];
  const third = topThree[2];

  return (
    <div className="flex flex-col w-full bg-[var(--color-bg-primary)] relative">
      {/* 배경 그라데이션 (다크블루 + 네온 블루/퍼플 포인트) */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        aria-hidden
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(59, 130, 246, 0.15), transparent), radial-gradient(ellipse 60% 40% at 80% 50%, rgba(139, 92, 246, 0.08), transparent), radial-gradient(ellipse 60% 40% at 20% 60%, rgba(34, 211, 238, 0.06), transparent)',
        }}
      />

      <header className="flex-shrink-0 relative z-10 border-b border-[var(--color-border-card)]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-10">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="p-3 rounded-xl"
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%)',
                boxShadow: '0 0 24px rgba(59, 130, 246, 0.4)',
              }}
            >
              <TrophyIcon className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)] tracking-tight">
              명예의 전당
            </h1>
          </div>
          <p className="text-[var(--color-text-secondary)] max-w-2xl">
            가장 활동적이고 뛰어난 운동인들의 기록입니다. 당신도 여기에 이름을 올리세요.
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto w-full px-4 md:px-6 py-6 relative z-10 flex flex-row">
        <aside
          className={`flex-shrink-0 border-r border-[var(--color-border-card)] pr-6 transition-all duration-200 ${
            sidebarOpen ? 'w-56 min-w-[14rem] md:w-64 md:min-w-[16rem]' : 'w-0 overflow-hidden pr-0 opacity-0'
          }`}
        >
          <div className="sticky top-4 space-y-6">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
              필터 <span className="text-[var(--color-text-secondary)] font-normal">({rankings.length})</span>
            </h2>
            <div>
              <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">연도</p>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full py-2.5 pl-3 pr-8 rounded-lg bg-[var(--color-bg-card)] border border-[var(--color-border-card)] text-[var(--color-text-primary)] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-cyan-400/50 appearance-none bg-no-repeat bg-[length:1rem_1rem] bg-[right_0.5rem_center]"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")` }}
              >
                {years.map((year) => (
                  <option key={year} value={year}>{year}년</option>
                ))}
              </select>
            </div>
            <div className="pt-4 border-t border-[var(--color-border-card)]">
              <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">지역</p>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="w-full py-2.5 pl-3 pr-8 rounded-lg bg-[var(--color-bg-card)] border border-[var(--color-border-card)] text-[var(--color-text-primary)] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-cyan-400/50 appearance-none bg-no-repeat bg-[length:1rem_1rem] bg-[right_0.5rem_center]"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")` }}
              >
                {KOREAN_CITIES.map((city) => {
                  const displayName = city === '전체' ? '전국' : getRegionDisplayName(city);
                  const regionValue = city === '전체' ? '전국' : city;
                  return (
                    <option key={city} value={regionValue}>
                      {displayName}
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="pt-4 border-t border-[var(--color-border-card)]">
              <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">
                <FunnelIcon className="w-3.5 h-3.5 inline mr-1" /> 운동 종목
              </p>
              <select
                value={selectedSport}
                onChange={(e) => setSelectedSport(e.target.value)}
                className="w-full py-2.5 pl-3 pr-8 rounded-lg bg-[var(--color-bg-card)] border border-[var(--color-border-card)] text-[var(--color-text-primary)] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-cyan-400/50 appearance-none bg-no-repeat bg-[length:1rem_1rem] bg-[right_0.5rem_center]"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")` }}
              >
                {SPORTS_CATEGORIES.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        </aside>

        <main className="flex-1 min-w-0 pl-6 pb-24">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-primary)] hover:text-cyan-400 transition-colors"
            >
              {sidebarOpen ? <><XMarkIcon className="w-4 h-4" /> 필터 숨기기</> : <><Bars3Icon className="w-4 h-4" /> 필터 보기</>}
            </button>
            <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
              <SparklesIcon className="w-4 h-4 text-cyan-400/80" />
              <span>{selectedYear}년 · {getRegionDisplayName(selectedRegion)} · {selectedSport}</span>
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-white/10 border-t-cyan-400 mb-4" />
              <p className="text-[var(--color-text-secondary)]">로딩 중...</p>
            </div>
          ) : rankings.length === 0 ? (
            <div className="py-20 text-center text-[var(--color-text-secondary)]">
              <TrophyOutlineIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg">선택한 조건에 해당하는 랭킹이 없습니다.</p>
            </div>
          ) : (
            <>
              {/* 포디움: 2위(왼쪽), 1위(가운데), 3위(오른쪽) */}
              {topThree.length >= 3 && (
                <section className="mb-12">
                  <div className="flex items-end justify-center gap-2 md:gap-4 max-w-4xl mx-auto" style={{ minHeight: '320px' }}>
                    {/* 2위 */}
                    <div
                      className="flex-1 flex flex-col items-center order-1 md:order-1 cursor-pointer"
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedRanker(second)}
                      onKeyDown={(e) => e.key === 'Enter' && setSelectedRanker(second)}
                    >
                      <div
                        className="relative mb-3 transition-transform hover:scale-105"
                        style={{ marginBottom: '0.75rem' }}
                      >
                        <div
                          className="w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center text-2xl font-bold border-4 border-white/20 overflow-hidden bg-slate-600/80"
                          style={{ boxShadow: '0 0 20px rgba(203, 213, 225, 0.3)' }}
                        >
                          {second.avatar ? (
                            <img src={second.avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-white">{second.nickname.charAt(0)}</span>
                          )}
                        </div>
                        <div className="absolute -top-1 -right-1 w-9 h-9 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center shadow-lg border-2 border-white/30">
                          <span className="text-white font-black text-lg">2</span>
                        </div>
                      </div>
                      <p className="text-sm md:text-base font-bold text-[var(--color-text-primary)] truncate max-w-full px-1 text-center">
                        {second.nickname}
                        {second.tag && <span className="text-[var(--color-text-secondary)] font-normal ml-1">{second.tag}</span>}
                      </p>
                      <p className="text-lg md:text-xl font-black text-cyan-400 mt-1">{second.score.toLocaleString()} RP</p>
                      <div
                        className="w-full mt-4 rounded-t-xl flex flex-col items-center justify-end pt-4 pb-2"
                        style={{
                          height: '140px',
                          background: 'linear-gradient(180deg, rgba(148, 163, 184, 0.25) 0%, rgba(71, 85, 105, 0.4) 100%)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderBottom: 'none',
                          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
                        }}
                      >
                        <span className="text-2xl">🥈</span>
                        <span className="text-xs font-semibold text-white/90 mt-1">2nd</span>
                      </div>
                    </div>

                    {/* 1위 (가운데, 가장 크게 + 글로우) */}
                    <div
                      className="flex-1 flex flex-col items-center order-0 md:order-2 cursor-pointer"
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedRanker(first)}
                      onKeyDown={(e) => e.key === 'Enter' && setSelectedRanker(first)}
                    >
                      <div
                        className="relative mb-3 transition-transform hover:scale-105"
                        style={{
                          filter: 'drop-shadow(0 0 24px rgba(250, 204, 21, 0.5)) drop-shadow(0 0 48px rgba(250, 204, 21, 0.25))',
                        }}
                      >
                        <div
                          className="w-28 h-28 md:w-32 md:h-32 rounded-full flex items-center justify-center text-3xl font-bold border-4 border-amber-400/50 overflow-hidden bg-gradient-to-br from-amber-500/90 to-yellow-600/90"
                          style={{
                            boxShadow: '0 0 0 4px rgba(250, 204, 21, 0.2), 0 0 40px rgba(250, 204, 21, 0.4)',
                          }}
                        >
                          {first.avatar ? (
                            <img src={first.avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-white">{first.nickname.charAt(0)}</span>
                          )}
                        </div>
                        <div className="absolute -top-1 -right-1 w-11 h-11 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg border-2 border-amber-200/50">
                          <span className="text-white font-black text-xl">1</span>
                        </div>
                      </div>
                      <p className="text-base md:text-lg font-bold text-[var(--color-text-primary)] truncate max-w-full px-1 text-center">
                        {first.nickname}
                        {first.tag && <span className="text-[var(--color-text-secondary)] font-normal ml-1">{first.tag}</span>}
                      </p>
                      <p className="text-xl md:text-2xl font-black bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent mt-1">
                        {first.score.toLocaleString()} RP
                      </p>
                      <div
                        className="w-full mt-4 rounded-t-xl flex flex-col items-center justify-end pt-4 pb-2"
                        style={{
                          height: '180px',
                          background: 'linear-gradient(180deg, rgba(250, 204, 21, 0.2) 0%, rgba(245, 158, 11, 0.35) 100%)',
                          border: '1px solid rgba(250, 204, 21, 0.3)',
                          borderBottom: 'none',
                          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 0 24px rgba(250, 204, 21, 0.15)',
                        }}
                      >
                        <span className="text-4xl">🥇</span>
                        <span className="text-sm font-bold text-amber-200 mt-1">1st</span>
                      </div>
                    </div>

                    {/* 3위 */}
                    <div
                      className="flex-1 flex flex-col items-center order-2 md:order-3 cursor-pointer"
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedRanker(third)}
                      onKeyDown={(e) => e.key === 'Enter' && setSelectedRanker(third)}
                    >
                      <div className="relative mb-3 transition-transform hover:scale-105" style={{ marginBottom: '0.75rem' }}>
                        <div
                          className="w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center text-2xl font-bold border-4 border-white/20 overflow-hidden bg-amber-800/80"
                          style={{ boxShadow: '0 0 20px rgba(217, 119, 6, 0.3)' }}
                        >
                          {third.avatar ? (
                            <img src={third.avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-white">{third.nickname.charAt(0)}</span>
                          )}
                        </div>
                        <div className="absolute -top-1 -right-1 w-9 h-9 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center shadow-lg border-2 border-white/30">
                          <span className="text-white font-black text-lg">3</span>
                        </div>
                      </div>
                      <p className="text-sm md:text-base font-bold text-[var(--color-text-primary)] truncate max-w-full px-1 text-center">
                        {third.nickname}
                        {third.tag && <span className="text-[var(--color-text-secondary)] font-normal ml-1">{third.tag}</span>}
                      </p>
                      <p className="text-lg md:text-xl font-black text-amber-400/90 mt-1">{third.score.toLocaleString()} RP</p>
                      <div
                        className="w-full mt-4 rounded-t-xl flex flex-col items-center justify-end pt-4 pb-2"
                        style={{
                          height: '120px',
                          background: 'linear-gradient(180deg, rgba(217, 119, 6, 0.25) 0%, rgba(180, 83, 9, 0.4) 100%)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderBottom: 'none',
                          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
                        }}
                      >
                        <span className="text-2xl">🥉</span>
                        <span className="text-xs font-semibold text-white/90 mt-1">3rd</span>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* 4위~ 카드 리스트 (글래스모피즘 + 호버 리프트) */}
              {restRankings.length > 0 && (
                <section>
                  <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                    <span className="w-1 h-5 rounded-full bg-gradient-to-b from-cyan-400 to-purple-500" />
                    랭킹 4위 ~
                  </h2>
                  <div className="grid grid-cols-1 gap-3">
                    {restRankings.map((ranker) => (
                      <div
                        key={ranker.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedRanker(ranker)}
                        onKeyDown={(e) => e.key === 'Enter' && setSelectedRanker(ranker)}
                        className="group flex items-center gap-4 p-4 md:p-5 rounded-xl border border-white/10 transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-500/10 hover:border-cyan-400/20"
                        style={{
                          background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
                          backdropFilter: 'blur(12px)',
                          WebkitBackdropFilter: 'blur(12px)',
                        }}
                      >
                        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-white/5 text-[var(--color-text-secondary)] font-bold text-lg group-hover:text-cyan-400 transition-colors">
                          {ranker.rank}
                        </div>
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500/80 to-purple-600/80 flex items-center justify-center text-white font-bold text-lg overflow-hidden border-2 border-white/10">
                            {ranker.avatar ? (
                              <img src={ranker.avatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                              ranker.nickname.charAt(0)
                            )}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-[var(--color-text-primary)] group-hover:text-cyan-400/90 transition-colors truncate">
                            {ranker.nickname}
                            {ranker.tag && <span className="font-normal text-[var(--color-text-secondary)] ml-1">{ranker.tag}</span>}
                          </p>
                          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                            {ranker.sportCategory} · {getRegionDisplayName(ranker.region)}
                          </p>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <p className="text-xl md:text-2xl font-black bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                            {ranker.score.toLocaleString()} RP
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* 1~3명만 있을 때 리스트 없이 포디움만 있는 경우: 1~2명이면 포디움 비표시하고 리스트로만 */}
              {topThree.length > 0 && topThree.length < 3 && (
                <section>
                  <div className="grid grid-cols-1 gap-3">
                    {rankings.map((ranker) => (
                      <div
                        key={ranker.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedRanker(ranker)}
                        onKeyDown={(e) => e.key === 'Enter' && setSelectedRanker(ranker)}
                        className="group flex items-center gap-4 p-4 md:p-5 rounded-xl border border-white/10 transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-500/10"
                        style={{
                          background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
                          backdropFilter: 'blur(12px)',
                        }}
                      >
                        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-white/5 text-[var(--color-text-secondary)] font-bold text-lg">
                          {ranker.rank}
                        </div>
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500/80 to-purple-600/80 flex items-center justify-center text-white font-bold overflow-hidden">
                            {ranker.avatar ? <img src={ranker.avatar} alt="" className="w-full h-full object-cover" /> : ranker.nickname.charAt(0)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-[var(--color-text-primary)]">{ranker.nickname}{ranker.tag && <span className="text-[var(--color-text-secondary)] ml-1">{ranker.tag}</span>}</p>
                          <p className="text-xs text-[var(--color-text-secondary)]">{ranker.sportCategory} · {getRegionDisplayName(ranker.region)}</p>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <p className="text-xl font-black bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">{ranker.score.toLocaleString()} RP</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </main>
      </div>

      {/* 플로팅: 내 순위 바 (하단 고정) */}
      {myRank && (myRank.rank != null || myRank.score > 0) && (
        <div
          className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center px-4 py-4 border-t border-white/10"
          style={{
            background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 -4px 24px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.05)',
          }}
        >
          <div className="flex items-center gap-4 max-w-md w-full">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-r from-cyan-500/90 to-purple-600/90 flex items-center justify-center border-2 border-white/20">
              <UserCircleIcon className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wider">My Rank</p>
              <p className="text-lg font-bold text-[var(--color-text-primary)]">
                {myRank.rank != null ? `${myRank.rank}위` : '순위 없음'}
                <span className="text-[var(--color-text-secondary)] font-normal ml-2">({myRank.score.toLocaleString()} RP)</span>
              </p>
            </div>
            <div className="flex-shrink-0 px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-400/30">
              <span className="text-cyan-400 font-black text-lg">{myRank.score.toLocaleString()} RP</span>
            </div>
          </div>
        </div>
      )}

      {selectedRanker && (
        <RankerDetail ranker={selectedRanker} onClose={() => setSelectedRanker(null)} />
      )}
    </div>
  );
};

export default HallOfFamePage;
