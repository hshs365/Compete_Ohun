import React, { useState, useEffect, useRef } from 'react';
import { CalendarIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

type DurationPreset = '1' | '2' | '3' | '4' | '5' | '6';

/** HH:mm 또는 HH:mm:ss → HH:mm 정규화 */
function normalizeHHmm(t: string): string {
  if (!t || t.length < 5) return '';
  const part = t.slice(0, 5);
  return /^\d{2}:\d{2}$/.test(part) ? part : '';
}

interface Step2MatchScheduleProps {
  meetingDate: string;
  meetingTime: string;
  meetingEndDate?: string;
  meetingEndTime?: string;
  onDateTimeChange: (date: string, time: string) => void;
  onMeetingEndTimeChange?: (endTime: string) => void;
  onMeetingEndDateChange?: (endDate: string) => void;
  /** true면 시간을 시 단위(오전/오후, 시)로만 선택 */
  timeStepHourOnly?: boolean;
}

function addHoursToTime(timeHHmm: string, hours: number): string {
  const [h, m] = timeHHmm.slice(0, 5).split(':').map(Number);
  const totalM = (h ?? 0) * 60 + (m ?? 0) + hours * 60;
  const newH = Math.floor(totalM / 60) % 24;
  const newM = totalM % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

function getDurationPreset(startHHmm: string, endHHmm: string): DurationPreset | null {
  if (!startHHmm || !endHHmm || startHHmm.length < 5 || endHHmm.length < 5) return null;
  const [sh, sm] = startHHmm.slice(0, 5).split(':').map(Number);
  const [eh, em] = endHHmm.slice(0, 5).split(':').map(Number);
  const startM = (sh ?? 0) * 60 + (sm ?? 0);
  let endM = (eh ?? 0) * 60 + (em ?? 0);
  if (endM <= startM) endM += 24 * 60; // 야간(자정 넘김) 처리
  const diffHours = (endM - startM) / 60;
  if (diffHours <= 0) return null;
  if (Math.abs(diffHours - 1) < 0.1) return '1';
  if (Math.abs(diffHours - 2) < 0.1) return '2';
  if (Math.abs(diffHours - 3) < 0.1) return '3';
  if (Math.abs(diffHours - 4) < 0.1) return '4';
  if (Math.abs(diffHours - 5) < 0.1) return '5';
  if (Math.abs(diffHours - 6) < 0.1) return '6';
  return null;
}

/** 0~23시를 오전/오후 N시 라벨로 */
function hourToLabel(hour24: number): string {
  if (hour24 === 0) return '오전 12시';
  if (hour24 < 12) return `오전 ${hour24}시`;
  if (hour24 === 12) return '오후 12시';
  return `오후 ${hour24 - 12}시`;
}

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => ({
  value: `${String(i).padStart(2, '0')}:00`,
  label: hourToLabel(i),
}));

/** 모달 내에서 안정적으로 동작하는 커스텀 시간 드롭다운 (네이티브 select 대체) */
function TimeDropdown({
  value,
  placeholder,
  onChange,
  options,
  'data-testid': testId,
}: {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  'data-testid'?: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [open]);

  const displayLabel = value ? (options.find((o) => o.value === value)?.label ?? value) : placeholder;

  return (
    <div ref={containerRef} className="relative w-full min-w-0">
      <button
        type="button"
        data-testid={testId}
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 text-left px-0 py-0.5 bg-transparent text-[var(--color-text-primary)] text-sm focus:outline-none cursor-pointer border-none"
      >
        <span className={value ? '' : 'text-[var(--color-text-secondary)]'}>{displayLabel}</span>
        <ChevronDownIcon className={`w-4 h-4 shrink-0 text-[var(--color-text-secondary)] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div
          className="absolute left-0 right-0 top-full mt-1 z-[100] max-h-[220px] overflow-y-auto rounded-lg border border-[var(--color-border-card)] bg-[var(--color-bg-primary)] shadow-lg py-1"
          role="listbox"
        >
          {options.map(({ value: v, label }) => (
            <button
              key={v}
              type="button"
              role="option"
              aria-selected={value === v}
              onClick={() => {
                onChange(v);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${
                value === v
                  ? 'bg-[var(--color-blue-primary)]/15 text-[var(--color-blue-primary)]'
                  : 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const Step2MatchSchedule: React.FC<Step2MatchScheduleProps> = ({
  meetingDate,
  meetingTime,
  meetingEndDate,
  meetingEndTime = '20:00',
  onDateTimeChange,
  onMeetingEndTimeChange,
  onMeetingEndDateChange,
  timeStepHourOnly = false,
}) => {
  const [durationPreset, setDurationPreset] = useState<DurationPreset | null>(() => {
    if (!onMeetingEndTimeChange || !meetingTime || !meetingEndTime) return '2';
    const p = getDurationPreset(meetingTime, meetingEndTime);
    return p ?? '2';
  });

  useEffect(() => {
    if (!onMeetingEndTimeChange || !meetingTime || meetingTime.length < 5) return;
    if (durationPreset && ['1', '2', '3', '4', '5', '6'].includes(durationPreset)) {
      const end = addHoursToTime(meetingTime, parseInt(durationPreset, 10));
      onMeetingEndTimeChange(end);
    }
  }, [meetingTime, durationPreset, onMeetingEndTimeChange]);

  // 야간(종료 시간이 오전으로 넘어가면 익일) — 종료일자 자동 설정
  // 빠른선택 +4시간 등으로 00:00 넘어가면 종료일자를 다음날로, 당일이면 당일로
  useEffect(() => {
    if (!onMeetingEndDateChange || !meetingDate || !meetingTime || !meetingEndTime) return;
    const [sh, sm] = meetingTime.slice(0, 5).split(':').map(Number);
    const [eh, em] = meetingEndTime.slice(0, 5).split(':').map(Number);
    const startM = (sh ?? 0) * 60 + (sm ?? 0);
    const endM = (eh ?? 0) * 60 + (em ?? 0);
    if (endM <= startM) {
      // 야간: 종료가 시작보다 앞서면 익일
      const d = new Date(meetingDate + 'T12:00:00');
      d.setDate(d.getDate() + 1);
      const nextDay = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (meetingEndDate !== nextDay) onMeetingEndDateChange(nextDay);
    } else {
      // 당일: 종료일자를 시작일자와 동일하게
      if (meetingEndDate !== meetingDate) onMeetingEndDateChange(meetingDate);
    }
  }, [meetingDate, meetingTime, meetingEndTime, onMeetingEndDateChange, meetingEndDate]);

  const todayMin = (() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  })();

  const datetimeLocalMin = (() => {
    const d = new Date();
    d.setTime(d.getTime() + 2 * 60 * 60 * 1000);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const h = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${day}T${h}:${min}`;
  })();

  const startTimeValue = normalizeHHmm(meetingTime);
  const endTimeValue = normalizeHHmm(meetingEndTime) || '20:00';

  if (timeStepHourOnly) {
    return (
      <div className="space-y-8">
        <h3 className="text-xl font-bold text-[var(--color-text-primary)] text-left">
          매치 일정
        </h3>

        {/* 수직 스택: 날짜 설정(한 줄) → 시간 설정 → 빠른 선택 */}
        <div className="space-y-6">
          {/* 일자 설정 — [ 시작 일자 ] ~ [ 종료 일자 ] 한 줄 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--color-text-primary)] text-left">
              일자 설정
            </label>
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <input
                  type="date"
                  required
                  value={meetingDate}
                  onChange={(e) => onDateTimeChange(e.target.value || '', meetingTime)}
                  min={todayMin}
                  className="w-full px-4 py-3 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)] date-input-dark"
                />
              </div>
              <span className="text-[var(--color-text-secondary)] font-medium shrink-0">~</span>
              <div className="flex-1 min-w-0">
                <input
                  type="date"
                  value={meetingEndDate || meetingDate}
                  onChange={(e) => onMeetingEndDateChange?.(e.target.value || meetingDate)}
                  min={meetingDate || todayMin}
                  className="w-full px-4 py-3 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)] date-input-dark"
                />
              </div>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)]">
              야간 운영 시 종료 일자를 익일로 설정해 주세요.
            </p>
          </div>

          {/* 시간 설정 — [ 시작 시간 ▾ ] ~ [ 종료 시간 ▾ ] 한 줄 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--color-text-primary)] text-left">
              시간 설정
            </label>
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0 flex items-center gap-2 rounded-lg border border-[var(--color-border-card)] bg-[var(--color-bg-primary)] px-3 py-2.5 focus-within:ring-2 focus-within:ring-[var(--color-blue-primary)] focus-within:border-transparent">
                <CalendarIcon className="w-4 h-4 shrink-0 text-[var(--color-text-secondary)]" />
                <TimeDropdown
                  value={startTimeValue}
                  placeholder="시작 시간"
                  options={HOUR_OPTIONS}
                  onChange={(v) => onDateTimeChange(meetingDate, v)}
                />
              </div>
              <span className="text-[var(--color-text-secondary)] font-medium shrink-0">~</span>
              <div className="flex-1 min-w-0 flex items-center gap-2 rounded-lg border border-[var(--color-border-card)] bg-[var(--color-bg-primary)] px-3 py-2.5 focus-within:ring-2 focus-within:ring-[var(--color-blue-primary)] focus-within:border-transparent">
                <CalendarIcon className="w-4 h-4 shrink-0 text-[var(--color-text-secondary)]" />
                {onMeetingEndTimeChange ? (
                  <TimeDropdown
                    value={endTimeValue}
                    placeholder="종료 시간"
                    options={HOUR_OPTIONS}
                    onChange={(v) => {
                      setDurationPreset(null);
                      onMeetingEndTimeChange(v);
                    }}
                  />
                ) : (
                  <span className="text-[var(--color-text-primary)] text-sm">
                    {HOUR_OPTIONS.find((o) => o.value === endTimeValue)?.label ?? endTimeValue}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 빠른 선택 — 캡슐 버튼 (+1시간 ~ +6시간) */}
          {onMeetingEndTimeChange && (
            <div className="space-y-2">
              <span className="block text-xs font-medium text-[var(--color-text-secondary)] text-left">
                빠른 선택
              </span>
              <div className="flex flex-wrap gap-2">
                {(['1', '2', '3', '4', '5', '6'] as const).map((hr) => (
                  <button
                    key={hr}
                    type="button"
                    onClick={() => {
                      setDurationPreset(hr);
                      if (meetingTime && meetingTime.length >= 5) {
                        onMeetingEndTimeChange(addHoursToTime(meetingTime, parseInt(hr, 10)));
                      }
                    }}
                    className={`rounded-full px-4 py-2 text-sm font-medium border transition-colors ${
                      durationPreset === hr
                        ? 'border-[var(--color-blue-primary)] bg-[var(--color-blue-primary)]/15 text-[var(--color-blue-primary)]'
                        : 'border-[var(--color-border-card)] bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:border-[var(--color-blue-primary)]/50 hover:text-[var(--color-text-primary)]'
                    }`}
                  >
                    +{hr}시간
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* timeStepHourOnly === false: datetime-local + 종료 시간 */
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-[var(--color-text-primary)] text-left">
        매치 일정
      </h3>
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--color-text-primary)] text-left">
            날짜 및 시간
          </label>
          <input
            type="datetime-local"
            value={meetingDate && meetingTime ? `${meetingDate}T${meetingTime}` : ''}
            onChange={(e) => {
              const value = e.target.value;
              if (value) {
                const [date, time] = value.split('T');
                onDateTimeChange(date || '', time || '');
              } else {
                onDateTimeChange('', '');
              }
            }}
            min={datetimeLocalMin}
            className="w-full px-4 py-3 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)] date-input-dark"
          />
        </div>
        {onMeetingEndDateChange && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--color-text-primary)] text-left">
              종료 일자
            </label>
            <input
              type="date"
              value={meetingEndDate || meetingDate}
              onChange={(e) => onMeetingEndDateChange(e.target.value || meetingDate)}
              min={meetingDate || todayMin}
              className="w-full px-4 py-3 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)] date-input-dark"
            />
          </div>
        )}
        {onMeetingEndTimeChange && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--color-text-primary)] text-left">
              종료 시간
            </label>
            <input
              type="time"
              value={meetingEndTime}
              onChange={(e) => onMeetingEndTimeChange(e.target.value)}
              className="w-full px-4 py-3 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)] time-input-dark"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Step2MatchSchedule;
