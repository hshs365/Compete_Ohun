import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShieldCheckIcon, ArrowLeftIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { api } from '../utils/api';
import LoadingSpinner from './LoadingSpinner';

interface TeamDetail {
  id: number;
  teamName: string;
  sport: string;
  position: string;
  role?: 'captain' | 'member';
  description?: string;
  memberCount?: number;
}

const TeamDetailPage = () => {
  const { teamId } = useParams();
  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const data = await api.get<TeamDetail>(`/api/teams/${teamId}`);
        setTeam(data);
      } catch (error) {
        console.error('팀 상세 로드 실패:', error);
        setTeam(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeam();
  }, [teamId]);

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto w-full pb-12">
        <LoadingSpinner fullScreen={false} message="팀 정보를 불러오는 중..." />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto w-full pb-12">
        <div className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-card)] p-8 text-center text-[var(--color-text-secondary)]">
          팀 정보를 찾을 수 없습니다.
        </div>
        <div className="mt-4 text-center">
          <Link
            to="/teams"
            className="inline-flex items-center gap-2 text-sm text-[var(--color-blue-primary)] hover:underline"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            팀 목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto w-full pb-12">
      <div className="mb-6">
        <Link
          to="/teams"
          className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          팀 목록
        </Link>
      </div>

      <div className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-card)] p-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <UserGroupIcon className="w-7 h-7" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
                {team.teamName}
              </h1>
              {team.role === 'captain' && (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <ShieldCheckIcon className="w-3.5 h-3.5" />
                  캡틴
                </span>
              )}
            </div>
            <p className="text-sm text-[var(--color-text-secondary)] mt-2">
              {team.description || '팀 소개가 아직 등록되지 않았습니다.'}
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              <span className="px-2.5 py-1 rounded-lg bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] border border-[var(--color-border-card)]">
                종목: {team.sport}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                내 포지션: {team.position}
              </span>
              {typeof team.memberCount === 'number' && (
                <span className="px-2.5 py-1 rounded-lg bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] border border-[var(--color-border-card)]">
                  팀원 수: {team.memberCount}명
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamDetailPage;
