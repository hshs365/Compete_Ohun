import React, { forwardRef } from 'react';
import DatePicker from 'react-datepicker';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';
import 'react-datepicker/dist/react-datepicker.css';
import { ko } from 'date-fns/locale';

interface DarkDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  pointColor?: string;
  minDate?: Date;
}

/** 클릭 시 캘린더만 열리고 모바일 키보드는 뜨지 않도록 버튼형 입력 사용 */
const CustomDateInput = forwardRef<HTMLButtonElement, { value?: string; onClick?: () => void }>(
  ({ value, onClick }, ref) => (
    <button
      type="button"
      ref={ref as React.RefObject<HTMLButtonElement>}
      onClick={onClick}
      className="dark-date-picker-input w-full text-left py-2.5 pl-3 pr-10 rounded-lg bg-[var(--color-bg-card)] border border-[var(--color-border-card)] text-[var(--color-text-primary)] cursor-pointer"
    >
      {value || '연도-월-일'}
    </button>
  )
);
CustomDateInput.displayName = 'CustomDateInput';

const DarkDatePicker: React.FC<DarkDatePickerProps> = ({
  value,
  onChange,
  className = '',
  placeholder = '연도-월-일',
  pointColor = '#22c55e',
  minDate,
}) => {
  const dateValue = value ? new Date(value + 'T12:00:00') : null;

  return (
    <div className={`dark-date-picker-root relative flex w-full items-center ${className}`}>
      <DatePicker
        selected={dateValue}
        onChange={(date: Date | null) => {
          if (date) {
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            onChange(`${y}-${m}-${d}`);
          } else {
            onChange('');
          }
        }}
        dateFormat="yyyy년 MM월 dd일"
        locale={ko}
        placeholderText={placeholder}
        minDate={minDate ?? new Date()}
        calendarClassName="dark-date-picker-calendar"
        showMonthDropdown
        showYearDropdown
        dropdownMode="select"
        popperPlacement="bottom-start"
        popperClassName="dark-date-picker-popper"
        customInput={<CustomDateInput />}
      />
      <CalendarDaysIcon className="absolute right-2.5 inset-y-0 my-auto h-5 w-5 shrink-0 text-[var(--color-text-secondary)] pointer-events-none" aria-hidden />
    </div>
  );
};

export default DarkDatePicker;
