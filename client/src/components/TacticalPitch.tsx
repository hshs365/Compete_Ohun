import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ArrowsPointingOutIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import { coordsToPositionAndLabel } from '../utils/tacticalPositionUtils';
import { rpToGrade } from '../constants/rankGrade';
import { getPremiumCardTheme } from '../constants/premiumRankCard';
import type { AllcourtplayRank } from '../constants/allcourtplayRank';
import { STADIUM_BG, STADIUM_THEME_BG, STADIUM_FLOODLIGHT } from '../constants/pitchStyle';
import FootballStatsRadar, { type FootballStats } from './FootballStatsRadar';

export interface TacticalPlacement {
  x: number;
  y: number;
  positionCode: string;
  slotLabel: string;
}

/** 팀별 네온 글로우 (드롭 하이라이트 등) */
const TEAM_GLOW: Record<'red' | 'blue', string> = {
  red: 'rgba(239,68,68,0.6)',
  blue: 'rgba(59,130,246,0.6)',
};

interface TacticalPitchProps {
  value: TacticalPlacement | null;
  onChange: (value: TacticalPlacement | null) => void;
  dragItemLabel?: string;
  dragItemImageUrl?: string | null;
  teamAccent?: 'red' | 'blue';
  size?: 'default' | 'modal';
  disabled?: boolean;
  /** 올코트플레이 랭크 점수 (카드 상단 표시, 없으면 —) */
  rankScore?: number | null;
  /** 모임장 전용: 드래그 칩·제거 버튼 숨김, value는 부모가 중앙 등으로 항상 전달 */
  leaderOnly?: boolean;
  /** true면 구장 라인 SVG 배경(원래 구장 모습) 표시 — 생성 모달 등 */
  showStadiumLines?: boolean;
  /** true면 배치된 위치를 큰 카드 대신 좌표만 반영한 작은 마커로 표시 */
  coordinateOnly?: boolean;
  /** 미니 정보창: 최근 5경기 승률 (0~100, null이면 미표시) */
  recentWinRate?: number | null;
  /** 미니 정보창: 최근 경기 스탯 (wins/total 등) */
  userStats?: { wins?: number; total?: number } | null;
  /** 미니 정보창: 리뷰 기반 레이더 차트 스탯 (멘탈/수비/공격 등 1~10) */
  footballStats?: Partial<FootballStats> | null;
}

export default function TacticalPitch({
  value,
  onChange,
  dragItemLabel = '모임장',
  dragItemImageUrl = null,
  teamAccent = 'red',
  size = 'default',
  disabled = false,
  rankScore = null,
  leaderOnly = false,
  showStadiumLines = false,
  coordinateOnly = false,
  recentWinRate = null,
  userStats = null,
  footballStats = null,
}: TacticalPitchProps) {
  const pitchRef = useRef<HTMLDivElement>(null);
  const didDragRef = useRef(false);
  const [isDraggingChip, setIsDraggingChip] = useState(false);
  const [editingLabel, setEditingLabel] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [cardHover, setCardHover] = useState(false);
  const [showCardInfo, setShowCardInfo] = useState(false);
  const [dropDust, setDropDust] = useState<{ x: number; y: number; key: number } | null>(null);

  const isModal = size === 'modal';
  const glowColor = TEAM_GLOW[teamAccent];
  const rp = rankScore != null && Number.isFinite(rankScore) ? rankScore : 0;
  const grade: AllcourtplayRank = rpToGrade(rp);
  const theme = getPremiumCardTheme(grade);

  /** 드롭 시 파티클 효과 (등급 색상) */
  const [dropParticle, setDropParticle] = useState<{ x: number; y: number; color: string; key: number } | null>(null);
  useEffect(() => {
    if (!dropParticle) return;
    const t = setTimeout(() => setDropParticle(null), 700);
    return () => clearTimeout(t);
  }, [dropParticle]);

  /** 드롭 시 먼지 파티클 */
  useEffect(() => {
    if (!dropDust) return;
    const t = setTimeout(() => setDropDust(null), 620);
    return () => clearTimeout(t);
  }, [dropDust]);

  /** 픽셀 좌표 → 배치 좌표. y는 아래=골키퍼(0), 위=공격(100)으로 저장 */
  const getCoordsFromEvent = useCallback((e: React.DragEvent | React.MouseEvent): { x: number; y: number } | null => {
    const el = pitchRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const clientX = 'clientX' in e ? e.clientX : e.touches?.[0]?.clientX;
    const clientY = 'clientY' in e ? e.clientY : e.touches?.[0]?.clientY;
    if (clientX == null || clientY == null) return null;
    const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const pixelY = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
    const y = 100 - pixelY; // 아래쪽(픽셀 100%) = 골키퍼(y=0), 위쪽(픽셀 0%) = 공격(y=100)
    return { x, y };
  }, []);

  const handlePitchDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);
      setIsDraggingChip(false);
      if (e.dataTransfer.types.indexOf('application/x-tactical-drag') === -1) return;
      const coords = getCoordsFromEvent(e);
      if (!coords) return;
      const { positionCode, slotLabel } = coordsToPositionAndLabel(coords.x, coords.y);
      const existing = value ?? { x: 0, y: 0, positionCode: 'MF', slotLabel: 'CM' };
      onChange({ ...existing, x: coords.x, y: coords.y, positionCode, slotLabel });
      const key = Date.now();
      setDropParticle({ x: coords.x, y: coords.y, color: theme.particleColor, key });
      setDropDust({ x: coords.x, y: coords.y, key });
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([30, 25, 30]);
      }
    },
    [getCoordsFromEvent, onChange, value, theme.particleColor]
  );

  const handlePitchDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setDragOver(true);
  }, []);

  const handlePitchDragLeave = useCallback((e: React.DragEvent) => {
    if (!pitchRef.current?.contains(e.relatedTarget as Node)) setDragOver(false);
  }, []);

  const handleChipDragStart = useCallback((e: React.DragEvent) => {
    e.dataTransfer.setData('application/x-tactical-drag', '1');
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

  const handleMarkerDragStart = useCallback(
    (e: React.DragEvent) => {
      if (!value) return;
      didDragRef.current = true;
      e.dataTransfer.setData('application/x-tactical-drag', '1');
      e.dataTransfer.setData('text/plain', JSON.stringify({ x: value.x, y: value.y }));
      const target = e.currentTarget as HTMLElement;
      const rect = target.getBoundingClientRect();
      e.dataTransfer.setDragImage(target, rect.width / 2, rect.height / 2);
    },
    [value]
  );

  const handleMarkerDragEnd = useCallback(() => {
    setTimeout(() => { didDragRef.current = false; }, 0);
  }, []);

  const handleCardClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (didDragRef.current) return;
    setShowCardInfo((v) => !v);
  }, []);


  const handleLabelChange = useCallback(
    (newLabel: string) => {
      if (!value) return;
      const trimmed = newLabel.trim() || value.slotLabel;
      onChange({ ...value, slotLabel: trimmed });
      setEditingLabel(false);
    },
    [value, onChange]
  );

  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange(null);
    },
    [onChange]
  );

  return (
    <div className={`w-full mx-auto select-none ${isModal ? 'max-w-full' : 'max-w-5xl'}`}>
      {!disabled && !leaderOnly && (
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
          ...(showStadiumLines ? STADIUM_THEME_BG : STADIUM_BG),
        }}
        onDragOver={!disabled ? handlePitchDragOver : undefined}
        onDragLeave={!disabled ? handlePitchDragLeave : undefined}
        onDrop={!disabled ? handlePitchDrop : undefined}
      >
        {/* 스타디움 서치라이트: 구석 → 중앙 (생성 모달일 때 더 강조) */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: showStadiumLines ? 0.85 : 0.5,
            background: showStadiumLines ? STADIUM_FLOODLIGHT : `
              radial-gradient(ellipse 80% 50% at 10% 0%, rgba(255,255,255,0.06) 0%, transparent 55%),
              radial-gradient(ellipse 80% 50% at 90% 0%, rgba(255,255,255,0.06) 0%, transparent 55%),
              radial-gradient(ellipse 100% 60% at 50% -10%, rgba(255,255,255,0.04) 0%, transparent 45%)
            `,
          }}
          aria-hidden
        />

        {/* 축구장 평면도: 구장 라인만 표시 (전술 격자 없음) */}
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

        {/* 드롭 가능 시 하이라이트 */}
        {dragOver && !value && (
          <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-cyan-400/50 bg-cyan-500/5 rounded-lg" />
        )}

        {/* 드롭 시 파티클(빛 가루) — 등급 색상으로 방사형 퍼짐 */}
        {dropParticle && (
          <div
            className="absolute pointer-events-none z-20"
            style={{
              left: `${dropParticle.x}%`,
              top: `${100 - dropParticle.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {[...Array(12)].map((_, i) => (
              <div
                key={`${dropParticle.key}-${i}`}
                className="animate-premium-particle-wrapper"
                style={{
                  transform: `translate(-50%, -50%) rotate(${i * 30}deg)`,
                }}
              >
                <div
                  className="absolute left-0 top-0 w-2 h-2 rounded-full animate-premium-particle"
                  style={{
                    background: dropParticle.color,
                    boxShadow: `0 0 8px ${dropParticle.color}, 0 0 4px ${dropParticle.color}`,
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {/* 드롭 시 먼지 파티클 — "쾅!" 손맛, 사방으로 퍼지며 페이드 */}
        {dropDust && (
          <div
            className="absolute pointer-events-none z-20 w-0 h-0"
            style={{
              left: `${dropDust.x}%`,
              top: `${100 - dropDust.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {[...Array(16)].map((_, i) => (
              <div
                key={`${dropDust.key}-dust-${i}`}
                className="absolute left-0 top-0 w-0 h-0"
                style={{
                  transform: `rotate(${i * 22.5}deg)`,
                  transformOrigin: '0 0',
                }}
              >
                <div
                  className="absolute left-0 top-0 w-2.5 h-2.5 rounded-full animate-drop-dust-out"
                  style={{
                    transform: 'translate(-50%, -50%)',
                    background: `rgba(120,113,108,${0.55 + (i % 3) * 0.12})`,
                    boxShadow: '0 0 4px rgba(0,0,0,0.35)',
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {/* 배치된 마커 — 스포츠 트레이딩 카드(등급별 스킨 S~F 번쩍) 또는 프리미엄 랭크 카드 */}
        {value && (coordinateOnly || leaderOnly) ? (
          <div
            draggable={!disabled}
            onDragStart={!disabled ? handleMarkerDragStart : undefined}
            onDragEnd={!disabled ? () => { handleChipDragEnd(); handleMarkerDragEnd(); } : undefined}
            onClick={handleCardClick}
            onMouseEnter={() => setCardHover(true)}
            onMouseLeave={() => setCardHover(false)}
            className="absolute z-10 flex flex-col items-center cursor-grab active:cursor-grabbing touch-none transition-transform duration-200"
            style={{
              left: `${value.x}%`,
              top: `${100 - value.y}%`,
              transform: `translate(-50%, -50%) ${cardHover ? 'scale(1.12)' : 'scale(1)'}`,
            }}
          >
            <div
              className={`
                relative rounded-xl overflow-hidden flex flex-col
                w-[80px] min-h-[108px]
                border-2
                transition-all duration-200
                ${cardHover ? 'backdrop-blur-md shadow-xl' : 'backdrop-blur-sm shadow-lg'}
              `}
              style={{
                borderColor: theme.borderColor,
                background: cardHover
                  ? 'linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.03) 35%, transparent 65%), linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.5) 100%)'
                  : 'linear-gradient(180deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.48) 100%)',
                boxShadow: cardHover
                  ? `${theme.tierGlow}, 0 0 16px ${theme.borderColor}, inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -1px 0 rgba(0,0,0,0.3), 0 8px 28px rgba(0,0,0,0.45)`
                  : `${theme.tierGlow}, 0 0 10px ${theme.borderColor}, inset 0 1px 0 rgba(255,255,255,0.12), 0 4px 18px rgba(0,0,0,0.38)`,
              }}
              title={`${grade} · ${value.slotLabel} (클릭 시 스탯)`}
            >
              {/* 고등급 반짝임 오버레이 */}
              {['S', 'A', 'B'].includes(grade) && <div className="tactical-card-shine" aria-hidden />}

              {/* 상단 메탈 베젤 + RP 강조 (좌측) */}
              <div
                className="shrink-0 h-5 px-1.5 flex items-center justify-between rounded-t-[10px] border-b border-white/10"
                style={{
                  background: 'linear-gradient(180deg, #6b7280 0%, #4b5563 35%, #374151 100%)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), 0 1px 0 rgba(0,0,0,0.3)',
                }}
              >
                <div className="flex items-baseline gap-0.5">
                  <span className="font-black text-[8px] uppercase tracking-widest text-white/90">RP</span>
                  <span className="font-black text-[10px] tabular-nums leading-none text-white" style={{ textShadow: `0 0 6px ${theme.tierColor}90` }}>
                    {rp.toLocaleString()}
                  </span>
                </div>
                <span className="font-black text-[9px] leading-none" style={{ color: theme.tierColor, textShadow: `0 0 6px ${theme.tierColor}99` }}>{grade}</span>
              </div>

              {/* 중앙: 프로필 아바타 + 그라데이션 마스크로 프레임과 합성 */}
              <div className="flex-1 flex items-center justify-center min-h-0 py-0.5 relative">
                <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-black/4 ring-1 ring-white/20 shrink-0">
                  {dragItemImageUrl ? (
                    <>
                      <img src={dragItemImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover object-center" />
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
                    <ArrowsPointingOutIcon className="w-5 h-5 text-white/50" />
                  )}
                </div>
              </div>

              {/* 하단 메탈 베젤 + 닉네임/포지션 */}
              <div
                className="shrink-0 py-1 px-1 text-center rounded-b-[10px] border-t border-white/10"
                style={{
                  background: 'linear-gradient(0deg, #4b5563 0%, #374151 50%, #1f2937 100%)',
                  boxShadow: 'inset 0 -1px 0 rgba(255,255,255,0.08)',
                }}
              >
                {dragItemLabel && dragItemLabel.trim() && (
                  <span className="font-bold text-white/95 text-[9px] truncate block w-full" title={dragItemLabel}>{dragItemLabel}</span>
                )}
                <span className="font-bold text-white text-[10px] uppercase tracking-widest block">{value.slotLabel}</span>
                <span className="text-white/60 text-[8px] uppercase">{value.positionCode}</span>
              </div>
            </div>

            {/* 미니 정보창 — 카드 클릭 시 리뷰 기반 레이더 차트 (홀로그램 스타일) */}
            {showCardInfo && (
              <div
                className="absolute z-50 left-full ml-3 top-1/2 -translate-y-1/2 w-[200px] py-2.5 px-2 rounded-lg border border-white/30 bg-black/70 backdrop-blur-xl shadow-[0_0_24px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)]"
                style={{
                  boxShadow: `0 0 20px ${theme.borderColor}50, 0 0 40px ${theme.borderColor}25, inset 0 1px 0 rgba(255,255,255,0.12)`,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-[10px] font-semibold text-white/90 uppercase tracking-wider mb-1 text-center">
                  유저 스탯 (동료 리뷰 기반)
                </div>
                <div className="flex justify-center">
                  <FootballStatsRadar
                    stats={footballStats ?? undefined}
                    height={180}
                    fill={theme.borderColor}
                    theme="dark"
                  />
                </div>
                {recentWinRate != null && (
                  <div className="flex justify-between gap-2 px-2 text-xs text-white/85 mb-1">
                    <span className="text-white/60">최근 5경기 승률</span>
                    <span className="font-bold tabular-nums">{recentWinRate}%</span>
                  </div>
                )}
                <div className="pt-1.5 border-t border-white/10 text-[10px] text-white/50 text-center">클릭하여 닫기</div>
              </div>
            )}
          </div>
        ) : value ? (
          <div
            draggable={!disabled}
            onDragStart={!disabled ? handleMarkerDragStart : undefined}
            onDragEnd={!disabled ? () => { handleChipDragEnd(); handleMarkerDragEnd(); } : undefined}
            onMouseEnter={() => setCardHover(true)}
            onMouseLeave={() => setCardHover(false)}
            className="absolute z-10 flex flex-col items-center cursor-grab active:cursor-grabbing touch-none group transition-transform duration-200"
            style={{
              left: `${value.x}%`,
              top: `${100 - value.y}%`,
              transform: `translate(-50%, -50%) ${cardHover ? 'scale(1.08)' : 'scale(1)'}`,
            }}
          >
            <div
              className={`
                relative rounded-xl overflow-hidden flex flex-col
                transition-all duration-200
                ${isModal ? 'w-[78px] min-h-[104px]' : 'w-[88px] min-h-[116px] sm:w-[96px] sm:min-h-[124px] md:w-[100px] md:min-h-[132px]'}
              `}
              style={{
                background: theme.cardBg,
                boxShadow: cardHover
                  ? `inset 0 1px 0 rgba(255,255,255,0.15), 0 0 0 2px ${theme.borderColor}, ${theme.tierGlow}, 0 8px 24px rgba(0,0,0,0.45)`
                  : `inset 0 1px 0 rgba(255,255,255,0.08), 0 0 0 2px ${theme.borderColor}, 0 4px 20px rgba(0,0,0,0.35)`,
              }}
              title="랭크 포인트"
            >
              <div className={`absolute top-0.5 left-1 z-10 flex flex-col items-start gap-0 ${isModal ? '' : 'sm:top-1 sm:left-1.5'}`}>
                <span
                  className={`font-black leading-none tracking-tighter ${isModal ? 'text-sm' : 'text-base sm:text-lg'}`}
                  style={{
                    color: theme.tierColor,
                    textShadow: `0 0 10px ${theme.tierColor}80, 0 0 20px ${theme.tierColor}50, 0 1px 3px rgba(0,0,0,0.6)`,
                    filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))',
                  }}
                >
                  {grade}
                </span>
                <span className={`font-bold tabular-nums uppercase tracking-wider ${isModal ? 'text-[8px]' : 'text-[9px]'}`} style={{ color: theme.rpColor }}>
                  {rp.toLocaleString()} RP
                </span>
              </div>
              <div className={`absolute right-0.5 z-10 uppercase tracking-widest opacity-40 ${isModal ? 'bottom-6 text-[4px]' : 'bottom-10 text-[5px] sm:text-[6px]'}`} style={{ color: theme.tierColor }}>
                allcourtplay
              </div>
              <div className={`flex-1 flex items-center justify-center px-0.5 min-h-0 ${isModal ? 'pt-4 pb-5' : 'pt-7 pb-9 sm:pt-8 sm:pb-10'}`}>
                <div className={`relative rounded-lg overflow-hidden bg-black/35 ring-1 ring-white/15 flex items-center justify-center shrink-0 ${isModal ? 'w-9 h-9' : 'w-11 h-11 sm:w-12 sm:h-12'}`}>
                  {dragItemImageUrl ? (
                    <img src={dragItemImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover object-center" />
                  ) : (
                    <ArrowsPointingOutIcon className={isModal ? 'w-5 h-5 text-white/40' : 'w-6 h-6 text-white/40'} />
                  )}
                </div>
              </div>
              <div className={`w-full bg-black/55 backdrop-blur-sm flex flex-col items-center gap-0 ${isModal ? 'py-1 px-1' : 'py-1.5 px-2'}`}>
                <span className={`font-bold text-white/95 truncate w-full text-center ${isModal ? 'text-[8px]' : 'text-[9px] sm:text-[10px]'}`}>{dragItemLabel}</span>
                {editingLabel ? (
                  <input
                    type="text"
                    value={value.slotLabel}
                    onChange={(e) => onChange({ ...value, slotLabel: e.target.value })}
                    onBlur={() => { handleLabelChange(value.slotLabel); setEditingLabel(false); }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleLabelChange((e.target as HTMLInputElement).value);
                    }}
                    className={`w-full px-1 py-0.5 font-bold text-center bg-white/15 border border-white/25 rounded text-white placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-white/40 ${isModal ? 'max-w-[36px] text-[8px]' : 'max-w-[48px] text-[9px] sm:max-w-[52px] sm:text-[10px]'}`}
                    autoFocus
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => !disabled && setEditingLabel(true)}
                    className="flex items-center gap-0.5 px-1 py-0 rounded text-white/90 hover:bg-white/10 transition-colors"
                  >
                    <span className={`font-bold uppercase tracking-wider ${isModal ? 'text-[8px]' : 'text-[9px] sm:text-[10px]'}`}>{value.slotLabel}</span>
                    {!disabled && <PencilSquareIcon className={isModal ? 'w-2 h-2 text-white/50' : 'w-2.5 h-2.5 text-white/50'} />}
                  </button>
                )}
                <span className={`text-white/50 uppercase tracking-wider ${isModal ? 'text-[6px]' : 'text-[7px] sm:text-[8px]'}`}>{value.positionCode}</span>
              </div>
              {!disabled && !leaderOnly && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className={`absolute top-0.5 right-0.5 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg z-20 ring-2 ring-white/80 hover:bg-red-400 hover:scale-110 active:scale-95 transition-transform font-bold leading-none ${isModal ? 'w-4 h-4 text-[10px]' : 'w-5 h-5 text-xs'}`}
                  aria-label="위치 제거"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        ) : null}
      </div>
      {!disabled && !leaderOnly && (
        <p className="text-xs text-[var(--color-text-secondary)] mt-2 text-center">
          구장 위 아무 위치에 드래그해 두세요. 포지션명을 눌러 직접 수정할 수 있습니다.
        </p>
      )}
      {!disabled && leaderOnly && (
        <p className="text-xs text-[var(--color-text-secondary)] mt-2 text-center">
          카드를 원하는 위치로 드래그해 이동하세요. 포지션명을 눌러 직접 수정할 수 있습니다.
        </p>
      )}
    </div>
  );
}
