import React, { useEffect, useState } from 'react';
import { UserGroupIcon, MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

interface TeamMembership {
  id: number;
  teamName: string;
  sport: string;
  position?: string;
  role?: 'captain' | 'member';
  logoUrl?: string;
  region?: string;
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
  const [activeTab, setActiveTab] = useState<'nearby' | 'other'>('nearby');
  const [teams, setTeams] = useState<TeamMembership[]>([]);
  const [userRegion, setUserRegion] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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
    const fetchTeams = async () => {
      setIsLoading(true);
      try {
        if (activeTab === 'nearby' && userRegion) {
          const data = await api.get<TeamMembership[]>(`/api/teams/browse?region=${encodeURIComponent(userRegion)}`);
          setTeams(data ?? []);
        } else if (activeTab === 'other') {
          const params = new URLSearchParams({ excludeRegion: userRegion ?? '' });
          if (searchQuery.trim()) params.set('search', searchQuery.trim());
          const data = await api.get<TeamMembership[]>(`/api/teams/browse?${params.toString()}`);
          setTeams(data ?? []);
        } else {
          setTeams([]);
        }
      } catch (error) {
        console.error('용병 클럽 목록 로드 실패:', error);
        setTeams([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTeams();
  }, [activeTab, userRegion, searchQuery]);

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto w-full pb-12">
      <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">용병 클럽</h2>
        <Link
          to="/teams/create"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white bg-[var(--color-blue-primary)] hover:opacity-90 transition-opacity"
        >
          <PlusIcon className="w-4 h-4" />
          용병 클럽 생성
        </Link>
      </div>

      <div className="flex items-center gap-2 border-b border-[var(--color-border-card)] mb-6">
        <button
          type="button"
          onClick={() => setActiveTab('nearby')}
          className={`px-4 py-2.5 font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 'nearby'
              ? 'text-[var(--color-blue-primary)] border-[var(--color-blue-primary)]'
              : 'text-[var(--color-text-secondary)] border-transparent hover:text-[var(--color-text-primary)]'
          }`}
        >
          내 근처 용병 클럽
          {userRegion && <span className="text-xs ml-1 opacity-80">({userRegion})</span>}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('other')}
          className={`px-4 py-2.5 font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 'other'
              ? 'text-[var(--color-blue-primary)] border-[var(--color-blue-primary)]'
              : 'text-[var(--color-text-secondary)] border-transparent hover:text-[var(--color-text-primary)]'
          }`}
        >
          타 지역 용병 클럽
        </button>
      </div>

      {activeTab === 'other' && (
        <div className="mb-6">
          <div className="relative max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--color-text-secondary)]" />
            <input
              type="text"
              placeholder="용병 클럽명, 지역으로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-2.5 pl-10 pr-4 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-card)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
            />
          </div>
          <p className="text-xs text-[var(--color-text-secondary)] mt-2">
            다른 지역의 용병 클럽을 검색하여 찾을 수 있습니다.
          </p>
        </div>
      )}

      {/* 필터 (실력·요일·연령) — 추후 API 연동 확장 */}
      <div className="mb-4">
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
        <LoadingSpinner fullScreen={false} message="용병 클럽 목록을 불러오는 중..." />
      ) : teams.length === 0 ? (
        <div className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-card)] p-8 text-center">
          <p className="text-[var(--color-text-secondary)] mb-6">
            {activeTab === 'nearby'
              ? userRegion
                ? `${userRegion} 지역에 등록된 용병 클럽이 없습니다.`
                : '지역 정보가 없습니다. 내 정보에서 거주 지역을 설정해주세요.'
              : searchQuery.trim()
              ? '검색 조건에 맞는 용병 클럽이 없습니다.'
              : '타 지역 용병 클럽을 검색해 보세요.'}
          </p>
          {activeTab === 'nearby' && userRegion && (
            <>
              <Link
                to="/teams/create"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-base font-semibold text-white bg-[var(--color-blue-primary)] hover:opacity-90 transition-opacity"
              >
                <PlusIcon className="w-5 h-5" />
                첫 번째 용병 클럽 만들기
              </Link>
              {NEARBY_REGIONS[userRegion] && NEARBY_REGIONS[userRegion].length > 0 && (
                <div className="mt-8 pt-6 border-t border-[var(--color-border-card)]">
                  <p className="text-sm text-[var(--color-text-secondary)] mb-3">근처 지역 용병 클럽도 살펴보기</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {NEARBY_REGIONS[userRegion].map((region) => (
                      <button
                        key={region}
                        type="button"
                        onClick={() => {
                          setActiveTab('other');
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
          {activeTab === 'other' && !searchQuery.trim() && (
            <p className="text-sm text-[var(--color-text-secondary)]">위 검색창에 용병 클럽명 또는 지역을 입력해 보세요.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {teams.map((team) => (
            <Link
              key={team.id}
              to={`/teams/${team.id}`}
              className="group flex flex-col items-center"
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
                <span className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                  {team.region}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeamsPage;
