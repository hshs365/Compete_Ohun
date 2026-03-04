import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { XMarkIcon, BellIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { api } from '../utils/api';
import { useNotification } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'group_join' | 'group_leave' | 'group_closed' | 'group_deleted' | 'group_cancelled' | 'group_waitlist_spot_open' | 'referee_rank_match_in_region' | 'creator_new_match' | 'mercenary_recruit' | 'new_follower' | 'facility_reservation' | 'system';
  isRead: boolean;
  createdAt: string;
  metadata?: Record<string, any>;
}

interface NotificationPanelProps {
  notifications?: Notification[];
}

const IMPORTANT_TYPES: Notification['type'][] = ['group_cancelled', 'group_deleted'];

function isImportant(type: Notification['type']) {
  return IMPORTANT_TYPES.includes(type);
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ notifications: propNotifications }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDrawerOpen, closeDrawer, setUnreadCount: setContextUnreadCount } = useNotification();
  const [notifications, setNotifications] = useState<Notification[]>(propNotifications || []);
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await api.get<{ notifications: Notification[]; total: number }>('/api/notifications?limit=100');
      setNotifications(response.notifications || []);
    } catch (error) {
      console.error('알림 가져오기 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get<{ count: number }>('/api/notifications/unread-count');
      const count = response.count || 0;
      setContextUnreadCount(count);
    } catch (error) {
      console.error('읽지 않은 알림 개수 가져오기 실패:', error);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      await api.patch(`/api/notifications/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
      setContextUnreadCount((prev: number) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('알림 읽음 처리 실패:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/api/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setContextUnreadCount(0);
    } catch (error) {
      console.error('모두 읽음 처리 실패:', error);
    }
  };

  useEffect(() => {
    // 로그인한 경우에만 알림 API 호출 (401 방지)
    if (!user) {
      setNotifications([]);
      setContextUnreadCount(0);
      return;
    }

    fetchNotifications();
    fetchUnreadCount();

    const interval = setInterval(() => {
      fetchNotifications();
      fetchUnreadCount();
    }, 10000);

    const handleNotificationUpdate = () => {
      fetchNotifications();
      fetchUnreadCount();
    };

    window.addEventListener('notificationUpdate', handleNotificationUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('notificationUpdate', handleNotificationUpdate);
    };
  }, [user]);

  useEffect(() => {
    if (propNotifications) {
      setNotifications(propNotifications);
    }
  }, [propNotifications]);

  const removeNotification = async (id: number) => {
    try {
      await api.delete(`/api/notifications/${id}`);
      const notification = notifications.find((n) => n.id === id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (notification && !notification.isRead) {
        setContextUnreadCount((prev: number) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('알림 삭제 실패:', error);
    }
  };

  const getNotificationStyles = (forImportant: boolean) => {
    const cardBase = 'bg-neutral-700/90 dark:bg-neutral-800/95 border border-neutral-600/50 dark:border-neutral-600/40 text-[var(--color-text-primary)]';
    if (forImportant) {
      return `${cardBase} border-l-4 border-l-red-500`;
    }
    return cardBase;
  };

  const handleNotificationClick = (n: Notification) => {
    if (!n.isRead) markAsRead(n.id);
    if (n.type === 'group_cancelled') return;
    closeDrawer();
    const meta = n.metadata || {};
    switch (n.type) {
      case 'group_join':
      case 'group_closed':
      case 'group_deleted':
      case 'group_waitlist_spot_open':
      case 'referee_rank_match_in_region':
      case 'creator_new_match':
      case 'mercenary_recruit':
        if (meta.groupId != null) navigate(`/?group=${meta.groupId}`);
        break;
      case 'new_follower':
        if (meta.followerId != null) navigate('/followers', { state: { openUserId: meta.followerId } });
        break;
      default:
        break;
    }
  };

  const importantList = notifications.filter((n) => isImportant(n.type));
  const normalList = notifications.filter((n) => !isImportant(n.type));

  const renderNotificationItem = (notification: Notification, important: boolean) => {
    const cardClass = getNotificationStyles(important);
    const isCancelled = notification.type === 'group_cancelled';

    return (
      <div
        key={notification.id}
        role="button"
        tabIndex={0}
        onClick={() => handleNotificationClick(notification)}
        onKeyDown={(e) => e.key === 'Enter' && handleNotificationClick(notification)}
        className={`${cardClass} rounded-lg p-3 flex items-start gap-3 transition-colors ${!notification.isRead ? 'ring-1 ring-red-400/40' : 'opacity-90'} ${isCancelled ? 'cursor-default' : 'cursor-pointer hover:bg-neutral-600/90 dark:hover:bg-neutral-700/90'}`}
      >
        {important ? (
          <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
        ) : (
          <BellIcon className="w-5 h-5 flex-shrink-0 mt-0.5 text-[var(--color-text-secondary)]" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-xs font-semibold">{notification.title}</p>
            {notification.isRead && (
              <span className="text-xs opacity-60">(읽음)</span>
            )}
          </div>
          <p className="text-sm break-words">{notification.message}</p>
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
          className="flex-shrink-0 p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          aria-label="알림 삭제"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>
    );
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <>
      {/* 백드롭: blur + 딤, 클릭 시 닫기 */}
      <div
        role="presentation"
        className={`fixed inset-0 z-[9998] bg-black/25 transition-opacity duration-300 md:bg-transparent ${isDrawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        style={{ backdropFilter: isDrawerOpen ? 'blur(10px)' : 'none', WebkitBackdropFilter: isDrawerOpen ? 'blur(10px)' : 'none' }}
        onClick={closeDrawer}
        aria-hidden
      />

      {/* 우측 슬라이드 드로어: 진한 무채색 배경 */}
      <aside
        className={`fixed top-0 right-0 h-full w-full max-w-sm sm:max-w-md bg-neutral-800/98 dark:bg-neutral-900/98 border-l border-neutral-600/50 shadow-2xl z-[9999] flex flex-col transition-transform duration-300 ease-out ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}
        aria-label="알림"
        aria-hidden={!isDrawerOpen}
      >
        {/* 헤더: 스크롤 시에도 상단 고정(Sticky) + 모두 읽음 */}
        <div className="sticky top-0 z-20 flex-shrink-0 p-4 border-b border-neutral-600/50 flex flex-col gap-3 bg-neutral-800/98 dark:bg-neutral-900/98">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">알림</h2>
            <button
              onClick={closeDrawer}
              className="p-2 hover:bg-neutral-700 rounded-lg transition-colors text-neutral-300"
              aria-label="알림 패널 닫기"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="w-full py-2 px-3 text-sm font-medium rounded-lg bg-neutral-700 hover:bg-neutral-600 text-neutral-200 transition-colors"
            >
              모두 읽음
            </button>
          )}
        </div>

        {/* 스크롤 영역: 중요 알림 스티키 + 일반 알림 */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {isLoading ? (
            <div className="p-6 text-center">
              <p className="text-sm text-neutral-400">알림을 불러오는 중...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <BellIcon className="w-12 h-12 text-neutral-500 mx-auto mb-3 opacity-50" />
              <p className="text-sm text-neutral-400">알림이 없습니다.</p>
            </div>
          ) : (
            <div className="p-3 space-y-3">
              {/* 중요 알림: 최상단 고정(스티키) */}
              {importantList.length > 0 && (
                <div className="sticky top-0 z-10 space-y-2 pb-2 -mx-1 px-1 bg-neutral-800/98 dark:bg-neutral-900/98 pt-1">
                  <p className="text-xs font-semibold text-red-500 uppercase tracking-wide">중요</p>
                  {importantList.map((n) => renderNotificationItem(n, true))}
                </div>
              )}

              {/* 일반 알림 */}
              {normalList.length > 0 && (
                <div className="space-y-2">
                  {importantList.length > 0 && (
                    <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide pt-1">일반</p>
                  )}
                  {normalList.map((n) => renderNotificationItem(n, false))}
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default NotificationPanel;
