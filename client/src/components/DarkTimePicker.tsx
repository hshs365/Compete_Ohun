import React, { useState, useRef, useEffect } from 'react';
import { ClockIcon } from '@heroicons/react/24/outline';

interface DarkTimePickerProps {
  value: string; // "HH:mm" format
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  pointColor?: string;
}

// 30분 단위, 12시간만 (12:00 ~ 11:30)
const TIME_OPTIONS = (() => {
  const opts: string[] = [];
  for (let h = 0; h < 12; h++) {
    for (let m = 0; m < 60; m += 30) {
      const displayH = h === 0 ? 12 : h;
      opts.push(`${displayH}:${String(m).padStart(2, '0')}`);
    }
  }
  return opts;
})();

const DarkTimePicker: React.FC<DarkTimePickerProps> = ({
  value,
  onChange,
  className = '',
  placeholder = '시간 선택',
  pointColor = '#22c55e',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [amPm, setAmPm] = useState<'am' | 'pm'>('am');
  const [timeStr, setTimeStr] = useState(''); // "12:00", "1:30" 등
  const containerRef = useRef<HTMLDivElement>(null);

  // value "HH:mm" → amPm + timeStr 파싱
  useEffect(() => {
    if (!value) {
      setAmPm('am');
      setTimeStr('');
      return;
    }
    const [hStr, mStr] = value.split(':');
    const h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10) || 0;
    if (h < 12) {
      setAmPm('am');
      setTimeStr(h === 0 ? `12:${String(m).padStart(2, '0')}` : `${h}:${String(m).padStart(2, '0')}`);
    } else {
      setAmPm('pm');
      const displayH = h === 12 ? 12 : h - 12;
      setTimeStr(`${displayH}:${String(m).padStart(2, '0')}`);
    }
  }, [value]);

  // amPm + timeStr → "HH:mm" 변환
  const toHHmm = (ap: 'am' | 'pm', ts: string): string => {
    if (!ts) return '';
    const [hPart, mPart] = ts.split(':');
    let h = parseInt(hPart, 10);
    const m = parseInt(mPart, 10) || 0;
    if (ap === 'am') {
      h = h === 12 ? 0 : h;
    } else {
      h = h === 12 ? 12 : h + 12;
    }
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const handleSelectTime = (ts: string) => {
    setTimeStr(ts);
    onChange(toHHmm(amPm, ts));
  };

  const handleToggleAmPm = (ap: 'am' | 'pm') => {
    setAmPm(ap);
    if (timeStr) onChange(toHHmm(ap, timeStr));
  };

  const displayText = value
    ? `${amPm === 'am' ? '오전' : '오후'} ${timeStr}`
    : '';

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div ref={containerRef} className={`dark-time-picker-root relative flex w-full ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="dark-time-picker-input flex w-full items-center gap-2 rounded-lg border border-[var(--color-border-card)] bg-[var(--color-bg-primary)] px-3 py-2.5 text-left text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-2"
        style={{ ['--tw-ring-color' as string]: pointColor }}
      >
        <ClockIcon className="h-5 w-5 shrink-0 opacity-90" style={{ color: pointColor }} />
        <span className={displayText ? '' : 'text-[var(--color-text-secondary)]'}>
          {displayText || placeholder}
        </span>
      </button>

      {isOpen && (
        <div className="dark-time-picker-dropdown absolute left-0 top-full z-[10001] mt-1 flex flex-col overflow-hidden rounded-lg border border-[var(--color-border-card)] bg-[var(--color-bg-card)] shadow-xl">
          {/* 오전/오후 선택 */}
          <div className="flex border-b border-[var(--color-border-card)] p-2">
            <button
              type="button"
              onClick={() => handleToggleAmPm('am')}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                amPm === 'am'
                  ? 'text-white'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]'
              }`}
              style={amPm === 'am' ? { backgroundColor: pointColor } : undefined}
            >
              오전
            </button>
            <button
              type="button"
              onClick={() => handleToggleAmPm('pm')}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                amPm === 'pm'
                  ? 'text-white'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]'
              }`}
              style={amPm === 'pm' ? { backgroundColor: pointColor } : undefined}
            >
              오후
            </button>
          </div>
          {/* 시간 목록 (12시간만, 30분 단위) */}
          <div className="max-h-[200px] overflow-y-auto p-1">
            {TIME_OPTIONS.map((ts) => {
              const isSelected = timeStr === ts;
              return (
                <button
                  key={ts}
                  type="button"
                  onClick={() => handleSelectTime(ts)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    isSelected
                      ? 'bg-[var(--color-blue-primary)] text-white'
                      : 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]'
                  }`}
                >
                  {ts}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DarkTimePicker;
