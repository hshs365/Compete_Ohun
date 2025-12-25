import React from 'react';

const ContactPage = () => {
  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto w-full">
      <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] mb-4 md:mb-6">문의하기</h1>
      <div className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-card)] p-4 md:p-6">
        <p className="text-[var(--color-text-secondary)] mb-6">궁금한 점이 있으시면 다음 양식을 통해 문의해주세요.</p>
        {/* 나중에 문의 폼 추가 */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">이메일</label>
            <input
              type="email"
              className="w-full px-4 py-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
              placeholder="your@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">제목</label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
              placeholder="문의 제목을 입력하세요"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">내용</label>
            <textarea
              rows={6}
              className="w-full px-4 py-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)] resize-none"
              placeholder="문의 내용을 입력하세요"
            />
          </div>
          <button className="w-full md:w-auto px-6 py-3 bg-[var(--color-blue-primary)] text-white rounded-lg font-semibold hover:opacity-90 transition-opacity">
            문의하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
