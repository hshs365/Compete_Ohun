import React, { useState, useEffect } from 'react';
import { ChevronLeftIcon, XMarkIcon } from '@heroicons/react/24/outline';
import type { SelectedGroup } from '../types/selected-group';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import FootballPitch from './FootballPitch';

interface Participant {
  userId: number;
  user: {
    id: number;
    nickname: string;
    tag?: string | null;
    profileImage?: string | null;
    totalScore?: number;
  };
  positionCode?: string | null;
  slotLabel?: string | null;
  isCreator?: boolean;
  team?: 'red' | 'blue';
}

interface GameSettings {
  gameType: 'team' | 'individual';
  positions?: string[];
}

interface GroupDetailData {
  id: number;
  name: string;
  category: string;
  type?: 'normal' | 'rank' | 'event';
  creatorId: number;
  creator?: { id: number; nickname: string; tag?: string | null; profileImage?: string | null; profileImageUrl?: string | null; totalScore?: number };
  participants: Participant[];
  gameSettings?: GameSettings | null;
}

function getProfileImage(userId: number, profileImage?: string | null, currentUserId?: number): string | null {
  if (profileImage) return profileImage;
  try {
    const saved = localStorage.getItem(`profileImage_${userId}`);
    if (saved && currentUserId === userId) return saved;
  } catch (_) {}
  return null;
}

interface MatchFormationHomeViewProps {
  group: SelectedGroup;
  onClose: () => void;
  /** 상세 보기(GroupDetail)로 전환 */
  onShowDetail?: () => void;
}

export default function MatchFormationHomeView({ group, onClose, onShowDetail }: MatchFormationHomeViewProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [detail, setDetail] = useState<GroupDetailData | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    api
      .get<GroupDetailData>(`/api/groups/${group.id}`)
      .then((res) => {
        if (!cancelled) {
          setDetail(res.data);
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [group.id]);

  const isTeamFormation = detail?.category === '축구' && detail?.gameSettings?.gameType === 'team';
  const recruitPositions = (detail?.gameSettings?.positions?.length ? detail.gameSettings.positions : ['GK', 'DF', 'MF', 'FW']) as string[];

  const withTeam = detail?.participants?.map((p) => ({
    userId: p.userId,
    nickname: p.user.nickname,
    tag: p.user.tag,
    positionCode: p.positionCode ?? null,
    slotLabel: p.slotLabel ?? null,
    isCreator: p.userId === detail.creatorId,
    team: (p.team ?? 'red') as 'red' | 'blue',
    profileImageUrl: getProfileImage(p.user.id, p.user.profileImage, user?.id),
    rankScore: p.user.totalScore ?? null,
    positionWinRate: null as number | null,
  })) ?? [];

  const creator = detail?.creator;
  const creatorId = detail?.creatorId;
  if (detail && creatorId && creator && !withTeam.some((p) => p.userId === creatorId)) {
    const creatorScore = creator.totalScore ?? detail.participants?.find((p) => p.userId === creatorId)?.user?.totalScore ?? null;
    withTeam.push({
      userId: creatorId,
      nickname: creator.nickname,
      tag: creator.tag,
      positionCode: null,
      slotLabel: null,
      isCreator: true,
      team: 'red',
      profileImageUrl: getProfileImage(creatorId, creator.profileImage ?? (creator as { profileImageUrl?: string | null }).profileImageUrl, user?.id),
      rankScore: creatorScore,
      positionWinRate: null,
    });
  }

  const redList = withTeam.filter((p) => p.team === 'red').map(({ team: _t, ...rest }) => rest);
  const blueList = withTeam.filter((p) => p.team === 'blue').map(({ team: _t, ...rest }) => rest);
  const isParticipant = !!user?.id && (detail?.participants?.some((p) => p.userId === user.id) ?? false);

  if (loading) {
    return (
      <div className="flex flex-col h-full w-full bg-[var(--color-bg-primary)]">
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-card)] bg-[var(--color-bg-card)]">
          <button type="button" onClick={onClose} className="p-2 -ml-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]" aria-label="목록으로">
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <span className="text-sm font-semibold text-[var(--color-text-primary)] truncate flex-1 text-center mx-2">{group.name}</span>
          <div className="w-9" />
        </div>
        <div className="flex-1 flex items-center justify-center text-[var(--color-text-secondary)] text-sm">로딩 중...</div>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="flex flex-col h-full w-full bg-[var(--color-bg-primary)]">
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-card)] bg-[var(--color-bg-card)]">
          <button type="button" onClick={onClose} className="p-2 -ml-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]" aria-label="목록으로">
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <span className="text-sm font-semibold text-[var(--color-text-primary)] truncate flex-1 text-center mx-2">{group.name}</span>
          <button type="button" onClick={onClose} className="p-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]" aria-label="닫기">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-4 text-[var(--color-text-secondary)] text-sm">
          <p>매치 정보를 불러올 수 없습니다.</p>
          {onShowDetail && (
            <button type="button" onClick={onShowDetail} className="px-4 py-2 rounded-lg bg-[var(--color-blue-primary)] text-white text-sm font-medium hover:opacity-90">
              상세 보기
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!isTeamFormation) {
    return (
      <div className="flex flex-col h-full w-full bg-[var(--color-bg-primary)]">
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-card)] bg-[var(--color-bg-card)]">
          <button type="button" onClick={onClose} className="p-2 -ml-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]" aria-label="목록으로">
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <span className="text-sm font-semibold text-[var(--color-text-primary)] truncate flex-1 text-center mx-2">{group.name}</span>
          <button type="button" onClick={onClose} className="p-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]" aria-label="닫기">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-4 text-[var(--color-text-secondary)] text-sm">
          <p>포지션 지정 매치가 아닙니다.</p>
          {onShowDetail && (
            <button type="button" onClick={onShowDetail} className="px-4 py-2 rounded-lg bg-[var(--color-blue-primary)] text-white text-sm font-medium hover:opacity-90">
              상세 보기
            </button>
          )}
        </div>
      </div>
    );
  }

  const matchLabel = detail.type === 'rank' ? '랭크 매치' : detail.type === 'event' ? '이벤트매치' : '매치';

  return (
    <div className="flex flex-col h-full w-full bg-[var(--color-bg-primary)] overflow-hidden">
      {/* 상단: 뒤로가기 | 제목 | 실시간 팀 | X */}
      <div
        className="flex-shrink-0 flex items-center justify-between gap-2 px-3 py-2.5 border-b border-[var(--color-border-card)]"
        style={{ background: detail.type === 'rank' ? 'linear-gradient(90deg, #92400e 0%, #b45309 50%, #d97706 100%)' : 'var(--color-bg-card)' }}
      >
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1 text-white/95 hover:text-white font-medium text-sm py-1.5 px-2 rounded-lg hover:bg-white/10 transition-colors"
          aria-label="목록으로"
        >
          <ChevronLeftIcon className="w-5 h-5" />
          <span className="hidden sm:inline">목록으로</span>
        </button>
        <span className="text-sm font-bold text-white truncate flex-1 text-center mx-2">
          축구 · {matchLabel}
        </span>
        <button
          type="button"
          className="px-2 py-1.5 rounded-lg text-white/90 hover:bg-white/10 text-xs font-medium transition-colors"
        >
          실시간 팀
        </button>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-lg text-white/90 hover:bg-white/10 transition-colors"
          aria-label="닫기"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      {/* 레드 | 블루 구장 분할 */}
      <div className="flex-1 min-h-0 flex flex-col sm:flex-row">
        <div className="flex-1 min-h-0 flex flex-col border-b sm:border-b-0 sm:border-r border-[var(--color-border-card)]">
          <div className="flex-shrink-0 py-1.5 px-2 text-center text-xs font-semibold bg-red-900/40 text-red-200 border-b border-red-800/50">
            레드팀
          </div>
          <div className="flex-1 min-h-[200px] sm:min-h-0 flex items-center justify-center p-2 overflow-hidden">
            <div className="w-full max-w-md aspect-[1/1.3] max-h-full">
              <FootballPitch
                mode="match"
                participants={redList}
                recruitPositions={recruitPositions}
                size="default"
                teamAccent="red"
                isUserParticipant={isParticipant}
              />
            </div>
          </div>
        </div>
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="flex-shrink-0 py-1.5 px-2 text-center text-xs font-semibold bg-blue-900/40 text-blue-200 border-b border-blue-800/50">
            블루팀
          </div>
          <div className="flex-1 min-h-[200px] sm:min-h-0 flex items-center justify-center p-2 overflow-hidden">
            <div className="w-full max-w-md aspect-[1/1.3] max-h-full">
              <FootballPitch
                mode="match"
                participants={blueList}
                recruitPositions={recruitPositions}
                size="default"
                teamAccent="blue"
                isUserParticipant={isParticipant}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 하단: 상세 보기 / 목록으로 */}
      <div className="flex-shrink-0 flex items-center justify-between gap-2 px-4 py-3 border-t border-[var(--color-border-card)] bg-[var(--color-bg-card)]">
        {onShowDetail ? (
          <button
            type="button"
            onClick={onShowDetail}
            className="px-4 py-2 rounded-lg border border-[var(--color-border-card)] text-[var(--color-text-primary)] text-sm font-medium hover:bg-[var(--color-bg-secondary)] transition-colors"
          >
            상세 보기
          </button>
        ) : (
          <div />
        )}
        <p className="text-xs text-[var(--color-text-secondary)] text-center flex-1">
          구장 위 아무 위치에 드래그해 두세요. 포지션명을 눌러 직접 수정할 수 있습니다.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-lg bg-[var(--color-blue-primary)] text-white text-sm font-medium hover:opacity-90 transition-colors"
        >
          목록으로
        </button>
      </div>
    </div>
  );
}
