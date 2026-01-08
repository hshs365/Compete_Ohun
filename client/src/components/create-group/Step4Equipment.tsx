import React from 'react';
import { WrenchScrewdriverIcon } from '@heroicons/react/24/outline';
import { getEquipmentBySport } from '../../constants/equipment';

interface Step4EquipmentProps {
  category: string;
  selectedEquipment: string[];
  onEquipmentToggle: (equipment: string) => void;
  description: string;
  onDescriptionChange: (description: string) => void;
}

const Step4Equipment: React.FC<Step4EquipmentProps> = ({
  category,
  selectedEquipment,
  onEquipmentToggle,
  description,
  onDescriptionChange,
}) => {
  const currentEquipmentList = getEquipmentBySport(category);

  return (
    <div className="space-y-6">
      {/* 안내 문구 */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
          준비물 및 모임 설명
        </h3>
        <p className="text-sm text-[var(--color-text-secondary)]">
          필요한 준비물을 선택하고 모임에 대한 설명을 작성하세요.
        </p>
      </div>

      {/* 준비물 선택 */}
      <div>
        <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
          <WrenchScrewdriverIcon className="w-4 h-4 inline mr-1" />
          준비물 (선택)
        </label>
        <div className="border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] p-3">
          <p className="text-xs text-[var(--color-text-secondary)] mb-3">
            {category}에 필요한 준비물을 선택해주세요.
          </p>
          <div className="flex flex-wrap gap-2">
            {currentEquipmentList.length > 0 ? (
              currentEquipmentList.map((equipment) => (
                <button
                  key={equipment}
                  type="button"
                  onClick={() => onEquipmentToggle(equipment)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    selectedEquipment.includes(equipment)
                      ? 'bg-[var(--color-blue-primary)] text-white'
                      : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-card)]'
                  }`}
                >
                  {equipment}
                  {selectedEquipment.includes(equipment) && (
                    <span className="ml-1">✓</span>
                  )}
                </button>
              ))
            ) : (
              <p className="text-sm text-[var(--color-text-secondary)] italic">
                준비물 목록이 없습니다.
              </p>
            )}
          </div>
          {selectedEquipment.length > 0 && (
            <div className="mt-3 pt-3 border-t border-[var(--color-border-card)]">
              <p className="text-xs text-[var(--color-text-secondary)] mb-1">선택된 준비물:</p>
              <p className="text-sm text-[var(--color-text-primary)]">
                {selectedEquipment.join(', ')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 모임 설명 */}
      <div>
        <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
          모임 설명
        </label>
        <textarea
          rows={4}
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          className="w-full px-4 py-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)] resize-none"
          placeholder="모임에 대한 간단한 설명을 작성해주세요..."
        />
        <p className="text-xs text-[var(--color-text-secondary)] mt-1">
          모임의 목적, 규칙, 주의사항 등을 자유롭게 작성해주세요.
        </p>
      </div>
    </div>
  );
};

export default Step4Equipment;
