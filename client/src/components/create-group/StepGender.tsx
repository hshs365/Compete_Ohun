import React from 'react';

interface StepGenderProps {
  genderRestriction: 'male' | 'female' | null;
  onGenderRestrictionChange: (gender: 'male' | 'female' | null) => void;
}

const StepGender: React.FC<StepGenderProps> = ({ genderRestriction, onGenderRestrictionChange }) => {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-[var(--color-text-primary)]">
          성별 제한
        </h3>
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => onGenderRestrictionChange(null)}
          className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
            genderRestriction === null
              ? 'border-[var(--color-blue-primary)] bg-blue-50 dark:bg-blue-900/20 text-[var(--color-blue-primary)] font-medium'
              : 'border-[var(--color-border-card)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] hover:border-[var(--color-blue-primary)]/50'
          }`}
        >
          제한 없음
        </button>
        <button
          type="button"
          onClick={() => onGenderRestrictionChange('male')}
          className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
            genderRestriction === 'male'
              ? 'border-[var(--color-blue-primary)] bg-blue-50 dark:bg-blue-900/20 text-[var(--color-blue-primary)] font-medium'
              : 'border-[var(--color-border-card)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] hover:border-[var(--color-blue-primary)]/50'
          }`}
        >
          남자만
        </button>
        <button
          type="button"
          onClick={() => onGenderRestrictionChange('female')}
          className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
            genderRestriction === 'female'
              ? 'border-[var(--color-blue-primary)] bg-blue-50 dark:bg-blue-900/20 text-[var(--color-blue-primary)] font-medium'
              : 'border-[var(--color-border-card)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] hover:border-[var(--color-blue-primary)]/50'
          }`}
        >
          여자만
        </button>
      </div>
    </div>
  );
};

export default StepGender;
