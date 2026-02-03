import React from 'react';

/**
 * 앱 전체 사용 가이드 페이지. (내용 추후 추가)
 */
const GuidePage = () => {
  return (
    <div className="flex-1 w-full p-4 md:p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] mb-4">
        가이드
      </h1>
      <p className="text-[var(--color-text-secondary)]">
        앱 사용 방법에 대한 설명이 여기에 추가됩니다.
      </p>
    </div>
  );
};

export default GuidePage;
