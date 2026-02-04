import React from 'react';
import { UsersIcon } from '@heroicons/react/24/outline';
import { getMinParticipantsForSport } from '../../constants/sports';

interface StepParticipantsProps {
  category: string;
  minParticipants: string;
  onMinParticipantsChange: (value: string) => void;
  maxParticipants: string;
  onMaxParticipantsChange: (value: string) => void;
  defaultMinParticipants?: number;
}

const StepParticipants: React.FC<StepParticipantsProps> = ({
  category,
  minParticipants,
  onMinParticipantsChange,
  maxParticipants,
  onMaxParticipantsChange,
  defaultMinParticipants,
}) => {
  const effectiveMin = minParticipants || (defaultMinParticipants != null ? String(defaultMinParticipants) : '');
  const minFloor = defaultMinParticipants ?? getMinParticipantsForSport(category) ?? 1;

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
          참여자 수
        </h3>
        <p className="text-sm text-[var(--color-text-secondary)]">
          최소·최대 참여 인원을 설정하세요.
        </p>
        <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <p className="text-sm text-amber-700 dark:text-amber-300">
            매치 일정 <strong>1시간 전</strong>까지 최소 인원이 모이지 않으면 매치가 자동으로 취소됩니다.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
            <UsersIcon className="w-4 h-4 inline mr-1" />
            최소 참여자 수 <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min={minFloor}
            max={1000}
            value={effectiveMin}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '') {
                onMinParticipantsChange('');
                return;
              }
              if (!/^\d+$/.test(value)) return;
              const n = parseInt(value, 10);
              if (n < 1 || n > 1000) return;
              if (n < minFloor) {
                onMinParticipantsChange(String(minFloor));
                return;
              }
              onMinParticipantsChange(value);
            }}
            className="w-full px-4 py-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
            placeholder={defaultMinParticipants != null ? String(defaultMinParticipants) : '최소 인원'}
          />
          {defaultMinParticipants === 33 && (
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">3파전 진행 시 33명이 필요합니다.</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
            <UsersIcon className="w-4 h-4 inline mr-1" />
            최대 참여자 수 <span className="text-xs text-[var(--color-text-secondary)] font-normal">(선택)</span>
          </label>
          <input
            type="number"
            min={1}
            max={1000}
            value={maxParticipants}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '' || (/^\d+$/.test(value) && parseInt(value, 10) >= 1 && parseInt(value, 10) <= 1000)) {
                onMaxParticipantsChange(value);
              }
            }}
            className="w-full px-4 py-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
            placeholder="최대 인원"
          />
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">매치에 참가할 수 있는 최대 인원 수입니다.</p>
        </div>
      </div>
    </div>
  );
};

export default StepParticipants;
