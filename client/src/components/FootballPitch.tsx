import React, { useState } from 'react';
import {
  FOOTBALL_FORMATION_442,
  FOOTBALL_POSITION_ORDER,
  FOOTBALL_PITCH_SLOTS,
} from '../constants/formation';

export type PitchMode = 'match' | 'stats';

interface SlotParticipant {
  userId: number;
  nickname: string;
  tag?: string | null;
  isCreator?: boolean;
  profileImageUrl?: string | null;
  slotLabel?: string | null;
  /** 오운 랭크 점수 (명예의 전당). 툴팁 표시용 */
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
}

/** 포지션별 중앙 원 악센트 (EA FC 스타일, 절제된 채도) */
const POSITION_CIRCLE: Record<string, string> = {
  GK: 'bg-amber-700/90',   // 골키퍼: 황갈/주황
  DF: 'bg-sky-700/90',     // 수비: 파랑
  MF: 'bg-emerald-700/90', // 미드: 녹색
  FW: 'bg-rose-700/90',    // 공격: 빨강
};

const PITCH_TEAM_STYLE: Record<'red' | 'blue', { background: string; boxShadow: string }> = {
  red: {
    background: 'linear-gradient(180deg, #160a0a 0%, #0d0808 30%, #0a0a0a 50%, #0d0808 70%, #160a0a 100%)',
    boxShadow: 'inset 0 0 0 1px rgba(199,54,54,0.12), inset 0 0 80px rgba(199,54,54,0.03)',
  },
  blue: {
    background: 'linear-gradient(180deg, #0a0a16 0%, #08080d 30%, #0a0a0a 50%, #08080d 70%, #0a0a16 100%)',
    boxShadow: 'inset 0 0 0 1px rgba(59,108,184,0.12), inset 0 0 80px rgba(59,108,184,0.03)',
  },
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

export default function FootballPitch({
  mode,
  participants = [],
  positionCounts = {},
  onSlotClick,
  isUserParticipant = false,
  recruitPositions,
  size = 'default',
  teamAccent,
}: FootballPitchProps) {
  const [hoveredSlotKey, setHoveredSlotKey] = useState<string | null>(null);
  const isModal = size === 'modal';
  const pitchStyle = teamAccent ? PITCH_TEAM_STYLE[teamAccent] : {
    background: 'linear-gradient(180deg, #0f0f0f 0%, #0a0a0a 50%, #0f0f0f 100%)',
    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.04)',
  };
  const cardStyle = teamAccent ? CARD_TEAM_STYLE[teamAccent] : null;
  const formation = FOOTBALL_FORMATION_442;
  const positionsToShow =
    recruitPositions?.length
      ? recruitPositions.filter((p) => formation[p] != null)
      : FOOTBALL_POSITION_ORDER.slice();

  const slots: PitchSlot[] = FOOTBALL_PITCH_SLOTS.map(({ positionCode, label }, index) => {
    if (!positionsToShow.includes(positionCode)) {
      return { positionCode, label, index, participant: null };
    }
    if (mode === 'match') {
      const byPos = participants.filter((p) => p.positionCode === positionCode);
      const slotIndexInRow = FOOTBALL_PITCH_SLOTS.slice(0, index).filter(
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

  return (
    <div className={`w-full mx-auto select-none ${isModal ? 'max-w-full' : 'max-w-5xl'}`}>
      <div
        className={`relative overflow-visible ${isModal ? 'min-h-[340px] rounded-md' : 'min-h-[320px] sm:min-h-[380px] md:min-h-[420px] rounded-lg'}`}
        style={{
          /* 아래쪽 반코트만: 골대=아래, 폭 68 / 높이 52.5 (FIFA 절반) */
          aspectRatio: '68 / 52.5',
          ...pitchStyle,
        }}
      >
        {/* 구장 라인: FIFA 규격 SVG 이미지 오버레이 */}
        <div
          className="absolute inset-0 pointer-events-none bg-no-repeat bg-center"
          style={{
            backgroundImage: `url('/pitch-lines.svg')`,
            backgroundSize: '100% 100%',
          }}
          aria-hidden
        />
        <div className={`absolute inset-0 flex flex-col justify-between ${isModal ? 'py-4 sm:py-5 px-3 sm:px-4' : 'py-5 sm:py-6 md:py-8 px-3 sm:px-4 md:px-6'}`}>
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
                      const canClick = mode === 'match' && isEmpty && onSlotClick && !isUserParticipant;
                      const count = slot.count ?? 0;
                      const slotKey = `${pos}-${idx}`;
                      const showPlayerTooltip = mode === 'match' && slot.participant && hoveredSlotKey === slotKey;
                      const tooltip = mode === 'stats' ? `${slot.label}에 ${count}회 참여했습니다` : (mode === 'match' && slot.participant ? undefined : undefined);
                      return (
                        <div
                          key={slotKey}
                          onClick={() => canClick && onSlotClick?.(slot.positionCode, slot.label)}
                          onMouseEnter={() => setHoveredSlotKey(slotKey)}
                          onMouseLeave={() => setHoveredSlotKey(null)}
                          title={!showPlayerTooltip ? tooltip : undefined}
                          className={`
                            relative flex flex-col items-center justify-center
                            border transition-[border-color,opacity] duration-150 select-none
                            ${isModal ? 'py-2 px-2.5 min-w-[64px] sm:min-w-[72px]' : 'py-2 px-2.5 min-w-[60px] sm:min-w-[68px] md:min-w-[80px]'}
                            ${canClick ? 'cursor-pointer hover:opacity-95' : mode === 'match' && slot.participant ? 'cursor-default' : ''}
                            ${!isModal ? 'rounded-sm' : 'rounded-[3px]'}
                          `}
                          style={{
                            background: cardStyle ? cardStyle.background : 'linear-gradient(180deg, #3d3d3d 0%, #333 100%)',
                            borderColor: cardStyle ? cardStyle.borderColor : 'rgba(255,255,255,0.06)',
                            boxShadow: 'none',
                          }}
                        >
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
                              <span className="truncate max-w-full text-center font-semibold" title={(slot.participant.nickname || '') + (slot.participant.tag || '')}>
                                {(slot.participant.nickname || '모임장').slice(0, 2)}
                                {slot.participant.isCreator && <span className="text-white/80 ml-0.5">★</span>}
                              </span>
                            )}
                            {mode === 'match' && isEmpty && <span className="text-white/95 text-sm sm:text-base leading-none">+</span>}
                            {mode === 'stats' && <span>{slot.count ?? 0}회</span>}
                          </div>
                          {showPlayerTooltip && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg bg-[var(--color-bg-card)] border border-[var(--color-border-card)] shadow-xl text-left whitespace-nowrap z-50 pointer-events-none">
                              <div className="text-xs font-semibold text-[var(--color-text-primary)]">{slot.participant?.nickname}{slot.participant?.tag ?? ''}</div>
                              {(slot.participant?.rankScore == null || slot.participant?.rankScore === 0) && slot.participant?.positionWinRate == null ? (
                                <div className="text-[11px] text-[var(--color-text-secondary)] mt-1">이 포지션에서 첫 경기입니다</div>
                              ) : (
                                <>
                                  <div className="text-[11px] text-[var(--color-text-secondary)] mt-1">오운 랭크 점수: {slot.participant?.rankScore != null ? slot.participant.rankScore.toLocaleString() : '-'}</div>
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
                  const canClick =
                    mode === 'match' &&
                    isEmpty &&
                    onSlotClick &&
                    !isUserParticipant;
                  const count = slot.count ?? 0;
                  const slotKeyB = `${pos}-${idx}`;
                  const showPlayerTooltipB = mode === 'match' && slot.participant && hoveredSlotKey === slotKeyB;
                  const tooltipB = mode === 'stats' ? `${slot.label}에 ${count}회 참여했습니다` : (mode === 'match' && slot.participant ? undefined : undefined);

                  return (
                    <div
                      key={slotKeyB}
                      onClick={() => canClick && onSlotClick?.(slot.positionCode, slot.label)}
                      onMouseEnter={() => setHoveredSlotKey(slotKeyB)}
                      onMouseLeave={() => setHoveredSlotKey(null)}
                      title={!showPlayerTooltipB ? tooltipB : undefined}
                      className={`
                        relative flex flex-col items-center justify-center
                        border transition-[border-color,opacity] duration-150 select-none
                        ${isModal ? 'py-2 px-2.5 min-w-[64px] sm:min-w-[72px]' : 'py-2 px-2.5 min-w-[60px] sm:min-w-[68px] md:min-w-[80px]'}
                        ${canClick ? 'cursor-pointer hover:opacity-95' : mode === 'match' && slot.participant ? 'cursor-default' : ''}
                        ${!isModal ? 'rounded-sm' : 'rounded-[3px]'}
                      `}
                      style={{
                        background: cardStyle ? cardStyle.background : 'linear-gradient(180deg, #3d3d3d 0%, #333 100%)',
                        borderColor: cardStyle ? cardStyle.borderColor : 'rgba(255,255,255,0.06)',
                        boxShadow: 'none',
                      }}
                    >
                      <span
                        className={`uppercase tracking-[0.2em] text-white/90 pointer-events-none font-medium ${isModal ? 'text-[9px]' : 'text-[10px] sm:text-xs'}`}
                      >
                        {slot.label}
                      </span>
                      {/* 중앙 원: 참가자 프로필/+ (포지션별 악센트, 크게 표시) */}
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
                          <span
                            className="truncate max-w-full text-center font-semibold"
                            title={(slot.participant.nickname || '') + (slot.participant.tag || '')}
                          >
                            {(slot.participant.nickname || '모임장').slice(0, 2)}
                            {slot.participant.isCreator && (
                              <span className="text-white/80 ml-0.5">★</span>
                            )}
                          </span>
                        )}
                        {mode === 'match' && isEmpty && (
                          <span className="text-white/95 text-sm sm:text-base leading-none">+</span>
                        )}
                        {mode === 'stats' && (
                          <span>{count}회</span>
                        )}
                      </div>
                      {showPlayerTooltipB && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg bg-[var(--color-bg-card)] border border-[var(--color-border-card)] shadow-xl text-left whitespace-nowrap z-50 pointer-events-none">
                          <div className="text-xs font-semibold text-[var(--color-text-primary)]">{slot.participant?.nickname}{slot.participant?.tag ?? ''}</div>
                          {(slot.participant?.rankScore == null || slot.participant?.rankScore === 0) && slot.participant?.positionWinRate == null ? (
                            <div className="text-[11px] text-[var(--color-text-secondary)] mt-1">이 포지션에서 첫 경기입니다</div>
                          ) : (
                            <>
                              <div className="text-[11px] text-[var(--color-text-secondary)] mt-1">오운 랭크 점수: {slot.participant?.rankScore != null ? slot.participant.rankScore.toLocaleString() : '-'}</div>
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
