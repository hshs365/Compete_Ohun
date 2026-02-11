/**
 * 전술 보드 — 가로형 구장(골대 좌/우)에 세로형 DB 좌표를 변환해 표시.
 * 레드=왼쪽 진영, 블루=오른쪽 진영. 선수 카드: 육각형, 팀/등급별 글로우. 네이티브 드래그(React 19 호환).
 */
import React, { useRef, useCallback, useState } from 'react';
import {
  positionToDefaultCoordsForTeam,
  coordsToPositionAndLabel,
  verticalToHorizontal,
  horizontalToVertical,
} from '../utils/tacticalPositionUtils';
import { rpToGrade } from '../constants/rankGrade';
import type { AllcourtplayRank } from '../constants/allcourtplayRank';
import FullPitchCSS from './FullPitchCSS';

export interface BoardParticipant {
  userId: number;
  nickname: string;
  positionCode: string | null;
  slotLabel: string | null;
  profileImageUrl?: string | null;
  rankScore?: number | null;
  team?: 'red' | 'blue';
  positionX?: number | null;
  positionY?: number | null;
}

interface TacticalBoardCanvasProps {
  participants: BoardParticipant[];
  currentUserId: number | null;
  onPositionChange: (x: number, y: number, positionCode: string, slotLabel: string) => void;
}

/** 전체 구장 클램프 */
const CONTAINMENT = { xMin: 5, xMax: 95, yMin: 5, yMax: 95 };
/** 팀별 진영: 레드=왼쪽(5~45%), 블루=오른쪽(55~95%). 배정된 팀 진영 밖으로 카드 이동 불가 */
const TEAM_HALF = { red: { xMin: 5, xMax: 45 }, blue: { xMin: 55, xMax: 95 } };

/** 카드 크기 (픽셀) */
const CARD_WIDTH = 48;
const CARD_HEIGHT = Math.round(CARD_WIDTH * (92 / 72));

/** 세로형(DB) 또는 기본 → 가로형(화면) 좌표 */
function getDisplayCoords(p: BoardParticipant): { hx: number; hy: number } {
  const team = p.team ?? 'red';
  let vx: number;
  let vy: number;
  if (p.positionX != null && p.positionY != null && Number.isFinite(p.positionX) && Number.isFinite(p.positionY)) {
    vx = Math.max(0, Math.min(100, p.positionX));
    vy = Math.max(0, Math.min(100, p.positionY));
  } else {
    const defaultCoords = positionToDefaultCoordsForTeam(team, p.positionCode || 'MF', p.slotLabel || 'CM');
    vx = defaultCoords.x;
    vy = defaultCoords.y;
  }
  return verticalToHorizontal(team, vx, vy);
}

/** 팀별 기본 글로우 클래스 */
const TEAM_GLOW_CLASS: Record<'red' | 'blue', string> = {
  red: 'shadow-[0_0_12px_rgba(239,68,68,0.5)]',
  blue: 'shadow-[0_0_12px_rgba(59,130,246,0.5)]',
};
const TEAM_GLOW_HOVER_CLASS: Record<'red' | 'blue', string> = {
  red: 'shadow-[0_0_16px_rgba(239,68,68,0.7)]',
  blue: 'shadow-[0_0_16px_rgba(59,130,246,0.7)]',
};

/** 등급별 글로우 — S/A: 골드·실버, B/C: 팀 기본, D/E/F: 팀 기본(카드 opacity-70) */
function getRankGlowClass(grade: AllcourtplayRank, team: 'red' | 'blue'): string {
  if (grade === 'S') return 'shadow-[0_0_14px_rgba(251,191,36,0.6)]';
  if (grade === 'A') return 'shadow-[0_0_14px_rgba(192,192,192,0.6)]';
  return TEAM_GLOW_CLASS[team];
}

function getRankGlowHoverClass(grade: AllcourtplayRank, team: 'red' | 'blue'): string {
  if (grade === 'S') return 'shadow-[0_0_18px_rgba(251,191,36,0.8)]';
  if (grade === 'A') return 'shadow-[0_0_18px_rgba(192,192,192,0.8)]';
  return TEAM_GLOW_HOVER_CLASS[team];
}

function isLowTier(grade: AllcourtplayRank): boolean {
  return grade === 'D' || grade === 'E' || grade === 'F';
}

/** 육각형 카드 clip-path — 상단 각진, 하단 뾰족 */
const CARD_CLIP_PATH = 'polygon(0% 0%, 100% 0%, 100% 75%, 50% 100%, 0% 75%)';

export default function TacticalBoardCanvas({
  participants,
  currentUserId,
  onPositionChange,
}: TacticalBoardCanvasProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const [draggingUserId, setDraggingUserId] = useState<number | null>(null);
  const [previewPosition, setPreviewPosition] = useState<{
    positionCode: string;
    slotLabel: string;
    tooltipX: number;
    tooltipY: number;
  } | null>(null);
  const [hoveredUserId, setHoveredUserId] = useState<number | null>(null);

  /** 드롭 위치를 가로형 %로 반환. team 지정 시 해당 팀 진영 안으로만 클램프 */
  const getCoordsFromEvent = useCallback(
    (clientX: number, clientY: number, team?: 'red' | 'blue'): { hx: number; hy: number } | null => {
      const el = boardRef.current;
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      let hx = ((clientX - rect.left) / rect.width) * 100;
      const hy = Math.max(CONTAINMENT.yMin, Math.min(CONTAINMENT.yMax, ((clientY - rect.top) / rect.height) * 100));
      if (team) {
        const half = TEAM_HALF[team];
        hx = Math.max(half.xMin, Math.min(half.xMax, hx));
      } else {
        hx = Math.max(CONTAINMENT.xMin, Math.min(CONTAINMENT.xMax, hx));
      }
      return { hx, hy };
    },
    []
  );

  const handleDragStart = useCallback(
    (e: React.DragEvent, userId: number) => {
      if (userId !== currentUserId) return;
      e.dataTransfer.setData('application/x-tactical-user', String(userId));
      e.dataTransfer.effectAllowed = 'move';
      setDraggingUserId(userId);
    },
    [currentUserId]
  );

  const handleDragEnd = useCallback(() => {
    setDraggingUserId(null);
    setPreviewPosition(null);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (e.dataTransfer.types.indexOf('application/x-tactical-user') === -1) return;
      const participant = participants.find((p) => p.userId === currentUserId);
      const team = (participant?.team ?? 'red') as 'red' | 'blue';
      const coords = getCoordsFromEvent(e.clientX, e.clientY, team);
      if (!coords) return;
      const { vx, vy } = horizontalToVertical(team, coords.hx, coords.hy);
      const { positionCode, slotLabel } = coordsToPositionAndLabel(vx, vy);
      const el = boardRef.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        setPreviewPosition({
          positionCode,
          slotLabel,
          tooltipX: e.clientX - rect.left + 12,
          tooltipY: e.clientY - rect.top - 8,
        });
      }
    },
    [getCoordsFromEvent, participants, currentUserId]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer.types.indexOf('application/x-tactical-user') === -1) return;
      const userId = Number(e.dataTransfer.getData('application/x-tactical-user'));
      const participant = participants.find((p) => p.userId === userId);
      const team = (participant?.team ?? 'red') as 'red' | 'blue';
      const coords = getCoordsFromEvent(e.clientX, e.clientY, team);
      if (!coords) return;
      const { vx, vy } = horizontalToVertical(team, coords.hx, coords.hy);
      const { positionCode, slotLabel } = coordsToPositionAndLabel(vx, vy);
      onPositionChange(vx, vy, positionCode, slotLabel);
      setDraggingUserId(null);
      setPreviewPosition(null);
    },
    [getCoordsFromEvent, onPositionChange, participants]
  );

  return (
    <div
      ref={boardRef}
      className="relative w-full rounded-xl overflow-hidden select-none bg-[#1a3d1a]"
      style={{ aspectRatio: '105 / 68' }}
      onDragOver={currentUserId ? handleDragOver : undefined}
      onDrop={currentUserId ? handleDrop : undefined}
    >
      <FullPitchCSS />

      {participants.map((p) => {
        const { hx, hy } = getDisplayCoords(p);
        const isMyCard = p.userId === currentUserId;
        const isDragging = draggingUserId === p.userId;
        const rp = p.rankScore != null && Number.isFinite(p.rankScore) ? p.rankScore : 0;
        const grade: AllcourtplayRank = rpToGrade(rp);
        const team = p.team ?? 'red';
        const positionAbbrev = (p.slotLabel || p.positionCode || 'CM').toUpperCase();
        const rankGlowClass = getRankGlowClass(grade, team);
        const rankGlowHoverClass = getRankGlowHoverClass(grade, team);
        const isHighTier = grade === 'S' || grade === 'A';
        const isHovered = hoveredUserId === p.userId;
        const glowClass = isHovered && isMyCard ? rankGlowHoverClass : rankGlowClass;
        const lowTier = isLowTier(grade);

        const cardContent = (
          <div
            className={`
              relative overflow-hidden transition-transform duration-200
              ${isMyCard ? 'hover:scale-110' : 'pointer-events-none'}
              ${glowClass}
              ${lowTier ? 'opacity-70 hover:opacity-90' : ''}
            `}
            style={{
              width: CARD_WIDTH,
              height: CARD_HEIGHT,
              clipPath: CARD_CLIP_PATH,
              transition: isDragging ? 'none' : 'box-shadow 0.2s ease, transform 0.2s ease',
              boxShadow: isMyCard && isHighTier ? 'inset 0 0 0 2px rgba(251,191,36,0.6)' : undefined,
            }}
            onMouseEnter={() => setHoveredUserId(p.userId)}
            onMouseLeave={() => setHoveredUserId(null)}
          >
            <div
              className="absolute inset-0 border-2"
              style={{
                background: 'linear-gradient(145deg, rgba(30,41,59,0.92) 0%, rgba(15,23,42,0.95) 40%, rgba(71,85,105,0.35) 100%)',
                borderColor: team === 'red' ? 'rgba(251,146,60,0.9)' : 'rgba(56,189,248,0.9)',
              }}
            />
            <div className="relative z-10 shrink-0 h-5 px-1 flex items-center justify-center border-b border-white/15" style={{ background: 'rgba(15,23,42,0.9)' }}>
              <span className="font-bold text-[10px] text-white tracking-wider">{positionAbbrev}</span>
            </div>
            <div className="relative z-10 flex-1 flex items-center justify-center min-h-[28px] py-0.5 px-1">
              <span className="font-bold text-white text-[9px] truncate w-full text-center drop-shadow-md">{p.nickname}</span>
            </div>
            <div className="relative z-10 shrink-0 py-0.5 px-1 flex items-center justify-between border-t border-white/10" style={{ background: 'rgba(31,41,55,0.95)' }}>
              <span className="font-bold text-[8px] text-white/95">{grade}</span>
              <span className="font-bold text-[8px] tabular-nums text-white/80">{rp} RP</span>
            </div>
          </div>
        );

        return (
          <div
            key={p.userId}
            draggable={isMyCard}
            onDragStart={isMyCard ? (e) => handleDragStart(e, p.userId) : undefined}
            onDragEnd={handleDragEnd}
            className={`absolute z-10 touch-none ${isMyCard ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'}`}
            style={{
              left: `${hx}%`,
              top: `${hy}%`,
              transform: 'translate(-50%, -50%)',
              transition: isDragging ? 'none' : 'box-shadow 0.2s ease',
            }}
          >
            {cardContent}
          </div>
        );
      })}

      {previewPosition && draggingUserId && (
        <div
          className="absolute z-30 px-2 py-1 rounded bg-black/80 text-white text-xs font-bold whitespace-nowrap pointer-events-none border border-white/30"
          style={{ left: previewPosition.tooltipX, top: previewPosition.tooltipY }}
        >
          {previewPosition.positionCode} → {previewPosition.slotLabel}
        </div>
      )}
    </div>
  );
}
