import React from 'react';
import { TagIcon } from '@heroicons/react/24/outline';

interface StepMatchNameProps {
  name: string;
  onNameChange: (name: string) => void;
  /** 자동 제안 안내 문구 (있으면 표시) */
  suggestedBy?: string;
}

const StepMatchName: React.FC<StepMatchNameProps> = ({ name, onNameChange, suggestedBy }) => {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
          매치명
        </h3>
        <p className="text-sm text-[var(--color-text-secondary)]">
          {suggestedBy ?? '매치를 구분할 이름을 입력하세요. (2자 이상)'}
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
          <TagIcon className="w-4 h-4 inline mr-1" />
          매치 이름 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          className="w-full px-4 py-3 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
          placeholder="예: 토요일 오후 풋살"
          minLength={2}
          maxLength={100}
        />
        <p className="text-xs text-[var(--color-text-secondary)] mt-2">
          2~100자 이내로 입력해 주세요.
        </p>
      </div>
    </div>
  );
};

export default StepMatchName;
