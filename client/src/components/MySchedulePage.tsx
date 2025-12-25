import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

// FullCalendar의 CSS는 전역으로 처리하거나 별도의 파일을 통해 관리됩니다.
// 여기서는 직접 임포트하지 않습니다.

const MySchedulePage = () => {
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="p-3 md:p-4 h-full bg-[var(--color-bg-primary)] overflow-y-auto">
      <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] mb-4 md:mb-6">내 일정</h1>
      <div className="bg-[var(--color-bg-card)] rounded-lg p-2 md:p-4">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next',
            center: 'title',
            right: isMobile ? 'today' : 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          editable={true}
          selectable={true}
          droppable={true}
          height="auto"
          aspectRatio={isMobile ? 1.2 : 1.8}
        />
      </div>
    </div>
  );
};

export default MySchedulePage;
