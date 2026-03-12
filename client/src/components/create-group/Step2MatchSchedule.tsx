import React, { useState, useEffect } from 'react';
import TimeRangeSlider from '../TimeRangeSlider';
import DarkDatePicker from '../DarkDatePicker';

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
  /** 설정 시 종료시간을 시작+ N시간으로 고정(빠른선택 비표시, 종료시간 읽기 전용). 예: 랭크 2파전 90분 = 2 */
  fixedDurationHours?: number;
}

function addHoursToTime(timeHHmm: string, hours: number): string {
  const [h, m] = timeHHmm.slice(0, 5).split(':').map(Number);
  const totalM = (h ?? 0) * 60 + (m ?? 0) + hours * 60;
  const newH = Math.floor(totalM / 60) % 24;
  const newM = totalM % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
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
  fixedDurationHours,
}) => {
  // 고정 경기 시간(예: 랭크 2시간): 시작 시간 변경 시 종료 시간·종료일 자동 반영
  useEffect(() => {
    if (fixedDurationHours == null || !onMeetingEndTimeChange || !meetingTime || meetingTime.length < 5) return;
    const end = addHoursToTime(meetingTime, fixedDurationHours);
    onMeetingEndTimeChange(end);
  }, [meetingTime, fixedDurationHours, onMeetingEndTimeChange]);

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

  const startTimeValue = normalizeHHmm(meetingTime);
  const endTimeValue = normalizeHHmm(meetingEndTime) || '20:00';

  if (timeStepHourOnly) {
    return (
      <div className="space-y-8">
        <h3 className="text-xl font-bold text-[var(--color-text-primary)] text-left">
          매치 일정
        </h3>

        {/* 랭크 매치: 전후반 45분·2시간 고정 안내 */}
        {fixedDurationHours != null && (
          <div className="p-4 rounded-xl bg-amber-500/15 border border-amber-500/40 text-left">
            <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
              랭크 매치는 전후반 45분, 시간 설정 없이 2시간 동안 진행됩니다.
            </p>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">
              시작 시간만 선택하면 종료 시간은 자동으로 2시간 후로 설정됩니다.
            </p>
          </div>
        )}

        {/* 수직 스택: 날짜 설정(하나) → 시간 설정 → 빠른 선택 */}
        <div className="space-y-6">
          {/* 일자 설정 — 단일 날짜 선택 (종료일은 시작 시간/종료 시간에 따라 자동 반영) */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--color-text-primary)] text-left">
              일자 설정
            </label>
            <div className="relative">
              <DarkDatePicker
                value={meetingDate}
                onChange={(date) => {
                  onDateTimeChange(date, meetingTime);
                  if (onMeetingEndDateChange) onMeetingEndDateChange(date);
                }}
                minDate={new Date(todayMin)}
                placeholder="연도-월-일"
              />
            </div>
            {fixedDurationHours == null && (
              <p className="text-xs text-[var(--color-text-secondary)]">
                야간 운영 시 종료 시간이 자정을 넘으면 종료 일자가 익일로 자동 설정됩니다.
              </p>
            )}
          </div>

          {/* 시간 설정 — 24h 타임라인 슬라이더 (용병 모달과 동일) */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--color-text-primary)] text-left">
              경기 시간
            </label>
            {onMeetingEndTimeChange && fixedDurationHours == null ? (
              <TimeRangeSlider
                startTime={startTimeValue || '18:00'}
                endTime={endTimeValue}
                onChange={(start, end) => {
                  onDateTimeChange(meetingDate, start);
                  onMeetingEndTimeChange(end);
                }}
                pointColor="#3b82f6"
              />
            ) : (
              <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-[var(--color-bg-secondary)]">
                <span className="text-[var(--color-text-primary)]">
                  {startTimeValue || '18:00'} ~ {endTimeValue}
                </span>
                <span className="text-xs text-[var(--color-text-secondary)]">(자동 설정)</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* timeStepHourOnly === false: 날짜 + TimeRangeSlider (24h 타임라인) */
  const startVal = normalizeHHmm(meetingTime) || '18:00';
  const endVal = normalizeHHmm(meetingEndTime) || '20:00';

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-[var(--color-text-primary)] text-left">
        매치 일정
      </h3>
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[var(--color-text-primary)] text-left">
            날짜
          </label>
          <div className="relative">
            <DarkDatePicker
              value={meetingDate}
              onChange={(date) => onDateTimeChange(date, meetingTime)}
              minDate={new Date(todayMin)}
              placeholder="연도-월-일"
            />
          </div>
        </div>
        {onMeetingEndTimeChange && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--color-text-primary)] text-left">
              경기 시간
            </label>
            <TimeRangeSlider
              startTime={startVal}
              endTime={endVal}
              onChange={(start, end) => {
                onDateTimeChange(meetingDate, start);
                onMeetingEndTimeChange(end);
              }}
              pointColor="#3b82f6"
            />
          </div>
        )}
        {onMeetingEndDateChange && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--color-text-primary)] text-left">
              종료 일자 (야간 매치 시 익일 선택)
            </label>
            <DarkDatePicker
              value={meetingEndDate || meetingDate}
              onChange={(date) => onMeetingEndDateChange(date || meetingDate)}
              minDate={new Date(meetingDate || todayMin)}
              placeholder="연도-월-일"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Step2MatchSchedule;
