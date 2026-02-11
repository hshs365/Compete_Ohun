/**
 * 좌표 기반 전술판 — 참가자 카드를 (positionX, positionY) 위치에 배치.
 * positionX/positionY가 없으면 positionToDefaultCoords(positionCode, slotLabel)로 기본 위치 사용.
 */
import React, { useRef, useCallback, useState } from 'react';
import { ArrowsPointingOutIcon } from '@heroicons/react/24/outline';
import { positionToDefaultCoords, coordsToPositionAndLabel } from '../utils/tacticalPositionUtils';
import { rpToGrade } from '../constants/rankGrade';
import { getPremiumCardTheme } from '../constants/premiumRankCard';
import type { AllcourtplayRank } from '../constants/allcourtplayRank';
import { STADIUM_BG, STADIUM_THEME_BG, FULL_FIELD_STRIPED_BG } from '../constants/pitchStyle';

export interface CoordinateParticipant {
  userId: number;
  nickname: string;
  tag?: string | null;
  positionCode: string | null;
  slotLabel: string | null;
  isCreator?: boolean;
  profileImageUrl?: string | null;
  rankScore?: number | null;
  /** 0–100. 없으면 positionCode/slotLabel로 기본 위치 */
  positionX?: number | null;
  positionY?: number | null;
  /** 팀 (매치 입장 등에서 레드/블루 카드 구분용) */
  team?: 'red' | 'blue';
}

interface CoordinateBasedPitchProps {
  participants: CoordinateParticipant[];
  teamAccent: 'red' | 'blue';
  size?: 'default' | 'modal';
  showStadiumLines?: boolean;
  /** true면 풀필드 세로 줄무늬 잔디 (한 구장에 레드/블루 전원 표시) */
  fullFieldStriped?: boolean;
  /** 드래그로 "내 포지션" 배치 시 콜백 (좌표 기반) */
  onPositionDrop?: (positionCode: string, slotLabel: string, positionX: number, positionY: number) => void;
  enableDragDrop?: boolean;
  dragItemLabel?: string;
  dragItemImageUrl?: string | null;
  dragItemRankScore?: number | null;
  currentUserId?: number | null;
  currentUserNickname?: string | null;
}

function getCoords(p: CoordinateParticipant): { x: number; y: number } {
  if (p.positionX != null && p.positionY != null && Number.isFinite(p.positionX) && Number.isFinite(p.positionY)) {
    return { x: p.positionX, y: p.positionY };
  }
  return positionToDefaultCoords(p.positionCode || 'MF', p.slotLabel || 'CM');
}

export default function CoordinateBasedPitch({
  participants,
  teamAccent,
  size = 'default',
  showStadiumLines = false,
  fullFieldStriped = false,
  onPositionDrop,
  enableDragDrop = false,
  dragItemLabel = '내 포지션',
  dragItemImageUrl = null,
  dragItemRankScore = null,
  currentUserId = null,
  currentUserNickname = null,
}: CoordinateBasedPitchProps) {
  const pitchRef = useRef<HTMLDivElement>(null);
  const [isDraggingChip, setIsDraggingChip] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const isModal = size === 'modal';

  const getCoordsFromEvent = useCallback((e: React.DragEvent): { x: number; y: number } | null => {
    const el = pitchRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const clientX = e.clientX;
    const clientY = e.clientY;
    const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const pixelY = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
    const y = 100 - pixelY;
    return { x, y };
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);
      setIsDraggingChip(false);
      if (e.dataTransfer.types.indexOf('application/x-coordinate-pitch-drag') === -1) return;
      const coords = getCoordsFromEvent(e);
      if (!coords || !onPositionDrop) return;
      const { positionCode, slotLabel } = coordsToPositionAndLabel(coords.x, coords.y);
      onPositionDrop(positionCode, slotLabel, coords.x, coords.y);
    },
    [getCoordsFromEvent, onPositionDrop]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (!pitchRef.current?.contains(e.relatedTarget as Node)) setDragOver(false);
  }, []);

  const handleChipDragStart = useCallback((e: React.DragEvent) => {
    e.dataTransfer.setData('application/x-coordinate-pitch-drag', '1');
    e.dataTransfer.effectAllowed = 'move';
    setIsDraggingChip(true);
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    e.dataTransfer.setDragImage(target, rect.width / 2, rect.height / 2);
  }, []);

  const handleChipDragEnd = useCallback(() => {
    setIsDraggingChip(false);
    setDragOver(false);
  }, []);

  return (
    <div className={`w-full mx-auto select-none ${isModal ? 'max-w-full' : 'max-w-5xl'}`}>
      {enableDragDrop && onPositionDrop && (
        <div className="flex items-center justify-center gap-2 mb-3">
          <div
            draggable
            onDragStart={handleChipDragStart}
            onDragEnd={handleChipDragEnd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-[var(--color-blue-primary)]/60 bg-[var(--color-blue-primary)]/10 cursor-grab active:cursor-grabbing hover:border-[var(--color-blue-primary)] hover:bg-[var(--color-blue-primary)]/15 transition-colors touch-none"
            role="button"
            aria-label={`${dragItemLabel}을(를) 구장 위 원하는 위치로 드래그하세요`}
          >
            <div className="w-10 h-10 rounded-full overflow-hidden bg-[var(--color-bg-card)] border border-[var(--color-border-card)] shrink-0 flex items-center justify-center">
              {dragItemImageUrl ? (
                <img src={dragItemImageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <ArrowsPointingOutIcon className="w-5 h-5 text-[var(--color-text-secondary)]" />
              )}
            </div>
            <span className="text-sm font-medium text-[var(--color-text-primary)]">{dragItemLabel}</span>
            <span className="text-xs text-[var(--color-text-secondary)]">드래그해서 배치</span>
          </div>
        </div>
      )}

      <div
        ref={pitchRef}
        className={`relative overflow-hidden rounded-xl w-full max-w-full min-h-[240px] sm:min-h-[280px] md:min-h-[320px] lg:min-h-[360px] max-h-[55vh] ${isModal ? 'max-h-[50vh]' : ''}`}
        style={{
          aspectRatio: '68 / 52.5',
          ...(fullFieldStriped ? FULL_FIELD_STRIPED_BG : showStadiumLines ? STADIUM_THEME_BG : STADIUM_BG),
        }}
        onDragOver={enableDragDrop ? handleDragOver : undefined}
        onDragLeave={enableDragDrop ? handleDragLeave : undefined}
        onDrop={enableDragDrop ? handleDrop : undefined}
      >
        {showStadiumLines && (
          <div
            className="absolute inset-0 pointer-events-none bg-no-repeat bg-center"
            style={{
              backgroundImage: `url('/pitch-lines.svg')`,
              backgroundSize: '100% 100%',
              opacity: 0.7,
            }}
            aria-hidden
          />
        )}

        {dragOver && enableDragDrop && (
          <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-cyan-400/50 bg-cyan-500/5 rounded-lg" />
        )}

        {participants.map((p) => {
          const { x, y } = getCoords(p);
          const rp = p.rankScore != null && Number.isFinite(p.rankScore) ? p.rankScore : 0;
          const grade: AllcourtplayRank = rpToGrade(rp);
          const theme = getPremiumCardTheme(grade);
          const slotLabel = p.slotLabel || 'CM';
          const positionCode = p.positionCode || 'MF';

          return (
            <div
              key={p.userId}
              className="absolute z-10 flex flex-col items-center pointer-events-none"
              style={{
                left: `${x}%`,
                top: `${100 - y}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <div
                className={`
                  relative rounded-xl overflow-hidden flex flex-col
                  ${isModal ? 'w-[78px] min-h-[104px]' : 'w-[88px] min-h-[116px] sm:w-[96px] sm:min-h-[124px] md:w-[100px] md:min-h-[132px]'}
                `}
                style={{
                  background: theme.cardBg,
                  boxShadow: p.team === 'blue'
                    ? `inset 0 1px 0 rgba(255,255,255,0.08), 0 0 0 2px ${theme.borderColor}, 0 4px 20px rgba(0,0,0,0.35), 0 0 12px rgba(59,130,246,0.25)`
                    : p.team === 'red'
                      ? `inset 0 1px 0 rgba(255,255,255,0.08), 0 0 0 2px ${theme.borderColor}, 0 4px 20px rgba(0,0,0,0.35), 0 0 12px rgba(239,68,68,0.25)`
                      : `inset 0 1px 0 rgba(255,255,255,0.08), 0 0 0 2px ${theme.borderColor}, 0 4px 20px rgba(0,0,0,0.35)`,
                }}
                title={`${p.nickname} · ${slotLabel}`}
              >
                <div className={`absolute top-0.5 left-1 z-10 flex flex-col items-start gap-0 ${isModal ? '' : 'sm:top-1 sm:left-1.5'}`}>
                  <span
                    className={`font-black leading-none tracking-tighter ${isModal ? 'text-sm' : 'text-base sm:text-lg'}`}
                    style={{
                      color: theme.tierColor,
                      textShadow: `0 0 10px ${theme.tierColor}80, 0 0 20px ${theme.tierColor}50, 0 1px 3px rgba(0,0,0,0.6)`,
                    }}
                  >
                    {grade}
                  </span>
                  <span className={`font-bold tabular-nums uppercase tracking-wider ${isModal ? 'text-[8px]' : 'text-[9px]'}`} style={{ color: theme.rpColor }}>
                    {rp.toLocaleString()} RP
                  </span>
                </div>
                <div className={`flex-1 flex items-center justify-center px-0.5 min-h-0 ${isModal ? 'pt-4 pb-5' : 'pt-7 pb-9 sm:pt-8 sm:pb-10'}`}>
                  <div className={`relative rounded-lg overflow-hidden bg-black/35 ring-1 ring-white/15 flex items-center justify-center shrink-0 ${isModal ? 'w-9 h-9' : 'w-11 h-11 sm:w-12 sm:h-12'}`}>
                    {p.profileImageUrl ? (
                      <img src={p.profileImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover object-center" />
                    ) : (
                      <ArrowsPointingOutIcon className={isModal ? 'w-5 h-5 text-white/40' : 'w-6 h-6 text-white/40'} />
                    )}
                  </div>
                </div>
                <div className={`w-full bg-black/55 backdrop-blur-sm flex flex-col items-center gap-0 ${isModal ? 'py-1 px-1' : 'py-1.5 px-2'}`}>
                  <span className={`font-bold text-white/95 truncate w-full text-center ${isModal ? 'text-[8px]' : 'text-[9px] sm:text-[10px]'}`}>{p.nickname}</span>
                  <span className={`font-bold text-white uppercase tracking-widest block ${isModal ? 'text-[8px]' : 'text-[9px] sm:text-[10px]'}`}>{slotLabel}</span>
                  <span className={`text-white/50 uppercase tracking-wider ${isModal ? 'text-[6px]' : 'text-[7px] sm:text-[8px]'}`}>{positionCode}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {enableDragDrop && onPositionDrop && (
        <p className="text-xs text-[var(--color-text-secondary)] mt-2 text-center">
          구장 위 원하는 위치에 드래그해 두세요. 좌표 기준으로 배치됩니다.
        </p>
      )}
    </div>
  );
}
