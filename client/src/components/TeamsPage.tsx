import React, { useEffect, useState } from 'react';
import { UserGroupIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import LoadingSpinner from './LoadingSpinner';

interface TeamMembership {
  id: number;
  teamName: string;
  sport: string;
  position: string;
  role?: 'captain' | 'member';
}

const TeamsPage = () => {
  const [teams, setTeams] = useState<TeamMembership[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const data = await api.get<TeamMembership[]>('/api/teams/me');
        setTeams(data || []);
      } catch (error) {
        console.error('팀 목록 로드 실패:', error);
        setTeams([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeams();
  }, []);

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto w-full pb-12">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] mb-2">
          팀
        </h1>
        <p className="text-[var(--color-text-secondary)]">
          내가 가입한 팀과 포지션을 한눈에 확인하세요.
        </p>
      </div>

      {isLoading ? (
        <LoadingSpinner fullScreen={false} message="팀 정보를 불러오는 중..." />
      ) : teams.length === 0 ? (
        <div className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-card)] p-8 text-center text-[var(--color-text-secondary)]">
          가입한 팀이 없습니다. 팀에 가입하면 이곳에 표시됩니다.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teams.map((team) => (
            <Link
              key={team.id}
              to={`/teams/${team.id}`}
              className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-card)] p-5 flex items-start gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <UserGroupIcon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                    {team.teamName}
                  </h2>
                  {team.role === 'captain' && (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <ShieldCheckIcon className="w-3.5 h-3.5" />
                      캡틴
                    </span>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-sm">
                  <span className="px-2.5 py-1 rounded-lg bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] border border-[var(--color-border-card)]">
                    종목: {team.sport}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    포지션: {team.position}
                  </span>
                </div>
                <p className="mt-3 text-xs text-[var(--color-text-secondary)]">
                  팀 상세에서 포지션을 변경할 수 있습니다.
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeamsPage;
