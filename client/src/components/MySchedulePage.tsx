import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import koLocale from '@fullcalendar/core/locales/ko';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { showInfo } from '../utils/swal';

interface GroupEvent {
  id: number;
  title: string;
  start: string;
  end?: string;
  color?: string;
  extendedProps: {
    groupId: number;
    location: string;
    category: string;
  };
}

const MySchedulePage = () => {
  const { user } = useAuth();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [events, setEvents] = useState<GroupEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 참가한 매치 및 생성한 매치 목록 가져오기
  useEffect(() => {
    const fetchMyGroups = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // 모든 모임 가져오기
        const allGroupsResponse = await api.get<{ groups: any[]; total: number }>('/api/groups?limit=1000');
        const allGroups = allGroupsResponse.groups;

        // 각 모임의 참가 여부 확인
        const participationChecks = await Promise.allSettled(
          allGroups.map((group: any) => api.get(`/api/groups/${group.id}`))
        );

        // 참가한 모임 또는 생성한 모임 필터링
        const myGroups = allGroups.filter((group: any, index: number) => {
          // 생성한 모임인지 확인
          if (group.creatorId === user.id) {
            return true;
          }
          
          // 참가한 모임인지 확인
          const result = participationChecks[index];
          return result.status === 'fulfilled' && (result.value as any)?.isUserParticipant === true;
        });

        // meetingTime을 파싱하여 FullCalendar 이벤트 형식으로 변환
        const calendarEvents: GroupEvent[] = myGroups
          .map((group: any) => {
            if (!group.meetingTime) return null;

            // meetingTime 파싱: "YYYY-MM-DD HH:MM" 형식 또는 "YYYY-MM-DD" 형식
            let startDate: Date | null = null;
            const meetingTimeStr = group.meetingTime.trim();

            // "YYYY-MM-DD HH:MM" 형식
            if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}$/.test(meetingTimeStr)) {
              startDate = new Date(meetingTimeStr.replace(' ', 'T'));
            }
            // "YYYY-MM-DD" 형식
            else if (/^\d{4}-\d{2}-\d{2}$/.test(meetingTimeStr)) {
              startDate = new Date(meetingTimeStr + 'T00:00:00');
            }
            // 다른 형식 시도
            else {
              startDate = new Date(meetingTimeStr);
            }

            // 유효한 날짜인지 확인
            if (!startDate || isNaN(startDate.getTime())) {
              console.warn('유효하지 않은 날짜 형식:', group.meetingTime, group.name);
              return null;
            }

            // 과거 날짜는 제외 (선택사항)
            // if (startDate < new Date()) {
            //   return null;
            // }

            // 종료 시간은 시작 시간 + 2시간으로 설정 (또는 meetingTime에서 추출)
            const endDate = new Date(startDate);
            endDate.setHours(endDate.getHours() + 2);

            // 카테고리별 색상 설정
            const categoryColors: Record<string, string> = {
              '배드민턴': '#3b82f6',
              '축구': '#10b981',
              '농구': '#f59e0b',
              '테니스': '#ef4444',
              '등산': '#8b5cf6',
              '야구': '#ec4899',
              '배구': '#06b6d4',
              '탁구': '#84cc16',
              '골프': '#14b8a6',
              '클라이밍': '#f97316',
              '러닝': '#6366f1',
            };

            return {
              id: group.id,
              title: group.name,
              start: startDate.toISOString(),
              end: endDate.toISOString(),
              color: categoryColors[group.category] || '#6366f1',
              extendedProps: {
                groupId: group.id,
                location: group.location,
                category: group.category,
              },
            };
          })
          .filter((event): event is GroupEvent => event !== null);

        setEvents(calendarEvents);
      } catch (error) {
        console.error('참가한 매치 목록 조회 실패:', error);
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMyGroups();
  }, []);

  return (
    <div className="p-3 md:p-4 h-full bg-[var(--color-bg-primary)] overflow-y-auto">
      <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] mb-4 md:mb-6">내 일정</h1>
      {isLoading ? (
        <div className="bg-[var(--color-bg-card)] rounded-lg p-8 text-center">
          <p className="text-[var(--color-text-secondary)]">일정을 불러오는 중...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="bg-[var(--color-bg-card)] rounded-lg p-8 text-center">
          <p className="text-[var(--color-text-secondary)]">참가하거나 생성한 모임이 없습니다.</p>
          <p className="text-sm text-[var(--color-text-secondary)] mt-2">
            모임에 참가하거나 모임을 생성하면 여기에 일정이 표시됩니다.
          </p>
        </div>
      ) : (
        <div className="bg-[var(--color-bg-card)] rounded-lg p-2 md:p-4">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next',
              center: 'title',
              right: isMobile ? 'today' : 'dayGridMonth,timeGridWeek,timeGridDay'
            }}
            events={events}
            editable={false}
            selectable={false}
            droppable={false}
            height="auto"
            aspectRatio={isMobile ? 1.2 : 1.8}
            locale={koLocale}
            eventClick={async (info) => {
              // 이벤트 클릭 시 모임 상세 정보 표시 (선택사항)
              await showInfo(
                `${info.event.title}\n위치: ${info.event.extendedProps.location}\n카테고리: ${info.event.extendedProps.category}`,
                '모임 정보'
              );
            }}
          />
        </div>
      )}
    </div>
  );
};

export default MySchedulePage;
