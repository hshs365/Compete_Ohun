import React, { useState, useEffect } from 'react';
import { XMarkIcon, BellIcon } from '@heroicons/react/24/outline';
import { api } from '../utils/api';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'group_join' | 'group_leave' | 'group_closed' | 'group_deleted' | 'facility_reservation' | 'system';
  isRead: boolean;
  createdAt: string;
  metadata?: Record<string, any>;
}

interface NotificationPanelProps {
  notifications?: Notification[];
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ notifications: propNotifications }) => {
  const [notifications, setNotifications] = useState<Notification[]>(propNotifications || []);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // 백엔드에서 알림 가져오기 (읽은 알림 포함)
  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      // limit을 늘려서 더 많은 알림을 가져오고, 읽은 알림도 포함
      const response = await api.get<{ notifications: Notification[]; total: number }>('/api/notifications?limit=100');
      setNotifications(response.notifications || []);
    } catch (error) {
      console.error('알림 가져오기 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 읽지 않은 알림 개수 가져오기
  const fetchUnreadCount = async () => {
    try {
      const response = await api.get<{ count: number }>('/api/notifications/unread-count');
      setUnreadCount(response.count || 0);
    } catch (error) {
      console.error('읽지 않은 알림 개수 가져오기 실패:', error);
    }
  };

  // 알림 읽음 처리
  const markAsRead = async (notificationId: number) => {
    try {
      await api.patch(`/api/notifications/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('알림 읽음 처리 실패:', error);
    }
  };

  // 초기 로드 및 주기적 업데이트
  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();

    // 10초마다 알림 업데이트 (더 빠른 반응을 위해)
    const interval = setInterval(() => {
      fetchNotifications();
      fetchUnreadCount();
    }, 10000);

    // 커스텀 이벤트 리스너: 모임 참가 등으로 인한 알림 즉시 업데이트
    const handleNotificationUpdate = () => {
      fetchNotifications();
      fetchUnreadCount();
    };

    window.addEventListener('notificationUpdate', handleNotificationUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('notificationUpdate', handleNotificationUpdate);
    };
  }, []);

  // prop으로 전달된 알림이 변경되면 업데이트
  useEffect(() => {
    if (propNotifications) {
      setNotifications(propNotifications);
    }
  }, [propNotifications]);

  const removeNotification = async (id: number) => {
    try {
      await api.delete(`/api/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      // 읽지 않은 알림이었다면 개수 감소
      const notification = notifications.find((n) => n.id === id);
      if (notification && !notification.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('알림 삭제 실패:', error);
    }
  };

  const hasNotifications = notifications.length > 0;

  const getNotificationStyles = (type: Notification['type']) => {
    const styles = {
      group_join: {
        bg: 'bg-green-500 dark:bg-green-600',
        border: 'border-green-600 dark:border-green-700',
        text: 'text-white',
      },
      group_leave: {
        bg: 'bg-yellow-500 dark:bg-yellow-600',
        border: 'border-yellow-600 dark:border-yellow-700',
        text: 'text-white',
      },
      group_closed: {
        bg: 'bg-orange-500 dark:bg-orange-600',
        border: 'border-orange-600 dark:border-orange-700',
        text: 'text-white',
      },
      group_deleted: {
        bg: 'bg-red-500 dark:bg-red-600',
        border: 'border-red-600 dark:border-red-700',
        text: 'text-white',
      },
      facility_reservation: {
        bg: 'bg-blue-500 dark:bg-blue-600',
        border: 'border-blue-600 dark:border-blue-700',
        text: 'text-white',
      },
      system: {
        bg: 'bg-gray-500 dark:bg-gray-600',
        border: 'border-gray-600 dark:border-gray-700',
        text: 'text-white',
      },
    };
    return styles[type] || styles.system;
  };

  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-6 z-[9999] flex flex-row-reverse items-start md:items-start gap-2 pointer-events-none">
      {/* 알림 아이콘 버튼 - 항상 표시 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="relative w-12 h-12 bg-[var(--color-bg-card)] border border-[var(--color-border-card)] rounded-full shadow-lg flex items-center justify-center hover:bg-[var(--color-bg-secondary)] transition-colors pointer-events-auto"
        aria-label="알림"
      >
        <BellIcon className="w-6 h-6 text-[var(--color-text-primary)]" />
        {/* 읽지 않은 알림이 있을 때 빨간색 배지 */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 rounded-full border-2 border-[var(--color-bg-card)] flex items-center justify-center text-white text-xs font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* 알림 목록 - 확장 시 왼쪽으로 표시 */}
      {isExpanded && (
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-card)] rounded-lg shadow-xl max-h-[600px] overflow-hidden flex flex-col pointer-events-auto max-w-sm w-full md:max-w-md">
          {/* 헤더 */}
          <div className="p-4 border-b border-[var(--color-border-card)] flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">알림</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <span className="text-xs text-[var(--color-text-secondary)]">
                  읽지 않음: {unreadCount}개
                </span>
              )}
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1 hover:bg-[var(--color-bg-secondary)] rounded transition-colors"
                aria-label="알림 패널 닫기"
              >
                <XMarkIcon className="w-5 h-5 text-[var(--color-text-secondary)]" />
              </button>
            </div>
          </div>

          {/* 알림 목록 스크롤 영역 */}
          <div className="overflow-y-auto flex-1">
            {isLoading ? (
              <div className="p-4 text-center">
                <p className="text-sm text-[var(--color-text-secondary)]">알림을 불러오는 중...</p>
              </div>
            ) : notifications.length > 0 ? (
              <div className="flex flex-col">
                {notifications.map((notification) => {
                  const styles = getNotificationStyles(notification.type);
                  return (
                    <div
                      key={notification.id}
                      className={`${styles.bg} ${styles.border} ${styles.text} border-b border-t-0 border-l-0 border-r-0 last:border-b-0 p-4 flex items-start gap-3 hover:opacity-90 transition-opacity cursor-pointer ${!notification.isRead ? 'ring-2 ring-white/50' : 'opacity-80'}`}
                      onClick={() => !notification.isRead && markAsRead(notification.id)}
                    >
                      <BellIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-xs font-semibold opacity-90">{notification.title}</p>
                          {notification.isRead && (
                            <span className="text-xs opacity-60">(읽음)</span>
                          )}
                        </div>
                        <p className="text-sm font-medium break-words">{notification.message}</p>
                        <p className="text-xs opacity-75 mt-1">
                          {new Date(notification.createdAt).toLocaleString('ko-KR', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotification(notification.id);
                        }}
                        className="flex-shrink-0 p-1 hover:bg-black/20 rounded transition-colors"
                        aria-label="알림 삭제"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center">
                <BellIcon className="w-12 h-12 text-[var(--color-text-secondary)] mx-auto mb-3 opacity-50" />
                <p className="text-sm text-[var(--color-text-secondary)]">알림이 없습니다.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;

