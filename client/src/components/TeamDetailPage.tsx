import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShieldCheckIcon, ArrowLeftIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { api } from '../utils/api';
import LoadingSpinner from './LoadingSpinner';

interface TeamParticipant {
  id: number;
  nickname: string;
  tag?: string;
  position: string;
  role?: 'captain' | 'member';
}

interface TeamDetail {
  id: number;
  teamName: string;
  sport: string;
  position: string;
  role?: 'captain' | 'member';
  description?: string;
  memberCount?: number;
  logoUrl?: string;
  winRate?: number;
  participants?: TeamParticipant[];
  region?: string;
  coach?: string;
  assistantCoach?: string;
  contact?: string;
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

  const participants = team.participants ?? [];
  const winRate = typeof team.winRate === 'number' ? team.winRate : null;

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

      {/* 팀 헤더: 로고 + 팀명 */}
      <div className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-card)] p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-card)] flex items-center justify-center overflow-hidden flex-shrink-0">
            {team.logoUrl ? (
              <img src={team.logoUrl} alt={team.teamName} className="w-full h-full object-contain p-1" />
            ) : (
              <UserGroupIcon className="w-12 h-12 text-[var(--color-text-secondary)]" />
            )}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
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
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              {team.sport} · 내 포지션: {team.position}
            </p>
          </div>
        </div>
      </div>

      {/* 팀 정보 */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">
          팀 정보
        </h2>
        <div className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-card)] p-5 space-y-4">
          <p className="text-[var(--color-text-primary)]">
            {team.description || '팀 소개가 아직 등록되지 않았습니다.'}
          </p>
          <div className="grid gap-2 text-sm">
            {team.region && (
              <p className="text-[var(--color-text-secondary)]">
                <span className="font-medium text-[var(--color-text-primary)]">소재지</span>: {team.region}
              </p>
            )}
            {team.coach && (
              <p className="text-[var(--color-text-secondary)]">
                <span className="font-medium text-[var(--color-text-primary)]">감독</span>: {team.coach}
              </p>
            )}
            {team.assistantCoach && (
              <p className="text-[var(--color-text-secondary)]">
                <span className="font-medium text-[var(--color-text-primary)]">코치</span>: {team.assistantCoach}
              </p>
            )}
            {team.contact && (
              <p className="text-[var(--color-text-secondary)]">
                <span className="font-medium text-[var(--color-text-primary)]">연락처</span>: {team.contact}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* 승률 */}
      {winRate !== null && (
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">
            승률
          </h2>
          <div className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-card)] p-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-[var(--color-blue-primary)]/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-[var(--color-blue-primary)]">{winRate}%</span>
              </div>
              <div>
                <p className="text-[var(--color-text-primary)] font-medium">최근 매치 승률</p>
                <p className="text-sm text-[var(--color-text-secondary)]">전체 경기 대비 승리 비율</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 참가자 */}
      <section>
        <h2 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">
          참가자 {team.memberCount != null && `(${team.memberCount}명)`}
        </h2>
        <div className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-card)] overflow-hidden">
          {participants.length > 0 ? (
            <ul className="divide-y divide-[var(--color-border-card)]">
              {participants.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between px-4 py-3 hover:bg-[var(--color-bg-secondary)] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--color-bg-secondary)] flex items-center justify-center">
                      <UserGroupIcon className="w-5 h-5 text-[var(--color-text-secondary)]" />
                    </div>
                    <div>
                      <span className="font-medium text-[var(--color-text-primary)]">
                        {p.nickname}
                        {p.tag && <span className="text-[var(--color-text-secondary)] ml-1">{p.tag}</span>}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs px-2 py-0.5 rounded bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)]">
                          {p.position}
                        </span>
                        {p.role === 'captain' && (
                          <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            캡틴
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-8 text-center text-[var(--color-text-secondary)]">
              참가자 목록이 비어 있습니다.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default TeamDetailPage;
