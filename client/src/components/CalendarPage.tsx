import React, { useState } from 'react';

const CalendarPage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay(); // 0 for Sunday, 1 for Monday, etc.
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const daysOfWeek = ['일', '월', '화', '수', '목', '금', '토'];

  const renderCalendarDays = () => {
    const days = [];
    // Fill leading empty days
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2 border border-[var(--color-border-card)] bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]"></div>);
    }
    // Fill days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(
        <div key={`day-${i}`} className="p-2 border border-[var(--color-border-card)] bg-[var(--color-bg-calendar-cell)] min-h-[100px] hover:bg-slate-700 transition-colors duration-200">
          <p className="text-lg font-semibold text-[var(--color-text-primary)]">{i}</p>
          {/* Events or content for the day can go here */}
        </div>
      );
    }
    return days;
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  return (
    <div className="flex flex-col h-screen p-4 bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]">
      <div className="flex justify-between items-center mb-4">
        <button onClick={goToPreviousMonth} className="px-4 py-2 rounded-lg bg-[var(--color-blue-primary)] text-white hover:bg-blue-700 transition-colors duration-200">이전 달</button>
        <h2 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">{`${year}년 ${month + 1}월`}</h2>
        <button onClick={goToNextMonth} className="px-4 py-2 rounded-lg bg-[var(--color-blue-primary)] text-white hover:bg-blue-700 transition-colors duration-200">다음 달</button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center font-bold mb-2">
        {daysOfWeek.map((day) => (
          <div key={day} className="p-2 text-[var(--color-text-primary)]">{day}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 flex-grow">
        {renderCalendarDays()}
      </div>
    </div>
  );
};

export default CalendarPage;
