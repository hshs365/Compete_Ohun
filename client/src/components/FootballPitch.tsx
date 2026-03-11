import React, { useState } from 'react';
import { ArrowsPointingOutIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import {
  FOOTBALL_POSITION_ORDER,
  getFormation,
  type FormationId,
} from '../constants/formation';
import { STADIUM_BG, STADIUM_THEME_BG, STADIUM_FLOODLIGHT, PITCH_TEAM_OVERLAY } from '../constants/pitchStyle';
import { rpToGrade } from '../constants/rankGrade';
import { getPremiumCardTheme } from '../constants/premiumRankCard';

export type PitchMode = 'match' | 'stats';

interface SlotParticipant {
  userId: number;
  nickname: string;
  tag?: string | null;
  isCreator?: boolean;
  profileImageUrl?: string | null;
  slotLabel?: string | null;
  /** 올코트플레이 랭크 점수 (명예의 전당). 툴팁 표시용 */
  rankScore?: number | null;
  /** 포지션 승률(%). 툴팁 표시용, 미집계 시 null */
  positionWinRate?: number | null;
}

interface PitchSlot {
  positionCode: string;
  label: string;
  index: number;
  participant?: SlotParticipant | null;
  count?: number;
}

interface FootballPitchProps {
  mode: 'match' | 'stats';
  participants?: Array<{ userId: number; nickname: string; tag?: string | null; positionCode?: string | null; isCreator?: boolean; profileImageUrl?: string | null; slotLabel?: string | null; rankScore?: number | null; positionWinRate?: number | null }>;
  positionCounts?: Record<string, number>;
  /** 클릭 시 (positionCode, slotLabel) 전달. slotLabel으로 RW/LW 등 정확한 슬롯 구분 */
  onSlotClick?: (positionCode: string, slotLabel: string) => void;
  isUserParticipant?: boolean;
  recruitPositions?: string[];
  size?: 'default' | 'modal';
  /** 전술 포지션 등에서 구장을 레드/블루 팀 색으로 직관적으로 표시 */
  teamAccent?: 'red' | 'blue';
  /** 포메이션 (442, 433, 352). 미지정 시 4-4-2 */
  formationId?: FormationId;
  /** 드래그해서 포지션에 배치 (클릭과 동시에 사용 가능) */
  enableDragDrop?: boolean;
  /** 드래그할 칩에 표시할 라벨 (예: 모임장, 내 포지션) */
  dragItemLabel?: string;
  /** 드래그 칩 프로필 이미지 URL */
  dragItemImageUrl?: string | null;
  /** 드래그 칩을 등급 카드(S~F) 스타일로 표시할 때 사용하는 RP (미설정 시 기본 칩) */
  dragItemRankScore?: number | null;
  /** 현재 로그인 유저 ID — 본인 카드만 드래그 가능할 때 사용 */
  currentUserId?: number | null;
  /** 본인 닉네임 — 드래그 칩·본인 카드에 표시 */
  currentUserNickname?: string | null;
  /** false면 빈 카드 슬롯을 표시하지 않음 (배치된 참가자 카드만 노출) */
  showEmptySlots?: boolean;
}

/** 포지션별 중앙 원 악센트 (EA FC 스타일, 절제된 채도) */
const POSITION_CIRCLE: Record<string, string> = {
  GK: 'bg-amber-700/90',   // 골키퍼: 황갈/주황
  DF: 'bg-sky-700/90',     // 수비: 파랑
  MF: 'bg-emerald-700/90', // 미드: 녹색
  FW: 'bg-rose-700/90',    // 공격: 빨강
};

/** 팀별 테두리·글로우 (상세보기 구장, 스타디움 배경 위에 겹침) */
const PITCH_TEAM_BORDER: Record<'red' | 'blue', string> = {
  red: 'inset 0 0 0 1px rgba(199,54,54,0.15), inset 0 0 60px rgba(199,54,54,0.04)',
  blue: 'inset 0 0 0 1px rgba(59,108,184,0.15), inset 0 0 60px rgba(59,108,184,0.04)',
};

/** 팀별 선수 카드 색상 (레드/블루 직관적 구분) */
const CARD_TEAM_STYLE: Record<'red' | 'blue', { background: string; borderColor: string }> = {
  red: {
    background: 'linear-gradient(180deg, #4a2a2a 0%, #3d2222 50%, #352020 100%)',
    borderColor: 'rgba(199,54,54,0.25)',
  },
  blue: {
    background: 'linear-gradient(180deg, #2a2a4a 0%, #22223d 50%, #202035 100%)',
    borderColor: 'rgba(59,108,184,0.25)',
  },
};

const DRAG_TYPE = 'application/x-formation-slot-drag';

/** 참여 후 드래그 칩: 등급 카드(S~F) 스타일 */
function DragChipGradeCard({
  rankScore,
  imageUrl,
  size = 'default',
  nickname,
}: {
  rankScore: number;
  imageUrl?: string | null;
  size?: 'default' | 'modal';
  /** 본인 닉네임 (있으면 하단에 표시) */
  nickname?: string | null;
}) {
  const grade = rpToGrade(rankScore);
  const theme = getPremiumCardTheme(grade);
  const cardW = size === 'modal' ? 'w-[62px]' : 'w-[56px] sm:w-[62px]';
  const cardMinH = size === 'modal' ? 'min-h-[86px]' : 'min-h-[80px] sm:min-h-[86px]';
  const textXs = size === 'modal' ? 'text-[8px]' : 'text-[7px] sm:text-[8px]';
  const avatarSize = size === 'modal' ? 'w-9 h-9' : 'w-8 h-8 sm:w-9 sm:h-9';
  return (
    <div
      className={`relative rounded-xl overflow-hidden flex flex-col ${cardW} ${cardMinH} border-2 cursor-grab active:cursor-grabbing touch-none`}
      style={{
        borderColor: theme.borderColor,
        background: 'linear-gradient(180deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.48) 100%)',
        boxShadow: `${theme.tierGlow}, 0 0 10px ${theme.borderColor}, inset 0 1px 0 rgba(255,255,255,0.12), 0 4px 18px rgba(0,0,0,0.38)`,
      }}
    >
      <div
        className="shrink-0 h-5 px-1.5 flex items-center justify-between rounded-t-[10px] border-b border-white/10"
        style={{
          background: 'linear-gradient(180deg, #6b7280 0%, #4b5563 35%, #374151 100%)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), 0 1px 0 rgba(0,0,0,0.3)',
        }}
      >
        <div className="flex items-baseline gap-0.5">
          <span className={`font-black uppercase tracking-widest text-white/90 ${textXs}`}>RP</span>
          <span className={`font-black tabular-nums leading-none text-white ${textXs}`} style={{ textShadow: `0 0 6px ${theme.tierColor}90` }}>
            {rankScore.toLocaleString()}
          </span>
        </div>
        <span className={`font-black leading-none ${textXs}`} style={{ color: theme.tierColor, textShadow: `0 0 6px ${theme.tierColor}99` }}>{grade}</span>
      </div>
      <div className="flex-1 flex items-center justify-center min-h-0 py-0.5 relative">
        <div className={`relative ${avatarSize} rounded-lg overflow-hidden bg-black/40 ring-1 ring-white/20 shrink-0 flex items-center justify-center`}>
          {imageUrl ? (
            <img src={imageUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <ArrowsPointingOutIcon className="w-4 h-4 text-white/50" />
          )}
        </div>
      </div>
      <div
        className="shrink-0 py-1 px-1 text-center rounded-b-[10px] border-t border-white/10"
        style={{
          background: 'linear-gradient(0deg, #4b5563 0%, #374151 50%, #1f2937 100%)',
          boxShadow: 'inset 0 -1px 0 rgba(255,255,255,0.08)',
        }}
      >
        <span className={`font-bold text-white/90 block truncate max-w-full ${size === 'modal' ? 'text-[10px]' : 'text-[9px] sm:text-[10px]'}`} title={nickname ?? '내 포지션'}>
          {nickname && nickname.trim() ? nickname : '내 포지션'}
        </span>
      </div>
    </div>
  );
}

/** 상세보기 전술판용 미니 트레이딩 카드 (생성 모달 TacticalPitch 카드와 동일 스타일) */
function ParticipantTradingCard({
  participant,
  slotLabel,
  positionCode,
  size,
}: {
  participant: SlotParticipant;
  slotLabel: string;
  positionCode: string;
  size: 'default' | 'modal';
}) {
  const rp = participant.rankScore ?? 0;
  const grade = rpToGrade(rp);
  const theme = getPremiumCardTheme(grade);
  const cardW = size === 'modal' ? 'w-[62px]' : 'w-[56px] sm:w-[62px]';
  const cardMinH = size === 'modal' ? 'min-h-[86px]' : 'min-h-[80px] sm:min-h-[86px]';
  const textXs = size === 'modal' ? 'text-[8px]' : 'text-[7px] sm:text-[8px]';
  const textSm = size === 'modal' ? 'text-[10px]' : 'text-[9px] sm:text-[10px]';
  const avatarSize = size === 'modal' ? 'w-9 h-9' : 'w-8 h-8 sm:w-9 sm:h-9';
  return (
    <div
      className={`relative rounded-xl overflow-hidden flex flex-col ${cardW} ${cardMinH} border-2 pointer-events-none`}
      style={{
        borderColor: theme.borderColor,
        background: 'linear-gradient(180deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.48) 100%)',
        boxShadow: `${theme.tierGlow}, 0 0 10px ${theme.borderColor}, inset 0 1px 0 rgba(255,255,255,0.12), 0 4px 18px rgba(0,0,0,0.38)`,
      }}
    >
      <div
        className="shrink-0 h-5 px-1.5 flex items-center justify-between rounded-t-[10px] border-b border-white/10"
        style={{
          background: 'linear-gradient(180deg, #6b7280 0%, #4b5563 35%, #374151 100%)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), 0 1px 0 rgba(0,0,0,0.3)',
        }}
      >
        <div className="flex items-baseline gap-0.5">
          <span className={`font-black uppercase tracking-widest text-white/90 ${textXs}`}>RP</span>
          <span className={`font-black tabular-nums leading-none text-white ${textXs}`} style={{ textShadow: `0 0 6px ${theme.tierColor}90` }}>
            {rp.toLocaleString()}
          </span>
        </div>
        <span className={`font-black leading-none ${textXs}`} style={{ color: theme.tierColor, textShadow: `0 0 6px ${theme.tierColor}99` }}>{grade}</span>
      </div>
      <div className="flex-1 flex items-center justify-center min-h-0 py-0.5 relative">
        <div className={`relative ${avatarSize} rounded-lg overflow-hidden bg-black/40 ring-1 ring-white/20 shrink-0 flex items-center justify-center`}>
          {participant.profileImageUrl ? (
            <>
              <img src={participant.profileImageUrl} alt="" className="w-full h-full object-cover" />
              <div
                className="absolute inset-0 pointer-events-none rounded-lg"
                style={{
                  background: 'linear-gradient(180deg, transparent 0%, transparent 50%, rgba(0,0,0,0.5) 100%)',
                  mixBlendMode: 'multiply',
                }}
                aria-hidden
              />
            </>
          ) : (
            <UserCircleIcon className="w-6 h-6 sm:w-7 sm:h-7 text-white/80" />
          )}
        </div>
      </div>
      <div
        className="shrink-0 py-1 px-1 text-center rounded-b-[10px] border-t border-white/10"
        style={{
          background: 'linear-gradient(0deg, #4b5563 0%, #374151 50%, #1f2937 100%)',
          boxShadow: 'inset 0 -1px 0 rgba(255,255,255,0.08)',
        }}
      >
        {participant.nickname && participant.nickname.trim() ? (
          <span className={`font-bold text-white/95 truncate block w-full ${textSm}`} title={participant.nickname}>{participant.nickname}</span>
        ) : null}
        <span className={`font-bold text-white uppercase tracking-widest block ${textXs}`}>{slotLabel}</span>
        <span className={`text-white/60 uppercase ${textXs}`}>{positionCode}</span>
      </div>
    </div>
  );
}

/** 빈 슬롯: 반투명 가이드라인만 (고정 틀/큰 + 제거) */
function EmptySlotGuide({ size }: { size: 'default' | 'modal' }) {
  const dim = size === 'modal' ? 'min-w-[62px] min-h-[86px]' : 'min-w-[56px] min-h-[80px] sm:min-w-[62px] sm:min-h-[86px]';
  return (
    <div
      className={`rounded-xl border border-dashed border-white/20 ${dim} flex items-center justify-center pointer-events-none bg-white/[0.03]`}
      aria-hidden
    />
  );
}

export default function FootballPitch({
  mode,
  participants = [],
  positionCounts = {},
  onSlotClick,
  isUserParticipant = false,
  recruitPositions,
  size = 'default',
  teamAccent,
  formationId = '442',
  enableDragDrop = false,
  dragItemLabel = '내 포지션',
  dragItemImageUrl = null,
  dragItemRankScore = null,
  currentUserId = null,
  currentUserNickname = null,
  showEmptySlots = true,
}: FootballPitchProps) {
  const [hoveredSlotKey, setHoveredSlotKey] = useState<string | null>(null);
  const [dragOverSlotKey, setDragOverSlotKey] = useState<string | null>(null);
  const isModal = size === 'modal';
  const showDragChip = enableDragDrop && !!onSlotClick && mode === 'match';
  const { formation, slots: pitchSlots } = getFormation(formationId);
  const useStadiumTheme = !!teamAccent;
  const showGradeCardChip = showDragChip && useStadiumTheme && (dragItemRankScore != null || dragItemRankScore === 0);
  const pitchStyle = useStadiumTheme
    ? { ...STADIUM_THEME_BG, boxShadow: `${STADIUM_THEME_BG.boxShadow}; ${PITCH_TEAM_BORDER[teamAccent!]}` }
    : STADIUM_BG;
  const cardStyle = teamAccent ? CARD_TEAM_STYLE[teamAccent] : null;
  const positionsToShow =
    recruitPositions?.length
      ? recruitPositions.filter((p) => formation[p] != null)
      : FOOTBALL_POSITION_ORDER.slice();

  const slots: PitchSlot[] = pitchSlots.map(({ positionCode, label }, index) => {
    if (!positionsToShow.includes(positionCode)) {
      return { positionCode, label, index, participant: null };
    }
    if (mode === 'match') {
      const byPos = participants.filter((p) => p.positionCode === positionCode);
      const slotIndexInRow = pitchSlots.slice(0, index).filter(
        (s) => s.positionCode === positionCode
      ).length;
      // slotLabel이 있으면 해당 라벨(LW, RW 등)로 매칭, 없으면 기존처럼 행 내 인덱스로 매칭
      const matched =
        byPos.find((p) => p.slotLabel != null && p.slotLabel === label) ??
        (byPos[slotIndexInRow]?.slotLabel == null ? byPos[slotIndexInRow] : undefined);
      const participant = matched
        ? {
            userId: matched.userId,
            nickname: matched.nickname,
            tag: matched.tag,
            isCreator: matched.isCreator,
            profileImageUrl: matched.profileImageUrl,
            rankScore: matched.rankScore,
            positionWinRate: matched.positionWinRate,
          }
        : null;
      return { positionCode, label, index, participant };
    }
    const count = positionCounts[positionCode] ?? 0;
    return { positionCode, label, index, count };
  });

  const rows: { pos: string; slots: PitchSlot[] }[] = [];
  let i = 0;
  for (const pos of FOOTBALL_POSITION_ORDER) {
    const n = formation[pos] ?? 0;
    if (n === 0 || !positionsToShow.includes(pos)) continue;
    rows.push({ pos, slots: slots.slice(i, i + n) });
    i += n;
  }

  const rowsToRender = [...rows].reverse();

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData(DRAG_TYPE, '1');
    e.dataTransfer.effectAllowed = 'move';
    if (e.currentTarget instanceof HTMLElement) {
      const rect = e.currentTarget.getBoundingClientRect();
      e.dataTransfer.setDragImage(e.currentTarget, rect.width / 2, rect.height / 2);
    }
  };

  const handleSlotDragOver = (e: React.DragEvent, slotKey: string, canDrop: boolean) => {
    if (!canDrop) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setDragOverSlotKey(slotKey);
  };

  const handleSlotDragLeave = (e: React.DragEvent, slotKey: string) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setDragOverSlotKey((prev) => (prev === slotKey ? null : prev));
  };

  const handleSlotDrop = (e: React.DragEvent, slot: PitchSlot, canDrop: boolean) => {
    setDragOverSlotKey(null);
    if (!canDrop || e.dataTransfer.types.indexOf(DRAG_TYPE) === -1) return;
    e.preventDefault();
    e.stopPropagation();
    onSlotClick?.(slot.positionCode, slot.label);
  };

  return (
    <div className={`w-full mx-auto select-none ${isModal ? 'max-w-full' : 'max-w-4xl lg:max-w-5xl'}`}>
      {showDragChip && (
        <div className="flex items-center justify-center gap-2 mb-3">
          {showGradeCardChip ? (
            <div
              draggable
              onDragStart={handleDragStart}
              onDragEnd={() => setDragOverSlotKey(null)}
              role="button"
              aria-label={`${dragItemLabel}을(를) 구장 포지션으로 드래그하여 배치`}
              className="touch-none"
            >
              <DragChipGradeCard
                rankScore={dragItemRankScore ?? 0}
                imageUrl={dragItemImageUrl}
                size={isModal ? 'modal' : 'default'}
                nickname={currentUserNickname}
              />
            </div>
          ) : (
            <div
              draggable
              onDragStart={handleDragStart}
              onDragEnd={() => setDragOverSlotKey(null)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-[var(--color-blue-primary)]/60 bg-[var(--color-blue-primary)]/10 cursor-grab active:cursor-grabbing hover:border-[var(--color-blue-primary)] hover:bg-[var(--color-blue-primary)]/15 transition-colors touch-none"
              role="button"
              aria-label={`${dragItemLabel}을(를) 구장 포지션으로 드래그하여 배치`}
            >
              <div className="w-10 h-10 rounded-full overflow-hidden bg-[var(--color-bg-card)] border border-[var(--color-border-card)] flex-shrink-0 flex items-center justify-center">
                {dragItemImageUrl ? (
                  <img src={dragItemImageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <ArrowsPointingOutIcon className="w-5 h-5 text-[var(--color-text-secondary)]" />
                )}
              </div>
              <span className="text-sm font-medium text-[var(--color-text-primary)]">{dragItemLabel}</span>
              <span className="text-xs text-[var(--color-text-secondary)]">드래그해서 배치</span>
            </div>
          )}
        </div>
      )}
      <div
        className={`relative overflow-visible rounded-xl w-full max-w-full ${isModal ? 'min-h-[260px] max-h-[50vh]' : 'min-h-[240px] sm:min-h-[280px] md:min-h-[320px] lg:min-h-[360px] max-h-[55vh]'}`}
        style={{
          aspectRatio: '68 / 52.5',
          ...pitchStyle,
        }}
      >
        {/* 스타디움 서치라이트 (팀 악센트 시 생성 모달과 동일 강조) */}
        <div
          className="absolute inset-0 pointer-events-none rounded-xl"
          style={{
            opacity: useStadiumTheme ? 0.85 : 0.5,
            background: useStadiumTheme ? STADIUM_FLOODLIGHT : `
              radial-gradient(ellipse 80% 50% at 10% 0%, rgba(255,255,255,0.06) 0%, transparent 55%),
              radial-gradient(ellipse 80% 50% at 90% 0%, rgba(255,255,255,0.06) 0%, transparent 55%),
              radial-gradient(ellipse 100% 60% at 50% -10%, rgba(255,255,255,0.04) 0%, transparent 45%)
            `,
          }}
          aria-hidden
        />
        {/* 팀 컬러 미세 오버레이 (레드/블루 구장일 때만) */}
        {teamAccent && (
          <div
            className="absolute inset-0 pointer-events-none rounded-xl"
            style={{ background: PITCH_TEAM_OVERLAY[teamAccent] }}
            aria-hidden
          />
        )}
        {/* 축구장 평면도: 팀 악센트 시 구장 라인만 표시 (전술 격자 없음) */}
        {useStadiumTheme && (
          <div
            className="absolute inset-0 pointer-events-none rounded-xl bg-no-repeat bg-center"
            style={{
              backgroundImage: `url('/pitch-lines.svg')`,
              backgroundSize: '100% 100%',
              opacity: 0.7,
            }}
            aria-hidden
          />
        )}
        <div className={`absolute inset-0 flex flex-col justify-between ${isModal ? 'py-3 sm:py-4 px-2 sm:px-3' : 'py-3 sm:py-5 md:py-6 px-2 sm:px-3 md:px-4'}`}>
          {rowsToRender.map(({ pos, slots: rowSlots }) => {
            const isSingle = rowSlots.length === 1;
            const isFwRow = pos === 'FW';
            const circleBg = POSITION_CIRCLE[pos] ?? POSITION_CIRCLE.DF;
            return (
              <div
                key={pos}
                className={`flex items-center w-full ${isSingle ? 'justify-center' : isFwRow ? 'justify-center' : 'justify-between'}`}
              >
                {isFwRow && !isSingle ? (
                  <div className="flex items-center justify-center gap-4 sm:gap-6 md:gap-8 w-full max-w-[72%]">
                    {rowSlots.map((slot, idx) => {
                      const isEmpty = mode === 'match' ? !slot.participant : false;
                      const canClick = mode === 'match' && isEmpty && !!onSlotClick;
                      const canDrop = canClick && showDragChip;
                      const count = slot.count ?? 0;
                      const slotKey = `${pos}-${idx}`;
                      const showPlayerTooltip = mode === 'match' && slot.participant && hoveredSlotKey === slotKey;
                      const tooltip = mode === 'stats' ? `${slot.label}에 ${count}회 참여했습니다` : (mode === 'match' && slot.participant ? undefined : undefined);
                      const isDropTarget = dragOverSlotKey === slotKey;
                      return (
                        <div
                          key={slotKey}
                          onClick={() => canClick && onSlotClick?.(slot.positionCode, slot.label)}
                          onMouseEnter={() => setHoveredSlotKey(slotKey)}
                          onMouseLeave={() => setHoveredSlotKey(null)}
                          onDragOver={canDrop ? (e) => handleSlotDragOver(e, slotKey, true) : undefined}
                          onDragLeave={canDrop ? (e) => handleSlotDragLeave(e, slotKey) : undefined}
                          onDrop={canDrop ? (e) => handleSlotDrop(e, slot, true) : undefined}
                          title={!showPlayerTooltip ? tooltip : undefined}
                          className={`
                            relative flex flex-col items-center justify-center
                            border transition-[border-color,opacity,box-shadow] duration-150 select-none
                            ${isModal ? 'py-2 px-2.5 min-w-[72px] sm:min-w-[80px]' : 'py-2 px-2.5 min-w-[68px] sm:min-w-[76px] md:min-w-[88px]'}
                            ${canClick ? 'cursor-pointer hover:opacity-95' : mode === 'match' && slot.participant ? 'cursor-default' : ''}
                            ${!isModal ? 'rounded-sm' : 'rounded-[3px]'}
                            ${isDropTarget ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-[var(--color-bg-card)]' : ''}
                          `}
                          style={{
                            background: useStadiumTheme ? 'transparent' : (cardStyle ? cardStyle.background : 'linear-gradient(180deg, #3d3d3d 0%, #333 100%)'),
                            borderColor: useStadiumTheme ? 'transparent' : (cardStyle ? cardStyle.borderColor : 'rgba(255,255,255,0.06)'),
                            boxShadow: isDropTarget ? '0 0 0 3px rgba(34,211,238,0.5)' : 'none',
                          }}
                        >
                          {mode === 'match' && useStadiumTheme ? (
                            slot.participant ? (
                              slot.participant.userId === currentUserId ? (
                                <div
                                  draggable
                                  onDragStart={handleDragStart}
                                  onDragEnd={() => setDragOverSlotKey(null)}
                                  className="cursor-grab active:cursor-grabbing touch-none inline-block"
                                  role="button"
                                  aria-label="내 포지션 카드 드래그하여 이동"
                                >
                                  <ParticipantTradingCard
                                    participant={slot.participant}
                                    slotLabel={slot.label}
                                    positionCode={slot.positionCode}
                                    size={isModal ? 'modal' : 'default'}
                                  />
                                </div>
                              ) : (
                                <ParticipantTradingCard
                                  participant={slot.participant}
                                  slotLabel={slot.label}
                                  positionCode={slot.positionCode}
                                  size={isModal ? 'modal' : 'default'}
                                />
                              )
                            ) : showEmptySlots ? (
                              <EmptySlotGuide size={isModal ? 'modal' : 'default'} />
                            ) : null
                          ) : (
                            <>
                              <span className={`uppercase tracking-[0.2em] text-white/90 pointer-events-none font-medium ${isModal ? 'text-[10px] sm:text-xs' : 'text-[10px] sm:text-xs'}`}>
                                {slot.label}
                              </span>
                              <div
                                className={`
                                  rounded-full flex items-center justify-center text-white font-medium tabular-nums pointer-events-none overflow-hidden
                                  ${circleBg}
                                  ${isModal ? 'mt-1.5 w-14 h-14 sm:w-16 sm:h-16 text-xs' : 'mt-2 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-sm sm:text-base'}
                                `}
                              >
                                {mode === 'match' && slot.participant && slot.participant.profileImageUrl && (
                                  <img src={slot.participant.profileImageUrl} alt="" className="w-full h-full object-cover" />
                                )}
                                {mode === 'match' && slot.participant && !slot.participant.profileImageUrl && (
                                  <UserCircleIcon className="w-8 h-8 sm:w-9 sm:h-9 text-white/80" />
                                )}
                                {mode === 'match' && isEmpty && <span className="text-white/95 text-sm sm:text-base leading-none">+</span>}
                                {mode === 'stats' && <span>{slot.count ?? 0}회</span>}
                              </div>
                            </>
                          )}
                          {showPlayerTooltip && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg bg-[var(--color-bg-card)] border border-[var(--color-border-card)] shadow-xl text-left whitespace-nowrap z-50 pointer-events-none">
                              <div className="text-xs font-semibold text-[var(--color-text-primary)]">{slot.participant?.nickname}{slot.participant?.tag ?? ''}</div>
                              {(slot.participant?.rankScore == null || slot.participant?.rankScore === 0) && slot.participant?.positionWinRate == null ? (
                                <div className="text-[11px] text-[var(--color-text-secondary)] mt-1">이 포지션에서 첫 경기입니다</div>
                              ) : (
                                <>
                                  <div className="text-[11px] text-[var(--color-text-secondary)] mt-1">{slot.participant?.rankScore != null ? `${slot.participant.rankScore.toLocaleString()} RP` : '0 RP'}</div>
                                  <div className="text-[11px] text-[var(--color-text-secondary)]">포지션 승률: {slot.participant?.positionWinRate != null ? `${slot.participant.positionWinRate}%` : '집계 예정'}</div>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : null}
                {(!isFwRow || isSingle) && rowSlots.map((slot, idx) => {
                  const isEmpty = mode === 'match' ? !slot.participant : false;
                  const canClick = mode === 'match' && isEmpty && !!onSlotClick;
                  const canDrop = canClick && showDragChip;
                  const count = slot.count ?? 0;
                  const slotKeyB = `${pos}-${idx}`;
                  const showPlayerTooltipB = mode === 'match' && slot.participant && hoveredSlotKey === slotKeyB;
                  const tooltipB = mode === 'stats' ? `${slot.label}에 ${count}회 참여했습니다` : (mode === 'match' && slot.participant ? undefined : undefined);
                  const isDropTargetB = dragOverSlotKey === slotKeyB;

                  return (
                    <div
                      key={slotKeyB}
                      onClick={() => canClick && onSlotClick?.(slot.positionCode, slot.label)}
                      onMouseEnter={() => setHoveredSlotKey(slotKeyB)}
                      onMouseLeave={() => setHoveredSlotKey(null)}
                      onDragOver={canDrop ? (e) => handleSlotDragOver(e, slotKeyB, true) : undefined}
                      onDragLeave={canDrop ? (e) => handleSlotDragLeave(e, slotKeyB) : undefined}
                      onDrop={canDrop ? (e) => handleSlotDrop(e, slot, true) : undefined}
                      title={!showPlayerTooltipB ? tooltipB : undefined}
                      className={`
                        relative flex flex-col items-center justify-center
                        border transition-[border-color,opacity,box-shadow] duration-150 select-none
                        ${isModal ? 'py-2 px-2.5 min-w-[72px] sm:min-w-[80px]' : 'py-2 px-2.5 min-w-[68px] sm:min-w-[76px] md:min-w-[88px]'}
                        ${canClick ? 'cursor-pointer hover:opacity-95' : mode === 'match' && slot.participant ? 'cursor-default' : ''}
                        ${!isModal ? 'rounded-sm' : 'rounded-[3px]'}
                        ${isDropTargetB ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-[var(--color-bg-card)]' : ''}
                      `}
                      style={{
                        background: useStadiumTheme ? 'transparent' : (cardStyle ? cardStyle.background : 'linear-gradient(180deg, #3d3d3d 0%, #333 100%)'),
                        borderColor: useStadiumTheme ? 'transparent' : (cardStyle ? cardStyle.borderColor : 'rgba(255,255,255,0.06)'),
                        boxShadow: isDropTargetB ? '0 0 0 3px rgba(34,211,238,0.5)' : 'none',
                      }}
                    >
                      {mode === 'match' && useStadiumTheme ? (
                        slot.participant ? (
                          slot.participant.userId === currentUserId ? (
                            <div
                              draggable
                              onDragStart={handleDragStart}
                              onDragEnd={() => setDragOverSlotKey(null)}
                              className="cursor-grab active:cursor-grabbing touch-none inline-block"
                              role="button"
                              aria-label="내 포지션 카드 드래그하여 이동"
                            >
                              <ParticipantTradingCard
                                participant={slot.participant}
                                slotLabel={slot.label}
                                positionCode={slot.positionCode}
                                size={isModal ? 'modal' : 'default'}
                              />
                            </div>
                          ) : (
                            <ParticipantTradingCard
                              participant={slot.participant}
                              slotLabel={slot.label}
                              positionCode={slot.positionCode}
                              size={isModal ? 'modal' : 'default'}
                            />
                          )
                        ) : showEmptySlots ? (
                          <EmptySlotGuide size={isModal ? 'modal' : 'default'} />
                        ) : null
                      ) : (
                        <>
                          <span
                            className={`uppercase tracking-[0.2em] text-white/90 pointer-events-none font-medium ${isModal ? 'text-[9px]' : 'text-[10px] sm:text-xs'}`}
                          >
                            {slot.label}
                          </span>
                          <div
                            className={`
                              rounded-full flex items-center justify-center text-white font-medium tabular-nums pointer-events-none overflow-hidden
                              ${circleBg}
                              ${isModal ? 'mt-1.5 w-14 h-14 sm:w-16 sm:h-16 text-xs' : 'mt-2 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-sm sm:text-base'}
                            `}
                          >
                            {mode === 'match' && slot.participant && slot.participant.profileImageUrl && (
                              <img src={slot.participant.profileImageUrl} alt="" className="w-full h-full object-cover" />
                            )}
                            {mode === 'match' && slot.participant && !slot.participant.profileImageUrl && (
                              <UserCircleIcon className="w-8 h-8 sm:w-9 sm:h-9 text-white/80" />
                            )}
                            {mode === 'match' && isEmpty && (
                              <span className="text-white/95 text-sm sm:text-base leading-none">+</span>
                            )}
                            {mode === 'stats' && (
                              <span>{count}회</span>
                            )}
                          </div>
                        </>
                      )}
                      {showPlayerTooltipB && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg bg-[var(--color-bg-card)] border border-[var(--color-border-card)] shadow-xl text-left whitespace-nowrap z-50 pointer-events-none">
                          <div className="text-xs font-semibold text-[var(--color-text-primary)]">{slot.participant?.nickname}{slot.participant?.tag ?? ''}</div>
                          {(slot.participant?.rankScore == null || slot.participant?.rankScore === 0) && slot.participant?.positionWinRate == null ? (
                            <div className="text-[11px] text-[var(--color-text-secondary)] mt-1">이 포지션에서 첫 경기입니다</div>
                          ) : (
                            <>
                              <div className="text-[11px] text-[var(--color-text-secondary)] mt-1">{slot.participant?.rankScore != null ? `${slot.participant.rankScore.toLocaleString()} RP` : '0 RP'}</div>
                              <div className="text-[11px] text-[var(--color-text-secondary)]">포지션 승률: {slot.participant?.positionWinRate != null ? `${slot.participant.positionWinRate}%` : '집계 예정'}</div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
