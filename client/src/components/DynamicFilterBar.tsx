import React, { useState } from 'react';
import { MagnifyingGlassIcon, MapPinIcon, Cog6ToothIcon, BellIcon } from '@heroicons/react/24/outline';
import { KOREAN_CITIES, getRegionDisplayName, getRegionChildren, parseRegionToHierarchy } from '../utils/locationUtils';
import { useNotification } from '../contexts/NotificationContext';
import { SPORT_CONFIG, SPORT_POINT_COLORS, type SportFilterFieldDef } from '../constants/sports';

interface DynamicFilterBarProps {
  /** 선택된 종목 (전체면 기본 검색바만) */
  selectedSport: string | null;
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  selectedRegion: string | null;
  onRegionChange: (region: string) => void;
  onOpenSearchOptions: () => void;
  /** 종목별 동적 필터 값 (key -> value 또는 string[]) */
  sportFilterValues: Record<string, string | string[]>;
  onSportFilterChange: (key: string, value: string | string[]) => void;
  /** 성별 필터 (용병 구하기 등). 있으면 성별 드롭다운 표시 */
  selectedGender?: 'male' | 'female' | null;
  onGenderChange?: (g: 'male' | 'female' | null) => void;
}

const DynamicFilterBar: React.FC<DynamicFilterBarProps> = ({
  selectedSport,
  searchQuery,
  onSearchQueryChange,
  selectedRegion,
  onRegionChange,
  onOpenSearchOptions,
  sportFilterValues,
  onSportFilterChange,
  selectedGender = null,
  onGenderChange,
}) => {
  const { unreadCount, openDrawer } = useNotification();
  const region = selectedRegion || '전체';
  const [openDropdown, setOpenDropdown] = useState<1 | 2 | 3 | 4 | null>(null);
  const hierarchy = parseRegionToHierarchy(region);
  const guList = hierarchy.sido && hierarchy.sido !== '전체' ? getRegionChildren(hierarchy.sido) : [];
  const dongList = hierarchy.sido && hierarchy.gu ? getRegionChildren(`${hierarchy.sido} ${hierarchy.gu}`) : [];
  const showGu = hierarchy.sido && hierarchy.sido !== '전체' && guList.length > 0;
  const showDong = hierarchy.gu && dongList.length > 0;

  const sportKey = selectedSport || '전체';
  const pointColor = SPORT_POINT_COLORS[sportKey] ?? SPORT_POINT_COLORS['전체'];
  const config = SPORT_CONFIG[sportKey] ?? SPORT_CONFIG['전체'];
  const filterFields = config?.filterFields ?? [];

  const renderField = (field: SportFilterFieldDef) => {
    const value = sportFilterValues[field.key];
    if (field.type === 'select') {
      const opts = field.options ?? [];
      return (
        <div key={field.key} className="flex-shrink-0">
          <select
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => onSportFilterChange(field.key, e.target.value)}
            className="px-2.5 py-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:ring-2"
            style={{ borderColor: pointColor, ['--tw-ring-color' as string]: pointColor }}
          >
            <option value="">{field.placeholder ?? `전체 ${field.label}`}</option>
            {opts.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      );
    }
    if (field.type === 'multiselect') {
      const arr = Array.isArray(value) ? value : [];
      const opts = field.options ?? [];
      const toggle = (v: string) => {
        const next = arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
        onSportFilterChange(field.key, next);
      };
      return (
        <div key={field.key} className="flex flex-wrap gap-1.5 flex-shrink-0">
          {opts.map((o) => {
            const active = arr.includes(o.value);
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => toggle(o.value)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  active
                    ? 'text-white'
                    : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:opacity-90'
                }`}
                style={active ? { backgroundColor: pointColor } : undefined}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col gap-2 p-2 bg-[var(--color-bg-card)] border-b border-[var(--color-border-card)]">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[120px]">
          <input
            type="text"
            placeholder={`${selectedSport ? selectedSport : ''} 매치 검색...`}
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className="w-full py-2 pl-9 pr-3 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] text-sm focus:outline-none focus:ring-2"
            style={{ ['--tw-ring-color' as string]: pointColor }}
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
                      className={`w-full text-left px-3 py-2 text-sm ${hierarchy.sido === sido ? 'text-white' : 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]'}`}
                      style={hierarchy.sido === sido ? { backgroundColor: pointColor } : undefined}
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
                    <button type="button" onClick={() => { onRegionChange(hierarchy.sido!); setOpenDropdown(null); }} className={`w-full text-left px-3 py-2 text-sm ${region === hierarchy.sido ? 'text-white' : 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]'}`} style={region === hierarchy.sido ? { backgroundColor: pointColor } : undefined}>시 전체</button>
                    {guList.map((gu) => (
                      <button key={gu.fullName} type="button" onClick={() => { onRegionChange(gu.fullName); setOpenDropdown(null); }} className={`w-full text-left px-3 py-2 text-sm ${region === gu.fullName ? 'text-white' : 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]'}`} style={region === gu.fullName ? { backgroundColor: pointColor } : undefined}>{gu.displayName}</button>
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
                    <button type="button" onClick={() => { onRegionChange(hierarchy.sido && hierarchy.gu ? `${hierarchy.sido} ${hierarchy.gu}` : hierarchy.gu!); setOpenDropdown(null); }} className={`w-full text-left px-3 py-2 text-sm ${!hierarchy.dong ? 'text-white' : 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]'}`} style={!hierarchy.dong ? { backgroundColor: pointColor } : undefined}>구 전체</button>
                    {dongList.map((dong) => (
                      <button key={dong.fullName} type="button" onClick={() => { onRegionChange(dong.fullName); setOpenDropdown(null); }} className={`w-full text-left px-3 py-2 text-sm ${region === dong.fullName ? 'text-white' : 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]'}`} style={region === dong.fullName ? { backgroundColor: pointColor } : undefined}>{dong.displayName}</button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        {onGenderChange && (
          <select
            value={selectedGender ?? ''}
            onChange={(e) => onGenderChange(e.target.value === 'male' || e.target.value === 'female' ? e.target.value : null)}
            className="px-2.5 py-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:ring-2 shrink-0 min-w-[90px]"
            style={{ borderColor: pointColor, ['--tw-ring-color' as string]: pointColor }}
          >
            <option value="">전체 성별</option>
            <option value="male">남자만</option>
            <option value="female">여자만</option>
          </select>
        )}
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
      {filterFields.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {filterFields.map(renderField)}
        </div>
      )}
    </div>
  );
};

export default DynamicFilterBar;
