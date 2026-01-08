import React, { useState, useEffect } from 'react';
import { UserGroupIcon, UserIcon, TrophyIcon, StarIcon } from '@heroicons/react/24/outline';
import { isTeamSport, getMinParticipantsForSport } from '../../constants/sports';

// 팀 게임 포지션 정의
const TEAM_POSITIONS: Record<string, string[]> = {
  '축구': ['GK', 'DF', 'MF', 'FW'],
  '풋살': ['GK', 'DF', 'MF', 'FW'],
  '농구': ['PG', 'SG', 'SF', 'PF', 'C'],
  '야구': ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'],
  '배구': ['S', 'OH', 'MB', 'OP', 'L'],
  '볼링': ['팀원'],
};

interface Step2GameSettingsProps {
  category: string;
  gameType: 'team' | 'individual';
  onGameTypeChange: (type: 'team' | 'individual') => void;
  teamSettings: {
    positions: string[];
    balanceByExperience: boolean;
    balanceByRank: boolean;
    minPlayersPerTeam: number;
  };
  onTeamSettingsChange: (settings: {
    positions: string[];
    balanceByExperience: boolean;
    balanceByRank: boolean;
    minPlayersPerTeam: number;
  }) => void;
}

const Step2GameSettings: React.FC<Step2GameSettingsProps> = ({
  category,
  gameType,
  onGameTypeChange,
  teamSettings,
  onTeamSettingsChange,
}) => {
  const isTeam = isTeamSport(category);
  const availablePositions = isTeam ? (TEAM_POSITIONS[category] || []) : [];

  // 축구 카테고리 선택 시 팀당 최소 인원을 11명으로 자동 설정
  useEffect(() => {
    if (category === '축구' && gameType === 'team') {
      if (teamSettings.minPlayersPerTeam !== 11) {
        onTeamSettingsChange({
          ...teamSettings,
          minPlayersPerTeam: 11,
        });
      }
    }
  }, [category, gameType, teamSettings, onTeamSettingsChange]);

  const handlePositionToggle = (position: string) => {
    const newPositions = teamSettings.positions.includes(position)
      ? teamSettings.positions.filter(p => p !== position)
      : [...teamSettings.positions, position];
    
    onTeamSettingsChange({
      ...teamSettings,
      positions: newPositions,
    });
  };

  if (!isTeam) {
    // 개인 운동은 이 단계를 건너뛰거나 간단한 설정만 제공
    return (
      <div className="space-y-6">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
            매치 진행 방식
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)]">
            {category}는 개인 또는 1:1 매칭 방식으로 진행됩니다.
          </p>
        </div>
        <div className="p-4 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-card)]">
          <div className="flex items-center gap-3">
            <UserIcon className="w-6 h-6 text-[var(--color-blue-primary)]" />
            <div>
              <p className="font-medium text-[var(--color-text-primary)]">개인 운동 매치</p>
              <p className="text-sm text-[var(--color-text-secondary)]">
                참가자들이 자유롭게 매칭되어 운동할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 안내 문구 */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
          매치 진행 방식 설정
        </h3>
        <p className="text-sm text-[var(--color-text-secondary)]">
          {category}는 팀 기반 매치로 진행됩니다. 포지션을 지정해 팀을 구성하거나 자유 매칭으로 모집할 수 있어요.
        </p>
      </div>

      {/* 매치 진행 방식 선택 */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-3">
          매치 진행 방식
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => onGameTypeChange('team')}
            className={`relative p-6 rounded-xl border-2 transition-all ${
              gameType === 'team'
                ? 'border-[var(--color-blue-primary)] bg-blue-50 dark:bg-blue-900/20'
                : 'border-[var(--color-border-card)] bg-[var(--color-bg-secondary)] hover:border-[var(--color-blue-primary)]/50'
            }`}
          >
            <div className="flex items-start gap-4">
              <UserGroupIcon className={`w-8 h-8 flex-shrink-0 ${
                gameType === 'team'
                  ? 'text-[var(--color-blue-primary)]'
                  : 'text-[var(--color-text-secondary)]'
              }`} />
              <div className="flex-1 text-left">
                <div className="font-semibold text-lg mb-1 text-[var(--color-text-primary)]">
                  포지션 지정 매치
                </div>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  블루팀/레드팀 전술 포지션을 지정해 참가자들이 팀/포지션을 선택합니다.
                </p>
              </div>
              {gameType === 'team' && (
                <span className="text-[var(--color-blue-primary)] text-xl">✓</span>
              )}
            </div>
          </button>

          <button
            type="button"
            onClick={() => onGameTypeChange('individual')}
            className={`relative p-6 rounded-xl border-2 transition-all ${
              gameType === 'individual'
                ? 'border-[var(--color-blue-primary)] bg-blue-50 dark:bg-blue-900/20'
                : 'border-[var(--color-border-card)] bg-[var(--color-bg-secondary)] hover:border-[var(--color-blue-primary)]/50'
            }`}
          >
            <div className="flex items-start gap-4">
              <UserIcon className={`w-8 h-8 flex-shrink-0 ${
                gameType === 'individual'
                  ? 'text-[var(--color-blue-primary)]'
                  : 'text-[var(--color-text-secondary)]'
              }`} />
              <div className="flex-1 text-left">
                <div className="font-semibold text-lg mb-1 text-[var(--color-text-primary)]">
                  자유 매칭
                </div>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  모집 후 현장에서 포지션을 자유롭게 정하는 방식입니다.
                </p>
              </div>
              {gameType === 'individual' && (
                <span className="text-[var(--color-blue-primary)] text-xl">✓</span>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* 팀 게임 설정 */}
      {gameType === 'team' && (
        <div className="space-y-6 pt-4 border-t border-[var(--color-border-card)]">
          {/* 포지션 선택 */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-3">
              모집할 포지션 (선택)
            </label>
            <p className="text-xs text-[var(--color-text-secondary)] mb-3">
              특정 포지션만 모집하려면 선택하세요. 선택하지 않으면 모든 포지션을 모집합니다.
            </p>
            <div className="flex flex-wrap gap-2">
              {availablePositions.map((position) => (
                <button
                  key={position}
                  type="button"
                  onClick={() => handlePositionToggle(position)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    teamSettings.positions.includes(position)
                      ? 'bg-[var(--color-blue-primary)] text-white'
                      : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-card)] border border-[var(--color-border-card)]'
                  }`}
                >
                  {position}
                  {teamSettings.positions.includes(position) && (
                    <span className="ml-1">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 밸런스 조정 옵션 */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-3">
              팀 밸런스 조정
            </label>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-4 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-card)] cursor-pointer hover:bg-[var(--color-bg-card)] transition-colors">
                <input
                  type="checkbox"
                  checked={teamSettings.balanceByExperience}
                  onChange={(e) => onTeamSettingsChange({
                    ...teamSettings,
                    balanceByExperience: e.target.checked,
                  })}
                  className="w-5 h-5 text-[var(--color-blue-primary)] rounded focus:ring-[var(--color-blue-primary)]"
                />
                <div className="flex items-center gap-2 flex-1">
                  <TrophyIcon className="w-5 h-5 text-[var(--color-text-secondary)]" />
                  <div>
                    <p className="font-medium text-[var(--color-text-primary)]">선수 출신 여부 고려</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      선수 출신 유저가 한 팀에 몰리지 않도록 상대편에도 균등하게 배분합니다.
                    </p>
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-card)] cursor-pointer hover:bg-[var(--color-bg-card)] transition-colors">
                <input
                  type="checkbox"
                  checked={teamSettings.balanceByRank}
                  onChange={(e) => onTeamSettingsChange({
                    ...teamSettings,
                    balanceByRank: e.target.checked,
                  })}
                  className="w-5 h-5 text-[var(--color-blue-primary)] rounded focus:ring-[var(--color-blue-primary)]"
                />
                <div className="flex items-center gap-2 flex-1">
                  <StarIcon className="w-5 h-5 text-[var(--color-text-secondary)]" />
                  <div>
                    <p className="font-medium text-[var(--color-text-primary)]">랭커 여부 고려</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      랭커와 일반 유저를 균등하게 배분합니다.
                    </p>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* 최소 인원 설정 */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
              팀당 최소 인원
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={teamSettings.minPlayersPerTeam}
              onChange={(e) => onTeamSettingsChange({
                ...teamSettings,
                minPlayersPerTeam: parseInt(e.target.value, 10) || 1,
              })}
              className="w-full px-4 py-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
            />
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">
              각 팀에 필요한 최소 인원 수를 설정하세요. {category === '축구' ? '(기본 11명)' : '(1~20명)'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Step2GameSettings;
