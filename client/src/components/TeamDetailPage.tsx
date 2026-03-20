import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShieldCheckIcon, ArrowLeftIcon, UserGroupIcon, UserPlusIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { api } from '../utils/api';
import LoadingSpinner from './LoadingSpinner';
import { showSuccess, showError } from '../utils/swal';

interface InviteUser {
  id: number;
  nickname: string;
  tag?: string;
  profileImageUrl?: string;
}

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
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteUsers, setInviteUsers] = useState<InviteUser[]>([]);
  const [inviteSearch, setInviteSearch] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [selectedInviteIds, setSelectedInviteIds] = useState<Set<number>>(new Set());
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const data = await api.get<TeamDetail>(`/api/teams/${teamId}`);
        setTeam(data);
      } catch (error) {
        console.error('크루 상세 로드 실패:', error);
        setTeam(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeam();
  }, [teamId]);

  useEffect(() => {
    if (!inviteModalOpen) return;
    const load = async () => {
      setInviteLoading(true);
      try {
        const data = inviteSearch.trim()
          ? await api.get<InviteUser[]>(`/api/users/search?q=${encodeURIComponent(inviteSearch.trim())}`)
          : await api.get<InviteUser[]>('/api/users/followers');
        setInviteUsers(Array.isArray(data) ? data : []);
      } catch {
        setInviteUsers([]);
      } finally {
        setInviteLoading(false);
      }
    };
    load();
  }, [inviteModalOpen, inviteSearch]);

  const toggleInviteSelect = (id: number) => {
    setSelectedInviteIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleInviteSubmit = async () => {
    if (selectedInviteIds.size === 0) return;
    setSending(true);
    try {
      await api.post(`/api/teams/${teamId}/invite`, { userIds: [...selectedInviteIds] });
      await showSuccess(`${selectedInviteIds.size}명에게 초대 알림을 보냈습니다.`, '크루 초대');
      setInviteModalOpen(false);
      setSelectedInviteIds(new Set());
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '초대 전송에 실패했습니다.';
      await showError(msg, '초대 실패');
    } finally {
      setSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto w-full pb-12">
        <LoadingSpinner fullScreen={false} message="크루 정보를 불러오는 중..." />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto w-full pb-12">
        <div className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-card)] p-8 text-center text-[var(--color-text-secondary)]">
          크루 정보를 찾을 수 없습니다.
        </div>
        <div className="mt-4 text-center">
          <Link
            to="/teams"
            className="inline-flex items-center gap-2 text-sm text-[var(--color-blue-primary)] hover:underline"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            크루 목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const participants = team.participants ?? [];
  const winRate = typeof team.winRate === 'number' ? team.winRate : null;

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto w-full pb-24 md:pb-12 safe-area-pb">
      <div className="mb-6">
        <Link
          to="/teams"
          className="inline-flex items-center gap-2 py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] touch-manipulation"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          크루 목록
        </Link>
      </div>

      {/* 크루 헤더: 로고 + 크루명 */}
      <div className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-card)] p-4 sm:p-6 mb-6">
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

      {/* 크루 정보 */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">
          크루 정보
        </h2>
        <div className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-card)] p-5 space-y-4">
          <p className="text-[var(--color-text-primary)]">
            {team.description || '크루 소개가 아직 등록되지 않았습니다.'}
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
                <span className="font-medium text-[var(--color-text-primary)]">코치</span>:{' '}
                {team.assistantCoach.split('\n').filter(Boolean).map((line, i) => (
                  <span key={i}>{i > 0 && ', '}{line}</span>
                ))}
              </p>
            )}
            {team.contact && (
              <p className="text-[var(--color-text-secondary)]">
                <span className="font-medium text-[var(--color-text-primary)]">연락처</span>:{' '}
                {team.contact.split('\n').filter(Boolean).map((line, i) => (
                  <span key={i}>{i > 0 && ', '}{line}</span>
                ))}
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
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <h2 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
            참가자 {team.memberCount != null && `(${team.memberCount}명)`}
          </h2>
          {team.role === 'captain' && (
            <button
              type="button"
              onClick={() => setInviteModalOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-3 min-h-[48px] rounded-xl text-sm font-medium text-white bg-[var(--color-blue-primary)] hover:opacity-90 active:opacity-95 transition-opacity touch-manipulation"
            >
              <UserPlusIcon className="w-4 h-4" />
              크루 초대하기
            </button>
          )}
        </div>
        <div className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-card)] overflow-hidden">
          {participants.length > 0 ? (
            <ul className="divide-y divide-[var(--color-border-card)]">
              {participants.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between px-4 py-3 min-h-[56px] hover:bg-[var(--color-bg-secondary)] active:bg-[var(--color-bg-secondary)] transition-colors"
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

      {/* 크루 초대 모달 */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50" onClick={() => !sending && setInviteModalOpen(false)}>
          <div className="w-full max-w-md max-h-[90dvh] sm:max-h-[85vh] flex flex-col bg-[var(--color-bg-card)] rounded-t-2xl sm:rounded-2xl border border-[var(--color-border-card)] shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-[var(--color-border-card)]">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                <UserPlusIcon className="w-5 h-5 text-[var(--color-blue-primary)]" />
                크루 초대하기
              </h3>
              <button type="button" onClick={() => !sending && setInviteModalOpen(false)} className="p-1 rounded-lg hover:bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto flex-1 min-h-0">
              <p className="text-sm text-[var(--color-text-secondary)]">
                팔로워 목록에서 초대할 유저를 선택하세요.
              </p>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--color-text-secondary)]" />
                <input
                  type="text"
                  value={inviteSearch}
                  onChange={(e) => setInviteSearch(e.target.value)}
                  placeholder="닉네임, 태그로 검색..."
                  className="w-full py-2.5 pl-10 pr-4 border border-[var(--color-border-card)] rounded-xl bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
                />
              </div>
              <div className="max-h-56 overflow-y-auto rounded-xl border border-[var(--color-border-card)] divide-y divide-[var(--color-border-card)]">
                {inviteLoading ? (
                  <div className="p-4 text-sm text-[var(--color-text-secondary)]">불러오는 중...</div>
                ) : inviteUsers.length === 0 ? (
                  <div className="p-4 text-sm text-[var(--color-text-secondary)]">
                    {inviteSearch.trim() ? '검색 결과가 없습니다.' : '팔로워 목록이 비어 있습니다.'}
                  </div>
                ) : (
                  inviteUsers.map((u) => {
                    const isParticipant = (team?.participants ?? []).some((p) => p.id === u.id);
                    return (
                      <label
                        key={u.id}
                        className={`flex items-center gap-3 p-4 min-h-[56px] transition-colors ${isParticipant ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-[var(--color-bg-secondary)] active:bg-[var(--color-bg-secondary)] touch-manipulation'}`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedInviteIds.has(u.id)}
                          onChange={() => !isParticipant && toggleInviteSelect(u.id)}
                          disabled={isParticipant}
                          className="rounded border-[var(--color-border-card)]"
                        />
                        <div className="w-10 h-10 rounded-full bg-[var(--color-bg-secondary)] flex items-center justify-center overflow-hidden shrink-0">
                          {u.profileImageUrl ? (
                            <img src={u.profileImageUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <UserGroupIcon className="w-5 h-5 text-[var(--color-text-secondary)]" />
                          )}
                        </div>
                        <span className="text-sm text-[var(--color-text-primary)]">
                          {u.nickname}
                          {u.tag && <span className="text-[var(--color-text-secondary)] ml-1">{u.tag}</span>}
                          {isParticipant && <span className="text-xs text-[var(--color-text-secondary)] ml-1">(이미 참가 중)</span>}
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
              {selectedInviteIds.size > 0 && (
                <p className="text-sm text-[var(--color-text-secondary)]">{selectedInviteIds.size}명 선택됨</p>
              )}
            </div>
            <div className="flex gap-3 p-4 border-t border-[var(--color-border-card)] safe-area-pb">
              <button
                type="button"
                onClick={() => !sending && setInviteModalOpen(false)}
                className="flex-1 py-4 sm:py-3 min-h-[52px] sm:min-h-0 rounded-xl font-medium text-[var(--color-text-primary)] bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-primary)] active:opacity-90 transition-colors touch-manipulation"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleInviteSubmit}
                disabled={selectedInviteIds.size === 0 || sending}
                className="flex-1 py-4 sm:py-3 min-h-[52px] sm:min-h-0 rounded-xl font-medium text-white bg-[var(--color-blue-primary)] hover:opacity-90 active:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity touch-manipulation"
              >
                {sending ? '전송 중...' : '초대 보내기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamDetailPage;
