import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useChat } from '../contexts/ChatContext';
import {
  UserIcon,
  CalendarIcon,
  ChatBubbleLeftEllipsisIcon,
  Cog6ToothIcon,
  HomeIcon,
  MegaphoneIcon,
  TrophyIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  BookOpenIcon,
} from '@heroicons/react/24/outline';
const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { openChatList } = useChat();

  const handleHomeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate('/');
  };

  const isActive = (item: { path: string; isHome?: boolean }) => {
    if ((item as { isHome?: boolean }).isHome) return location.pathname === '/';
    return location.pathname === item.path || location.pathname.startsWith(item.path + '/');
  };

  const mainMenuItems = [
    { name: '용병', icon: HomeIcon, path: '/', isHome: true },
    { name: '내 정보', icon: UserIcon, path: '/my-info' },
    { name: '내 일정', icon: CalendarIcon, path: '/my-schedule' },
    { name: '명예의전당', icon: TrophyIcon, path: '/hall-of-fame' },
    { name: '용병 클럽', icon: ShieldCheckIcon, path: '/teams' },
    { name: '팔로워', icon: UserGroupIcon, path: '/followers' },
    { name: '가이드', icon: BookOpenIcon, path: '/guide' },
  ];

  const footerMenuItems: Array<{ name: string; icon: typeof MegaphoneIcon; path?: string; onOpenChat?: () => void }> = [
    { name: '공지사항', icon: MegaphoneIcon, path: '/notice' },
    { name: '채팅', icon: ChatBubbleLeftEllipsisIcon, onOpenChat: openChatList },
    { name: '문의하기', icon: ChatBubbleLeftEllipsisIcon, path: '/contact' },
    { name: '앱 설정', icon: Cog6ToothIcon, path: '/settings' },
  ];

  return (
    <div className="hidden md:flex flex-col items-center w-16 bg-gray-900 text-white h-screen py-5 shrink-0 gap-0 pl-0">
      <div className="w-full">
        <nav className="flex flex-col items-center space-y-7 w-full">
          {mainMenuItems.map((item) => {
            const active = isActive(item);
            const baseClass = 'relative flex flex-col items-center transition-colors duration-200 w-full border-l-2 border-transparent';
            const activeClass = active
              ? 'text-white border-transparent before:content-[""] before:block before:absolute before:left-0 before:top-0 before:bottom-0 before:w-0.5 before:bg-cyan-400'
              : 'text-gray-400 hover:text-white';
            if ((item as { isHome?: boolean }).isHome) {
              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={handleHomeClick}
                  className={`${baseClass} ${activeClass}`}
                >
                  <item.icon className="h-6 w-6" />
                  <span className="text-xs mt-1 whitespace-nowrap">{item.name}</span>
                </button>
              );
            }
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`${baseClass} ${activeClass}`}
              >
                <item.icon className="h-6 w-6" />
                <span className="text-xs mt-1 whitespace-nowrap">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto w-full pt-6">
        <nav className="flex flex-col items-center space-y-7 w-full">
          {footerMenuItems.map((item) => {
            const active = item.path
              ? location.pathname === item.path || location.pathname.startsWith(item.path + '/')
              : false;
            const baseClass = 'relative flex flex-col items-center transition-colors duration-200 w-full border-l-2 border-transparent';
            const activeClass = active
              ? 'text-white border-transparent before:content-[""] before:block before:absolute before:left-0 before:top-0 before:bottom-0 before:w-0.5 before:bg-cyan-400'
              : 'text-gray-400 hover:text-white';
            if (item.onOpenChat) {
              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={item.onOpenChat}
                  className={`${baseClass} ${activeClass} cursor-pointer bg-transparent border-none`}
                >
                  <item.icon className="h-6 w-6" />
                  <span className="text-xs mt-1 whitespace-nowrap">{item.name}</span>
                </button>
              );
            }
            return (
              <Link
                key={item.name}
                to={item.path!}
                className={`${baseClass} ${activeClass}`}
              >
                <item.icon className="h-6 w-6" />
                <span className="text-xs mt-1 whitespace-nowrap">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;