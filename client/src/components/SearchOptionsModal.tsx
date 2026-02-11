import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

/** 사용자 주소 기준 기본 지도 보기 단위 (시≈5km, 구≈2km, 동≈500m) */
export type MapViewLevel = 'sido' | 'gu' | 'dong';

interface SearchOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDays: number[];
  onDaysChange: (days: number[]) => void;
  hideClosed?: boolean;
  onHideClosedChange?: (hide: boolean) => void;
  onlyRanker?: boolean;
  onOnlyRankerChange?: (only: boolean) => void;
  gender?: 'male' | 'female' | null;
  onGenderChange?: (gender: 'male' | 'female' | null) => void;
  includeCompleted?: boolean;
  onIncludeCompletedChange?: (include: boolean) => void;
  /** 지도 기본 보기 단위 (사용자 주소 기준) */
  mapViewLevel?: MapViewLevel;
  onMapViewLevelChange?: (level: MapViewLevel) => void;
}

const MAP_VIEW_OPTIONS: { value: MapViewLevel; label: string }[] = [
  { value: 'sido', label: '시 단위' },
  { value: 'gu', label: '구 단위' },
  { value: 'dong', label: '동 단위' },
];

const SearchOptionsModal: React.FC<SearchOptionsModalProps> = ({
  isOpen,
  onClose,
  selectedDays,
  onDaysChange,
  hideClosed = true,
  onHideClosedChange,
  onlyRanker = false,
  onOnlyRankerChange,
  gender = null,
  onGenderChange,
  includeCompleted = false,
  onIncludeCompletedChange,
  mapViewLevel = 'sido',
  onMapViewLevelChange,
}) => {
  const [localSelectedDays, setLocalSelectedDays] = useState<number[]>(selectedDays);
  const [localHideClosed, setLocalHideClosed] = useState<boolean>(hideClosed);
  const [localOnlyRanker, setLocalOnlyRanker] = useState<boolean>(onlyRanker);
  const [localGender, setLocalGender] = useState<'male' | 'female' | null>(gender);
  const [localIncludeCompleted, setLocalIncludeCompleted] = useState<boolean>(includeCompleted);
  const [localMapViewLevel, setLocalMapViewLevel] = useState<MapViewLevel>(mapViewLevel);
  const modalMouseDownRef = React.useRef<{ x: number; y: number } | null>(null);

  // prop 변경 시 로컬 상태 업데이트
  React.useEffect(() => {
    setLocalSelectedDays(selectedDays);
    setLocalHideClosed(hideClosed);
    setLocalOnlyRanker(onlyRanker);
    setLocalGender(gender);
    setLocalIncludeCompleted(includeCompleted);
    setLocalMapViewLevel(mapViewLevel);
  }, [selectedDays, hideClosed, onlyRanker, gender, includeCompleted, mapViewLevel, isOpen]);

  const weekDays = [
    { day: 1, label: '월' },
    { day: 2, label: '화' },
    { day: 3, label: '수' },
    { day: 4, label: '목' },
    { day: 5, label: '금' },
    { day: 6, label: '토' },
    { day: 0, label: '일' },
  ];

  const handleDayToggle = (day: number) => {
    if (localSelectedDays.includes(day)) {
      setLocalSelectedDays(localSelectedDays.filter(d => d !== day));
    } else {
      setLocalSelectedDays([...localSelectedDays, day]);
    }
  };

  const handleApply = () => {
    onDaysChange(localSelectedDays);
    if (onHideClosedChange) {
      onHideClosedChange(localHideClosed);
    }
    if (onOnlyRankerChange) {
      onOnlyRankerChange(localOnlyRanker);
    }
    if (onGenderChange) {
      onGenderChange(localGender);
    }
    if (onIncludeCompletedChange) {
      onIncludeCompletedChange(localIncludeCompleted);
    }
    if (onMapViewLevelChange) {
      onMapViewLevelChange(localMapViewLevel);
    }
    onClose();
  };

  const handleReset = () => {
    setLocalSelectedDays([]);
    setLocalHideClosed(true);
    setLocalOnlyRanker(false);
    setLocalGender(null);
    setLocalIncludeCompleted(false);
    setLocalMapViewLevel('sido');
    onDaysChange([]);
    if (onHideClosedChange) {
      onHideClosedChange(true);
    }
    if (onOnlyRankerChange) {
      onOnlyRankerChange(false);
    }
    if (onGenderChange) {
      onGenderChange(null);
    }
    if (onIncludeCompletedChange) {
      onIncludeCompletedChange(false);
    }
    if (onMapViewLevelChange) {
      onMapViewLevelChange('sido');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4"
      onMouseDown={(e) => {
        // 모달 내부가 아닌 경우에만 마우스 다운 위치 저장
        if (e.target === e.currentTarget) {
          modalMouseDownRef.current = { x: e.clientX, y: e.clientY };
        }
      }}
      onMouseUp={(e) => {
        // 모달 바깥 부분을 클릭한 경우에만 닫기
        if (e.target === e.currentTarget && modalMouseDownRef.current) {
          const dx = e.clientX - modalMouseDownRef.current.x;
          const dy = e.clientY - modalMouseDownRef.current.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < 5) {
            onClose();
          }
          modalMouseDownRef.current = null;
        }
      }}
      onClick={(e) => {
        // 모달 바깥 부분 클릭 시에만 닫기
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="bg-[var(--color-bg-card)] rounded-2xl shadow-xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">검색 옵션</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--color-bg-secondary)] rounded-lg transition-colors"
            aria-label="닫기"
          >
            <XMarkIcon className="w-5 h-5 text-[var(--color-text-primary)]" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-[var(--color-text-primary)] mb-3">요일 필터</h3>
            <div className="flex gap-1">
              {weekDays.map(({ day, label }) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleDayToggle(day)}
                  className={`flex-1 py-3 px-2 rounded-lg flex items-center justify-center transition-all ${
                    localSelectedDays.includes(day)
                      ? 'bg-[var(--color-blue-primary)] text-white shadow-md'
                      : 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] border border-[var(--color-border-card)] hover:bg-[var(--color-bg-secondary)] hover:border-[var(--color-blue-primary)]'
                  }`}
                >
                  <span className="text-lg font-bold">{label}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] mt-3 text-center">
              선택한 요일에 해당하는 매치만 표시됩니다. 아무것도 선택하지 않으면 모든 요일의 매치가 표시됩니다.
            </p>
          </div>

          <div className="border-t border-[var(--color-border-card)] pt-4">
            <h3 className="text-sm font-medium text-[var(--color-text-primary)] mb-3">기타 필터</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border-card)] cursor-pointer hover:bg-[var(--color-bg-secondary)] transition-colors">
                <input
                  type="checkbox"
                  checked={!localHideClosed}
                  onChange={(e) => setLocalHideClosed(!e.target.checked)}
                  className="w-4 h-4 text-[var(--color-blue-primary)] rounded focus:ring-[var(--color-blue-primary)]"
                />
                <span className="text-sm text-[var(--color-text-primary)]">마감된 매치 보이기</span>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border-card)] cursor-pointer hover:bg-[var(--color-bg-secondary)] transition-colors">
                <input
                  type="checkbox"
                  checked={localOnlyRanker}
                  onChange={(e) => setLocalOnlyRanker(e.target.checked)}
                  className="w-4 h-4 text-[var(--color-blue-primary)] rounded focus:ring-[var(--color-blue-primary)]"
                />
                <span className="text-sm text-[var(--color-text-primary)]">선수출신 경기만 보기</span>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border-card)] cursor-pointer hover:bg-[var(--color-bg-secondary)] transition-colors">
                <input
                  type="checkbox"
                  checked={localIncludeCompleted}
                  onChange={(e) => setLocalIncludeCompleted(e.target.checked)}
                  className="w-4 h-4 text-[var(--color-blue-primary)] rounded focus:ring-[var(--color-blue-primary)]"
                />
                <span className="text-sm text-[var(--color-text-primary)]">종료된 매치 보이기</span>
              </label>
            </div>
          </div>

          <div className="border-t border-[var(--color-border-card)] pt-4">
            <h3 className="text-sm font-medium text-[var(--color-text-primary)] mb-3">지도 기본 보기</h3>
            <p className="text-xs text-[var(--color-text-secondary)] mb-2">
              사용자 주소를 기준으로 기본 지도 축척이 설정됩니다.
            </p>
            <p className="text-xs text-[var(--color-text-secondary)] mb-3">
              시·구 단위 선택 시 지역 드롭다운 2개(시/도, 구), 동 단위 선택 시 3개(시/도, 구, 동)가 표시됩니다.
            </p>
            <div className="flex gap-2">
              {MAP_VIEW_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setLocalMapViewLevel(value)}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                    localMapViewLevel === value
                      ? 'border-[var(--color-blue-primary)] bg-blue-50 dark:bg-blue-900/20 text-[var(--color-blue-primary)] font-medium'
                      : 'border-[var(--color-border-card)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] hover:border-[var(--color-blue-primary)]/50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-[var(--color-border-card)] pt-4">
            <h3 className="text-sm font-medium text-[var(--color-text-primary)] mb-3">성별 필터</h3>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setLocalGender(null)}
                className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                  localGender === null
                    ? 'border-[var(--color-blue-primary)] bg-blue-50 dark:bg-blue-900/20 text-[var(--color-blue-primary)] font-medium'
                    : 'border-[var(--color-border-card)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] hover:border-[var(--color-blue-primary)]/50'
                }`}
              >
                전체
              </button>
              <button
                type="button"
                onClick={() => setLocalGender('male')}
                className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                  localGender === 'male'
                    ? 'border-[var(--color-blue-primary)] bg-blue-50 dark:bg-blue-900/20 text-[var(--color-blue-primary)] font-medium'
                    : 'border-[var(--color-border-card)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] hover:border-[var(--color-blue-primary)]/50'
                }`}
              >
                남자만
              </button>
              <button
                type="button"
                onClick={() => setLocalGender('female')}
                className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                  localGender === 'female'
                    ? 'border-[var(--color-blue-primary)] bg-blue-50 dark:bg-blue-900/20 text-[var(--color-blue-primary)] font-medium'
                    : 'border-[var(--color-border-card)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] hover:border-[var(--color-blue-primary)]/50'
                }`}
              >
                여자만
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6 pt-4 border-t border-[var(--color-border-card)]">
          <button
            onClick={handleReset}
            className="flex-1 px-4 py-2 bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] rounded-lg font-medium hover:opacity-80 transition-opacity"
          >
            초기화
          </button>
          <button
            onClick={handleApply}
            className="flex-1 px-4 py-2 bg-[var(--color-blue-primary)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            적용
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchOptionsModal;

