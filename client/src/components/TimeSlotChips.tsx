import React, { useMemo } from 'react';

/** 06:00 ~ 24:00, 30분 단위 시간 슬롯 (24:00 = 자정) */
const TIME_SLOTS = (() => {
  const slots: string[] = [];
  for (let h = 6; h <= 23; h++) {
    for (let m = 0; m < 60; m += 30) {
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  slots.push('24:00');
  return slots;
})();

/** HH:mm → "오전/오후 H:mm" 표시 (24:00 = 자정) */
function formatDisplayTime(value: string): string {
  if (!value) return '';
  if (value === '24:00') return '자정 (24:00)';
  const [hStr, mStr] = value.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10) || 0;
  if (h === 0) return `오전 12:${String(m).padStart(2, '0')}`;
  if (h < 12) return `오전 ${h}:${String(m).padStart(2, '0')}`;
  if (h === 12) return `오후 12:${String(m).padStart(2, '0')}`;
  return `오후 ${h - 12}:${String(m).padStart(2, '0')}`;
}

interface TimeSlotChipsProps {
  value: string; // "HH:mm"
  onChange: (value: string) => void;
  pointColor?: string;
}

const TimeSlotChips: React.FC<TimeSlotChipsProps> = ({
  value,
  onChange,
  pointColor = '#22c55e',
}) => {
  const slots = useMemo(() => TIME_SLOTS, []);

  return (
    <div className="overflow-x-auto pb-2 -mx-1">
      <div className="flex gap-2 min-w-max px-1">
        {slots.map((slot) => {
          const isSelected = value === slot;
          return (
            <button
              key={slot}
              type="button"
              onClick={() => onChange(slot)}
              className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                isSelected
                  ? 'text-white shadow-md'
                  : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] border border-[var(--color-border-card)] hover:border-opacity-70'
              }`}
              style={
                isSelected
                  ? { backgroundColor: pointColor, borderColor: pointColor }
                  : undefined
              }
            >
              {slot}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TimeSlotChips;
export { formatDisplayTime };
