import React, { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import TimeRangeSlider from './TimeRangeSlider';
import { showConfirm } from '../utils/swal';

/** 0=일 … 6=토 */
const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
const DAY_LABELS_FULL = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
/** 표시 순서: 평일 먼저 (월화수목금토일) */
const WEEKDAY_FIRST_ORDER = [1, 2, 3, 4, 5, 6, 0];
const POINT_COLOR = '#22c55e';
/** 초기 등록 영역 구분용 (파란/인디고 계열) */
const ADD_BLOCK_ACCENT = '#6366f1';

interface TimeSlot {
  start: string;
  end: string;
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}
/** 겹치는 시간대를 하나로 합친 배열 반환 */
function mergeOverlappingSlots(slots: TimeSlot[]): TimeSlot[] {
  if (slots.length <= 1) return slots.map((s) => ({ ...s }));
  const sorted = [...slots].sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
  const merged: TimeSlot[] = [];
  let cur = { ...sorted[0] };
  for (let i = 1; i < sorted.length; i++) {
    const n = sorted[i];
    if (timeToMinutes(cur.end) >= timeToMinutes(n.start)) {
      cur.end = timeToMinutes(cur.end) >= timeToMinutes(n.end) ? cur.end : n.end;
    } else {
      merged.push(cur);
      cur = { ...n };
    }
  }
  merged.push(cur);
  return merged;
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

  /** 한 번에 추가: 선택한 요일 체크 (0=일 … 6=토) */
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [batchStart, setBatchStart] = useState('18:00');
  const [batchEnd, setBatchEnd] = useState('21:00');

  useEffect(() => {
    setLocal(availability.length > 0 ? [...availability] : []);
  }, [availability]);

  const toggleDay = (dayOfWeek: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayOfWeek) ? prev.filter((d) => d !== dayOfWeek) : [...prev, dayOfWeek].sort((a, b) => a - b)
    );
  };

  /** 선택한 요일들에 동일한 시간대를 한 번에 추가 (겹치면 병합 확인) */
  const addBatch = async () => {
    if (selectedDays.length === 0) return;
    const slot = { start: batchStart, end: batchEnd };
    let next: DayAvailability[] = [];
    setLocal((prev) => {
      const n = [...prev];
      for (const dayOfWeek of selectedDays) {
        const idx = n.findIndex((d) => d.dayOfWeek === dayOfWeek);
        if (idx >= 0) {
          n[idx] = { ...n[idx], timeSlots: [...n[idx].timeSlots, { ...slot }] };
        } else {
          n.push({ dayOfWeek, timeSlots: [{ ...slot }] });
        }
      }
      next = n.sort((a, b) => (a.dayOfWeek + 6) % 7 - (b.dayOfWeek + 6) % 7);
      return next;
    });

    setSelectedDays([]);

    // 병합 필요 여부: 어떤 요일에서라도 병합 시 슬롯 수가 줄어들면 확인
    const merged = next.map((d) => ({ ...d, timeSlots: mergeOverlappingSlots(d.timeSlots) }));
    const needsConfirm = next.some((d, i) => merged[i].timeSlots.length < d.timeSlots.length);
    if (needsConfirm) {
      const ok = await showConfirm('시간대를 늘리시겠습니까?', '시간대 병합', '늘리기', '취소');
      if (ok) setLocal(merged);
    }
  };

  const removeDay = (dayOfWeek: number) => {
    setLocal((prev) => prev.filter((d) => d.dayOfWeek !== dayOfWeek));
  };

  /** 요일 하나에 시간대 추가 (겹치면 병합 확인) */
  const addTimeSlot = async (dayOfWeek: number) => {
    let next: DayAvailability[] = [];
    setLocal((prev) => {
      next = prev.map((d) =>
        d.dayOfWeek === dayOfWeek
          ? { ...d, timeSlots: [...d.timeSlots, { start: '18:00', end: '21:00' }] }
          : d
      );
      return next;
    });
    const day = next.find((d) => d.dayOfWeek === dayOfWeek);
    if (!day || day.timeSlots.length <= 1) return;
    const mergedSlots = mergeOverlappingSlots(day.timeSlots);
    if (mergedSlots.length < day.timeSlots.length) {
      const ok = await showConfirm('시간대를 늘리시겠습니까?', '시간대 병합', '늘리기', '취소');
      if (ok) setLocal(next.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, timeSlots: mergedSlots } : d)));
    }
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
      <h4 className="text-sm font-medium text-[var(--color-text-primary)]">
        활동 가능 요일·시간
      </h4>

      {/* 한 번에 추가: 등록 영역만 다른 색(인디고)으로 구분, 모바일 터치 영역 확보 */}
      {!disabled && (
        <div
          className="p-4 sm:p-4 rounded-xl border-2 min-h-[44px] touch-manipulation"
          style={{
            backgroundColor: ADD_BLOCK_ACCENT + '12',
            borderColor: ADD_BLOCK_ACCENT + '50',
          }}
        >
          <p className="text-xs text-[var(--color-text-secondary)] mb-3">
            요일을 선택하고 시간대를 정한 뒤 추가하세요.
          </p>
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5 mb-3">
            {WEEKDAY_FIRST_ORDER.map((dayOfWeek) => (
              <label
                key={dayOfWeek}
                className={`inline-flex items-center justify-center min-h-[40px] sm:min-h-[44px] rounded-lg sm:rounded-xl border cursor-pointer text-xs sm:text-sm font-medium transition-colors touch-manipulation select-none ${
                  selectedDays.includes(dayOfWeek)
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/15 text-[var(--color-accent)]'
                    : 'border-[var(--color-border-card)] text-[var(--color-text-secondary)] hover:border-[var(--color-border)] active:opacity-80'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedDays.includes(dayOfWeek)}
                  onChange={() => toggleDay(dayOfWeek)}
                  className="sr-only"
                  aria-label={`${DAY_LABELS[dayOfWeek]}요일`}
                />
                <span>{DAY_LABELS[dayOfWeek]}</span>
              </label>
            ))}
          </div>
          <div className="mb-3">
            <TimeRangeSlider
              startTime={batchStart}
              endTime={batchEnd}
              onChange={(start, end) => {
                setBatchStart(start);
                setBatchEnd(end);
              }}
              pointColor={ADD_BLOCK_ACCENT}
            />
          </div>
          <button
            type="button"
            onClick={addBatch}
            disabled={selectedDays.length === 0}
            className="w-full min-h-[48px] py-3 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 active:opacity-95 touch-manipulation"
            style={{ backgroundColor: ADD_BLOCK_ACCENT }}
          >
            추가
          </button>
        </div>
      )}

      {local.length === 0 ? (
        <p className="text-sm text-[var(--color-text-secondary)] py-4 text-center">
          등록된 활동 가능 시간이 없어요. 요일을 추가해 주세요.
        </p>
      ) : (
        <div className="space-y-3">
          {local
            .sort((a, b) => (a.dayOfWeek + 6) % 7 - (b.dayOfWeek + 6) % 7)
            .map((day) => (
              <div
                key={day.dayOfWeek}
                className="p-3 sm:p-3 rounded-xl bg-[var(--color-bg-primary)] border border-[var(--color-border-card)]"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[var(--color-text-primary)]">
                    {DAY_LABELS[day.dayOfWeek]}
                  </span>
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => removeDay(day.dayOfWeek)}
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center -m-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-red-500/20 hover:text-red-400 touch-manipulation"
                      aria-label="요일 삭제"
                    >
                      <TrashIcon className="w-5 h-5" />
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
                          className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-lg text-[var(--color-text-secondary)] hover:text-red-400 shrink-0 touch-manipulation"
                          aria-label="시간대 삭제"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => addTimeSlot(day.dayOfWeek)}
                      className="min-h-[44px] px-3 py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] flex items-center gap-2 touch-manipulation rounded-lg active:opacity-80"
                    >
                      <PlusIcon className="w-4 h-4" />
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
          className="w-full min-h-[48px] py-3 rounded-xl font-semibold text-white transition-opacity hover:opacity-90 active:opacity-95 disabled:opacity-50 mt-3 touch-manipulation"
          style={{ backgroundColor: POINT_COLOR }}
        >
          {saving ? '저장 중...' : '시간표 저장'}
        </button>
      )}
    </div>
  );
};

export default AvailabilityScheduleManager;
