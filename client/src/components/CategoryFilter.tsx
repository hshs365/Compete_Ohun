import React from 'react';
import { SPORTS_CATEGORIES } from '../constants/sports';

interface CategoryFilterProps {
  selectedCategory: string | null;
  setSelectedCategory: (category: string | null) => void;
  selectedCity?: string | null; // 현재 선택된 지역
}

const CategoryFilter = ({ selectedCategory, setSelectedCategory, selectedCity }: CategoryFilterProps) => {
  const categories = SPORTS_CATEGORIES;

  const handleCategoryClick = (category) => {
    if (category === '전체') {
      setSelectedCategory(null);
      // "전체" 선택 시 현재 지역 중심으로 지도 이동을 트리거하기 위해
      // 커스텀 이벤트 발생 (KakaoMapPanel에서 이미 selectedCity를 감지하므로 추가 작업 불필요)
    } else {
      setSelectedCategory(category);
    }
  };

  return (
    <div className="bg-[var(--color-bg-card)] p-2 border-r border-[var(--color-border-card)] flex flex-row md:flex-col items-center md:items-stretch space-x-2 md:space-x-0 md:space-y-2 overflow-x-auto md:overflow-x-visible">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => handleCategoryClick(category)}
          className={`whitespace-nowrap py-2 px-3 md:px-1 md:w-full text-xs rounded-lg transition-colors flex-shrink-0 md:flex-shrink ${
            (selectedCategory === category || (category === '전체' && selectedCategory === null))
              ? 'bg-[var(--color-blue-primary)] text-white'
              : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] hover:opacity-80'
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  );
};

export default CategoryFilter;
