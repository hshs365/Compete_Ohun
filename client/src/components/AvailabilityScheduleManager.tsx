import React, { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import TimeRangeSlider from './TimeRangeSlider';
import { api } from '../utils/api';
import { showSuccess, showError } from '../utils/swal';

const DAY_LABELS = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
const POINT_COLOR = '#22c55e';

interface TimeSlot {
  start: string;
  end: string;
}

interface DayAvailability {
  dayOfWeek: number;
  timeSlots: TimeSlot[];
}

interface AvailabilityScheduleManagerProps {
  availability: DayAvailability[];
  onSave: (next: DayAvailability[]) => Promise<void>;
  disabled?: boolean;
}

const AvailabilityScheduleManager: React.FC<AvailabilityScheduleManagerProps> = ({
  availability,
  onSave,
  disabled,
}) => {
  const [local, setLocal] = useState<DayAvailability[]>(() =>
    availability.length > 0 ? [...availability] : []
  );

  useEffect(() => {
    setLocal(availability.length > 0 ? [...availability] : []);
  }, [availability]);

  const addDay = () => {
    const used = new Set(local.map((d) => d.dayOfWeek));
    for (let i = 0; i < 7; i++) {
      if (!used.has(i)) {
        setLocal((prev) => [...prev, { dayOfWeek: i, timeSlots: [{ start: '09:00', end: '12:00' }] }]);
        return;
      }
    }
  };

  const removeDay = (dayOfWeek: number) => {
    setLocal((prev) => prev.filter((d) => d.dayOfWeek !== dayOfWeek));
  };

  const addTimeSlot = (dayOfWeek: number) => {
    setLocal((prev) =>
      prev.map((d) =>
        d.dayOfWeek === dayOfWeek
          ? { ...d, timeSlots: [...d.timeSlots, { start: '18:00', end: '21:00' }] }
          : d
      )
    );
  };

  const removeTimeSlot = (dayOfWeek: number, idx: number) => {
    setLocal((prev) =>
      prev.map((d) =>
        d.dayOfWeek === dayOfWeek
          ? { ...d, timeSlots: d.timeSlots.filter((_, i) => i !== idx) }
          : d
      )
    );
  };

  const updateSlot = (dayOfWeek: number, idx: number, field: 'start' | 'end', value: string) => {
    setLocal((prev) =>
      prev.map((d) =>
        d.dayOfWeek === dayOfWeek
          ? {
              ...d,
              timeSlots: d.timeSlots.map((ts, i) =>
                i === idx ? { ...ts, [field]: value } : ts
              ),
            }
          : d
      )
    );
  };

  const updateSlotRange = (dayOfWeek: number, idx: number, start: string, end: string) => {
    setLocal((prev) =>
      prev.map((d) =>
        d.dayOfWeek === dayOfWeek
          ? {
              ...d,
              timeSlots: d.timeSlots.map((ts, i) =>
                i === idx ? { ...ts, start, end } : ts
              ),
            }
          : d
      )
    );
  };

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(local);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-[var(--color-text-primary)]">
          활동 가능 요일·시간
        </h4>
        {!disabled && (
          <button
            type="button"
            onClick={addDay}
            className="flex items-center gap-1.5 text-sm font-medium px-2 py-1 rounded-lg transition-colors"
            style={{ color: POINT_COLOR }}
          >
            <PlusIcon className="w-4 h-4" />
            요일 추가
          </button>
        )}
      </div>
      {local.length === 0 ? (
        <p className="text-sm text-[var(--color-text-secondary)] py-4 text-center">
          등록된 활동 가능 시간이 없어요. 요일을 추가해 주세요.
        </p>
      ) : (
        <div className="space-y-3">
          {local
            .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
            .map((day) => (
              <div
                key={day.dayOfWeek}
                className="p-3 rounded-xl bg-[var(--color-bg-primary)] border border-[var(--color-border-card)]"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[var(--color-text-primary)]">
                    {DAY_LABELS[day.dayOfWeek]}
                  </span>
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => removeDay(day.dayOfWeek)}
                      className="p-1 rounded text-[var(--color-text-secondary)] hover:bg-red-500/20 hover:text-red-400"
                      aria-label="삭제"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  {day.timeSlots.map((ts, idx) => (
                    <div key={idx} className={`flex items-start gap-2 ${disabled ? 'pointer-events-none opacity-70' : ''}`}>
                      <div className="flex-1 min-w-0">
                        <TimeRangeSlider
                          startTime={ts.start}
                          endTime={ts.end}
                          onChange={(start, end) => updateSlotRange(day.dayOfWeek, idx, start, end)}
                          pointColor={POINT_COLOR}
                        />
                      </div>
                      {!disabled && day.timeSlots.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTimeSlot(day.dayOfWeek, idx)}
                          className="p-2 rounded text-[var(--color-text-secondary)] hover:text-red-400 shrink-0"
                          aria-label="삭제"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => addTimeSlot(day.dayOfWeek)}
                      className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] flex items-center gap-1"
                    >
                      <PlusIcon className="w-3 h-3" />
                      시간대 추가
                    </button>
                  )}
                </div>
              </div>
            ))}
        </div>
      )}
      {!disabled && local.length > 0 && (
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full py-2.5 rounded-xl font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 mt-3"
          style={{ backgroundColor: POINT_COLOR }}
        >
          {saving ? '저장 중...' : '시간표 저장'}
        </button>
      )}
    </div>
  );
};

export default AvailabilityScheduleManager;
