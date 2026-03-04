import React, { useEffect, useState } from 'react';
import { TrophyIcon, StarIcon } from '@heroicons/react/24/outline';
import { isTeamSport } from '../../constants/sports';
import { useAuth } from '../../contexts/AuthContext';
import TacticalPitch from '../TacticalPitch';
import { positionToDefaultCoords } from '../../utils/tacticalPositionUtils';
import { api } from '../../utils/api';
import type { FootballStats } from '../FootballStatsRadar';

const TEAM_POSITIONS: Record<string, string[]> = {
  '축구': ['GK', 'DF', 'MF', 'FW'],
  '풋살': ['GK', 'DF', 'MF', 'FW'],
  '농구': ['PG', 'SG', 'SF', 'PF', 'C'],
  '야구': ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'],
  '배구': ['S', 'OH', 'MB', 'OP', 'L'],
  '볼링': ['팀원'],
};

interface Step2PositionSettingsProps {
  category: string;
  teamSettings: {
    positions: string[];
    balanceByExperience: boolean;
    balanceByRank: boolean;
    minPlayersPerTeam: number;
    creatorPositionCode?: string;
    creatorSlotLabel?: string;
    creatorTeam?: 'red' | 'blue';
    creatorPositionX?: number;
    creatorPositionY?: number;
  };
  onTeamSettingsChange: (settings: {
    positions: string[];
    balanceByExperience: boolean;
    balanceByRank: boolean;
    minPlayersPerTeam: number;
    creatorPositionCode?: string;
    creatorSlotLabel?: string;
    creatorTeam?: 'red' | 'blue';
    creatorPositionX?: number;
    creatorPositionY?: number;
  }) => void;
  matchType?: 'general' | 'rank' | 'event';
}

const Step2PositionSettings: React.FC<Step2PositionSettingsProps> = ({
  category,
  teamSettings,
  onTeamSettingsChange,
  matchType,
}) => {
  const { user } = useAuth();
  const [footballStats, setFootballStats] = useState<Partial<FootballStats> | null>(null);
  const isTeam = isTeamSport(category);
  const creatorPitchTeam = (teamSettings.creatorTeam as 'red' | 'blue') || 'red';

  // 축구 시 모임장(현재 유저) 리뷰 기반 레이더 스탯 — 미니 정보창용
  useEffect(() => {
    if (category !== '축구' || !user?.id) return;
    api
      .get<Record<string, number>>('/api/users/me/football-stats')
      .then((data) => setFootballStats(data ?? null))
      .catch(() => setFootballStats(null));
  }, [category, user?.id]);

  const creatorProfileImage =
    user?.profileImageUrl ||
    (user?.id ? (typeof localStorage !== 'undefined' ? localStorage.getItem(`profileImage_${user.id}`) : null) : null);

  if (!isTeam) return null;

  // 전술판 배치 값: 축구는 모임장 필수 → 없으면 필드 중앙(MF/CM) 기본
  const hasPosition =
    category === '축구' &&
    (teamSettings.creatorPositionCode?.trim() || (teamSettings.creatorPositionX != null && teamSettings.creatorPositionY != null));
  const defaultCenter = { x: 50, y: 50, positionCode: 'MF' as const, slotLabel: 'CM' };
  const tacticalValue =
    category === '축구'
      ? hasPosition
        ? {
            x: teamSettings.creatorPositionX ?? positionToDefaultCoords(teamSettings.creatorPositionCode ?? 'MF', teamSettings.creatorSlotLabel ?? 'CM').x,
            y: teamSettings.creatorPositionY ?? positionToDefaultCoords(teamSettings.creatorPositionCode ?? 'MF', teamSettings.creatorSlotLabel ?? 'CM').y,
            positionCode: teamSettings.creatorPositionCode ?? 'MF',
            slotLabel: teamSettings.creatorSlotLabel ?? 'CM',
          }
        : defaultCenter
      : null;

  // 축구 모임장: 저장된 값이 없으면 중앙을 기본으로 한 번 동기화
  useEffect(() => {
    if (category !== '축구') return;
    if (teamSettings.creatorPositionX != null && teamSettings.creatorPositionY != null) return;
    onTeamSettingsChange({
      ...teamSettings,
      creatorPositionCode: defaultCenter.positionCode,
      creatorSlotLabel: defaultCenter.slotLabel,
      creatorPositionX: defaultCenter.x,
      creatorPositionY: defaultCenter.y,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">전술판 포지션</h3>
        <p className="text-sm text-[var(--color-text-secondary)]">
          구장에서 원하는 위치로 마커를 드래그해 두면 해당 좌표의 포지션이 등록됩니다.
        </p>
      </div>

      {/* 모임장 참가 포지션 (축구) — 전술판 드래그 앤 드롭 */}
      {category === '축구' && (
        <div className="space-y-4 p-4 bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border-card)]">
          <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">모임장 참가 포지션</h4>
          <div className="flex gap-1 p-1 rounded-lg bg-[var(--color-bg-primary)] w-fit mb-2">
            <button
              type="button"
              onClick={() => onTeamSettingsChange({ ...teamSettings, creatorTeam: 'red' })}
              className="px-4 py-2 rounded-md text-sm font-medium transition-colors"
              style={{
                background: creatorPitchTeam === 'red' ? 'rgba(199,54,54,0.25)' : 'transparent',
                color: creatorPitchTeam === 'red' ? '#fca5a5' : 'var(--color-text-secondary)',
              }}
            >
              레드팀
            </button>
            <button
              type="button"
              onClick={() => onTeamSettingsChange({ ...teamSettings, creatorTeam: 'blue' })}
              className="px-4 py-2 rounded-md text-sm font-medium transition-colors"
              style={{
                background: creatorPitchTeam === 'blue' ? 'rgba(59,108,184,0.25)' : 'transparent',
                color: creatorPitchTeam === 'blue' ? '#93c5fd' : 'var(--color-text-secondary)',
              }}
            >
              블루팀
            </button>
          </div>

          {!user && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mb-2">
              로그인 정보를 불러올 수 없습니다. 새로고침 후 다시 시도해 주세요.
            </p>
          )}
          <div className="w-full rounded-xl overflow-hidden border border-[var(--color-border-card)] bg-[var(--color-bg-primary)] min-h-[280px] max-h-[50vh] flex items-center justify-center isolate">
            <TacticalPitch
              value={tacticalValue}
              onChange={(placement) => {
                if (!placement) return;
                onTeamSettingsChange({
                  ...teamSettings,
                  creatorPositionCode: placement.positionCode,
                  creatorSlotLabel: placement.slotLabel,
                  creatorPositionX: placement.x,
                  creatorPositionY: placement.y,
                  creatorTeam: creatorPitchTeam,
                });
              }}
              dragItemLabel={user?.nickname?.trim() ? user.nickname : '모임장'}
              dragItemImageUrl={creatorProfileImage}
              teamAccent={creatorPitchTeam}
              size="modal"
              leaderOnly
              showStadiumLines
              footballStats={footballStats ?? undefined}
            />
          </div>
        </div>
      )}

      {/* 팀 밸런스 조정 — 랭크 포지션 지정 시에는 참가 가능 최소 랭크 단계로 이동 */}
      {matchType !== 'rank' && (
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-3">팀 밸런스 조정</label>
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-4 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-card)] cursor-pointer hover:bg-[var(--color-bg-card)] transition-colors">
              <input
                type="checkbox"
                checked={teamSettings.balanceByExperience}
                onChange={(e) => onTeamSettingsChange({ ...teamSettings, balanceByExperience: e.target.checked })}
                className="w-5 h-5 text-[var(--color-blue-primary)] rounded focus:ring-[var(--color-blue-primary)]"
              />
              <div className="flex items-center gap-2 flex-1">
                <TrophyIcon className="w-5 h-5 text-[var(--color-text-secondary)]" />
                <div>
                  <p className="font-medium text-[var(--color-text-primary)]">선수 출신 여부 고려</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">선수 출신 유저가 있다면 상대편에도 배치되어 한 팀으로 몰리지 않게 조정합니다.</p>
                </div>
              </div>
            </label>
            <label className="flex items-center gap-3 p-4 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-card)] cursor-pointer hover:bg-[var(--color-bg-card)] transition-colors">
              <input
                type="checkbox"
                checked={teamSettings.balanceByRank}
                onChange={(e) => onTeamSettingsChange({ ...teamSettings, balanceByRank: e.target.checked })}
                className="w-5 h-5 text-[var(--color-blue-primary)] rounded focus:ring-[var(--color-blue-primary)]"
              />
              <div className="flex items-center gap-2 flex-1">
                <StarIcon className="w-5 h-5 text-[var(--color-text-secondary)]" />
                <div>
                  <p className="font-medium text-[var(--color-text-primary)]">랭커 여부 고려</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">랭커와 일반 유저를 균등하게 배분합니다.</p>
                </div>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* 팀당 최소 인원 — 랭크 매치는 11vs11 고정이라 설정 없음 */}
      {matchType !== 'rank' && (
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">팀당 최소 인원</label>
          <input
            type="number"
            min="1"
            max="20"
            value={teamSettings.minPlayersPerTeam}
            onChange={(e) =>
              onTeamSettingsChange({
                ...teamSettings,
                minPlayersPerTeam: parseInt(e.target.value, 10) || 1,
              })
            }
            className="w-full px-4 py-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
          />
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            각 팀에 필요한 최소 인원 수를 설정하세요. {category === '축구' ? '(기본 11명)' : '(1~20명)'}
          </p>
        </div>
      )}
    </div>
  );
};

export default Step2PositionSettings;
