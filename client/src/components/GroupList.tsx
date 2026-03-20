import { useState, useEffect, useRef, useMemo } from 'react';
import { CurrencyDollarIcon } from '@heroicons/react/24/solid';
import { getMannerGradeConfig } from '../utils/mannerGrade';
import { SPORT_CHIP_STYLES, SPORT_POINT_COLORS } from '../constants/sports';
import type { SelectedGroup } from '../types/selected-group';
import { api } from '../utils/api';
import { addressMatchesRegion, getDistanceKm, type KoreanCity } from '../utils/locationUtils';
import LoadingSpinner from './LoadingSpinner';
import MercenaryEmptyState from './MercenaryEmptyState';
import type { MatchType } from './GroupListPanel';

/** 지도 bounds (이 지역에서 재검색용) */
export type MapBounds = { latMin: number; latMax: number; lngMin: number; lngMax: number } | null;

interface GroupListProps {
  selectedCategory: string | null;
  searchQuery?: string;
  /** 종목별 동적 필터 값 (API sportSpecificFilter로 전달) */
  sportFilterValues?: Record<string, string | string[]>;
  /** 선택 지역: '전체' | 시/도 | 구 fullName | 동 fullName. 있으면 selectedCity 대신 사용 */
  selectedRegion?: string;
  /** @deprecated use selectedRegion */
  selectedCity?: KoreanCity;
  selectedDays?: number[]; // 선택된 요일 (0=일요일, 1=월요일, ..., 6=토요일)
  /** 날짜 필터 YYYY-MM-DD (특정 날짜 매치만) */
  filterDate?: string | null;
  hideClosed?: boolean;
  onlyRanker?: boolean;
  gender?: 'male' | 'female' | null;
  includeCompleted?: boolean; // 종료된 매치 포함 여부
  onGroupClick: (group: SelectedGroup) => void;
  refreshTrigger?: number; // 목록 새로고침 트리거
  /** 지도 bounds (이 지역에서 재검색 시 API에 전달) */
  mapBounds?: MapBounds;
  /** 매치 종류: 일반/랭크/이벤트 (API type·onlyRanker 반영) */
  matchType?: MatchType;
  /** 내 주소(도시) 좌표 [위도, 경도]. 있으면 가까운 순 정렬 */
  userCoords?: [number, number] | null;
  /** 목록 데이터 변경 시 콜백 (지도 마커용) */
  onGroupsChange?: (groups: SelectedGroup[]) => void;
  /** 로딩 상태 변경 시 콜백 */
  onLoadingChange?: (loading: boolean) => void;
  /** 마커 클릭 시 해당 시설의 매치 목록 (API 대신 이 목록 표시, 빠른시간순) */
  groupsOverride?: SelectedGroup[];
  /** 플레이어 모드: 인원 미달 매치만 표시 (플레이어 N명 구해요) */
  mercenaryOnly?: boolean;
  /** 참가 후 즉시 반영용: { groupId, participantCount } (낙관적 업데이트) */
  optimisticParticipantCount?: { groupId: number; participantCount: number } | null;
  /** 플레이어 빈 상태: 선택된 종목 (있으면 MercenaryEmptyState 표시) */
  emptyStateSport?: string | null;
  /** 빈 상태에서 '플레이어 구하기 작성' 클릭 시 */
  onEmptyWriteClick?: () => void;
  /** 비로그인 시 빈 상태의 작성 버튼 숨김 (기본 true) */
  showEmptyWriteButton?: boolean;
  /** 플레이어 모드에서 전체 종목 조회 시, 지역 필터 적용된 목록의 종목별 개수 (지역별 정렬용) */
  onCategoryCountsChange?: (counts: Record<string, number>) => void;
  /** 플레이어 모드: true면 내 활동시간에 해당하는 매치만 표시, false면 모두 표시 */
  filterByActivityTime?: boolean;
  /** 내 활동 가능 시간표 (filterByActivityTime일 때 사용) */
  activityTimeSlots?: Array<{ dayOfWeek: number; timeSlots: Array<{ start: string; end: string }> }>;
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
  meetingDateTime?: string | null; // API 실제 일시 (meetingTime 없을 때 플레이어 등 폴백)
  contact: string | null;
  equipment: string[];
  participantCount: number;
  /** 매치장 제외 참가자 수 (플레이어 구하기 등에서 사용) */
  participantCountExcludingCreator?: number;
  maxParticipants: number | null;
  createdAt: string;
  type?: 'normal' | 'rank' | 'event'; // 매치 유형
  recentJoinCount?: number;
  hasRanker?: boolean;
  isClosed?: boolean;
  hasFee?: boolean;
  feeAmount?: number | null;
  creator?: {
    id: number;
    nickname?: string;
    tag?: string | null;
    mannerScore?: number;
    noShowCount?: number;
  };
  boostedUntil?: string | null;
  isBoosted?: boolean;
  depositAmount?: number | null;
}

/** 목록용 매치 일시 표기 (예: "2/10(화) 08:00" 또는 "2/10(화) 08:00~10:00") */
function formatMeetingTimeForList(meetingTime?: string | null, parsed?: Date | undefined): string {
  if (meetingTime && meetingTime.trim()) {
    const s = meetingTime.trim();
    // "YYYY-MM-DD HH:MM ~ HH:MM" 형태면 그대로 또는 짧게
    const rangeMatch = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})\s+(\d{1,2}):(\d{2})\s*~\s*(\d{1,2}):(\d{2})/);
    if (rangeMatch) {
      const [, y, m, d, h1, min1, h2, min2] = rangeMatch;
      const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
      const date = new Date(Number(y), Number(m) - 1, Number(d));
      const dayLabel = weekdays[date.getDay()];
      return `${Number(m)}/${Number(d)}(${dayLabel}) ${h1}:${min1}~${h2}:${min2}`;
    }
    // "YYYY-MM-DDTHH:MM" 또는 "YYYY-MM-DD HH:MM"
    const isoMatch = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})[T\s]+(\d{1,2}):(\d{2})/);
    if (isoMatch) {
      const [, y, m, d, h, min] = isoMatch;
      const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
      const date = new Date(Number(y), Number(m) - 1, Number(d));
      const dayLabel = weekdays[date.getDay()];
      return `${Number(m)}/${Number(d)}(${dayLabel}) ${h}:${min}`;
    }
    // "YYYY-MM-DD"만 있으면 날짜만
    const dateOnly = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (dateOnly) {
      const [, y, m, d] = dateOnly;
      const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
      const date = new Date(Number(y), Number(m) - 1, Number(d));
      const dayLabel = weekdays[date.getDay()];
      return `${Number(m)}/${Number(d)}(${dayLabel})`;
    }
    return s;
  }
  if (parsed && !isNaN(parsed.getTime())) {
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const m = parsed.getMonth() + 1;
    const d = parsed.getDate();
    const dayLabel = weekdays[parsed.getDay()];
    const h = parsed.getHours();
    const min = String(parsed.getMinutes()).padStart(2, '0');
    return `${m}/${d}(${dayLabel}) ${h}:${min}`;
  }
  return '';
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

/** meeting 시간(분 단위)이 timeSlots 내에 있는지 (start/end는 "HH:mm") */
function isMeetingInActivitySlots(
  meetingDate: Date,
  slots: Array<{ dayOfWeek: number; timeSlots: Array<{ start: string; end: string }> }>
): boolean {
  const dayOfWeek = meetingDate.getDay();
  const meetingMinutes = meetingDate.getHours() * 60 + meetingDate.getMinutes();
  const daySlots = slots.filter((s) => s.dayOfWeek === dayOfWeek);
  for (const day of daySlots) {
    for (const ts of day.timeSlots ?? []) {
      const [sh, sm] = (ts.start || '00:00').split(':').map(Number);
      const [eh, em] = (ts.end || '23:59').split(':').map(Number);
      const startM = sh * 60 + (sm || 0);
      const endM = eh * 60 + (em || 0);
      if (meetingMinutes >= startM && meetingMinutes <= endM) return true;
    }
  }
  return false;
}

const GroupList: React.FC<GroupListProps> = ({ selectedCategory, searchQuery, sportFilterValues, selectedRegion: propSelectedRegion, selectedCity = '전체', selectedDays = [], filterDate = null, hideClosed = true, onlyRanker = false, gender = null, includeCompleted = false, onGroupClick, refreshTrigger, mapBounds = null, matchType = 'general', userCoords = null, onGroupsChange, onLoadingChange, groupsOverride, mercenaryOnly = false, optimisticParticipantCount, emptyStateSport, onEmptyWriteClick, showEmptyWriteButton = true, onCategoryCountsChange, filterByActivityTime = false, activityTimeSlots }) => {
  const selectedRegion = propSelectedRegion ?? selectedCity;
  const [groups, setGroups] = useState<SelectedGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 표시할 목록: groupsOverride 사용 시 해당 목록, 아니면 state. 활동시간만 보기 시 필터 적용
  const displayedGroups = useMemo(() => {
    const list = groupsOverride !== undefined && groupsOverride ? groupsOverride : groups;
    if (!mercenaryOnly || !filterByActivityTime || !activityTimeSlots?.length) return list;
    return list.filter((group) => {
      let meetingDate: Date | null = group.parsedMeetingTime ?? null;
      if (!meetingDate && group.meetingTime) {
        const s = group.meetingTime.trim();
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) meetingDate = new Date(s.slice(0, 16));
        else if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(s)) {
          const startPart = s.split('~')[0]?.trim() || s;
          meetingDate = new Date(startPart.replace(' ', 'T') + ':00');
        }
      }
      if (!meetingDate || isNaN(meetingDate.getTime())) return false;
      return isMeetingInActivitySlots(meetingDate, activityTimeSlots);
    });
  }, [groupsOverride, groups, mercenaryOnly, filterByActivityTime, activityTimeSlots]);

  // sportFilterValues 객체 참조 대신 직렬화된 값으로 의존성 안정화 (무한 fetch 방지)
  const sportFilterKey = sportFilterValues && typeof sportFilterValues === 'object' && Object.keys(sportFilterValues).length > 0
    ? JSON.stringify(sportFilterValues)
    : '';

  // selectedDays 배열 참조 안정화 (기본값 []가 매 렌더 새 참조 생성 → 로딩/빈 상태 번갈아 나오는 문제)
  const selectedDaysKey = JSON.stringify(selectedDays ?? []);

  // mapBounds 객체 참조 안정화
  const mapBoundsKey = mapBounds
    ? `${mapBounds.latMin},${mapBounds.latMax},${mapBounds.lngMin},${mapBounds.lngMax}`
    : '';

  // 시설 필터(마커 클릭) 모드: groupsOverride 사용, API fetch 스킵
  const hasGroupsOverride = groupsOverride !== undefined;
  useEffect(() => {
    if (hasGroupsOverride && groupsOverride) {
      const sorted = [...groupsOverride].sort((a, b) => {
        const ta = a.parsedMeetingTime?.getTime() ?? Infinity;
        const tb = b.parsedMeetingTime?.getTime() ?? Infinity;
        return ta - tb;
      });
      setGroups(sorted);
      setIsLoading(false);
      onLoadingChange?.(false);
      onGroupsChange?.(sorted);
      return;
    }
  }, [hasGroupsOverride, groupsOverride, onGroupsChange, onLoadingChange]);

  useEffect(() => {
    if (hasGroupsOverride) return;
    const fetchGroups = async () => {
      setIsLoading(true);
      onLoadingChange?.(true);
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
        // matchType에 따라 API 파라미터: 일반=type=normal, 랭크=type=rank, 이벤트=type=event (타입별 목록 분리)
        const effectiveType = matchType === 'rank' ? 'rank' : matchType === 'event' ? 'event' : 'normal';
        queryParams.append('type', effectiveType);
        if (onlyRanker) {
          queryParams.append('onlyRanker', 'true');
        }
        if (gender) {
          queryParams.append('gender', gender);
        }
        if (includeCompleted) {
          queryParams.append('includeCompleted', 'true');
        }
        if (filterDate) {
          queryParams.append('filterDate', filterDate);
        }
        if (sportFilterValues && Object.keys(sportFilterValues).length > 0) {
          const filterObj: Record<string, string | string[]> = {};
          for (const [k, v] of Object.entries(sportFilterValues)) {
            if (v !== undefined && v !== null && v !== '' && (Array.isArray(v) ? v.length > 0 : true)) {
              filterObj[k] = v;
            }
          }
          if (Object.keys(filterObj).length > 0) {
            queryParams.append('sportSpecificFilter', JSON.stringify(filterObj));
          }
        }
        if (mapBounds) {
          queryParams.append('latMin', String(mapBounds.latMin));
          queryParams.append('latMax', String(mapBounds.latMax));
          queryParams.append('lngMin', String(mapBounds.lngMin));
          queryParams.append('lngMax', String(mapBounds.lngMax));
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
                 
                 // meetingTime 파싱 (다양한 형식 지원). meetingTime 없으면 meetingDateTime 폴백 (플레이어 구하기 등)
                 let parsedMeetingTime: Date | null = null;
                 const rawMeetingTime = group.meetingTime?.trim() || null;
                 const rawMeetingDateTime = group.meetingDateTime;
                 const effectiveMeetingTime = rawMeetingTime || (rawMeetingDateTime ? (() => {
                   const d = new Date(rawMeetingDateTime);
                   return !isNaN(d.getTime()) ? d.toISOString().slice(0, 16).replace('T', ' ') : null;
                 })() : null);
                 if (effectiveMeetingTime) {
                   const meetingTimeStr = effectiveMeetingTime;
                   if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(meetingTimeStr)) {
                     parsedMeetingTime = new Date(meetingTimeStr.slice(0, 16));
                   } else if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(meetingTimeStr)) {
                     const startPart = meetingTimeStr.split('~')[0]?.trim() || meetingTimeStr;
                     parsedMeetingTime = new Date(startPart.replace(' ', 'T') + ':00');
                   } else if (/^\d{4}-\d{2}-\d{2}$/.test(meetingTimeStr)) {
                     parsedMeetingTime = new Date(meetingTimeStr + 'T00:00:00');
                   } else {
                     const dateMatch = meetingTimeStr.match(/^\d{4}-\d{2}-\d{2}/);
                     parsedMeetingTime = dateMatch ? new Date(dateMatch[0] + 'T00:00:00') : new Date(meetingTimeStr);
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
                 
                 const groupType = group.type || 'normal';
                 const isFull = group.isClosed ?? (group.maxParticipants != null && group.participantCount >= group.maxParticipants);
                 const creator = (group as GroupResponse & { creator?: { id: number; nickname?: string; tag?: string | null; mannerScore?: number; noShowCount?: number } }).creator;
                 return {
                   id: group.id,
                   name: group.name,
                   location: group.location,
                   coordinates: [parseFloat(group.latitude.toString()), parseFloat(group.longitude.toString())] as [number, number],
                   memberCount: group.participantCount,
                   participantCountExcludingCreator: group.participantCountExcludingCreator,
                   maxParticipants: group.maxParticipants || undefined,
                   category: group.category,
                   description: group.description || undefined,
                   meetingTime: effectiveMeetingTime || undefined,
                   contact: group.contact || undefined,
                   equipment: group.equipment || [],
                   type: groupType,
                   isFull,
                   hasFee: group.hasFee,
                   feeAmount: group.feeAmount ?? undefined,
                   parsedMeetingTime: parsedMeetingTime && !isNaN(parsedMeetingTime.getTime()) ? parsedMeetingTime : undefined,
                   badges: {
                     isNew,
                     isHot,
                     hasRanker,
                     isUrgent,
                     isToday,
                   },
                   creator: creator ? {
                     id: creator.id,
                     nickname: creator.nickname ?? '',
                     tag: creator.tag ?? null,
                     mannerScore: creator.mannerScore ?? 80,
                     noShowCount: creator.noShowCount ?? 0,
                   } : undefined,
                   boostedUntil: (group as GroupResponse & { boostedUntil?: string | null }).boostedUntil ?? null,
                   isBoosted: (group as GroupResponse & { isBoosted?: boolean }).isBoosted ?? false,
                   depositAmount: (group as GroupResponse & { depositAmount?: number | null }).depositAmount ?? null,
                 } as SelectedGroup;
               });

               // ⭐ 날짜 필터링: filterDate 있으면 해당 날짜만, 없으면 오늘~1주일 이내
               const today = new Date();
               today.setHours(0, 0, 0, 0); // 오늘 00:00:00
               
               const oneWeekLater = new Date(today);
               oneWeekLater.setDate(oneWeekLater.getDate() + 7); // 1주일 후 00:00:00
               
               const filterDateOnly = filterDate ? (() => {
                 const [y, m, d] = filterDate.split('-').map(Number);
                 const fd = new Date(y, (m ?? 1) - 1, d ?? 1);
                 fd.setHours(0, 0, 0, 0);
                 return fd;
               })() : null;
               
               mappedGroups = mappedGroups.filter((group) => {
                 // 일정이 없으면 표시하지 않음 (parsedMeetingTime 있으면 사용)
                 if (!group.meetingTime && !group.parsedMeetingTime) return false;
                 
                 // meetingTime 또는 parsedMeetingTime으로 날짜 비교
                 let meetingDate: Date | null = group.parsedMeetingTime ?? null;
                 if (!meetingDate && group.meetingTime) {
                   const meetingTimeStr = group.meetingTime.trim();
                   if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(meetingTimeStr)) {
                     meetingDate = new Date(meetingTimeStr.slice(0, 16));
                   } else if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(meetingTimeStr)) {
                     const startPart = meetingTimeStr.split('~')[0]?.trim() || meetingTimeStr;
                     meetingDate = new Date(startPart.replace(' ', 'T') + ':00');
                   } else if (/^\d{4}-\d{2}-\d{2}$/.test(meetingTimeStr)) {
                     meetingDate = new Date(meetingTimeStr + 'T00:00:00');
                   } else {
                     const dateMatch = meetingTimeStr.match(/^\d{4}-\d{2}-\d{2}/);
                     meetingDate = dateMatch ? new Date(dateMatch[0] + 'T00:00:00') : new Date(meetingTimeStr);
                   }
                 }
                 
                 if (!meetingDate || isNaN(meetingDate.getTime())) {
                   return false; // 파싱 실패 시 표시하지 않음
                 }
                 
                 // 날짜만 비교 (시간 제외)
                 const meetingDateOnly = new Date(meetingDate);
                 meetingDateOnly.setHours(0, 0, 0, 0);
                 
                 // 오늘/내일 등 특정 날짜 선택 시: 해당 날짜의 매치만 표시
                 if (filterDateOnly) {
                   if (meetingDateOnly.getTime() !== filterDateOnly.getTime()) return false;
                 } else {
                   // 전체 선택 시: 오늘부터 1주일 이내만
                   if (meetingDateOnly < today || meetingDateOnly >= oneWeekLater) {
                     return false;
                   }
                 }
                 
                 // 요일 필터링: 선택된 요일이 있으면 해당 요일만 표시
                 if (selectedDays.length > 0) {
                   const dayOfWeek = meetingDate.getDay(); // 0=일요일, 1=월요일, ..., 6=토요일
                   return selectedDays.includes(dayOfWeek);
                 }
                 
                 return true;
               });

               // ⭐ 지역 필터링: bounds 검색이 아닐 때만 (bounds 사용 시 API가 이미 필터링함)
               if (!mapBounds && selectedRegion && selectedRegion !== '전체') {
                 mappedGroups = mappedGroups.filter((group) =>
                   addressMatchesRegion(group.location, selectedRegion)
                 );
               }

               // ⭐ 플레이어 모드: 인원 미달 매치만 (게시자 1명 포함해 current < max)
               if (mercenaryOnly) {
                 mappedGroups = mappedGroups.filter((group) => {
                   const max = group.maxParticipants ?? 0;
                   const others = group.participantCountExcludingCreator ?? Math.max(0, (group.memberCount ?? group.participantCount ?? 0) - 1);
                   const current = 1 + others;
                   return max > 0 && current < max;
                 });
               }

               // (활동시간 필터는 아래 useMemo에서 적용 — 토글 시 재계산만 하면 되도록)

               // ⭐ 정렬: 내 주소지와 가까운 순, 동일 거리면 일정 빠른 순
               mappedGroups.sort((a, b) => {
                 if (userCoords && userCoords.length === 2) {
                   const [userLat, userLon] = userCoords;
                   const distA = getDistanceKm(userLat, userLon, a.coordinates[0], a.coordinates[1]);
                   const distB = getDistanceKm(userLat, userLon, b.coordinates[0], b.coordinates[1]);
                   if (distA !== distB) return distA - distB;
                 }
                 // 거리 동일 또는 userCoords 없음: 일정 기준 정렬
                 if (a.parsedMeetingTime && b.parsedMeetingTime) {
                   return a.parsedMeetingTime.getTime() - b.parsedMeetingTime.getTime();
                 }
                 if (a.parsedMeetingTime && !b.parsedMeetingTime) return -1;
                 if (!a.parsedMeetingTime && b.parsedMeetingTime) return 1;
                 return 0;
               });

               // 플레이어 모드 + 전체 종목 조회 시: 지역 필터된 목록의 종목별 개수 전달 (지역별 정렬용)
               if (mercenaryOnly && onCategoryCountsChange && (selectedCategory === null || selectedCategory === '전체')) {
                 const counts: Record<string, number> = {};
                 for (const g of mappedGroups) {
                   const cat = g.category || '전체';
                   counts[cat] = (counts[cat] ?? 0) + 1;
                 }
                 onCategoryCountsChange(counts);
               }

        setGroups(mappedGroups);
        onGroupsChange?.(mappedGroups);
      } catch (err) {
        const listLabel = mercenaryOnly ? '플레이어 구하기 목록' : '매치 목록';
        console.error(`${listLabel} 조회 실패:`, err);
        const msg = err instanceof Error ? err.message : '';
        if (matchType === 'rank' || matchType === 'event') {
          setError(null);
          setGroups([]);
          onGroupsChange?.([]);
        } else {
          setError(msg.includes('Internal') || msg.includes('500') ? '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' : (msg || `${listLabel}을 불러오는데 실패했습니다.`));
          setGroups([]);
          onGroupsChange?.([]);
        }
      } finally {
        setIsLoading(false);
        onLoadingChange?.(false);
      }
    };

    fetchGroups();
  }, [selectedCategory, searchQuery, sportFilterKey, selectedRegion, selectedDaysKey, filterDate, hideClosed, onlyRanker, gender, includeCompleted, refreshTrigger, matchType, userCoords, hasGroupsOverride, mapBoundsKey]);

  if (isLoading) {
    const loadingMessage = mercenaryOnly ? '플레이어 구하기 목록을 불러오는 중...' : '매치 목록을 불러오는 중...';
    return (
      <div className="p-4 relative min-h-[200px]">
        <LoadingSpinner message={loadingMessage} />
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
        {displayedGroups.length > 0 ? (
          displayedGroups.map((group) => (
            <button
              onClick={() => onGroupClick(group)}
              className="w-full text-left block p-2 md:p-3 bg-[var(--color-bg-card)] rounded-lg md:rounded-xl border border-[var(--color-border-card)] border-l-4 transition-all duration-300 hover:scale-[1.02] hover:border-[var(--color-blue-primary)] cursor-pointer"
              key={group.id}
              style={{
                borderLeftColor: SPORT_POINT_COLORS[group.category ?? ''] ?? SPORT_POINT_COLORS['전체'],
              }}
            >
              <div className="mb-1.5 gap-1.5">
                {/* 제목과 배지 */}
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <div className="relative min-w-0 flex-1">
                    <GroupTitle title={group.name} groupId={group.id} />
                  </div>
                  {/* 배지 표시 */}
                  <div className="flex items-center gap-1.5 flex-wrap flex-shrink-0">
                    {group.isBoosted && (
                      <span className="px-2 py-0.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-xs font-bold rounded-full flex items-center gap-1 shadow-md" title="슈퍼 노출 중">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                        슈퍼 노출
                      </span>
                    )}
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
                    {group.badges?.isUrgent && !(group.maxParticipants && (() => {
                      const opt = optimisticParticipantCount?.groupId === group.id ? optimisticParticipantCount.participantCount : null;
                      const raw = opt ?? group.memberCount ?? group.participantCount ?? 0;
                      const max = group.maxParticipants ?? 0;
                      const others = mercenaryOnly ? (group.participantCountExcludingCreator ?? Math.max(0, raw - 1)) : raw;
                      return mercenaryOnly ? (1 + others) >= max : raw >= max;
                    })()) && (
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
                {/* 매치 일시 (참가비 있을 때만 포인트 표시) */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--color-text-secondary)] mb-1.5">
                  {formatMeetingTimeForList(group.meetingTime, group.parsedMeetingTime) && (
                    <span className="font-bold text-[var(--color-text-primary)]">
                      일시: {formatMeetingTimeForList(group.meetingTime, group.parsedMeetingTime)}
                    </span>
                  )}
                  {group.hasFee && group.feeAmount != null && group.feeAmount > 0 && (
                    <span className="font-bold text-[var(--color-text-primary)] flex items-center gap-1">
                      <CurrencyDollarIcon className="w-3.5 h-3.5 text-[var(--color-blue-primary)]" aria-hidden />
                      포인트: {Number(group.feeAmount).toLocaleString()}P
                    </span>
                  )}
                </div>
              </div>
              {/* 매치장 신뢰도·노쇼 배지 (매너 등급 아이콘: 그린/옐로/레드) */}
              {group.creator != null && (
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  {(() => {
                    const mannerConfig = getMannerGradeConfig(group.creator.mannerScore ?? 80);
                    return (
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${mannerConfig.badgeClass}`}
                        title={`신뢰도: ${group.creator.mannerScore ?? 80}점 · ${mannerConfig.label}`}
                      >
                        <span aria-hidden>{mannerConfig.icon}</span>
                        <span className="badge-text-contrast">{group.creator.mannerScore ?? 80}점</span>
                      </span>
                    );
                  })()}
                  {(group.creator.noShowCount ?? 0) > 0 && (
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-700 dark:text-red-300 border border-red-500/40"
                      title="노쇼 횟수"
                    >
                      ⚠ 노쇼 {(group.creator.noShowCount ?? 0)}회
                    </span>
                  )}
                </div>
              )}
              <div className="flex flex-col md:flex-row md:items-center gap-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  {(() => {
                    const optimistic = optimisticParticipantCount?.groupId === group.id
                      ? optimisticParticipantCount.participantCount
                      : null;
                    const rawCount = optimistic ?? group.memberCount ?? group.participantCount ?? 0;
                    const rawMax = group.maxParticipants;
                    // 플레이어 구하기: 게시자를 1명으로 포함해 표시 (1/4명)
                    const othersCount = mercenaryOnly
                      ? (group.participantCountExcludingCreator != null
                          ? (optimistic ?? group.participantCountExcludingCreator)
                          : Math.max(0, rawCount - 1))
                      : null;
                    const displayCount = mercenaryOnly && othersCount != null
                      ? 1 + othersCount
                      : rawCount;
                    const displayMax = rawMax;
                    const pct = displayMax != null && displayMax > 0 ? Math.min(100, (displayCount / displayMax) * 100) : 0;
                    const showFull = rawMax != null && (mercenaryOnly ? displayCount >= displayMax : rawCount >= rawMax);
                    return (
                      <>
                        <p className="text-xs md:text-sm text-[var(--color-text-secondary)] flex items-center gap-2">
                          <span>참가자: <span className="font-semibold text-[var(--color-text-primary)]">{displayCount}{displayMax != null ? `/${displayMax}` : ''}명</span></span>
                          {displayMax != null && displayMax > 0 && (
                            <span className="flex items-center gap-1.5 min-w-[64px]">
                              <span className="inline-block h-1.5 flex-1 min-w-[32px] max-w-[48px] rounded-full bg-[var(--color-bg-secondary)] overflow-hidden" aria-hidden>
                                <span
                                  className="block h-full rounded-full bg-[var(--color-blue-primary)] transition-all duration-300"
                                  style={{ width: `${pct}%` }}
                                />
                              </span>
                            </span>
                          )}
                        </p>
                        {showFull && (
                          <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs font-semibold rounded-full">
                            인원마감
                          </span>
                        )}
                      </>
                    );
                  })()}
                </div>
                {(() => {
                  const chipStyle = SPORT_CHIP_STYLES[group.category] ?? SPORT_CHIP_STYLES['전체'];
                  return (
                    <span className={`badge-text-contrast px-1.5 py-0.5 text-xs font-semibold rounded-full self-start md:self-auto border ${chipStyle.bg} ${chipStyle.border}`}>
                      {group.category}
                    </span>
                  );
                })()}
              </div>
            </button>
          ))
        ) : emptyStateSport != null && onEmptyWriteClick ? (
          <MercenaryEmptyState
            selectedSport={emptyStateSport}
            onWriteClick={onEmptyWriteClick}
            showWriteButton={showEmptyWriteButton}
          />
        ) : (
          <p className="p-3 text-[var(--color-text-secondary)] italic text-center text-sm">
            {searchQuery
              ? '검색 결과가 없습니다.'
              : matchType === 'rank'
              ? '랭크 매치가 아직 등록되지 않았습니다.'
              : matchType === 'event'
              ? '이벤트 매치가 아직 등록되지 않았습니다.'
              : '해당 카테고리의 매치가 없습니다.'}
          </p>
        )}
      </div>
    </div>
  );
};

export default GroupList;
