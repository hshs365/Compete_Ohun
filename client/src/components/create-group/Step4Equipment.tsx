import React, { useState } from 'react';
import { WrenchScrewdriverIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { getEquipmentBySport } from '../../constants/equipment';

interface Step4EquipmentProps {
  category: string;
  selectedEquipment: string[];
  onEquipmentToggle: (equipment: string) => void;
  /** 매치장이 직접 입력한 준비물 추가 */
  onEquipmentAdd?: (item: string) => void;
  description: string;
  onDescriptionChange: (description: string) => void;
}

const Step4Equipment: React.FC<Step4EquipmentProps> = ({
  category,
  selectedEquipment,
  onEquipmentToggle,
  onEquipmentAdd,
  description,
  onDescriptionChange,
}) => {
  const currentEquipmentList = getEquipmentBySport(category);
  const customItems = selectedEquipment.filter((e) => !currentEquipmentList.includes(e));
  const [showAddInput, setShowAddInput] = useState(false);
  const [addInputValue, setAddInputValue] = useState('');

  const handleAddCustom = () => {
    const trimmed = addInputValue.trim();
    if (!trimmed || !onEquipmentAdd) return;
    if (selectedEquipment.includes(trimmed)) {
      setAddInputValue('');
      return;
    }
    onEquipmentAdd(trimmed);
    setAddInputValue('');
  };

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
            {category}에 필요한 준비물을 선택하거나, 목록에 없는 항목은 직접 추가할 수 있습니다.
          </p>
          <div className="flex flex-wrap gap-2 items-center">
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
            {/* 직접 추가한 준비물 */}
            {customItems.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] border border-[var(--color-border-card)]"
              >
                {item}
                <button
                  type="button"
                  onClick={() => onEquipmentToggle(item)}
                  className="p-0.5 rounded hover:bg-[var(--color-bg-card)] transition-colors"
                  aria-label={`${item} 제거`}
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </span>
            ))}
            {/* +추가 버튼 / 입력 영역 */}
            {onEquipmentAdd && (
              <>
                {!showAddInput ? (
                  <button
                    type="button"
                    onClick={() => setShowAddInput(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border border-dashed border-[var(--color-border-card)] text-[var(--color-text-secondary)] hover:border-[var(--color-blue-primary)] hover:text-[var(--color-blue-primary)] transition-colors"
                  >
                    <PlusIcon className="w-4 h-4" />
                    추가
                  </button>
                ) : (
                  <div className="inline-flex items-center gap-2 flex-wrap">
                    <input
                      type="text"
                      value={addInputValue}
                      onChange={(e) => setAddInputValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustom();
                        }
                        if (e.key === 'Escape') {
                          setAddInputValue('');
                          setShowAddInput(false);
                        }
                      }}
                      placeholder="항목 입력"
                      className="px-3 py-1.5 rounded-lg text-sm border border-[var(--color-border-card)] bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)] w-32"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleAddCustom}
                      className="px-2.5 py-1.5 rounded-lg text-sm font-medium bg-[var(--color-blue-primary)] text-white hover:opacity-90 transition-opacity"
                    >
                      추가
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAddInputValue('');
                        setShowAddInput(false);
                      }}
                      className="p-1.5 rounded hover:bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] transition-colors"
                      aria-label="취소"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
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
