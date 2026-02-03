import React, { useState, useEffect } from 'react';
import GroupList from './GroupList';
import SearchOptionsModal from './SearchOptionsModal';
import { MagnifyingGlassIcon, MapPinIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { KOREAN_CITIES, getRegionDisplayName, getUserCity, type KoreanCity } from '../utils/locationUtils';
import { MATCH_TYPE_THEME } from './HomeMatchTypeChoice';

export type MatchType = 'general' | 'rank' | 'event';

interface GroupListPanelProps {
  selectedCategory: string | null;
  onGroupClick: (group: any) => void;
  refreshTrigger?: number;
  selectedCity?: string | null;
  onCityChange?: (city: KoreanCity) => void;
  selectedDays?: number[];
  onDaysChange?: (days: number[]) => void;
  /** 매치 종류: 일반 매치 | 랭크매치 | 이벤트매치 (홈에서 탭으로 전환) */
  matchType?: MatchType;
  onMatchTypeChange?: (type: MatchType) => void;
  /** true면 매치 종류에 맞는 테마 색(패널 전체 배경·헤더) 적용 */
  matchTypeTheme?: boolean;
}

const GroupListPanel = ({ selectedCategory, onGroupClick, refreshTrigger, selectedCity: propSelectedCity, onCityChange, selectedDays = [], onDaysChange, matchType = 'general', onMatchTypeChange, matchTypeTheme = false }: GroupListPanelProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<KoreanCity>(propSelectedCity as KoreanCity || '전체');
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [isSearchOptionsOpen, setIsSearchOptionsOpen] = useState(false);
  const [hideClosed, setHideClosed] = useState(true); // 기본적으로 마감된 모임 숨기기
  const [onlyRanker, setOnlyRanker] = useState(false);
  const [gender, setGender] = useState<'male' | 'female' | null>(null);
  const [includeCompleted, setIncludeCompleted] = useState(false); // 종료된 모임 포함 여부

  // prop으로 전달된 selectedCity가 변경되면 내부 state 업데이트
  useEffect(() => {
    if (propSelectedCity) {
      setSelectedCity(propSelectedCity as KoreanCity);
    }
  }, [propSelectedCity]);

  // 사용자 위치 기반으로 기본 도시 설정 (prop이 없을 때만)
  useEffect(() => {
    if (!propSelectedCity) {
      const userCity = getUserCity();
      if (userCity) {
        setSelectedCity(userCity);
        if (onCityChange) {
          onCityChange(userCity);
        }
      }
    }
  }, [propSelectedCity, onCityChange]);

  const theme = matchTypeTheme ? MATCH_TYPE_THEME[matchType] : null;
  // 테마 있을 때: 패널 전체를 매치 종류별 10% 투명도 단색으로 채움
  const borderClass = theme ? 'border-r border-[var(--color-border-card)]' : 'border-l border-r border-[var(--color-border-card)]';
  const themeBg10 = theme ? theme.accentRgba.replace('0.15', '0.10') : null;
  const headerBg = themeBg10 ? { background: themeBg10 } : undefined;
  const panelBg = themeBg10 ? { background: themeBg10 } : undefined;

  return (
    <div 
      data-guide="group-list-panel"
      className={`w-full md:w-96 p-2.5 md:p-3 flex flex-col h-full max-h-[400px] md:max-h-none ${borderClass}`}
      style={{
        ...(panelBg || {}),
        backgroundColor: theme ? undefined : 'var(--color-bg-card)',
      }}
    >
      {/* 매치 종류 탭: 일반 매치 | 랭크매치 | 이벤트매치 */}
      {onMatchTypeChange && (
        <div 
          className="flex gap-1 p-1 rounded-lg bg-[var(--color-bg-primary)] mb-3"
          style={headerBg}
        >
          {(['general', 'rank', 'event'] as const).map((type) => {
            const t = matchTypeTheme ? MATCH_TYPE_THEME[type] : null;
            const activeBg = matchType === type && t ? t.accentHex : undefined;
            return (
              <button
                key={type}
                type="button"
                onClick={() => onMatchTypeChange(type)}
                className={`flex-1 py-2 rounded-md text-xs font-medium transition-colors ${
                  matchType === type
                    ? 'text-white'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]'
                }`}
                style={matchType === type && activeBg ? { backgroundColor: activeBg } : undefined}
              >
                {type === 'general' ? '일반 매치' : type === 'rank' ? '랭크매치' : '이벤트매치'}
              </button>
            );
          })}
        </div>
      )}

      {/* 검색창과 지역 선택 */}
      <div className="space-y-2.5 mb-3">
        <div className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="매치 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-2 pl-10 pr-10 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-card)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
            />
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--color-text-secondary)]" />
          </div>
          <button
            onClick={() => setIsSearchOptionsOpen(true)}
            className="p-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-card)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] transition-colors"
            aria-label="검색 옵션"
            title="검색 옵션"
          >
            <Cog6ToothIcon className="h-5 w-5" />
          </button>
        </div>
        
        {/* 지역 선택 드롭다운 */}
        <div className="relative">
          <button
            onClick={() => setShowCityDropdown(!showCityDropdown)}
            className="w-full flex items-center justify-between p-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-card)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <MapPinIcon className="h-4 w-4 flex-shrink-0 text-[var(--color-text-secondary)]" />
              <span className="text-sm truncate">{getRegionDisplayName(selectedCity)}</span>
            </div>
            <svg
              className={`h-4 w-4 text-[var(--color-text-secondary)] transition-transform ${showCityDropdown ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {/* 드롭다운 메뉴 */}
          {showCityDropdown && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowCityDropdown(false)}
              />
              <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--color-bg-card)] border border-[var(--color-border-card)] rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto overflow-x-hidden min-w-0">
                {KOREAN_CITIES.map((city) => (
                  <button
                    key={city}
                    onClick={() => {
                      setSelectedCity(city);
                      setShowCityDropdown(false);
                      if (onCityChange) {
                        onCityChange(city);
                      }
                    }}
                    className={`w-full min-w-0 text-left px-4 py-2 text-sm transition-all duration-200 break-words whitespace-normal ${
                      selectedCity === city
                        ? 'bg-[var(--color-blue-primary)] text-white'
                        : 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] hover:pl-6 hover:font-medium'
                    }`}
                  >
                    {getRegionDisplayName(city)}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <GroupList 
          selectedCategory={selectedCategory} 
          searchQuery={searchQuery}
          selectedCity={selectedCity}
          selectedDays={selectedDays}
          hideClosed={hideClosed}
          onlyRanker={onlyRanker}
          gender={gender}
          includeCompleted={includeCompleted}
          onGroupClick={onGroupClick}
          refreshTrigger={refreshTrigger}
          matchType={matchType}
        />
      </div>

      {/* 검색 옵션 모달 */}
      <SearchOptionsModal
        isOpen={isSearchOptionsOpen}
        onClose={() => setIsSearchOptionsOpen(false)}
        selectedDays={selectedDays}
        onDaysChange={(days) => {
          if (onDaysChange) {
            onDaysChange(days);
          }
        }}
        hideClosed={hideClosed}
        onHideClosedChange={setHideClosed}
        onlyRanker={onlyRanker}
        onOnlyRankerChange={setOnlyRanker}
        gender={gender}
        onGenderChange={setGender}
        includeCompleted={includeCompleted}
        onIncludeCompletedChange={setIncludeCompleted}
      />
    </div>
  );
};

export default GroupListPanel;
