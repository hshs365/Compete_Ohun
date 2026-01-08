import React, { useState, useEffect } from 'react';
import {
  CalendarDaysIcon,
  MapPinIcon,
  UserGroupIcon,
  ClockIcon,
  TrophyIcon,
  FireIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { SPORTS_CATEGORIES } from '../constants/sports';
import { showSuccess, showError } from '../utils/swal';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

interface EventMatch {
  id: number;
  name: string;
  description: string | null;
  meetingDateTime: string | null;
  location: string;
  participantCount: number;
  maxParticipants: number | null;
  category: string;
  isCompleted: boolean;
  createdAt: string;
  recentJoinCount?: number;
  hasRanker?: boolean;
  creator?: {
    id: number;
    nickname: string;
    tag: string | null;
  };
}

const EventMatchPage = () => {
  const { user } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'upcoming' | 'ongoing' | 'completed'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const [events, setEvents] = useState<EventMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<{ businessNumberVerified?: boolean } | null>(null);

  // 사용자 프로필 정보 가져오기 (사장님 여부 확인)
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const profile = await api.get<{ businessNumberVerified?: boolean }>('/api/auth/me');
        setUserProfile(profile);
      } catch (error) {
        // 인증되지 않은 사용자는 무시
      }
    };
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  // 이벤트매치 목록 가져오기
  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        const queryParams = new URLSearchParams();
        queryParams.append('type', 'event');
        // 종료된 이벤트매치는 기본적으로 제외
        if (selectedStatus === 'completed') {
          queryParams.append('includeCompleted', 'true');
        }
        if (selectedCategory && selectedCategory !== '전체') {
          queryParams.append('category', selectedCategory);
        }
        queryParams.append('limit', '1000');

        const response = await api.get<{ groups: EventMatch[]; total: number }>(
          `/api/groups?${queryParams.toString()}`
        );

        // 현재 시간 기준으로 상태 계산
        const now = new Date();
        const eventsWithStatus = response.groups.map((event) => {
          let status: 'upcoming' | 'ongoing' | 'completed' = 'upcoming';
          if (event.isCompleted) {
            status = 'completed';
          } else if (event.meetingDateTime) {
            const meetingDate = new Date(event.meetingDateTime);
            if (meetingDate < now) {
              status = 'completed';
            } else {
              // meetingDateTime이 2시간 이내면 ongoing
              const hoursUntil = (meetingDate.getTime() - now.getTime()) / (1000 * 60 * 60);
              if (hoursUntil <= 2 && hoursUntil >= 0) {
                status = 'ongoing';
              }
            }
          }
          return { ...event, status };
        });

        setEvents(eventsWithStatus);
      } catch (error) {
        console.error('이벤트매치 목록 가져오기 실패:', error);
        showError('이벤트매치 목록을 불러오는데 실패했습니다.', '오류');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, [selectedStatus, selectedCategory]);
  const categories = SPORTS_CATEGORIES;

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'upcoming':
        return '예정';
      case 'ongoing':
        return '진행중';
      case 'completed':
        return '종료';
      default:
        return '';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-500';
      case 'ongoing':
        return 'bg-green-500';
      case 'completed':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const filteredEvents = events.filter((event) => {
    const statusMatch = selectedStatus === 'all' || event.status === selectedStatus;
    const categoryMatch = selectedCategory === '전체' || event.category === selectedCategory;
    return statusMatch && categoryMatch;
  });

  const handleJoinEvent = async (eventId: number) => {
    // TODO: 이벤트 참가 API 호출
    console.log('이벤트 참가:', eventId);
    await showSuccess('이벤트에 참가 신청되었습니다.', '이벤트 참가');
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto w-full pb-12">
      <div className="mb-6 md:mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] mb-2">
            이벤트 매치
          </h1>
          <p className="text-[var(--color-text-secondary)]">
            다양한 스포츠 이벤트와 매치에 참여하세요
          </p>
        </div>
        {userProfile?.businessNumberVerified && (
          <button
            onClick={() => {
              // TODO: 이벤트매치 생성 모달 열기
              showInfo('이벤트매치 생성 기능은 준비 중입니다.', '알림');
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-blue-primary)] text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            <PlusIcon className="w-5 h-5" />
            <span>이벤트매치 개최</span>
          </button>
        )}
      </div>

      {/* 필터 */}
      <div className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-card)] p-4 md:p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* 상태 필터 */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
              상태
            </label>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedStatus('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedStatus === 'all'
                    ? 'bg-[var(--color-blue-primary)] text-white'
                    : 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] border border-[var(--color-border-card)] hover:bg-[var(--color-bg-secondary)]'
                }`}
              >
                전체
              </button>
              <button
                onClick={() => setSelectedStatus('upcoming')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedStatus === 'upcoming'
                    ? 'bg-[var(--color-blue-primary)] text-white'
                    : 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] border border-[var(--color-border-card)] hover:bg-[var(--color-bg-secondary)]'
                }`}
              >
                예정
              </button>
              <button
                onClick={() => setSelectedStatus('ongoing')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedStatus === 'ongoing'
                    ? 'bg-[var(--color-blue-primary)] text-white'
                    : 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] border border-[var(--color-border-card)] hover:bg-[var(--color-bg-secondary)]'
                }`}
              >
                진행중
              </button>
              <button
                onClick={() => setSelectedStatus('completed')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedStatus === 'completed'
                    ? 'bg-[var(--color-blue-primary)] text-white'
                    : 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] border border-[var(--color-border-card)] hover:bg-[var(--color-bg-secondary)]'
                }`}
              >
                종료
              </button>
            </div>
          </div>

          {/* 카테고리 필터 */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
              카테고리
            </label>
            <div className="flex gap-2 flex-wrap">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-[var(--color-blue-primary)] text-white'
                      : 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] border border-[var(--color-border-card)] hover:bg-[var(--color-bg-secondary)]'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 이벤트 목록 */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner />
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-card)] p-12 text-center">
          <CalendarDaysIcon className="w-16 h-16 mx-auto text-[var(--color-text-secondary)] mb-4" />
          <p className="text-[var(--color-text-secondary)] text-lg">
            조건에 맞는 이벤트가 없습니다.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEvents.map((event) => (
            <div
              key={event.id}
              className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-card)] p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex flex-col md:flex-row gap-4">
                {/* 이벤트 정보 */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-xl font-bold text-[var(--color-text-primary)]">
                              {event.name}
                            </h3>
                        {event.isHot && (
                          <FireIcon className="w-5 h-5 text-orange-500" />
                        )}
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium text-white ${getStatusColor(event.status)}`}
                        >
                          {getStatusLabel(event.status)}
                        </span>
                        <span className="px-2 py-1 bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] text-xs rounded">
                          {event.category}
                        </span>
                      </div>
                      {event.description && (
                        <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                          {event.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 상세 정보 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    {event.meetingDateTime && (
                      <>
                        <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                          <CalendarDaysIcon className="w-5 h-5" />
                          <span>{new Date(event.meetingDateTime).toLocaleDateString('ko-KR')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                          <ClockIcon className="w-5 h-5" />
                          <span>{new Date(event.meetingDateTime).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </>
                    )}
                    <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                      <MapPinIcon className="w-5 h-5" />
                      <span>{event.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                      <UserGroupIcon className="w-5 h-5" />
                      <span>
                        {event.participantCount} / {event.maxParticipants || '제한없음'}명
                      </span>
                    </div>
                  </div>
                </div>

                {/* 참가 버튼 */}
                {event.status !== 'completed' && (
                  <div className="flex items-center md:items-end">
                    <button
                      onClick={() => handleJoinEvent(event.id)}
                      disabled={event.participants >= event.maxParticipants}
                      className={`w-full md:w-auto px-6 py-3 rounded-lg font-semibold transition-opacity ${
                        event.participants >= event.maxParticipants
                          ? 'bg-gray-400 text-white cursor-not-allowed'
                          : 'bg-[var(--color-blue-primary)] text-white hover:opacity-90'
                      }`}
                    >
                      {event.participants >= event.maxParticipants ? '마감' : '참가하기'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventMatchPage;

