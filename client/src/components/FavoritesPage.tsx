import React, { useState } from 'react';
import {
  HeartIcon,
  MapPinIcon,
  UserGroupIcon,
  CalendarIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { showSuccess } from '../utils/swal';

interface FavoriteItem {
  id: number;
  type: 'group' | 'facility' | 'user';
  name: string;
  description?: string;
  location?: string;
  members?: number;
  category?: string;
  addedDate: string;
}

const FavoritesPage = () => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'group' | 'facility' | 'user'>('all');

  // 샘플 데이터
  const favorites: FavoriteItem[] = [
    {
      id: 1,
      type: 'group',
      name: '강남 러닝 크루',
      description: '매일 아침 6시 공원에서 함께 달려요!',
      location: '서울특별시 강남구',
      members: 45,
      category: '러닝',
      addedDate: '2024-01-15',
    },
    {
      id: 2,
      type: 'facility',
      name: '강남 스포츠센터',
      description: '다양한 운동 기구와 시설을 갖춘 프리미엄 체육센터',
      location: '서울특별시 강남구 테헤란로 123',
      addedDate: '2024-01-20',
    },
    {
      id: 3,
      type: 'group',
      name: '홍대 배드민턴 동호회',
      description: '주 3회 배드민턴을 즐기는 동호회입니다',
      location: '서울특별시 마포구',
      members: 32,
      category: '배드민턴',
      addedDate: '2024-01-22',
    },
    {
      id: 4,
      type: 'user',
      name: '운동왕123',
      description: '러닝과 헬스를 즐기는 사용자',
      addedDate: '2024-01-25',
    },
    {
      id: 5,
      type: 'facility',
      name: '올림픽공원 풋살장',
      description: '인조잔디와 조명시설을 갖춘 실내 풋살장',
      location: '서울특별시 송파구',
      addedDate: '2024-02-01',
    },
  ];

  const filteredFavorites = favorites.filter(
    (item) => selectedFilter === 'all' || item.type === selectedFilter
  );

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'group':
        return '모임';
      case 'facility':
        return '시설';
      case 'user':
        return '사용자';
      default:
        return '';
    }
  };

  const handleRemoveFavorite = async (id: number) => {
    // TODO: 즐겨찾기 제거 API 호출
    console.log('즐겨찾기 제거:', id);
    await showSuccess('즐겨찾기에서 제거되었습니다.', '즐겨찾기');
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto w-full pb-12">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] mb-2">
          즐겨찾기
        </h1>
        <p className="text-[var(--color-text-secondary)]">
          관심 있는 모임, 시설, 사용자를 한눈에
        </p>
      </div>

      {/* 필터 */}
      <div className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-card)] p-4 mb-6">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedFilter === 'all'
                ? 'bg-[var(--color-blue-primary)] text-white'
                : 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] border border-[var(--color-border-card)] hover:bg-[var(--color-bg-secondary)]'
            }`}
          >
            전체
          </button>
          <button
            onClick={() => setSelectedFilter('group')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedFilter === 'group'
                ? 'bg-[var(--color-blue-primary)] text-white'
                : 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] border border-[var(--color-border-card)] hover:bg-[var(--color-bg-secondary)]'
            }`}
          >
            모임
          </button>
          <button
            onClick={() => setSelectedFilter('facility')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedFilter === 'facility'
                ? 'bg-[var(--color-blue-primary)] text-white'
                : 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] border border-[var(--color-border-card)] hover:bg-[var(--color-bg-secondary)]'
            }`}
          >
            시설
          </button>
          <button
            onClick={() => setSelectedFilter('user')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedFilter === 'user'
                ? 'bg-[var(--color-blue-primary)] text-white'
                : 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] border border-[var(--color-border-card)] hover:bg-[var(--color-bg-secondary)]'
            }`}
          >
            사용자
          </button>
        </div>
      </div>

      {/* 즐겨찾기 목록 */}
      {filteredFavorites.length === 0 ? (
        <div className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-card)] p-12 text-center">
          <HeartIcon className="w-16 h-16 mx-auto text-[var(--color-text-secondary)] mb-4" />
          <p className="text-[var(--color-text-secondary)] text-lg mb-2">
            즐겨찾기한 항목이 없습니다.
          </p>
          <p className="text-sm text-[var(--color-text-secondary)]">
            관심 있는 모임이나 시설을 즐겨찾기에 추가해보세요!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredFavorites.map((item) => (
            <div
              key={item.id}
              className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-card)] p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-red-500 flex items-center justify-center">
                    <HeartSolidIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
                        {item.name}
                      </h3>
                      <span className="px-2 py-1 bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] text-xs rounded">
                        {getTypeLabel(item.type)}
                      </span>
                    </div>
                    {item.category && (
                      <span className="text-sm text-[var(--color-text-secondary)]">
                        {item.category}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveFavorite(item.id)}
                  className="p-2 hover:bg-[var(--color-bg-secondary)] rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-5 h-5 text-[var(--color-text-secondary)]" />
                </button>
              </div>

              {item.description && (
                <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                  {item.description}
                </p>
              )}

              <div className="space-y-2">
                {item.location && (
                  <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                    <MapPinIcon className="w-4 h-4" />
                    <span>{item.location}</span>
                  </div>
                )}
                {item.members && (
                  <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                    <UserGroupIcon className="w-4 h-4" />
                    <span>멤버 {item.members}명</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                  <CalendarIcon className="w-4 h-4" />
                  <span>추가일: {new Date(item.addedDate).toLocaleDateString('ko-KR')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FavoritesPage;

