import { useState, useEffect, useRef } from 'react';
import type { SelectedGroup } from './MapPanel';
import { api } from '../utils/api';
import { extractCityFromAddress, type KoreanCity } from '../utils/locationUtils';
import LoadingSpinner from './LoadingSpinner';

interface GroupListProps {
  selectedCategory: string | null;
  searchQuery?: string;
  selectedCity?: KoreanCity;
  selectedDays?: number[]; // 선택된 요일 (0=일요일, 1=월요일, ..., 6=토요일)
  hideClosed?: boolean;
  onlyRanker?: boolean;
  gender?: 'male' | 'female' | null;
  includeCompleted?: boolean; // 종료된 매치 포함 여부
  onGroupClick: (group: SelectedGroup) => void;
  refreshTrigger?: number; // 목록 새로고침 트리거
}

interface GroupResponse {
  id: number;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  category: string;
  description: string | null;
  meetingTime: string | null;
  contact: string | null;
  equipment: string[];
  participantCount: number;
  maxParticipants: number | null;
  createdAt: string;
  recentJoinCount?: number; // 최근 1시간 이내 참가자 수 (백엔드에서 제공)
  hasRanker?: boolean; // 랭커가 참가한 매치인지 여부 (백엔드에서 제공)
  isClosed?: boolean; // 매치 마감 여부
}

// 제목이 두 줄을 넘어가는지 확인하는 컴포넌트
const GroupTitle = ({ title, groupId }: { title: string; groupId: number }) => {
  const [needsMarquee, setNeedsMarquee] = useState(false);
  const measureRef = useRef<HTMLHeadingElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasCheckedRef = useRef<string>('');

  useEffect(() => {
    // title이 변경되었을 때만 체크
    if (hasCheckedRef.current === title && needsMarquee !== undefined) return;
    
    const checkOverflow = () => {
      if (measureRef.current && containerRef.current) {
        const element = measureRef.current;
        const container = containerRef.current;
        
        // 임시로 스타일 변경하여 실제 높이 측정
        const originalDisplay = element.style.display;
        const originalWebkitLineClamp = element.style.webkitLineClamp;
        const originalWebkitBoxOrient = element.style.webkitBoxOrient;
        const originalOverflow = element.style.overflow;
        
        // 측정을 위한 임시 스타일
        element.style.display = 'block';
        element.style.webkitLineClamp = 'none';
        element.style.webkitBoxOrient = 'unset';
        element.style.overflow = 'visible';
        
        const textHeight = element.scrollHeight;
        const containerHeight = container.offsetHeight || 48; // 기본값 3rem (두 줄)
        
        // 원래 스타일 복원
        element.style.display = originalDisplay;
        element.style.webkitLineClamp = originalWebkitLineClamp;
        element.style.webkitBoxOrient = originalWebkitBoxOrient;
        element.style.overflow = originalOverflow;
        
        // 텍스트 높이가 컨테이너 높이(두 줄)를 넘으면 마퀴 효과 필요
        const isOverflowing = textHeight > containerHeight;
        
        if (isOverflowing !== needsMarquee) {
          setNeedsMarquee(isOverflowing);
        }
        hasCheckedRef.current = title;
      }
    };

    // DOM이 렌더링된 후 체크
    const timeout = setTimeout(checkOverflow, 200);
    
    return () => {
      clearTimeout(timeout);
    };
  }, [title, groupId]);

  return (
    <>
      <style>{`
        @keyframes scroll-title-${groupId} {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(calc(-50% - 1rem));
          }
        }
      `}</style>
      <div 
        ref={containerRef}
        className="relative overflow-hidden"
        style={{ 
          maxHeight: '3rem', // 두 줄 높이
          lineHeight: '1.5rem',
        }}
      >
        {needsMarquee ? (
          <div
            className="text-base md:text-lg font-bold text-[var(--color-text-primary)] tracking-tight whitespace-nowrap"
            style={{
              display: 'inline-block',
              animation: `scroll-title-${groupId} 25s linear infinite`,
            }}
          >
            {title} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {title}
          </div>
        ) : (
          <h5
            ref={measureRef}
            className="text-base md:text-lg font-bold text-[var(--color-text-primary)] tracking-tight line-clamp-2 break-words"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              wordBreak: 'break-word',
            }}
          >
            {title}
          </h5>
        )}
      </div>
    </>
  );
};

const GroupList: React.FC<GroupListProps> = ({ selectedCategory, searchQuery, selectedCity = '전체', selectedDays = [], hideClosed = true, onlyRanker = false, gender = null, includeCompleted = false, onGroupClick, refreshTrigger }) => {
  const [groups, setGroups] = useState<SelectedGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGroups = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const category = selectedCategory === '전체' || selectedCategory === null ? undefined : selectedCategory;
        const queryParams = new URLSearchParams();
        
        if (category) {
          queryParams.append('category', category);
        }
        if (searchQuery) {
          queryParams.append('search', searchQuery);
        }
        if (hideClosed) {
          queryParams.append('hideClosed', 'true');
        }
        if (onlyRanker) {
          queryParams.append('onlyRanker', 'true');
        }
        if (gender) {
          queryParams.append('gender', gender);
        }
        if (includeCompleted) {
          queryParams.append('includeCompleted', 'true');
        }
        queryParams.append('limit', '1000'); // 충분히 많은 데이터 가져오기 (지역 필터링을 위해)

        const response = await api.get<{ groups: GroupResponse[]; total: number }>(
          `/api/groups?${queryParams.toString()}`
        );

               let mappedGroups: SelectedGroup[] = response.groups.map((group) => {
                 // NEW! 배지: 생성된 지 하루(24시간) 이내인지 확인
                 const createdAt = new Date(group.createdAt);
                 const now = new Date();
                 const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
                 const isNew = hoursSinceCreation <= 24;
                 
                // HOT! 배지: 최근 1시간 이내 참가자 3명 이상 증가한 매치
                 const isHot = (group.recentJoinCount || 0) >= 3;
                 
                // 랭커 배지: 랭커가 참가한 매치
                 const hasRanker = group.hasRanker || false;
                 
                 // 마감임박 배지: 남은 인원이 10% 이하인 경우
                 const isUrgent = group.maxParticipants 
                   ? (group.maxParticipants - group.participantCount) <= Math.ceil(group.maxParticipants * 0.1)
                   : false;
                 
                 // meetingTime 파싱
                 let parsedMeetingTime: Date | null = null;
                 if (group.meetingTime) {
                   const meetingTimeStr = group.meetingTime.trim();
                   if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(meetingTimeStr)) {
                     parsedMeetingTime = new Date(meetingTimeStr);
                   } else if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}$/.test(meetingTimeStr)) {
                     parsedMeetingTime = new Date(meetingTimeStr.replace(' ', 'T'));
                   } else if (/^\d{4}-\d{2}-\d{2}$/.test(meetingTimeStr)) {
                     parsedMeetingTime = new Date(meetingTimeStr + 'T00:00:00');
                   } else {
                     parsedMeetingTime = new Date(meetingTimeStr);
                   }
                 }
                 
                 // 오늘 모임 배지: 모임 일정이 오늘인지 확인
                 let isToday = false;
                 if (parsedMeetingTime && !isNaN(parsedMeetingTime.getTime())) {
                   const today = new Date();
                   today.setHours(0, 0, 0, 0);
                   const meetingDate = new Date(parsedMeetingTime);
                   meetingDate.setHours(0, 0, 0, 0);
                   isToday = meetingDate.getTime() === today.getTime();
                 }
                 
                 return {
                   id: group.id,
                   name: group.name,
                   location: group.location,
                   coordinates: [parseFloat(group.latitude.toString()), parseFloat(group.longitude.toString())] as [number, number],
                   memberCount: group.participantCount,
                   maxParticipants: group.maxParticipants || undefined,
                   category: group.category,
                   description: group.description || undefined,
                   meetingTime: group.meetingTime || undefined,
                   contact: group.contact || undefined,
                   equipment: group.equipment || [],
                   parsedMeetingTime: parsedMeetingTime && !isNaN(parsedMeetingTime.getTime()) ? parsedMeetingTime : undefined,
                   badges: {
                     isNew,
                     isHot,
                     hasRanker,
                     isUrgent,
                     isToday,
                   },
                 };
               });

               // ⭐ 날짜 필터링: 당일 기준 1주일치 매치만 표시
               const today = new Date();
               today.setHours(0, 0, 0, 0); // 오늘 00:00:00
               
               const oneWeekLater = new Date(today);
               oneWeekLater.setDate(oneWeekLater.getDate() + 7); // 1주일 후 00:00:00
               
               mappedGroups = mappedGroups.filter((group) => {
                 // 일정이 없으면 표시하지 않음
                 if (!group.meetingTime) return false;
                 
                 // meetingTime 파싱
                 let meetingDate: Date | null = null;
                 const meetingTimeStr = group.meetingTime.trim();
                 
                 if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(meetingTimeStr)) {
                   // datetime-local 형식 (YYYY-MM-DDTHH:MM)
                   meetingDate = new Date(meetingTimeStr);
                 } else if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}$/.test(meetingTimeStr)) {
                   // "YYYY-MM-DD HH:MM" 형식
                   meetingDate = new Date(meetingTimeStr.replace(' ', 'T'));
                 } else if (/^\d{4}-\d{2}-\d{2}$/.test(meetingTimeStr)) {
                   // "YYYY-MM-DD" 형식
                   meetingDate = new Date(meetingTimeStr + 'T00:00:00');
                 } else {
                   // 기타 형식 시도
                   meetingDate = new Date(meetingTimeStr);
                 }
                 
                 if (!meetingDate || isNaN(meetingDate.getTime())) {
                   return false; // 파싱 실패 시 표시하지 않음
                 }
                 
                 // 날짜만 비교 (시간 제외)
                 const meetingDateOnly = new Date(meetingDate);
                 meetingDateOnly.setHours(0, 0, 0, 0);
                 
                 // 오늘부터 1주일 이내인지 확인
                 if (meetingDateOnly < today || meetingDateOnly >= oneWeekLater) {
                   return false;
                 }
                 
                 // 요일 필터링: 선택된 요일이 있으면 해당 요일만 표시
                 if (selectedDays.length > 0) {
                   const dayOfWeek = meetingDate.getDay(); // 0=일요일, 1=월요일, ..., 6=토요일
                   return selectedDays.includes(dayOfWeek);
                 }
                 
                 return true;
               });

               // ⭐ 지역 필터링: 선택된 도시에 해당하는 매치만 표시
               if (selectedCity && selectedCity !== '전체') {
                 mappedGroups = mappedGroups.filter((group) => {
                   const groupCity = extractCityFromAddress(group.location);
                   return groupCity === selectedCity;
                 });
               }

               // ⭐ 일정 기준 정렬: 가장 빠른 일정부터 표시
               mappedGroups.sort((a, b) => {
                 // parsedMeetingTime이 있는 경우 우선 정렬
                 if (a.parsedMeetingTime && b.parsedMeetingTime) {
                   return a.parsedMeetingTime.getTime() - b.parsedMeetingTime.getTime();
                 }
                 // 하나만 있는 경우 앞으로
                 if (a.parsedMeetingTime && !b.parsedMeetingTime) return -1;
                 if (!a.parsedMeetingTime && b.parsedMeetingTime) return 1;
                 // 둘 다 없으면 원래 순서 유지
                 return 0;
               });

        setGroups(mappedGroups);
      } catch (err) {
        console.error('매치 목록 조회 실패:', err);
        setError(err instanceof Error ? err.message : '매치 목록을 불러오는데 실패했습니다.');
        setGroups([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroups();
  }, [selectedCategory, searchQuery, selectedCity, selectedDays, hideClosed, onlyRanker, gender, includeCompleted, refreshTrigger]);

  if (isLoading) {
    return (
      <div className="p-4 relative min-h-[200px]">
        <LoadingSpinner message="매치 목록을 불러오는 중..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-1.5 md:p-3">
      <div className="space-y-2 md:space-y-2.5">
        {groups.length > 0 ? (
          groups.map((group) => (
            <button
              onClick={() => onGroupClick(group)}
              className="w-full text-left block p-2 md:p-3 bg-[var(--color-bg-card)] rounded-lg md:rounded-xl border border-[var(--color-border-card)] transition-all duration-300 hover:scale-[1.02] hover:border-[var(--color-blue-primary)] cursor-pointer" 
              key={group.id}
            >
              <div className="mb-1.5 gap-1.5">
                {/* 제목과 배지 */}
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <div className="relative min-w-0 flex-1">
                    <GroupTitle title={group.name} groupId={group.id} />
                  </div>
                  {/* 배지 표시 */}
                  <div className="flex items-center gap-1.5 flex-wrap flex-shrink-0">
                    {group.badges?.isNew && (
                      <span className="px-2 py-0.5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full animate-pulse shadow-md">
                        NEW!
                      </span>
                    )}
                    {group.badges?.isHot && (
                      <span className="px-2 py-0.5 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold rounded-full flex items-center gap-1 shadow-md">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                        </svg>
                        HOT!
                      </span>
                    )}
                    {group.badges?.hasRanker && (
                      <span className="px-2 py-0.5 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-white text-xs font-bold rounded-full flex items-center gap-1 shadow-md">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        랭커
                      </span>
                    )}
                    {group.badges?.isUrgent && !(group.maxParticipants && group.memberCount && group.memberCount >= group.maxParticipants) && (
                      <span className="px-2 py-0.5 bg-gradient-to-r from-red-600 to-red-700 text-white text-xs font-bold rounded-full flex items-center gap-1 shadow-md animate-pulse">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        마감임박
                      </span>
                    )}
                    {group.badges?.isToday && (
                      <span className="px-2 py-0.5 bg-gradient-to-r from-green-500 to-green-600 text-white text-xs font-bold rounded-full shadow-md">
                        오늘 매치
                      </span>
                    )}
                  </div>
                </div>
                {/* 주소 */}
                <div className="mb-1.5">
                  <span className="px-1.5 py-0.5 bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] text-xs font-semibold rounded-full">
                    {group.location}
                  </span>
                </div>
              </div>
              <div className="flex flex-col md:flex-row md:items-center gap-1.5">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs md:text-sm text-[var(--color-text-secondary)]">
                    참가자: <span className="px-1.5 py-0.5 bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] text-xs font-semibold rounded-full">{group.memberCount}명</span>
                    {group.maxParticipants && (
                      <span className="text-[var(--color-text-secondary)]">/ {group.maxParticipants}명</span>
                    )}
                  </p>
                  {group.maxParticipants && group.memberCount && group.memberCount >= group.maxParticipants && (
                    <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs font-semibold rounded-full">
                      인원마감
                    </span>
                  )}
                </div>
                <span className="px-1.5 py-0.5 bg-[var(--color-blue-primary)] text-white text-xs font-semibold rounded-full self-start md:self-auto">
                  {group.category}
                </span>
              </div>
            </button>
          ))
        ) : (
          <p className="p-3 text-[var(--color-text-secondary)] italic text-center text-sm">
            {searchQuery ? '검색 결과가 없습니다.' : '해당 카테고리의 매치가 없습니다.'}
          </p>
        )}
      </div>
    </div>
  );
};

export default GroupList;
