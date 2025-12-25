import React, { useState } from 'react';
import {
  CalendarDaysIcon,
  MapPinIcon,
  UserGroupIcon,
  ClockIcon,
  TrophyIcon,
  FireIcon,
} from '@heroicons/react/24/outline';
import { SPORTS_CATEGORIES } from '../constants/sports';

interface EventMatch {
  id: number;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  participants: number;
  maxParticipants: number;
  category: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  prize?: string;
  isHot?: boolean;
}

const EventMatchPage = () => {
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'upcoming' | 'ongoing' | 'completed'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');

  // 샘플 데이터
  const events: EventMatch[] = [
    {
      id: 1,
      title: '2024 강남구 배드민턴 대회',
      description: '강남구 배드민턴 동호회 회원들을 위한 토너먼트 대회입니다.',
      date: '2024-02-15',
      time: '09:00 - 18:00',
      location: '서울특별시 강남구 스포츠센터',
      participants: 32,
      maxParticipants: 64,
      category: '배드민턴',
      status: 'upcoming',
      prize: '우승상금 100만원',
      isHot: true,
    },
    {
      id: 2,
      title: '서울 마라톤 펀런',
      description: '함께 달리며 즐기는 마라톤 펀런 이벤트',
      date: '2024-02-10',
      time: '06:00 - 10:00',
      location: '서울한강공원',
      participants: 128,
      maxParticipants: 200,
      category: '러닝',
      status: 'upcoming',
      prize: '완주 기념품',
      isHot: true,
    },
    {
      id: 3,
      title: '풋살 리그전',
      description: '8개 팀이 참가하는 풋살 리그전',
      date: '2024-02-08',
      time: '14:00 - 20:00',
      location: '올림픽공원 풋살장',
      participants: 16,
      maxParticipants: 16,
      category: '축구',
      status: 'ongoing',
      prize: '우승 트로피',
    },
    {
      id: 4,
      title: '테니스 친선경기',
      description: '테니스 동호회 친선경기',
      date: '2024-02-05',
      time: '10:00 - 16:00',
      location: '서초 테니스 클럽',
      participants: 24,
      maxParticipants: 32,
      category: '테니스',
      status: 'completed',
    },
    {
      id: 5,
      title: '농구 3on3 대회',
      description: '야외 농구장에서 진행되는 3on3 토너먼트',
      date: '2024-02-20',
      time: '13:00 - 18:00',
      location: '잠실 체육공원',
      participants: 48,
      maxParticipants: 64,
      category: '농구',
      status: 'upcoming',
      prize: '우승팀 상금 50만원',
    },
  ];

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

  const handleJoinEvent = (eventId: number) => {
    // TODO: 이벤트 참가 API 호출
    console.log('이벤트 참가:', eventId);
    alert('이벤트에 참가 신청되었습니다.');
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto w-full pb-12">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] mb-2">
          이벤트 매치
        </h1>
        <p className="text-[var(--color-text-secondary)]">
          다양한 스포츠 이벤트와 매치에 참여하세요
        </p>
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
      {filteredEvents.length === 0 ? (
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
                          {event.title}
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
                      <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                        {event.description}
                      </p>
                    </div>
                  </div>

                  {/* 상세 정보 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                      <CalendarDaysIcon className="w-5 h-5" />
                      <span>{new Date(event.date).toLocaleDateString('ko-KR')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                      <ClockIcon className="w-5 h-5" />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                      <MapPinIcon className="w-5 h-5" />
                      <span>{event.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                      <UserGroupIcon className="w-5 h-5" />
                      <span>
                        {event.participants} / {event.maxParticipants}명
                      </span>
                    </div>
                    {event.prize && (
                      <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                        <TrophyIcon className="w-5 h-5 text-yellow-500" />
                        <span className="font-semibold text-[var(--color-text-primary)]">
                          {event.prize}
                        </span>
                      </div>
                    )}
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

