import React from 'react';
import { TagIcon } from '@heroicons/react/24/outline';
import { SPORTS_LIST } from '../../constants/sports';

interface Step1CategoryProps {
  category: string;
  onCategoryChange: (category: string) => void;
}

const Step1Category: React.FC<Step1CategoryProps> = ({ category, onCategoryChange }) => {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
          어떤 운동 모임을 만들까요?
        </h3>
      </div>

      {/* 카테고리 선택 */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-3">
          <TagIcon className="w-4 h-4 inline mr-1" />
          운동 종류 <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {SPORTS_LIST.map((sport) => (
            <button
              key={sport}
              type="button"
              onClick={() => onCategoryChange(sport)}
              className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                category === sport
                  ? 'border-[var(--color-blue-primary)] bg-blue-50 dark:bg-blue-900/20'
                  : 'border-[var(--color-border-card)] bg-[var(--color-bg-secondary)] hover:border-[var(--color-blue-primary)]/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`font-medium ${
                  category === sport
                    ? 'text-[var(--color-blue-primary)]'
                    : 'text-[var(--color-text-primary)]'
                }`}>
                  {sport}
                </span>
                {category === sport && (
                  <span className="text-[var(--color-blue-primary)]">✓</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Step1Category;
