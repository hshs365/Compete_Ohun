import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  UserIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  ChatBubbleLeftEllipsisIcon,
  Cog6ToothIcon,
  HomeIcon,
  MegaphoneIcon,
  TrophyIcon,
  ShoppingBagIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  BookOpenIcon,
} from '@heroicons/react/24/outline';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleHomeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const isAlreadyOnHome = location.pathname === '/';
    // 홈 화면에서 홈 버튼 클릭 시에만 초기 화면(종목 선택)으로 리셋
    if (isAlreadyOnHome) {
      try {
        localStorage.removeItem('home_category');
        localStorage.removeItem('home_entered_match_view');
        localStorage.removeItem('home_match_type');
      } catch (_) {}
      window.dispatchEvent(new CustomEvent('homeReset'));
    }
    navigate('/');
  };

  const isActive = (item: { path: string; isHome?: boolean }) => {
    if ((item as { isHome?: boolean }).isHome) return location.pathname === '/';
    return location.pathname === item.path || location.pathname.startsWith(item.path + '/');
  };

  const mainMenuItems = [
    { name: '홈', icon: HomeIcon, path: '/', isHome: true },
    { name: '내 정보', icon: UserIcon, path: '/my-info' },
    { name: '활동기록', icon: ChartBarIcon, path: '/my-activity' },
    { name: '내 일정', icon: CalendarIcon, path: '/my-schedule' },
    { name: '시설', icon: BuildingOfficeIcon, path: '/facility-reservation' },
    { name: '명예의전당', icon: TrophyIcon, path: '/hall-of-fame' },
    { name: '스포츠용품', icon: ShoppingBagIcon, path: '/sports-equipment' },
    { name: '팀', icon: ShieldCheckIcon, path: '/teams' },
    { name: '팔로워', icon: UserGroupIcon, path: '/followers' },
    { name: '가이드', icon: BookOpenIcon, path: '/guide' },
  ];

  const footerMenuItems = [
    { name: '공지사항', icon: MegaphoneIcon, path: '/notice' },
    { name: '문의하기', icon: ChatBubbleLeftEllipsisIcon, path: '/contact' },
    { name: '앱 설정', icon: Cog6ToothIcon, path: '/settings' },
  ];

  return (
    <div className="hidden md:flex flex-col items-center w-16 bg-gray-900 text-white h-screen py-4 shrink-0">
      <div className="w-full">
        <nav className="flex flex-col items-center space-y-6 w-full">
          {mainMenuItems.map((item) => {
            const active = isActive(item);
            const baseClass = 'flex flex-col items-center transition-colors duration-200 w-full border-l-2 border-transparent';
            const activeClass = active ? 'text-white border-l-cyan-400' : 'text-gray-400 hover:text-white';
            return (item as { isHome?: boolean }).isHome ? (
              <button
                key={item.name}
                type="button"
                onClick={handleHomeClick}
                className={`${baseClass} ${activeClass}`}
              >
                <item.icon className="h-6 w-6" />
                <span className="text-xs mt-1 whitespace-nowrap">{item.name}</span>
              </button>
            ) : (
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

      <div className="mt-auto w-full">
        <nav className="flex flex-col items-center space-y-6 w-full">
          {footerMenuItems.map((item) => {
            const active = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            const baseClass = 'flex flex-col items-center transition-colors duration-200 w-full border-l-2 border-transparent';
            const activeClass = active ? 'text-white border-l-cyan-400' : 'text-gray-400 hover:text-white';
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
    </div>
  );
};

export default Sidebar;