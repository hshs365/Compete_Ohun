import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import koLocale from '@fullcalendar/core/locales/ko';
import { CalendarDaysIcon, PlusIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import type { DatesSetArg } from '@fullcalendar/core';
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
    groupId?: number;
    location: string;
    category: string;
    type: 'match' | 'reservation';
    reservationId?: number;
    facilityId?: number;
    facilityName?: string;
    userName?: string;
    status?: string;
  };
}

interface MyFacility {
  id: number;
  name: string;
  address?: string;
}

const MySchedulePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const calendarRef = useRef<FullCalendar>(null);
  const [events, setEvents] = useState<GroupEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'>('timeGridWeek');
  const [showReservations, setShowReservations] = useState(true);
  const [showMatches, setShowMatches] = useState(true);
  const [myFacilities, setMyFacilities] = useState<MyFacility[]>([]);
  /** 시설별 예약 표시 여부 (facilityId → checked). 기본값: 전체 선택 */
  const [selectedFacilityIds, setSelectedFacilityIds] = useState<Set<number>>(new Set());

  // 시설 등록 권한: 사업자 또는 내가 등록한 시설이 있는 경우
  const hasFacilities = myFacilities.length > 0;

  // 내가 등록한 시설 목록 조회 (시설별 필터용)
  useEffect(() => {
    if (!user?.id) return;
    const fetchMyFacilities = async () => {
      try {
        const list = await api.get<MyFacility[]>('/api/facilities/my');
        const facilities = Array.isArray(list) ? list : [];
        setMyFacilities(facilities);
        setSelectedFacilityIds(new Set(facilities.map((f) => f.id)));
      } catch (error) {
        console.error('내 시설 목록 조회 실패:', error);
        setMyFacilities([]);
      }
    };
    fetchMyFacilities();
  }, [user?.id]);

  // 참가한 매치 및 생성한 매치 목록 가져오기 + 시설 등록자인 경우 시설 예약 현황
  useEffect(() => {
    const fetchSchedules = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
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

        const allEvents: GroupEvent[] = [];

        // 1. 매치 일정 조회
        const allGroupsResponse = await api.get<{ groups: any[]; total: number }>('/api/groups?limit=1000');
        const allGroups = allGroupsResponse.groups;

        const participationChecks = await Promise.allSettled(
          allGroups.map((group: any) => api.get(`/api/groups/${group.id}`))
        );

        const myGroups = allGroups.filter((group: any, index: number) => {
          if (group.creatorId === user.id) return true;
          const result = participationChecks[index];
          return result.status === 'fulfilled' && (result.value as any)?.isUserParticipant === true;
        });

        const matchEvents: GroupEvent[] = myGroups
          .map((group: any) => {
            if (!group.meetingTime) return null;
            let startDate: Date | null = null;
            const meetingTimeStr = group.meetingTime.trim();
            if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(meetingTimeStr)) {
              startDate = new Date(meetingTimeStr.slice(0, 16));
            } else if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(meetingTimeStr)) {
              const startPart = meetingTimeStr.split('~')[0]?.trim() || meetingTimeStr;
              startDate = new Date(startPart.replace(' ', 'T') + ':00');
            } else if (/^\d{4}-\d{2}-\d{2}$/.test(meetingTimeStr)) {
              startDate = new Date(meetingTimeStr + 'T00:00:00');
            } else {
              const dateMatch = meetingTimeStr.match(/^\d{4}-\d{2}-\d{2}/);
              startDate = dateMatch ? new Date(dateMatch[0] + 'T00:00:00') : new Date(meetingTimeStr);
            }
            if (!startDate || isNaN(startDate.getTime())) return null;
            const endDate = new Date(startDate);
            endDate.setHours(endDate.getHours() + 2);
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
                type: 'match' as const,
              },
            };
          })
          .filter((event): event is GroupEvent => event !== null);

        allEvents.push(...matchEvents);

        // 2. 시설 등록자인 경우: 내가 등록한 시설에 대한 예약 (가예약, 확정 등) 조회
        try {
          const raw = await api.get<unknown>('/api/reservations/owner');
          const reservations = Array.isArray(raw) ? raw : [];

          const reservationEvents: GroupEvent[] = reservations
            .map((res: any) => {
              if (!res.reservationDate || !res.startTime) return null;

              const startDate = new Date(`${res.reservationDate}T${res.startTime}`);
              const endDate = new Date(`${res.reservationDate}T${res.endTime}`);

              if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return null;

              // 예약 상태별 색상 (가예약 포함)
              const statusColors: Record<string, string> = {
                pending: '#f59e0b',    // 대기 - 주황
                confirmed: '#10b981',  // 확정 - 녹색
                completed: '#6b7280',  // 완료 - 회색
                cancelled: '#ef4444',  // 취소 - 빨강
                no_show: '#dc2626',    // 노쇼 - 진한 빨강
                provisional: '#a855f7', // 가예약 - 보라
              };

              const isProvisional = res.status === 'provisional';
              const titleSuffix = isProvisional ? ' (가예약)' : '';
              // 예약자/매치장 닉네임: user.nickname 우선, 가예약 시 memo에서 "가예약중 - 닉네임" 추출
              let hostNickname = res.user?.nickname;
              if (!hostNickname && isProvisional && res.memo) {
                const match = String(res.memo).match(/가예약중\s*-\s*(.+)/);
                hostNickname = match ? match[1].trim() : undefined;
              }
              hostNickname = hostNickname || '사용자';
              return {
                id: res.id + 100000, // 매치 ID와 충돌 방지
                title: `[예약] ${res.facility?.name || '시설'} - ${hostNickname}${titleSuffix}`,
                start: startDate.toISOString(),
                end: endDate.toISOString(),
                color: statusColors[res.status] || '#6366f1',
                extendedProps: {
                  type: 'reservation' as const,
                  reservationId: res.id,
                  facilityId: res.facilityId ?? res.facility?.id,
                  facilityName: res.facility?.name,
                  userName: hostNickname,
                  status: res.status,
                  location: res.facility?.address || '',
                  category: '시설예약',
                },
              };
            })
            .filter((event): event is GroupEvent => event !== null);

          allEvents.push(...reservationEvents);
        } catch (error) {
          console.error('시설 예약 현황 조회 실패:', error);
        }

        setEvents(allEvents);
      } catch (error) {
        console.error('일정 조회 실패:', error);
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchedules();
  }, [user?.id]);

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    calendarRef.current?.getApi()?.today();
  };

  const goToPrev = () => {
    calendarRef.current?.getApi()?.prev();
    const api = calendarRef.current?.getApi();
    if (api) {
      const view = api.view;
      setCurrentDate(view.currentStart);
    }
  };

  const goToNext = () => {
    calendarRef.current?.getApi()?.next();
    const api = calendarRef.current?.getApi();
    if (api) {
      const view = api.view;
      setCurrentDate(view.currentStart);
    }
  };

  const handleDatesSet = (arg: DatesSetArg) => {
    setCurrentDate(arg.view.currentStart);
  };

  const handleMiniCalendarDateClick = (date: Date) => {
    setCurrentDate(date);
    calendarRef.current?.getApi()?.gotoDate(date);
  };

  const getTitleText = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    return `${year}년 ${month}월`;
  };

  const getMiniCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPad = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < startPad; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  };

  const today = new Date();
  const miniDays = getMiniCalendarDays();

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg-primary)] overflow-hidden">
      <div className="flex flex-1 min-h-0">
        {/* 사이드바 */}
        <aside className="w-[240px] md:w-[280px] shrink-0 flex flex-col border-r border-[var(--color-border-card)] bg-[var(--color-bg-card)]">
          <div className="p-4 border-b border-[var(--color-border-card)]">
            <div className="flex items-center gap-2 mb-4">
              <CalendarDaysIcon className="w-6 h-6 text-[var(--color-blue-primary)]" />
              <h1 className="text-lg font-bold text-[var(--color-text-primary)]">내 일정</h1>
            </div>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-white bg-[var(--color-blue-primary)] hover:opacity-90 transition-opacity"
            >
              <PlusIcon className="w-5 h-5" />
              만들기
            </button>
          </div>
          <div className="p-4 border-b border-[var(--color-border-card)]">
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-[var(--color-text-secondary)] mb-2">
              {['일', '월', '화', '수', '목', '금', '토'].map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {miniDays.map((d, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => d !== null && handleMiniCalendarDateClick(new Date(currentDate.getFullYear(), currentDate.getMonth(), d))}
                  disabled={d === null}
                  className={`aspect-square rounded-lg text-sm transition-colors ${
                    d === null
                      ? 'invisible'
                      : today.getDate() === d && today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear()
                      ? 'bg-[var(--color-blue-primary)] text-white font-semibold'
                      : currentDate.getDate() === d
                      ? 'bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] font-medium'
                      : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]'
                  }`}
                >
                  {d ?? ''}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 p-4 overflow-auto">
            <details open className="group">
              <summary className="cursor-pointer text-sm font-medium text-[var(--color-text-primary)] list-none flex items-center justify-between">
                내 캘린더
              </summary>
              <div className="mt-2 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-[var(--color-text-secondary)]">
                  <input
                    type="checkbox"
                    checked={showMatches}
                    onChange={(e) => setShowMatches(e.target.checked)}
                    className="rounded"
                  />
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: '#6366f1' }}
                    aria-hidden
                  />
                  매치 일정
                </label>
                {hasFacilities && (
                  <>
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-[var(--color-text-secondary)]">
                      <input
                        type="checkbox"
                        checked={showReservations}
                        onChange={(e) => setShowReservations(e.target.checked)}
                        className="rounded"
                      />
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: '#10b981' }}
                        aria-hidden
                      />
                      시설 예약
                    </label>
                    <div className="ml-4 mt-2 space-y-1.5 border-l-2 border-[var(--color-border-card)] pl-3">
                      {myFacilities.map((f) => (
                        <label
                          key={f.id}
                          className="flex items-center gap-2 cursor-pointer text-xs text-[var(--color-text-secondary)]"
                        >
                          <input
                            type="checkbox"
                            checked={selectedFacilityIds.has(f.id)}
                            onChange={(e) => {
                              setSelectedFacilityIds((prev) => {
                                const next = new Set(prev);
                                if (e.target.checked) next.add(f.id);
                                else next.delete(f.id);
                                return next;
                              });
                            }}
                            className="rounded"
                          />
                          <span className="truncate" title={f.name}>
                            {f.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </details>
            {hasFacilities && (
              <div className="mt-4 pt-4 border-t border-[var(--color-border-card)]">
                <p className="text-xs font-medium text-[var(--color-text-secondary)] mb-2">예약 상태 색상</p>
                <div className="space-y-1.5 text-xs text-[var(--color-text-secondary)]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#a855f7]" />
                    <span>가예약</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
                    <span>대기</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
                    <span>확정</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#6b7280]" />
                    <span>완료</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
                    <span>취소/노쇼</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* 메인 캘린더 */}
        <main className="flex-1 flex flex-col min-w-0 p-4">
          {/* 커스텀 툴바 */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <button
              type="button"
              onClick={goToToday}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-[var(--color-text-primary)] bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-card)] border border-[var(--color-border-card)] transition-colors"
            >
              오늘
            </button>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={goToPrev}
                className="p-1.5 rounded-lg text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] transition-colors"
              >
                <ChevronLeftIcon className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={goToNext}
                className="p-1.5 rounded-lg text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] transition-colors"
              >
                <ChevronRightIcon className="w-5 h-5" />
              </button>
            </div>
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] min-w-[140px]">
              {getTitleText()}
            </h2>
            <div className="flex gap-1 ml-auto">
              {(['dayGridMonth', 'timeGridWeek', 'timeGridDay'] as const).map((view) => (
                <button
                  key={view}
                  type="button"
                  onClick={() => {
                    setViewType(view);
                    calendarRef.current?.getApi()?.changeView(view);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    viewType === view
                      ? 'bg-[var(--color-blue-primary)] text-white'
                      : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]'
                  }`}
                >
                  {view === 'dayGridMonth' ? '월' : view === 'timeGridWeek' ? '주' : '일'}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="flex-1 flex items-center justify-center bg-[var(--color-bg-card)] rounded-lg border border-[var(--color-border-card)]">
              <p className="text-[var(--color-text-secondary)]">일정을 불러오는 중...</p>
            </div>
          ) : (
            <>
              <div className="schedule-calendar-wrapper flex-1 min-h-0 rounded-lg border border-[var(--color-border-card)] overflow-hidden">
                <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView={viewType}
                initialDate={currentDate}
                headerToolbar={false}
                events={events.filter((e) => {
                  if (e.extendedProps.type === 'match' && !showMatches) return false;
                  if (e.extendedProps.type === 'reservation') {
                    if (!showReservations) return false;
                    const fid = e.extendedProps.facilityId;
                    if (fid != null && selectedFacilityIds.size > 0 && !selectedFacilityIds.has(fid)) return false;
                  }
                  return true;
                })}
                editable={false}
                selectable={false}
                droppable={false}
                height="100%"
                locale={koLocale}
                slotMinTime="06:00:00"
                slotMaxTime="24:00:00"
                allDaySlot={true}
                datesSet={handleDatesSet}
                eventClick={async (info) => {
                  const props = info.event.extendedProps;
                  if (props.type === 'reservation') {
                    const statusKo: Record<string, string> = {
                      provisional: '가예약',
                      pending: '대기',
                      confirmed: '확정',
                      completed: '완료',
                      cancelled: '취소',
                      no_show: '노쇼',
                    };
                    await showInfo(
                      `시설: ${props.facilityName || '-'}\n매치장 닉네임: ${props.userName || '-'}\n상태: ${statusKo[props.status as string] || props.status}\n위치: ${props.location}`,
                      '예약 정보'
                    );
                  } else {
                    await showInfo(
                      `${info.event.title}\n위치: ${props.location}\n카테고리: ${props.category}`,
                      '모임 정보'
                    );
                  }
                }}
              />
              </div>
              {events.length === 0 && (
                <p className="mt-3 text-center text-sm text-[var(--color-text-secondary)]">
                  {hasFacilities
                    ? '참가·생성한 모임이나 내 시설에 대한 예약(가예약·확정)이 여기에 표시됩니다.'
                    : '참가하거나 생성한 모임이 있으면 여기에 일정이 표시됩니다.'}
                </p>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default MySchedulePage;
