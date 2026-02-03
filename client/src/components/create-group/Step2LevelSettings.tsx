import React from 'react';
import { TrophyIcon, StarIcon } from '@heroicons/react/24/outline';

interface Step2LevelSettingsProps {
  category: string;
  teamSettings: {
    positions: string[];
    balanceByExperience: boolean;
    balanceByRank: boolean;
    minPlayersPerTeam: number;
    creatorPositionCode?: string;
    creatorTeam?: 'red' | 'blue';
  };
  onTeamSettingsChange: (settings: {
    positions: string[];
    balanceByExperience: boolean;
    balanceByRank: boolean;
    minPlayersPerTeam: number;
    creatorPositionCode?: string;
    creatorTeam?: 'red' | 'blue';
  }) => void;
}

const Step2LevelSettings: React.FC<Step2LevelSettingsProps> = ({
  category,
  teamSettings,
  onTeamSettingsChange,
}) => {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">경기 레벨 설정</h3>
        <p className="text-sm text-[var(--color-text-secondary)]">
          자유 매칭에서도 선수 출신·오운 축구 랭커 등을 반영해 팀 밸런스를 맞출 수 있습니다. 팀당 최소 인원도 설정하세요.
        </p>
      </div>

      {/* 팀 밸런스 조정 */}
      <div>
        <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-3">팀 밸런스 조정</label>
        <div className="space-y-3">
          <label className="flex items-center gap-3 p-4 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-card)] cursor-pointer hover:bg-[var(--color-bg-card)] transition-colors">
            <input
              type="checkbox"
              checked={teamSettings.balanceByExperience}
              onChange={(e) =>
                onTeamSettingsChange({
                  ...teamSettings,
                  balanceByExperience: e.target.checked,
                })
              }
              className="w-5 h-5 text-[var(--color-blue-primary)] rounded focus:ring-[var(--color-blue-primary)]"
            />
            <div className="flex items-center gap-2 flex-1">
              <TrophyIcon className="w-5 h-5 text-[var(--color-text-secondary)]" />
              <div>
                <p className="font-medium text-[var(--color-text-primary)]">선수 출신 여부 고려</p>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  선수 출신 유저가 있다면 상대편에도 배치되어 한 팀으로 몰리지 않게 조정합니다.
                </p>
              </div>
            </div>
          </label>
          <label className="flex items-center gap-3 p-4 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-card)] cursor-pointer hover:bg-[var(--color-bg-card)] transition-colors">
            <input
              type="checkbox"
              checked={teamSettings.balanceByRank}
              onChange={(e) =>
                onTeamSettingsChange({
                  ...teamSettings,
                  balanceByRank: e.target.checked,
                })
              }
              className="w-5 h-5 text-[var(--color-blue-primary)] rounded focus:ring-[var(--color-blue-primary)]"
            />
            <div className="flex items-center gap-2 flex-1">
              <StarIcon className="w-5 h-5 text-[var(--color-text-secondary)]" />
              <div>
                <p className="font-medium text-[var(--color-text-primary)]">오운 축구 랭커 여부 고려</p>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  랭커와 일반 유저를 균등하게 배분합니다.
                </p>
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

export default Step2LevelSettings;
