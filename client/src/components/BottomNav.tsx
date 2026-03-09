import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  HomeIcon,
  UserIcon,
  Squares2X2Icon,
  ChatBubbleLeftEllipsisIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  UserIcon as UserIconSolid,
  Squares2X2Icon as Squares2X2IconSolid,
  ChatBubbleLeftEllipsisIcon as ChatBubbleLeftEllipsisIconSolid,
  TrophyIcon as TrophyIconSolid,
} from '@heroicons/react/24/solid';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';

/** 모바일 전용 하단 네비게이션 바 */
const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { openChatList } = useChat();

  const handleHomeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate('/');
  };

  const handleChatClick = (e: React.MouseEvent) => {
    e.preventDefault();
    openChatList();
  };

  const items = [
    { name: '용병', path: '/', icon: HomeIcon, iconSolid: HomeIconSolid, onClick: handleHomeClick, isHome: true },
    { name: '채팅', path: 'chat', icon: ChatBubbleLeftEllipsisIcon, iconSolid: ChatBubbleLeftEllipsisIconSolid, onClick: handleChatClick },
    { name: '명예의 전당', path: '/hall-of-fame', icon: TrophyIcon, iconSolid: TrophyIconSolid },
    { name: '내정보', path: '/my-info', icon: UserIcon, iconSolid: UserIconSolid, protected: true },
    { name: '더보기', path: '/more', icon: Squares2X2Icon, iconSolid: Squares2X2IconSolid },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-[9000] flex items-center justify-around h-16 bg-[var(--color-bg-card)] border-t border-[var(--color-border-card)] safe-area-bottom"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0)' }}
    >
      {items.map((item) => {
        const isActive = item.onClick && item.path === 'chat'
          ? false
          : item.isHome
            ? location.pathname === '/'
            : location.pathname === item.path || location.pathname.startsWith(item.path + '/');
        const Icon = isActive ? item.iconSolid : item.icon;
        const disabled = item.protected && !user;

        const content = (
          <span className="flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 py-2">
            <Icon className={`w-6 h-6 shrink-0 ${isActive ? 'text-[var(--color-blue-primary)]' : 'text-[var(--color-text-secondary)]'}`} />
            <span className={`text-[10px] truncate max-w-full ${isActive ? 'text-[var(--color-blue-primary)] font-semibold' : 'text-[var(--color-text-secondary)]'}`}>
              {item.name}
            </span>
          </span>
        );

        const activeTabClass = isActive
          ? 'bg-[var(--color-blue-primary)]/12 border-b-2 border-b-[var(--color-blue-primary)]'
          : '';

        if (item.onClick) {
          return (
            <button
              key={item.path === 'chat' ? 'chat' : item.path}
              type="button"
              onClick={item.onClick}
              className={`flex-1 flex items-center justify-center min-w-0 h-full touch-manipulation active:bg-[var(--color-bg-secondary)] ${activeTabClass}`}
              aria-current={isActive ? 'page' : undefined}
            >
              {content}
            </button>
          );
        }

        if (disabled) {
          return (
            <Link
              key={item.path}
              to="/login"
              className={`flex-1 flex items-center justify-center min-w-0 h-full touch-manipulation active:bg-[var(--color-bg-secondary)] ${activeTabClass}`}
            >
              {content}
            </Link>
          );
        }

        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex-1 flex items-center justify-center min-w-0 h-full touch-manipulation active:bg-[var(--color-bg-secondary)] ${activeTabClass}`}
            aria-current={isActive ? 'page' : undefined}
          >
            {content}
          </Link>
        );
      })}
    </nav>
  );
};

export default BottomNav;
