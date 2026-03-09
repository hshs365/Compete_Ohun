import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheckIcon,
  UserGroupIcon,
  BookOpenIcon,
  MegaphoneIcon,
  ChatBubbleLeftEllipsisIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';

/** 모바일 '더보기' 메뉴 페이지 */
const MoreMenuPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const mainItems = [
    { name: '용병 클럽', path: '/teams', icon: ShieldCheckIcon, protected: true },
    { name: '팔로워', path: '/followers', icon: UserGroupIcon, protected: true },
    { name: '가이드', path: '/guide', icon: BookOpenIcon },
  ];

  const footerItems = [
    { name: '공지사항', path: '/notice', icon: MegaphoneIcon },
    { name: '문의하기', path: '/contact', icon: ChatBubbleLeftEllipsisIcon },
    { name: '앱 설정', path: '/settings', icon: Cog6ToothIcon },
  ];

  const handleItemClick = (item: (typeof mainItems)[0] | (typeof footerItems)[0]) => {
    if ('onOpenChat' in item && item.onOpenChat) {
      item.onOpenChat();
      return;
    }
    if (item.protected && !user) {
      navigate('/login');
      return;
    }
    if (item.path) navigate(item.path);
  };

  return (
    <div className="flex flex-col min-h-full pb-24 md:pb-4">
      <header className="flex-shrink-0 px-4 py-4 border-b border-[var(--color-border-card)] bg-[var(--color-bg-card)]">
        <h1 className="text-xl font-bold text-[var(--color-text-primary)]">더보기</h1>
      </header>
      <main className="flex-1 p-4 space-y-6">
        <section>
          <ul className="rounded-xl overflow-hidden border border-[var(--color-border-card)] bg-[var(--color-bg-card)] divide-y divide-[var(--color-border-card)]">
            {mainItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <button
                    type="button"
                    onClick={() => handleItemClick(item)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] active:bg-[var(--color-bg-secondary)]"
                  >
                    <Icon className="w-5 h-5 text-[var(--color-text-secondary)] shrink-0" />
                    <span>{item.name}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
        <section>
          <ul className="rounded-xl overflow-hidden border border-[var(--color-border-card)] bg-[var(--color-bg-card)] divide-y divide-[var(--color-border-card)]">
            {footerItems.map((item) => {
              const Icon = item.icon;
              if ('onOpenChat' in item && item.onOpenChat) {
                return (
                  <li key={item.name}>
                    <button
                      type="button"
                      onClick={() => item.onOpenChat!()}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] active:bg-[var(--color-bg-secondary)]"
                    >
                      <Icon className="w-5 h-5 text-[var(--color-text-secondary)] shrink-0" />
                      <span>{item.name}</span>
                    </button>
                  </li>
                );
              }
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className="flex items-center gap-3 px-4 py-3 text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] active:bg-[var(--color-bg-secondary)]"
                  >
                    <Icon className="w-5 h-5 text-[var(--color-text-secondary)] shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      </main>
    </div>
  );
};

export default MoreMenuPage;
