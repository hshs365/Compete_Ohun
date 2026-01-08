import React from 'react';
import { Link } from 'react-router-dom';
import {
  UserIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  ChatBubbleLeftEllipsisIcon,
  Cog6ToothIcon,
  HomeIcon,
  MegaphoneIcon,
  TrophyIcon,
  HeartIcon,
  ShoppingBagIcon,
  CalendarDaysIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

const Sidebar = () => {
  const mainMenuItems = [
    { name: '홈', icon: HomeIcon, path: '/' }, // '홈' 메뉴 추가
    { name: '내정보', icon: UserIcon, path: '/my-info' },
    { name: '내일정', icon: CalendarIcon, path: '/my-schedule' },
    { name: '시설예약', icon: BuildingOfficeIcon, path: '/facility-reservation' },
    { name: '명예의전당', icon: TrophyIcon, path: '/hall-of-fame' },
    { name: '즐겨찾기', icon: HeartIcon, path: '/favorites' },
    { name: '스포츠용품', icon: ShoppingBagIcon, path: '/sports-equipment' },
    { name: '이벤트매치', icon: CalendarDaysIcon, path: '/event-match' },
    { name: '팔로워', icon: UserGroupIcon, path: '/followers' },
  ];

  const footerMenuItems = [
    { name: '공지사항', icon: MegaphoneIcon, path: '/notice' },
    { name: '문의하기', icon: ChatBubbleLeftEllipsisIcon, path: '/contact' },
    { name: '앱 설정', icon: Cog6ToothIcon, path: '/settings' },
  ];

  return (
    <div className="hidden md:flex flex-col items-center w-16 bg-gray-900 text-white h-screen py-4 flex-shrink-0">
      <div>
        <nav className="flex flex-col items-center space-y-6">
          {mainMenuItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className="flex flex-col items-center text-gray-400 hover:text-white transition-colors duration-200"
            >
              <item.icon className="h-6 w-6" />
              <span className="text-xs mt-1">{item.name}</span>
            </Link>
          ))}
        </nav>
      </div>

      <div className="mt-auto">
        <nav className="flex flex-col items-center space-y-6">
          {footerMenuItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className="flex flex-col items-center text-gray-400 hover:text-white transition-colors duration-200"
            >
              <item.icon className="h-6 w-6" />
              <span className="text-xs mt-1">{item.name}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;