import React, { useState } from 'react';
import GroupList from './GroupList';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface GroupListPanelProps {
  selectedCategory: string | null;
  onGroupClick: (group: any) => void;
  refreshTrigger?: number;
}

const GroupListPanel = ({ selectedCategory, onGroupClick, refreshTrigger }: GroupListPanelProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="w-full md:w-96 bg-[var(--color-bg-card)] p-3 md:p-4 border-l border-r border-[var(--color-border-card)] flex flex-col h-full max-h-[400px] md:max-h-none">
      <div className="relative mb-4">
        <input
          type="text"
          placeholder="모임 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-2 pl-10 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-card)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
        />
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--color-text-secondary)]" />
      </div>
      <div className="flex-1 overflow-y-auto">
        <GroupList 
          selectedCategory={selectedCategory} 
          searchQuery={searchQuery}
          onGroupClick={onGroupClick}
          refreshTrigger={refreshTrigger}
        />
      </div>
    </div>
  );
};

export default GroupListPanel;
