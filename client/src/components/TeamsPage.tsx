import React, { useEffect, useState } from 'react';
import { UserGroupIcon, MagnifyingGlassIcon, PlusIcon, ShieldCheckIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

interface TeamParticipant {
  id: number;
  nickname: string;
  tag?: string;
  position: string;
  role?: 'captain' | 'member';
}

interface TeamMembership {
  id: number;
  teamName: string;
  sport: string;
  position?: string;
  role?: 'captain' | 'member';
  logoUrl?: string;
  region?: string;
  description?: string;
  memberCount?: number;
  participants?: TeamParticipant[];
}

/** 근처 지역 추천 (빈 화면 시 타 지역 탐색 유도) */
const NEARBY_REGIONS: Record<string, string[]> = {
  '대전광역시': ['세종특별자치시', '충청북도', '충청남도'],
  '세종특별자치시': ['대전광역시', '충청북도', '충청남도'],
  '충청북도': ['대전광역시', '세종특별자치시', '경기도'],
  '충청남도': ['대전광역시', '세종특별자치시'],
  '서울특별시': ['경기도', '인천광역시'],
  '경기도': ['서울특별시', '인천광역시'],
  '부산광역시': ['경상남도', '울산광역시'],
  '대구광역시': ['경상북도', '경상남도'],
  '인천광역시': ['서울특별시', '경기도'],
  '광주광역시': ['전라남도', '전라북도'],
  '울산광역시': ['부산광역시', '경상남도'],
};

const TeamsPage = () => {
  const { user } = useAuth();
  const [mainTab, setMainTab] = useState<'my' | 'list'>('my');
  const [activeListTab, setActiveListTab] = useState<'nearby' | 'other'>('nearby');
  const [myTeams, setMyTeams] = useState<TeamMembership[]>([]);
  const [teams, setTeams] = useState<TeamMembership[]>([]);
  const [userRegion, setUserRegion] = useState<string | null>(null);
  const [myTeamsLoading, setMyTeamsLoading] = useState(false);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSkill, setFilterSkill] = useState<string>('');
  const [filterDay, setFilterDay] = useState<string>('');
  const [filterAge, setFilterAge] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchUserRegion = async () => {
      try {
        const data = await api.get<{ residenceSido?: string | null }>('/api/auth/me');
        setUserRegion(data?.residenceSido ?? null);
      } catch {
        setUserRegion(null);
      }
    };
    if (user) fetchUserRegion();
  }, [user]);

  useEffect(() => {
    const fetchMyTeams = async () => {
      setMyTeamsLoading(true);
      try {
        const data = await api.get<TeamMembership[]>('/api/teams/me');
        setMyTeams(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('내 크루 로드 실패:', error);
        setMyTeams([]);
      } finally {
        setMyTeamsLoading(false);
      }
    };
    if (user && mainTab === 'my') fetchMyTeams();
  }, [user, mainTab]);

  useEffect(() => {
    const fetchTeams = async () => {
      setTeamsLoading(true);
      try {
        if (activeListTab === 'nearby' && userRegion) {
          const data = await api.get<TeamMembership[]>(`/api/teams/browse?region=${encodeURIComponent(userRegion)}`);
          setTeams(data ?? []);
        } else if (activeListTab === 'other') {
          const params = new URLSearchParams({ excludeRegion: userRegion ?? '' });
          if (searchQuery.trim()) params.set('search', searchQuery.trim());
          const data = await api.get<TeamMembership[]>(`/api/teams/browse?${params.toString()}`);
          setTeams(data ?? []);
        } else {
          setTeams([]);
        }
      } catch (error) {
        console.error('크루 목록 로드 실패:', error);
        setTeams([]);
      } finally {
        setTeamsLoading(false);
      }
    };
    if (mainTab === 'list') fetchTeams();
  }, [mainTab, activeListTab, userRegion, searchQuery]);

  const isLoading = mainTab === 'my' ? myTeamsLoading : teamsLoading;
  const primaryTeam = myTeams[0];

  return (
    <div className="flex flex-col min-h-full bg-[var(--color-bg-primary)]">
      {/* 헤더 — 내정보 페이지 스타일 */}
      <header className="flex-shrink-0 bg-[var(--color-bg-card)] border-b border-[var(--color-border-card)] safe-area-top">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-5 sm:py-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)]">크루</h1>
              <p className="text-sm sm:text-base text-[var(--color-text-secondary)] mt-0.5">
                친해진 플레이어들과 크루를 결성하세요.
              </p>
            </div>
            <Link
              to="/teams/create"
              className="inline-flex items-center justify-center gap-2 px-4 py-3 min-h-[48px] rounded-xl text-sm font-semibold text-white bg-[var(--color-blue-primary)] hover:opacity-90 active:opacity-95 transition-opacity touch-manipulation"
            >
              <PlusIcon className="w-5 h-5" />
              크루 생성
            </Link>
          </div>
        </div>
      </header>

      {/* 내 크루 / 크루 목록 탭 — 내정보 프로필/계정정보 스타일 */}
      <div className="flex-shrink-0 bg-[var(--color-bg-card)] border-b border-[var(--color-border-card)]">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6">
          <div className="flex gap-1.5 sm:gap-2 py-2 sm:py-2.5">
            <button
              type="button"
              onClick={() => setMainTab('my')}
              className={`flex-1 min-h-[48px] py-3 rounded-xl text-sm font-semibold transition-colors active:scale-[0.98] touch-manipulation ${
                mainTab === 'my'
                  ? 'text-white bg-[var(--color-blue-primary)]'
                  : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]'
              }`}
            >
              내 크루
            </button>
            <button
              type="button"
              onClick={() => setMainTab('list')}
              className={`flex-1 min-h-[48px] py-3 rounded-xl text-sm font-semibold transition-colors active:scale-[0.98] touch-manipulation ${
                mainTab === 'list'
                  ? 'text-white bg-[var(--color-blue-primary)]'
                  : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]'
              }`}
            >
              크루 목록
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-4 md:px-6 py-4 sm:py-6 pb-24 md:pb-12 safe-area-pb">
        {/* 내 크루 탭 */}
        {mainTab === 'my' && (
          <div className="space-y-6">
            {isLoading ? (
              <LoadingSpinner fullScreen={false} message="내 크루를 불러오는 중..." />
            ) : myTeams.length === 0 ? (
              <div className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-card)] p-8 text-center">
                <UserGroupIcon className="w-16 h-16 mx-auto text-[var(--color-text-secondary)] mb-4" />
                <p className="text-[var(--color-text-secondary)] mb-6">
                  참여 중인 크루가 없습니다.
                  <br />
                  크루를 만들거나 다른 크루에 참여해 보세요.
                </p>
                <Link
                  to="/teams/create"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-base font-semibold text-white bg-[var(--color-blue-primary)] hover:opacity-90 transition-opacity"
                >
                  <PlusIcon className="w-5 h-5" />
                  크루 만들기
                </Link>
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => setMainTab('list')}
                    className="text-sm text-[var(--color-blue-primary)] hover:underline"
                  >
                    크루 목록에서 둘러보기 →
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* 내 크루 카드 */}
                <section className="space-y-4">
                  <h2 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                    크루 정보
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {myTeams.map((team) => (
                      <Link
                        key={team.id}
                        to={`/teams/${team.id}`}
                        className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl bg-[var(--color-bg-card)] border border-[var(--color-border-card)] hover:border-[var(--color-blue-primary)]/40 active:scale-[0.99] transition-all touch-manipulation group"
                      >
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-[var(--color-bg-secondary)] flex items-center justify-center overflow-hidden shrink-0">
                          {team.logoUrl ? (
                            <img src={team.logoUrl} alt={team.teamName} className="w-full h-full object-contain p-1" />
                          ) : (
                            <UserGroupIcon className="w-8 h-8 text-[var(--color-text-secondary)]" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[var(--color-text-primary)] truncate group-hover:text-[var(--color-blue-primary)]">
                              {team.teamName}
                            </span>
                            {team.role === 'captain' && (
                              <span className="shrink-0 inline-flex items-center gap-0.5 text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                <ShieldCheckIcon className="w-3.5 h-3.5" />
                                캡틴
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-sm text-[var(--color-text-secondary)]">
                            {team.sport && <span>{team.sport}</span>}
                            {team.region && <span>· {team.region}</span>}
                            {team.memberCount != null && <span>· {team.memberCount}명</span>}
                          </div>
                        </div>
                        <ChevronRightIcon className="w-5 h-5 text-[var(--color-text-secondary)] shrink-0" />
                      </Link>
                    ))}
                  </div>
                </section>

                {/* 크루원 목록 — 선택된/첫 번째 크루 기준 */}
                {primaryTeam && (
                  <section className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-card)] overflow-hidden">
                    <div className="px-4 py-3 border-b border-[var(--color-border-card)] flex items-center justify-between">
                      <h2 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                        {primaryTeam.teamName} 크루원
                      </h2>
                      <Link
                        to={`/teams/${primaryTeam.id}`}
                        className="text-sm text-[var(--color-blue-primary)] hover:underline"
                      >
                        상세보기
                      </Link>
                    </div>
                    {(primaryTeam.role === 'captain' || (primaryTeam.participants ?? []).length > 0) ? (
                      <ul className="divide-y divide-[var(--color-border-card)]">
                        {primaryTeam.role === 'captain' && (
                          <li className="flex items-center gap-3 px-4 py-3 bg-[var(--color-bg-secondary)]/50">
                            <div className="w-10 h-10 rounded-full bg-[var(--color-bg-secondary)] flex items-center justify-center shrink-0">
                              <UserGroupIcon className="w-5 h-5 text-[var(--color-text-secondary)]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="font-medium text-[var(--color-text-primary)]">
                                {user?.nickname ?? '나'}
                                <span className="text-xs text-emerald-600 dark:text-emerald-400 ml-1">(캡틴)</span>
                              </span>
                            </div>
                          </li>
                        )}
                        {(primaryTeam.participants ?? []).map((p) => (
                          <li
                            key={p.id}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-bg-secondary)] transition-colors"
                          >
                            <div className="w-10 h-10 rounded-full bg-[var(--color-bg-secondary)] flex items-center justify-center shrink-0">
                              <UserGroupIcon className="w-5 h-5 text-[var(--color-text-secondary)]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="font-medium text-[var(--color-text-primary)]">
                                {p.nickname}
                                {p.tag && <span className="text-[var(--color-text-secondary)] ml-1">{p.tag}</span>}
                              </span>
                              <div className="flex items-center gap-2 mt-0.5">
                                {p.position && (
                                  <span className="text-xs px-2 py-0.5 rounded bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)]">
                                    {p.position}
                                  </span>
                                )}
                                {p.role === 'captain' && (
                                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                    캡틴
                                  </span>
                                )}
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="px-4 py-8 text-center text-sm text-[var(--color-text-secondary)]">
                        크루원 목록이 비어 있습니다.
                      </div>
                    )}
                  </section>
                )}
              </>
            )}
          </div>
        )}

        {/* 크루 목록 탭 */}
        {mainTab === 'list' && (
          <div className="space-y-6">
            <div className="flex items-center gap-1 border-b border-[var(--color-border-card)] overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveListTab('nearby')}
                className={`flex-1 min-w-0 px-3 sm:px-4 py-3 font-medium text-sm transition-colors border-b-2 -mb-px touch-manipulation whitespace-nowrap ${
                  activeListTab === 'nearby'
                    ? 'text-[var(--color-blue-primary)] border-[var(--color-blue-primary)]'
                    : 'text-[var(--color-text-secondary)] border-transparent hover:text-[var(--color-text-primary)]'
                }`}
              >
                내 근처 크루
                {userRegion && <span className="text-xs ml-1 opacity-80">({userRegion})</span>}
              </button>
              <button
                type="button"
                onClick={() => setActiveListTab('other')}
                className={`flex-1 min-w-0 px-3 sm:px-4 py-3 font-medium text-sm transition-colors border-b-2 -mb-px touch-manipulation whitespace-nowrap ${
                  activeListTab === 'other'
                    ? 'text-[var(--color-blue-primary)] border-[var(--color-blue-primary)]'
                    : 'text-[var(--color-text-secondary)] border-transparent hover:text-[var(--color-text-primary)]'
                }`}
              >
                타 지역 크루
              </button>
            </div>

            {activeListTab === 'other' && (
              <div className="mb-4">
                <div className="relative max-w-md">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--color-text-secondary)]" />
                  <input
                    type="text"
                    placeholder="크루명, 지역으로 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full py-2.5 pl-10 pr-4 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-card)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
                  />
                </div>
                <p className="text-xs text-[var(--color-text-secondary)] mt-2">
                  다른 지역의 크루를 검색하여 찾을 수 있습니다.
                </p>
              </div>
            )}

            {/* 필터 (추후 API 연동) */}
            <div>
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] flex items-center gap-1"
              >
                <svg className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                필터 {[filterSkill, filterDay, filterAge].filter(Boolean).length ? `(${[filterSkill, filterDay, filterAge].filter(Boolean).length})` : ''}
              </button>
              {showFilters && (
                <div className="flex flex-wrap items-center gap-3 mt-3 p-3 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border-card)]">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--color-text-secondary)]">실력</span>
                    <select
                      value={filterSkill}
                      onChange={(e) => setFilterSkill(e.target.value)}
                      className="py-1.5 pl-2 pr-7 text-sm border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]"
                    >
                      <option value="">전체</option>
                      <option value="low">하</option>
                      <option value="mid">중</option>
                      <option value="high">상</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--color-text-secondary)]">활동 요일</span>
                    <select
                      value={filterDay}
                      onChange={(e) => setFilterDay(e.target.value)}
                      className="py-1.5 pl-2 pr-7 text-sm border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]"
                    >
                      <option value="">전체</option>
                      <option value="weekday">주중</option>
                      <option value="weekend">주말</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--color-text-secondary)]">연령대</span>
                    <select
                      value={filterAge}
                      onChange={(e) => setFilterAge(e.target.value)}
                      className="py-1.5 pl-2 pr-7 text-sm border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]"
                    >
                      <option value="">전체</option>
                      <option value="20">20대</option>
                      <option value="30">30대</option>
                      <option value="40">40대+</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {isLoading ? (
              <LoadingSpinner fullScreen={false} message="크루 목록을 불러오는 중..." />
            ) : teams.length === 0 ? (
              <div className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-card)] p-8 text-center">
                <p className="text-[var(--color-text-secondary)] mb-6">
                  {activeListTab === 'nearby'
                    ? userRegion
                      ? `${userRegion} 지역에 등록된 크루가 없습니다.`
                      : '지역 정보가 없습니다. 내 정보에서 거주 지역을 설정해주세요.'
                    : searchQuery.trim()
                    ? '검색 조건에 맞는 크루가 없습니다.'
                    : '타 지역 크루를 검색해 보세요.'}
                </p>
                {activeListTab === 'nearby' && userRegion && (
                  <>
                    <Link
                      to="/teams/create"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-base font-semibold text-white bg-[var(--color-blue-primary)] hover:opacity-90 transition-opacity"
                    >
                      <PlusIcon className="w-5 h-5" />
                      첫 번째 크루 만들기
                    </Link>
                    {NEARBY_REGIONS[userRegion] && NEARBY_REGIONS[userRegion].length > 0 && (
                      <div className="mt-8 pt-6 border-t border-[var(--color-border-card)]">
                        <p className="text-sm text-[var(--color-text-secondary)] mb-3">근처 지역 크루도 살펴보기</p>
                        <div className="flex flex-wrap justify-center gap-2">
                          {NEARBY_REGIONS[userRegion].map((region) => (
                            <button
                              key={region}
                              type="button"
                              onClick={() => {
                                setActiveListTab('other');
                                setSearchQuery(region);
                              }}
                              className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--color-text-primary)] bg-[var(--color-bg-secondary)] border border-[var(--color-border-card)] hover:border-[var(--color-blue-primary)]/50 transition-colors"
                            >
                              {region.replace('광역시', '').replace('특별시', '').replace('특별자치시', '').replace('도', '')}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
                {activeListTab === 'other' && !searchQuery.trim() && (
                  <p className="text-sm text-[var(--color-text-secondary)]">위 검색창에 크루명 또는 지역을 입력해 보세요.</p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
                {teams.map((team) => (
                  <Link
                    key={team.id}
                    to={`/teams/${team.id}`}
                    className="group flex flex-col items-center touch-manipulation active:scale-[0.98] transition-transform"
                  >
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[var(--color-bg-card)] border border-[var(--color-border-card)] flex items-center justify-center overflow-hidden shadow-sm group-hover:shadow-md group-hover:border-[var(--color-blue-primary)]/30 transition-all">
                      {team.logoUrl ? (
                        <img src={team.logoUrl} alt={team.teamName} className="w-full h-full object-contain p-1" />
                      ) : (
                        <UserGroupIcon className="w-10 h-10 sm:w-12 sm:h-12 text-[var(--color-text-secondary)] group-hover:text-[var(--color-blue-primary)] transition-colors" />
                      )}
                    </div>
                    <span className="mt-3 text-sm font-medium text-[var(--color-text-primary)] text-center line-clamp-2 group-hover:text-[var(--color-blue-primary)] transition-colors">
                      {team.teamName}
                    </span>
                    {team.region && (
                      <span className="text-xs text-[var(--color-text-secondary)] mt-0.5">{team.region}</span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamsPage;
