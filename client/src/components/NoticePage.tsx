import React, { useState, useEffect } from 'react';
import {
  MegaphoneIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  SparklesIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import { showSuccess, showError } from '../utils/swal';

type NoticeType = 'update' | 'info' | 'warning' | 'success';

interface Notice {
  id: number;
  type: NoticeType;
  title: string;
  content: string;
  createdAt: string;
  version?: string | null;
  isImportant: boolean;
}

const NOTICE_TYPES: { value: NoticeType; label: string }[] = [
  { value: 'update', label: '업데이트' },
  { value: 'info', label: '안내' },
  { value: 'warning', label: '주의' },
  { value: 'success', label: '신규' },
];

const NoticePage = () => {
  const { user } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<{ isAdmin?: boolean } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    type: 'info' as NoticeType,
    title: '',
    content: '',
    version: '',
    isImportant: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchNotices = async () => {
    try {
      const list = await api.get<Notice[]>('/api/notices');
      setNotices(Array.isArray(list) ? list : []);
    } catch {
      setNotices([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  useEffect(() => {
    if (!user) return;
    api
      .get<{ isAdmin?: boolean }>('/api/auth/me')
      .then(setUserProfile)
      .catch(() => setUserProfile(null));
  }, [user]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.title.trim()) {
      showError('제목을 입력해주세요.');
      return;
    }
    if (!createForm.content.trim()) {
      showError('내용을 입력해주세요.');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post('/api/notices', {
        type: createForm.type,
        title: createForm.title.trim(),
        content: createForm.content.trim(),
        version: createForm.version.trim() || undefined,
        isImportant: createForm.isImportant,
      });
      showSuccess('공지사항이 등록되었습니다.');
      setShowCreateModal(false);
      setCreateForm({ type: 'info', title: '', content: '', version: '', isImportant: false });
      fetchNotices();
    } catch (err: any) {
      showError(err?.message || '등록에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTypeIcon = (type: NoticeType) => {
    switch (type) {
      case 'update':
        return SparklesIcon;
      case 'info':
        return InformationCircleIcon;
      case 'warning':
        return ExclamationTriangleIcon;
      case 'success':
        return CheckCircleIcon;
      default:
        return MegaphoneIcon;
    }
  };

  const getTypeColor = (type: NoticeType) => {
    switch (type) {
      case 'update':
        return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900 dark:text-purple-300 dark:border-purple-700';
      case 'info':
        return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700';
      case 'warning':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-300 dark:border-yellow-700';
      case 'success':
        return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-700';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
    }
  };

  const getTypeLabel = (type: NoticeType) => {
    return NOTICE_TYPES.find((t) => t.value === type)?.label ?? '공지';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto w-full space-y-6 pb-12">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center space-x-3">
          <MegaphoneIcon className="w-8 h-8 text-[var(--color-blue-primary)]" />
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)]">공지사항</h1>
        </div>
        {userProfile?.isAdmin && (
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-blue-primary)] text-white font-medium hover:opacity-90 transition-opacity"
          >
            <PlusIcon className="w-5 h-5" />
            공지사항 등록
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-[var(--color-text-secondary)]">불러오는 중...</div>
      ) : (
        <div className="space-y-4">
          {notices.map((notice) => {
            const Icon = getTypeIcon(notice.type);
            return (
              <div
                key={notice.id}
                className={`bg-[var(--color-bg-card)] rounded-xl border ${
                  notice.isImportant
                    ? 'border-[var(--color-blue-primary)] border-2 shadow-lg'
                    : 'border-[var(--color-border-card)]'
                } p-4 md:p-6 hover:shadow-md transition-shadow`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className={`p-2 rounded-lg ${getTypeColor(notice.type)}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getTypeColor(notice.type)}`}>
                          {getTypeLabel(notice.type)}
                        </span>
                        {notice.isImportant && (
                          <span className="px-2 py-1 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 rounded-full text-xs font-semibold">
                            중요
                          </span>
                        )}
                        {notice.version && (
                          <span className="px-2 py-1 bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] rounded-full text-xs font-semibold">
                            v{notice.version}
                          </span>
                        )}
                      </div>
                      <h2 className="text-lg md:text-xl font-bold text-[var(--color-text-primary)]">
                        {notice.title}
                      </h2>
                    </div>
                  </div>
                  <span className="text-sm text-[var(--color-text-secondary)] whitespace-nowrap ml-4">
                    {formatDate(notice.createdAt)}
                  </span>
                </div>
                <div className="mt-4">
                  <p className="text-[var(--color-text-secondary)] whitespace-pre-line leading-relaxed">
                    {notice.content.trim()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && notices.length === 0 && (
        <div className="text-center py-12">
          <MegaphoneIcon className="w-16 h-16 text-[var(--color-text-secondary)] mx-auto mb-4 opacity-50" />
          <p className="text-[var(--color-text-secondary)]">등록된 공지사항이 없습니다.</p>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => !isSubmitting && setShowCreateModal(false)}>
          <div
            className="bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border-card)] shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-4">공지사항 등록</h2>
              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">유형</label>
                  <select
                    value={createForm.type}
                    onChange={(e) => setCreateForm((f) => ({ ...f, type: e.target.value as NoticeType }))}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--color-border-card)] bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)]"
                  >
                    {NOTICE_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">제목 *</label>
                  <input
                    type="text"
                    value={createForm.title}
                    onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value }))}
                    maxLength={200}
                    placeholder="제목을 입력하세요"
                    className="w-full px-3 py-2 rounded-lg border border-[var(--color-border-card)] bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">내용 *</label>
                  <textarea
                    value={createForm.content}
                    onChange={(e) => setCreateForm((f) => ({ ...f, content: e.target.value }))}
                    rows={6}
                    placeholder="내용을 입력하세요"
                    className="w-full px-3 py-2 rounded-lg border border-[var(--color-border-card)] bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">버전 (선택)</label>
                  <input
                    type="text"
                    value={createForm.version}
                    onChange={(e) => setCreateForm((f) => ({ ...f, version: e.target.value }))}
                    maxLength={20}
                    placeholder="예: 1.2.0"
                    className="w-full px-3 py-2 rounded-lg border border-[var(--color-border-card)] bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)]"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="create-notice-important"
                    checked={createForm.isImportant}
                    onChange={(e) => setCreateForm((f) => ({ ...f, isImportant: e.target.checked }))}
                    className="rounded border-[var(--color-border-card)]"
                  />
                  <label htmlFor="create-notice-important" className="text-sm text-[var(--color-text-primary)]">
                    중요 공지로 표시
                  </label>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => !isSubmitting && setShowCreateModal(false)}
                    className="px-4 py-2 rounded-lg border border-[var(--color-border-card)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-lg bg-[var(--color-blue-primary)] text-white font-medium disabled:opacity-50"
                  >
                    {isSubmitting ? '등록 중...' : '등록'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NoticePage;
