import React from 'react';
import { TrophyIcon, StarIcon } from '@heroicons/react/24/outline';
import { isTeamSport } from '../../constants/sports';
import { useAuth } from '../../contexts/AuthContext';
import FootballPitch from '../FootballPitch';

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
  };
  onTeamSettingsChange: (settings: {
    positions: string[];
    balanceByExperience: boolean;
    balanceByRank: boolean;
    minPlayersPerTeam: number;
    creatorPositionCode?: string;
    creatorSlotLabel?: string;
    creatorTeam?: 'red' | 'blue';
  }) => void;
}

const Step2PositionSettings: React.FC<Step2PositionSettingsProps> = ({
  category,
  teamSettings,
  onTeamSettingsChange,
}) => {
  const { user } = useAuth();
  const isTeam = isTeamSport(category);
  const creatorPitchTeam = (teamSettings.creatorTeam as 'red' | 'blue') || 'red';

  // 포지션 선택 시 매치장(현재 사용자) 프로필 사진을 구장에 표시
  const creatorProfileImage =
    user?.profileImageUrl ||
    (user?.id ? (typeof localStorage !== 'undefined' ? localStorage.getItem(`profileImage_${user.id}`) : null) : null);
  // 포지션 선택 시에만 매치장을 슬롯에 표시. 닉네임이 비어 있어도 '모임장' 등으로 표시되도록 폴백
  const creatorDisplayName = (user?.nickname?.trim() || user?.email?.split('@')[0] || '모임장').slice(0, 20);
  const creatorParticipants =
    category === '축구' && user && teamSettings.creatorPositionCode
      ? [
          {
            userId: user.id,
            nickname: creatorDisplayName || '모임장',
            tag: user.tag ?? null,
            positionCode: teamSettings.creatorPositionCode,
            slotLabel: teamSettings.creatorSlotLabel ?? null,
            isCreator: true,
            profileImageUrl: creatorProfileImage,
          },
        ]
      : [];

  if (!isTeam) return null;

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">포지션 및 팀 설정</h3>
        <p className="text-sm text-[var(--color-text-secondary)]">
          포지션 지정 매치에서 모임장 포지션, 모집 포지션, 팀 밸런스를 설정합니다.
        </p>
      </div>

      {/* 모임장 참가 포지션 (축구) — 구장 인라인 표시 */}
      {category === '축구' && (
        <div className="space-y-4 p-4 bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border-card)]">
          <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">모임장 참가 포지션</h4>
          <p className="text-xs text-[var(--color-text-secondary)]">
            매치 생성 시 모임장이 참가할 포지션과 팀을 미리 선택합니다. 아래 구장에서 클릭해 선택하세요.
          </p>

          {/* 팀 선택 후 구장에서 포지션 클릭 */}
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
          {/* 구장 인라인 — 이 단계에서 바로 표시 */}
          <div className="w-full rounded-xl overflow-hidden border border-[var(--color-border-card)] bg-[var(--color-bg-primary)] min-h-[280px] flex items-center justify-center">
            <FootballPitch
              mode="match"
              participants={creatorParticipants}
              onSlotClick={(positionCode, slotLabel) => {
                onTeamSettingsChange({
                  ...teamSettings,
                  creatorPositionCode: positionCode,
                  creatorSlotLabel: slotLabel,
                  creatorTeam: creatorPitchTeam,
                });
              }}
              isUserParticipant={false}
              recruitPositions={['GK', 'DF', 'MF', 'FW']}
              size="default"
              teamAccent={creatorPitchTeam}
            />
          </div>

        </div>
      )}

      {/* 팀 밸런스 조정 */}
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

      {/* 팀당 최소 인원 */}
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
    </div>
  );
};

export default Step2PositionSettings;
