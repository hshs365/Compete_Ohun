import React from 'react';
import { MapPinIcon } from '@heroicons/react/24/outline';
import { KOREAN_CITIES, getRegionDisplayName, type KoreanCity } from '../../utils/locationUtils';

interface StepRegionProps {
  selectedRegion: KoreanCity | null;
  onRegionChange: (region: KoreanCity) => void;
}

const StepRegion: React.FC<StepRegionProps> = ({ selectedRegion, onRegionChange }) => {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <MapPinIcon className="w-6 h-6 text-[var(--color-text-secondary)]" />
          <h3 className="text-xl font-bold text-[var(--color-text-primary)]">
            지역 선택
          </h3>
        </div>
        <p className="text-sm text-[var(--color-text-secondary)]">
          매치를 진행할 지역을 선택하세요. 다음 단계에서 이 지역 기준으로 시설 목록이 표시됩니다.
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[60vh] overflow-y-auto pr-1">
        {KOREAN_CITIES.filter((city) => city !== '전체').map((city) => (
          <button
            key={city}
            type="button"
            onClick={() => onRegionChange(city)}
            className={`px-4 py-3 rounded-lg border-2 text-left transition-all ${
              selectedRegion === city
                ? 'border-[var(--color-blue-primary)] bg-blue-50 dark:bg-blue-900/20 text-[var(--color-blue-primary)] font-medium'
                : 'border-[var(--color-border-card)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] hover:border-[var(--color-blue-primary)]/50'
            }`}
          >
            {getRegionDisplayName(city)}
          </button>
        ))}
      </div>
    </div>
  );
};

export default StepRegion;
