import React from 'react';
import { TrophyIcon, StarIcon } from '@heroicons/react/24/outline';
import type { MinRankGrade } from '../MultiStepCreateGroup';

const RANK_GRADES: { value: MinRankGrade; label: string }[] = [
  { value: null, label: '제한 없음' },
  { value: 'S', label: 'S급 이상' },
  { value: 'A', label: 'A급 이상' },
  { value: 'B', label: 'B급 이상' },
  { value: 'C', label: 'C급 이상' },
  { value: 'D', label: 'D급 이상' },
  { value: 'E', label: 'E급 이상' },
  { value: 'F', label: 'F급 이상' },
];

/** 팀 밸런스 조정만 사용. 부모는 전체 teamSettings를 넘기고, 변경 시 병합해서 반영 */
interface StepMinRankGradeProps {
  minRankGrade: MinRankGrade;
  onMinRankGradeChange: (grade: MinRankGrade) => void;
  teamSettings: { balanceByExperience: boolean; balanceByRank: boolean };
  onTeamSettingsChange: (patch: { balanceByExperience?: boolean; balanceByRank?: boolean }) => void;
}

const StepMinRankGrade: React.FC<StepMinRankGradeProps> = ({
  minRankGrade,
  onMinRankGradeChange,
  teamSettings,
  onTeamSettingsChange,
}) => (
  <div className="space-y-6">
    <div className="mb-6">
      <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">참가 가능 최소 랭크</h3>
      <p className="text-sm text-[var(--color-text-secondary)]">
        선택한 등급 이상의 올코트플레이 랭크만 이 매치에 신청할 수 있습니다. 제한 없음이면 모든 유저가 신청 가능합니다.
      </p>
    </div>
    <div className="p-4 bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border-card)]">
      <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">최소 랭크</label>
      <select
        value={minRankGrade ?? ''}
        onChange={(e) => onMinRankGradeChange((e.target.value || null) as MinRankGrade)}
        className="w-full px-4 py-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
      >
        {RANK_GRADES.map((g) => (
          <option key={g.value ?? 'none'} value={g.value ?? ''}>
            {g.label}
          </option>
        ))}
      </select>
    </div>

    {/* 팀 밸런스 조정 (랭크 매치 시 이 단계에서 표시) */}
    <div>
      <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-3">팀 밸런스 조정</label>
      <div className="space-y-3">
        <label className="flex items-center gap-3 p-4 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-card)] cursor-pointer hover:bg-[var(--color-bg-card)] transition-colors">
          <input
            type="checkbox"
            checked={teamSettings.balanceByExperience}
            onChange={(e) => onTeamSettingsChange({ balanceByExperience: e.target.checked })}
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
            onChange={(e) => onTeamSettingsChange({ balanceByRank: e.target.checked })}
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
  </div>
);

export default StepMinRankGrade;
