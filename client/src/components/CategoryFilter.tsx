import React from 'react';
import { MAIN_CATEGORIES } from '../constants/sports';

const CategoryFilter = ({ selectedCategory, setSelectedCategory }) => {
  const categories = MAIN_CATEGORIES;

  const handleCategoryClick = (category) => {
    if (category === '전체') {
      setSelectedCategory(null);
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
