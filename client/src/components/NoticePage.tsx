import React, { useState } from 'react';
import {
  MegaphoneIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

interface Notice {
  id: number;
  type: 'update' | 'info' | 'warning' | 'success';
  title: string;
  content: string;
  date: string;
  version?: string;
  isImportant: boolean;
}

const NoticePage = () => {
  // 샘플 공지사항 데이터 (실제로는 API에서 가져올 데이터)
  const [notices] = useState<Notice[]>([
    {
      id: 1,
      type: 'update',
      title: '앱 버전 1.2.0 업데이트',
      content: `
        새로운 기능이 추가되었습니다:
        - 채팅 기능 개선
        - 지도 검색 성능 향상
        - 버그 수정 및 안정성 개선
        
        업데이트를 위해 최신 버전으로 업데이트해주세요.
      `,
      date: '2024-01-20',
      version: '1.2.0',
      isImportant: true,
    },
    {
      id: 2,
      type: 'info',
      title: '시스템 점검 안내',
      content: '2024년 1월 25일 오전 2시부터 4시까지 시스템 점검이 진행됩니다. 점검 시간 동안 서비스 이용이 제한될 수 있습니다.',
      date: '2024-01-18',
      isImportant: true,
    },
    {
      id: 3,
      type: 'success',
      title: '신규 기능 출시: 실시간 위치 공유',
      content: '이제 모임에서 실시간으로 위치를 공유할 수 있습니다. 모임 상세 페이지에서 위치 공유 버튼을 통해 이용하실 수 있습니다.',
      date: '2024-01-15',
      isImportant: false,
    },
    {
      id: 4,
      type: 'warning',
      title: '보안 업데이트 권장',
      content: '계정 보안을 위해 2단계 인증 설정을 권장합니다. 설정 > 보안에서 2단계 인증을 활성화할 수 있습니다.',
      date: '2024-01-10',
      isImportant: false,
    },
    {
      id: 5,
      type: 'update',
      title: '앱 버전 1.1.5 업데이트',
      content: `
        주요 개선 사항:
        - 알림 기능 개선
        - UI/UX 개선
        - 성능 최적화
      `,
      date: '2024-01-05',
      version: '1.1.5',
      isImportant: false,
    },
  ]);

  const getTypeIcon = (type: Notice['type']) => {
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

  const getTypeColor = (type: Notice['type']) => {
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

  const getTypeLabel = (type: Notice['type']) => {
    switch (type) {
      case 'update':
        return '업데이트';
      case 'info':
        return '안내';
      case 'warning':
        return '주의';
      case 'success':
        return '신규';
      default:
        return '공지';
    }
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
      <div className="flex items-center space-x-3 mb-6">
        <MegaphoneIcon className="w-8 h-8 text-[var(--color-blue-primary)]" />
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)]">공지사항</h1>
      </div>

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
                  {formatDate(notice.date)}
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

      {notices.length === 0 && (
        <div className="text-center py-12">
          <MegaphoneIcon className="w-16 h-16 text-[var(--color-text-secondary)] mx-auto mb-4 opacity-50" />
          <p className="text-[var(--color-text-secondary)]">등록된 공지사항이 없습니다.</p>
        </div>
      )}
    </div>
  );
};

export default NoticePage;


