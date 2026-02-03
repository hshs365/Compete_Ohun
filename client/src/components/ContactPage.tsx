import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import { showSuccess, showError } from '../utils/swal';

const INQUIRY_TYPES = [
  '버그발생신고',
  '업체 제휴 문의',
  '기능 제안',
  '서비스 이용 문의',
  '결제/환불 문의',
  '기타',
] as const;

const ContactPage = () => {
  const { user } = useAuth();
  const [inquiryType, setInquiryType] = useState<(typeof INQUIRY_TYPES)[number]>('서비스 이용 문의');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitterEmail, setSubmitterEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  useEffect(() => {
    if (user) {
      api
        .get<{ email?: string | null }>('/api/auth/me')
        .then((data) => {
          if (data?.email) {
            setSubmitterEmail(data.email);
          }
        })
        .catch(() => {})
        .finally(() => setIsLoadingUser(false));
    } else {
      setIsLoadingUser(false);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = submitterEmail.trim();
    if (!email) {
      await showError('이메일을 입력해주세요.', '입력 필요');
      return;
    }
    if (!title.trim()) {
      await showError('제목을 입력해주세요.', '입력 필요');
      return;
    }
    if (!content.trim()) {
      await showError('내용을 입력해주세요.', '입력 필요');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post('/api/contact', {
        type: inquiryType,
        title: title.trim(),
        content: content.trim(),
        submitterEmail: email,
      });
      await showSuccess('문의가 접수되었습니다. 확인 후 연락드리겠습니다.', '문의 접수');
      setTitle('');
      setContent('');
    } catch (err: any) {
      await showError(err?.message || '문의 접수에 실패했습니다. 다시 시도해주세요.', '접수 실패');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto w-full">
      <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] mb-4 md:mb-6">
        문의하기
      </h1>
      <div className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-card)] p-4 md:p-6">
        <p className="text-[var(--color-text-secondary)] mb-6">
          궁금한 점이 있으시면 다음 양식을 통해 문의해주세요. 신고자 계정의 이메일로 접수됩니다.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 문의 종류 */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
              문의 종류
            </label>
            <select
              value={inquiryType}
              onChange={(e) => setInquiryType(e.target.value as (typeof INQUIRY_TYPES)[number])}
              className="w-full px-4 py-2.5 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
            >
              {INQUIRY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* 이메일 (로그인 시 계정 이메일로 자동 채움) */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
              접수 이메일 <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={submitterEmail}
              onChange={(e) => setSubmitterEmail(e.target.value)}
              placeholder={user ? '계정 이메일로 접수됩니다' : 'your@email.com'}
              readOnly={!!user && !!submitterEmail}
              disabled={isLoadingUser}
              className="w-full px-4 py-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)] disabled:opacity-70 disabled:cursor-not-allowed"
            />
            {user && (
              <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                로그인한 계정의 이메일로 접수됩니다.
              </p>
            )}
          </div>

          {/* 제목 */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
              제목 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="문의 제목을 입력하세요"
              maxLength={200}
              className="w-full px-4 py-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
            />
          </div>

          {/* 내용 */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
              내용 <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="문의 내용을 상세히 입력해주세요"
              className="w-full px-4 py-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)] resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isLoadingUser}
            className="w-full md:w-auto px-6 py-3 bg-[var(--color-blue-primary)] text-white rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '접수 중...' : '문의하기'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ContactPage;
