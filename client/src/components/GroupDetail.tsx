import React from 'react';
import { XMarkIcon, MapPinIcon, UsersIcon, TagIcon } from '@heroicons/react/24/outline';
import type { SelectedGroup } from './MapPanel';

interface GroupDetailProps {
  group: SelectedGroup | null;
  onClose: () => void;
}

const GroupDetail: React.FC<GroupDetailProps> = ({ group, onClose }) => {
  if (!group) return null;

  return (
    <div className="w-full md:w-96 bg-[var(--color-bg-card)] border-l border-[var(--color-border-card)] flex flex-col h-full">
      {/* 헤더 */}
      <div className="sticky top-0 bg-[var(--color-bg-card)] border-b border-[var(--color-border-card)] p-4 flex items-center justify-between z-10 flex-shrink-0">
        <h2 className="text-lg md:text-xl font-bold text-[var(--color-text-primary)]">{group.name}</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-[var(--color-bg-secondary)] rounded-lg transition-colors"
        >
          <XMarkIcon className="w-5 h-5 text-[var(--color-text-primary)]" />
        </button>
      </div>

      {/* 내용 */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {/* 기본 정보 */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <MapPinIcon className="w-5 h-5 text-[var(--color-text-secondary)]" />
              <span className="text-[var(--color-text-primary)] font-medium">{group.location}</span>
            </div>
            
            <div className="flex items-center space-x-4">
              {group.memberCount !== undefined && (
                <div className="flex items-center space-x-2">
                  <UsersIcon className="w-5 h-5 text-[var(--color-text-secondary)]" />
                  <span className="text-[var(--color-text-secondary)]">
                    현재 인원: <span className="text-[var(--color-text-primary)] font-semibold">{group.memberCount}명</span>
                  </span>
                </div>
              )}
              
              {group.category && (
                <div className="flex items-center space-x-2">
                  <TagIcon className="w-5 h-5 text-[var(--color-text-secondary)]" />
                  <span className="px-3 py-1 bg-[var(--color-blue-primary)] text-white text-sm font-semibold rounded-full">
                    {group.category}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 상세 정보 */}
          <div className="border-t border-[var(--color-border-card)] pt-4">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-3">상세 정보</h3>
            <div className="space-y-2 text-[var(--color-text-secondary)]">
              {group.description && (
                <p className="leading-relaxed">{group.description}</p>
              )}
              {group.meetingTime && (
                <p>모임 시간: <span className="text-[var(--color-text-primary)]">{group.meetingTime}</span></p>
              )}
              {group.contact && (
                <p>문의: <span className="text-[var(--color-text-primary)]">{group.contact}</span></p>
              )}
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="flex space-x-3 pt-4 border-t border-[var(--color-border-card)]">
            <button className="flex-1 px-4 py-3 bg-[var(--color-blue-primary)] text-white rounded-lg font-semibold hover:opacity-90 transition-opacity">
              모임 가입하기
            </button>
            <button className="px-4 py-3 bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] rounded-lg font-semibold hover:opacity-80 transition-opacity">
              공유하기
            </button>
        </div>
      </div>
    </div>
  );
};

export default GroupDetail;

