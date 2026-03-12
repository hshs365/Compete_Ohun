import React, { useRef, useState, useCallback } from 'react';

const SLOT_COUNT = 48; // 00:00 ~ 24:00, 30분 단위
const MIN_SLOTS = 2; // 최소 1시간 (2 slots)

/** 슬롯 인덱스(0~47) → HH:mm */
function slotToTime(slot: number): string {
  const h = Math.floor(slot / 2);
  const m = (slot % 2) * 30;
  if (h === 24) return '24:00';
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** HH:mm → 슬롯 인덱스 */
function timeToSlot(time: string): number {
  if (!time) return 0;
  const [hStr, mStr] = time.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10) || 0;
  if (h === 24) return 48;
  return h * 2 + Math.round(m / 30);
}

/** 분 → "총 N시간 매치" / "총 N분 매치" */
function formatDuration(minutes: number): string {
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `총 ${h}시간 ${m}분 매치` : `총 ${h}시간 매치`;
  }
  return `총 ${minutes}분 매치`;
}

interface TimeRangeSliderProps {
  startTime: string;
  endTime: string;
  onChange: (start: string, end: string) => void;
  pointColor?: string;
}

const TimeRangeSlider: React.FC<TimeRangeSliderProps> = ({
  startTime,
  endTime,
  onChange,
  pointColor = '#22c55e',
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeHandle, setActiveHandle] = useState<'start' | 'end' | 'bar' | null>(null);
  const barDragRef = useRef<{ clientX: number; startSlot: number; endSlot: number } | null>(null);

  const rawStart = timeToSlot(startTime || '18:00');
  const rawEnd = timeToSlot(endTime || '20:00');
  const startSlot = Math.max(0, Math.min(rawStart, 48 - MIN_SLOTS));
  const endSlot = Math.max(startSlot + MIN_SLOTS, Math.min(48, rawEnd));
  const durationMinutes = (endSlot - startSlot) * 30;

  const getSlotFromClientX = useCallback((clientX: number): number => {
    const track = trackRef.current;
    if (!track) return 0;
    const rect = track.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    const rawSlot = pct * SLOT_COUNT;
    return Math.round(rawSlot); // 30분 단위 스냅
  }, []);

  const handleMove = useCallback(
    (clientX: number) => {
      const slot = Math.round(getSlotFromClientX(clientX));
      const clampedSlot = Math.max(0, Math.min(SLOT_COUNT, slot));

      if (activeHandle === 'start') {
        const newStart = Math.min(clampedSlot, endSlot - MIN_SLOTS);
        onChange(slotToTime(newStart), slotToTime(endSlot));
      } else if (activeHandle === 'end') {
        const newEnd = Math.max(clampedSlot, startSlot + MIN_SLOTS);
        onChange(slotToTime(startSlot), slotToTime(newEnd));
      } else if (activeHandle === 'bar' && barDragRef.current) {
        const { clientX: initX, startSlot: initStart, endSlot: initEnd } = barDragRef.current;
        const initSlot = Math.round(getSlotFromClientX(initX));
        const deltaSlots = slot - initSlot;
        const duration = initEnd - initStart;
        let newStart = initStart + deltaSlots;
        let newEnd = initEnd + deltaSlots;
        if (newStart < 0) {
          newStart = 0;
          newEnd = Math.min(SLOT_COUNT, duration);
        } else if (newEnd > SLOT_COUNT) {
          newEnd = SLOT_COUNT;
          newStart = Math.max(0, SLOT_COUNT - duration);
        }
        onChange(slotToTime(newStart), slotToTime(newEnd));
      }
    },
    [activeHandle, startSlot, endSlot, getSlotFromClientX, onChange]
  );

  const handleMouseDown = (e: React.MouseEvent, handle: 'start' | 'end' | 'bar') => {
    e.preventDefault();
    if (handle === 'bar') {
      barDragRef.current = { clientX: e.clientX, startSlot, endSlot };
    }
    setActiveHandle(handle);
  };

  const handleTouchStart = (e: React.TouchEvent, handle: 'start' | 'end' | 'bar') => {
    if (handle === 'bar' && e.touches[0]) {
      barDragRef.current = {
        clientX: e.touches[0].clientX,
        startSlot,
        endSlot,
      };
    }
    setActiveHandle(handle);
  };


  React.useEffect(() => {
    if (activeHandle === null) return;

    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const onMouseUp = () => {
      barDragRef.current = null;
      setActiveHandle(null);
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches[0]) handleMove(e.touches[0].clientX);
    };
    const onTouchEnd = () => {
      barDragRef.current = null;
      setActiveHandle(null);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [activeHandle, handleMove]);

  const startPct = (startSlot / SLOT_COUNT) * 100;
  const endPct = (endSlot / SLOT_COUNT) * 100;
  const rangePct = endPct - startPct;

  return (
    <div className="space-y-3">
      <div className="flex justify-between text-xs text-[var(--color-text-secondary)]">
        <span>00:00</span>
        <span>24:00</span>
      </div>

      <div
        ref={trackRef}
        className="relative h-12 sm:h-10 select-none touch-none overflow-visible"
        role="slider"
        aria-valuemin={0}
        aria-valuemax={48}
        aria-valuenow={startSlot}
        aria-valuetext={`${startTime} - ${endTime}`}
      >
        {/* 배경 트랙 */}
        <div className="absolute inset-0 rounded-full bg-[var(--color-bg-secondary)]" />

        {/* 30분 단위 눈금 (2시간마다 표시) */}
        {Array.from({ length: 13 }, (_, i) => i * 4).map((slot) => (
          <div
            key={slot}
            className="absolute top-1/2 -translate-y-1/2 w-px h-3 rounded-full bg-[var(--color-border-card)]"
            style={{ left: `${(slot / SLOT_COUNT) * 100}%` }}
          />
        ))}

        {/* 선택된 범위 (바 전체 드래그로 이동) */}
        <div
          className="absolute top-0 h-full rounded-full transition-colors cursor-grab active:cursor-grabbing touch-manipulation z-[5]"
          style={{
            left: `${startPct}%`,
            width: `${rangePct}%`,
            backgroundColor: pointColor + '50',
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            handleMouseDown(e, 'bar');
          }}
          onTouchStart={(e) => handleTouchStart(e, 'bar')}
        />

        {/* 시작 핸들 (모바일에서 작게 해 바 터치 용이) */}
        <div
          className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/2 w-6 h-6 sm:w-5 sm:h-5 rounded-full border-2 cursor-grab active:cursor-grabbing shadow-md z-10 touch-manipulation"
          style={{
            left: `${startPct}%`,
            backgroundColor: pointColor,
            borderColor: 'white',
          }}
          onMouseDown={(e) => handleMouseDown(e, 'start')}
          onTouchStart={(e) => handleTouchStart(e, 'start')}
        />

        {/* 종료 핸들 */}
        <div
          className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/2 w-6 h-6 sm:w-5 sm:h-5 rounded-full border-2 cursor-grab active:cursor-grabbing shadow-md z-10 touch-manipulation"
          style={{
            left: `${endPct}%`,
            backgroundColor: pointColor,
            borderColor: 'white',
          }}
          onMouseDown={(e) => handleMouseDown(e, 'end')}
          onTouchStart={(e) => handleTouchStart(e, 'end')}
        />

        {/* 툴팁: 총 시간 표시 (드래그 중 실시간 갱신) */}
        <div
          className="absolute -top-8 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg text-sm font-medium text-white whitespace-nowrap shadow-lg z-20 pointer-events-none"
          style={{
            backgroundColor: pointColor,
            left: `${((startSlot + endSlot) / 2 / SLOT_COUNT) * 100}%`,
          }}
        >
          {formatDuration(durationMinutes)}
          <span className="block text-xs opacity-90 mt-0.5">
            {slotToTime(startSlot)} ~ {slotToTime(endSlot)}
          </span>
        </div>
      </div>

      <div className="flex justify-between text-sm text-[var(--color-text-secondary)]">
        <span>시작: {slotToTime(startSlot)}</span>
        <span>종료: {slotToTime(endSlot)}</span>
      </div>
    </div>
  );
};

export default TimeRangeSlider;
