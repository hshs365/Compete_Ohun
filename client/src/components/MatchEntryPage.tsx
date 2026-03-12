import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import { ChevronLeftIcon, XMarkIcon } from '@heroicons/react/24/outline';
import TacticalBoardCanvas, { type BoardParticipant } from './TacticalBoardCanvas';
import ExpandableQRCode from './ExpandableQRCode';
import { showError, showToast } from '../utils/swal';

interface Participant {
  id: number;
  userId: number;
  user: {
    id: number;
    nickname: string;
    tag?: string | null;
    profileImage?: string | null;
    profileImageUrl?: string | null;
    totalScore?: number;
  };
  positionCode?: string | null;
  slotLabel?: string | null;
  isCreator?: boolean;
  team?: 'red' | 'blue';
  positionX?: number | null;
  positionY?: number | null;
}

interface GroupDetailData {
  id: number;
  name: string;
  location: string;
  category: string;
  type?: 'normal' | 'rank' | 'event';
  creatorId: number;
  creator?: {
    id: number;
    nickname: string;
    tag?: string | null;
    profileImage?: string | null;
    profileImageUrl?: string | null;
    totalScore?: number;
  };
  participants: Participant[];
  isUserParticipant?: boolean;
  gameSettings?: { gameType?: string; positions?: string[] } | null;
}

const MatchEntryPage: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [group, setGroup] = useState<GroupDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGroup = useCallback(async () => {
    if (!groupId) return;
    try {
      const data = await api.get<GroupDetailData>(`/api/groups/${groupId}`);
      setGroup(data);
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? '매치 정보를 불러오지 못했습니다.');
      setGroup(null);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    if (!groupId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await api.get<GroupDetailData>(`/api/groups/${groupId}`);
        if (!cancelled) {
          setGroup(data);
          setError(null);
          const isCreator = user && data.creatorId && user.id === data.creatorId;
          const isInParticipants = user && data.participants?.some((p) => p.userId === user.id);
          const canEnter = data.isUserParticipant || isCreator || isInParticipants;
          if (!canEnter) {
            showError('참가자만 매치 입장을 이용할 수 있습니다.', '매치 입장');
            navigate('/');
          }
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message ?? '매치 정보를 불러오지 못했습니다.');
          setGroup(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [groupId, user, navigate]);

  const isCreator = !!user && !!group && group.creatorId === user.id;
  const isParticipant =
    !!group &&
    (group.isUserParticipant === true || (!!user && group.participants.some((p) => p.userId === user.id)));
  const canEnter = isCreator || isParticipant;

  const boardParticipants: BoardParticipant[] = (group?.participants ?? []).map((p) => ({
    userId: p.userId,
    nickname: p.user.nickname,
    positionCode: p.positionCode ?? null,
    slotLabel: p.slotLabel ?? null,
    profileImageUrl: p.user.profileImage ?? (p.user as { profileImageUrl?: string | null }).profileImageUrl ?? null,
    rankScore: p.user.totalScore ?? null,
    team: (p.team ?? 'red') as 'red' | 'blue',
    positionX: p.positionX ?? null,
    positionY: p.positionY ?? null,
  }));

  if (group?.creatorId && group?.creator && !boardParticipants.some((p) => p.userId === group.creatorId)) {
    const c = group.creator;
    boardParticipants.push({
      userId: group.creatorId,
      nickname: c.nickname,
      positionCode: null,
      slotLabel: null,
      profileImageUrl: c.profileImage ?? (c as { profileImageUrl?: string | null }).profileImageUrl ?? null,
      rankScore: c.totalScore ?? null,
      team: 'red',
      positionX: null,
      positionY: null,
    });
  }

  const handlePositionChange = useCallback(
    async (vx: number, vy: number, positionCode: string, slotLabel: string) => {
      if (!groupId || !user || !group) return;
      const participant = group.participants.find((p) => p.userId === user.id);
      const myTeam = (participant?.team ?? (user.id === group.creatorId ? (group.gameSettings as { creatorTeam?: 'red' | 'blue' })?.creatorTeam : undefined) ?? 'red') as 'red' | 'blue';
      try {
        await api.patch(`/api/groups/${groupId}/my-position`, {
          positionCode,
          team: myTeam,
          slotLabel,
          positionX: vx,
          positionY: vy,
        });
        showToast('포지션이 저장되었습니다.', 'success');
        await fetchGroup();
      } catch (e: any) {
        showError(e?.message ?? '포지션 저장에 실패했습니다.', '저장 실패');
      }
    },
    [groupId, user, group, fetchGroup]
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <p className="text-[var(--color-text-secondary)]">로딩 중...</p>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[var(--color-bg)] p-4">
        <p className="text-red-500">{error ?? '매치를 찾을 수 없습니다.'}</p>
        <button type="button" onClick={() => navigate(-1)} className="flex items-center gap-1 text-[var(--color-blue-primary)]">
          <ChevronLeftIcon className="w-5 h-5" /> 뒤로
        </button>
      </div>
    );
  }

  if (!canEnter) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[var(--color-bg)] p-4">
        <p className="text-[var(--color-text)]">참가자만 이용 가능합니다.</p>
        <button type="button" onClick={() => navigate(-1)} className="flex items-center gap-1 text-[var(--color-blue-primary)]">
          <ChevronLeftIcon className="w-5 h-5" /> 뒤로
        </button>
      </div>
    );
  }

  const matchLabel = group.type === 'rank' ? '랭크 매치' : group.type === 'event' ? '이벤트매치' : '매치';

  return (
    <div className="flex flex-col h-screen w-full bg-[var(--color-bg-primary)] overflow-hidden">
      <div
        className="shrink-0 flex items-center justify-between gap-2 px-3 py-2.5 border-b border-[var(--color-border-card)]"
        style={{
          background:
            group.type === 'rank'
              ? 'linear-gradient(90deg, #92400e 0%, #b45309 50%, #d97706 100%)'
              : 'var(--color-bg-card)',
        }}
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-white/95 hover:text-white font-medium text-sm py-1.5 px-2 rounded-lg hover:bg-white/10 transition-colors"
          aria-label="뒤로"
        >
          <ChevronLeftIcon className="w-5 h-5" />
          <span className="hidden sm:inline">뒤로</span>
        </button>
        <span className="text-sm font-bold text-white truncate flex-1 text-center mx-2">
          {group.category} · {matchLabel}
        </span>
        {/* PC 전용: QR로 모바일에서 바로 보기 (터치 시 확대) */}
        {typeof window !== 'undefined' && groupId && (
          <div className="hidden md:flex items-center gap-2 mr-2 py-1 px-2 rounded-lg bg-white/10">
            <ExpandableQRCode
              value={`${window.location.origin}/match-entry/${groupId}`}
              size={36}
              caption="모바일에서 보기"
              className="!p-1 !border-0 !bg-transparent hover:!opacity-90"
            />
            <span className="text-[10px] text-white/90 whitespace-nowrap">터치 시 확대</span>
          </div>
        )}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg text-white/90 hover:bg-white/10 transition-colors"
          aria-label="닫기"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      {/* 스타디움 배경 + 풀필드 전술판 (한 장의 구장에 레드/블루 선수 카드) */}
      <div className="flex-1 min-h-0 flex flex-col relative">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-25"
          style={{ backgroundImage: "url('/stadium-bg.jpg')" }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-[#0a0f0a]/75" aria-hidden />
        <div className="flex-1 min-h-0 flex items-center justify-center p-3 relative z-10">
          <div className="w-full max-w-4xl max-h-full aspect-[105/68] flex items-center justify-center">
            <TacticalBoardCanvas
              participants={boardParticipants}
              currentUserId={user?.id ?? null}
              onPositionChange={handlePositionChange}
            />
          </div>
        </div>
      </div>

      <div className="shrink-0 px-4 py-2 border-t border-[var(--color-border-card)] bg-[var(--color-bg-card)]">
        <p className="text-xs text-[var(--color-text-secondary)] text-center">{group.name} · {group.location}</p>
        <p className="text-xs text-[var(--color-text-secondary)] text-center mt-0.5">
          참가자 {group.participants.length}명 · 구장 위에서 내 카드를 드래그해 포지션을 배치하세요.
        </p>
      </div>
    </div>
  );
};

export default MatchEntryPage;
