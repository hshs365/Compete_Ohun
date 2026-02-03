import React, { useEffect, useState } from 'react';
import { UserGroupIcon, MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import { TEAM_PAGE_SPORTS } from '../constants/sports';

interface TeamMembership {
  id: number;
  teamName: string;
  sport: string;
  position?: string;
  role?: 'captain' | 'member';
  logoUrl?: string;
  region?: string;
}

const SPORT_CARD_THEME: Record<string, { bg: string; border: string; text: string }> = {
  축구: { bg: 'from-green-900 to-green-950', border: 'border-green-400 hover:border-green-300', text: 'text-green-100' },
  풋살: { bg: 'from-emerald-900 to-emerald-950', border: 'border-emerald-400 hover:border-emerald-300', text: 'text-emerald-100' },
  농구: { bg: 'from-orange-900 to-orange-950', border: 'border-orange-400 hover:border-orange-300', text: 'text-orange-100' },
  야구: { bg: 'from-amber-900 to-amber-950', border: 'border-amber-400 hover:border-amber-300', text: 'text-amber-100' },
};
const DEFAULT_CARD_THEME = { bg: 'from-gray-800 to-gray-900', border: 'border-gray-400 hover:border-gray-300', text: 'text-gray-100' };

const TeamsPage = () => {
  const { user } = useAuth();
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'nearby' | 'other'>('nearby');
  const [teams, setTeams] = useState<TeamMembership[]>([]);
  const [userRegion, setUserRegion] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
    if (!selectedSport) {
      setTeams([]);
      return;
    }
    const fetchTeams = async () => {
      setIsLoading(true);
      try {
        if (activeTab === 'nearby' && userRegion) {
          const data = await api.get<TeamMembership[]>(`/api/teams/browse?sport=${encodeURIComponent(selectedSport)}&region=${encodeURIComponent(userRegion)}`);
          setTeams(data ?? []);
        } else if (activeTab === 'other') {
          const params = new URLSearchParams({ sport: selectedSport, excludeRegion: userRegion ?? '' });
          if (searchQuery.trim()) params.set('search', searchQuery.trim());
          const data = await api.get<TeamMembership[]>(`/api/teams/browse?${params.toString()}`);
          setTeams(data ?? []);
        } else {
          setTeams([]);
        }
      } catch (error) {
        console.error('팀 목록 로드 실패:', error);
        setTeams([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTeams();
  }, [selectedSport, activeTab, userRegion, searchQuery]);

  const refreshTeams = () => {
    if (selectedSport) {
      if (activeTab === 'nearby' && userRegion) {
        api.get<TeamMembership[]>(`/api/teams/browse?sport=${encodeURIComponent(selectedSport)}&region=${encodeURIComponent(userRegion)}`)
          .then((data) => setTeams(data ?? []))
          .catch(() => setTeams([]));
      } else if (activeTab === 'other') {
        const params = new URLSearchParams({ sport: selectedSport, excludeRegion: userRegion ?? '' });
        if (searchQuery.trim()) params.set('search', searchQuery.trim());
        api.get<TeamMembership[]>(`/api/teams/browse?${params.toString()}`)
          .then((data) => setTeams(data ?? []))
          .catch(() => setTeams([]));
      }
    }
  };

  // 1단계: 종목 선택 (웅장한 스케일) - 팀 생성 버튼 없음
  if (!selectedSport) {
    return (
      <div className="flex flex-col flex-1 w-full overflow-hidden relative">
        <div className="flex-shrink-0 px-4 pt-6 pb-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] mb-1">
            종목을 선택하세요
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)]">
            종목을 고르면 내 근처 팀과 타 지역 클럽을 볼 수 있습니다.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-4 p-4 overflow-auto max-w-2xl md:max-w-3xl mx-auto">
          {TEAM_PAGE_SPORTS.map((sport) => {
            const theme = SPORT_CARD_THEME[sport] ?? DEFAULT_CARD_THEME;
            return (
              <button
                key={sport}
                type="button"
                onClick={() => setSelectedSport(sport)}
                className={`
                  w-[160px] min-h-[120px] md:w-[200px] md:min-h-[140px]
                  flex flex-col items-center justify-center gap-2 p-4
                  bg-gradient-to-b ${theme.bg} border-2 ${theme.border}
                  rounded-lg md:rounded-xl
                  transition-all duration-200 hover:scale-[1.02] hover:shadow-2xl hover:brightness-110
                  relative overflow-hidden
                `}
              >
                <span className={`text-xl md:text-2xl font-bold ${theme.text} relative z-10`}>{sport}</span>
                <p className="text-xs text-gray-300 text-center relative z-10">클릭하여 팀 보기</p>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // 2단계: 내 근처 / 타 지역 탭
  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto w-full pb-12">
      <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSelectedSport(null)}
            className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            종목 변경
          </button>
          <span className="text-sm text-[var(--color-text-secondary)]">{selectedSport} 팀</span>
        </div>
        <Link
          to={selectedSport ? `/teams/create?sport=${encodeURIComponent(selectedSport)}` : '/teams/create'}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white bg-[var(--color-blue-primary)] hover:opacity-90 transition-opacity"
        >
          <PlusIcon className="w-4 h-4" />
          팀 생성
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
          내 근처 팀
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
          타 지역 클럽
        </button>
      </div>

      {activeTab === 'other' && (
        <div className="mb-6">
          <div className="relative max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--color-text-secondary)]" />
            <input
              type="text"
              placeholder="팀명, 지역으로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-2.5 pl-10 pr-4 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-card)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
            />
          </div>
          <p className="text-xs text-[var(--color-text-secondary)] mt-2">
            다른 지역의 팀을 검색하여 찾을 수 있습니다.
          </p>
        </div>
      )}

      {isLoading ? (
        <LoadingSpinner fullScreen={false} message="팀 목록을 불러오는 중..." />
      ) : teams.length === 0 ? (
        <div className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-card)] p-8 text-center text-[var(--color-text-secondary)]">
          {activeTab === 'nearby'
            ? userRegion
              ? `${userRegion} 지역에 등록된 ${selectedSport} 팀이 없습니다.`
              : '지역 정보가 없습니다. 내 정보에서 거주 지역을 설정해주세요.'
            : searchQuery.trim()
            ? '검색 조건에 맞는 팀이 없습니다.'
            : '타 지역 팀을 검색해 보세요.'}
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
