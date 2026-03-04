import React, { useState } from 'react';
import { MagnifyingGlassIcon, MapPinIcon, Cog6ToothIcon, BellIcon } from '@heroicons/react/24/outline';
import { KOREAN_CITIES, getRegionDisplayName, getRegionChildren, parseRegionToHierarchy } from '../utils/locationUtils';
import { useNotification } from '../contexts/NotificationContext';
interface SearchAndRegionBarProps {
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  selectedRegion: string | null;
  onRegionChange: (region: string) => void;
  onOpenSearchOptions: () => void;
}

const SearchAndRegionBar: React.FC<SearchAndRegionBarProps> = ({
  searchQuery,
  onSearchQueryChange,
  selectedRegion,
  onRegionChange,
  onOpenSearchOptions,
}) => {
  const { unreadCount, openDrawer } = useNotification();
  const region = selectedRegion || '전체';
  const [openDropdown, setOpenDropdown] = useState<1 | 2 | 3 | null>(null);
  const hierarchy = parseRegionToHierarchy(region);
  const guList = hierarchy.sido && hierarchy.sido !== '전체' ? getRegionChildren(hierarchy.sido) : [];
  const dongList = hierarchy.sido && hierarchy.gu ? getRegionChildren(`${hierarchy.sido} ${hierarchy.gu}`) : [];
  const showGu = hierarchy.sido && hierarchy.sido !== '전체' && guList.length > 0;
  const showDong = hierarchy.gu && dongList.length > 0;

  return (
    <div className="flex items-center gap-2 flex-wrap p-2 bg-[var(--color-bg-card)] border-b border-[var(--color-border-card)]">
      <div className="relative flex-1 min-w-[120px]">
        <input
          type="text"
          placeholder="매치 검색..."
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          className="w-full py-2 pl-9 pr-3 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
        />
        <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-secondary)]" aria-hidden />
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        <MapPinIcon className="h-4 w-4 shrink-0 text-[var(--color-text-secondary)]" aria-hidden />
        <div className="relative flex-1 min-w-[100px]">
          <button
            type="button"
            onClick={() => setOpenDropdown(openDropdown === 1 ? null : 1)}
            className="w-full flex items-center justify-between gap-1 px-2.5 py-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] transition-colors text-sm"
          >
            <span className="truncate">{getRegionDisplayName(hierarchy.sido || '전체')}</span>
            <svg className="h-3.5 w-3.5 shrink-0 text-[var(--color-text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
          {openDropdown === 1 && (
            <>
              <div className="fixed inset-0 z-[200]" onClick={() => setOpenDropdown(null)} aria-hidden />
              <div className="absolute top-full left-0 mt-1 min-w-[140px] max-h-56 overflow-y-auto bg-[var(--color-bg-card)] border border-[var(--color-border-card)] rounded-lg shadow-lg z-[210] py-1">
                {KOREAN_CITIES.map((sido) => (
                  <button
                    key={sido}
                    type="button"
                    onClick={() => { onRegionChange(sido); setOpenDropdown(null); }}
                    className={`w-full text-left px-3 py-2 text-sm ${hierarchy.sido === sido ? 'bg-[var(--color-blue-primary)] text-white' : 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]'}`}
                  >
                    {getRegionDisplayName(sido)}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        {showGu && (
          <div className="relative flex-1 min-w-[90px]">
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === 2 ? null : 2)}
              className="w-full flex items-center justify-between gap-1 px-2.5 py-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] transition-colors text-sm"
            >
              <span className="truncate">{guList.find((g) => g.fullName === region)?.displayName ?? hierarchy.gu ?? '시 전체'}</span>
              <svg className="h-3.5 w-3.5 shrink-0 text-[var(--color-text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {openDropdown === 2 && (
              <>
                <div className="fixed inset-0 z-[200]" onClick={() => setOpenDropdown(null)} aria-hidden />
                <div className="absolute top-full left-0 mt-1 min-w-[120px] max-h-56 overflow-y-auto bg-[var(--color-bg-card)] border border-[var(--color-border-card)] rounded-lg shadow-lg z-[210] py-1">
                  <button type="button" onClick={() => { onRegionChange(hierarchy.sido!); setOpenDropdown(null); }} className={`w-full text-left px-3 py-2 text-sm ${region === hierarchy.sido ? 'bg-[var(--color-blue-primary)] text-white' : 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]'}`}>시 전체</button>
                  {guList.map((gu) => (
                    <button key={gu.fullName} type="button" onClick={() => { onRegionChange(gu.fullName); setOpenDropdown(null); }} className={`w-full text-left px-3 py-2 text-sm ${region === gu.fullName ? 'bg-[var(--color-blue-primary)] text-white' : 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]'}`}>{gu.displayName}</button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
        {showDong && (
          <div className="relative flex-1 min-w-[80px]">
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === 3 ? null : 3)}
              className="w-full flex items-center justify-between gap-1 px-2.5 py-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] transition-colors text-sm"
            >
              <span className="truncate">{dongList.find((d) => d.fullName === region)?.displayName ?? hierarchy.dong ?? '구 전체'}</span>
              <svg className="h-3.5 w-3.5 shrink-0 text-[var(--color-text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {openDropdown === 3 && (
              <>
                <div className="fixed inset-0 z-[200]" onClick={() => setOpenDropdown(null)} aria-hidden />
                <div className="absolute top-full left-0 mt-1 min-w-[100px] max-h-56 overflow-y-auto bg-[var(--color-bg-card)] border border-[var(--color-border-card)] rounded-lg shadow-lg z-[210] py-1">
                  <button type="button" onClick={() => { onRegionChange(hierarchy.sido && hierarchy.gu ? `${hierarchy.sido} ${hierarchy.gu}` : hierarchy.gu!); setOpenDropdown(null); }} className={`w-full text-left px-3 py-2 text-sm ${!hierarchy.dong ? 'bg-[var(--color-blue-primary)] text-white' : 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]'}`}>구 전체</button>
                  {dongList.map((dong) => (
                    <button key={dong.fullName} type="button" onClick={() => { onRegionChange(dong.fullName); setOpenDropdown(null); }} className={`w-full text-left px-3 py-2 text-sm ${region === dong.fullName ? 'bg-[var(--color-blue-primary)] text-white' : 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]'}`}>{dong.displayName}</button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
      <button type="button" onClick={onOpenSearchOptions} className="p-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] shrink-0" aria-label="검색 옵션" title="검색 옵션">
        <Cog6ToothIcon className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={openDrawer}
        className="relative p-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] shrink-0"
        aria-label={unreadCount > 0 ? `알림 (읽지 않음 ${unreadCount}개)` : '알림'}
        title="알림"
      >
        <BellIcon className="h-5 w-5" />
        {unreadCount > 0 && (
          <span
            className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-[var(--color-bg-primary)] ring-1 ring-red-400/50"
            aria-hidden
          />
        )}
      </button>
    </div>
  );
};

export default SearchAndRegionBar;
