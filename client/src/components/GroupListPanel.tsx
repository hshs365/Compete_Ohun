import React, { useState, useEffect, useMemo } from 'react';
import GroupList from './GroupList';
import { getUserCity, getCityCoordinates, type KoreanCity } from '../utils/locationUtils';
import { useAuth } from '../contexts/AuthContext';
import { MATCH_TYPE_THEME } from './HomeMatchTypeChoice';

export type MatchType = 'general' | 'rank' | 'event';

interface GroupListPanelProps {
  selectedCategory: string | null;
  onGroupClick: (group: any) => void;
  refreshTrigger?: number;
  /** 선택 지역: '전체' | 시/도 | 구 fullName | 동 fullName */
  selectedRegion?: string | null;
  onRegionChange?: (region: string) => void;
  /** @deprecated use selectedRegion/onRegionChange */
  selectedCity?: string | null;
  /** @deprecated use onRegionChange */
  onCityChange?: (city: KoreanCity) => void;
  selectedDays?: number[];
  onDaysChange?: (days: number[]) => void;
  /** 날짜 필터 YYYY-MM-DD (특정 날짜 매치만) */
  filterDate?: string | null;
  /** 지도 bounds (이 지역에서 재검색 시) */
  mapBounds?: import('./GroupList').MapBounds;
  /** 매치 종류: 일반 매치 | 랭크 매치 | 이벤트매치 (홈에서 탭으로 전환) */
  matchType?: MatchType;
  onMatchTypeChange?: (type: MatchType) => void;
  /** true면 매치 종류에 맞는 테마 색(패널 전체 배경·헤더) 적용 */
  matchTypeTheme?: boolean;
  /** 목록 데이터 변경 시 콜백 (지도 마커용) */
  onGroupsChange?: (groups: import('../types/selected-group').SelectedGroup[]) => void;
  /** 로딩 상태 변경 시 콜백 */
  onLoadingChange?: (loading: boolean) => void;
  /** 마커 클릭 시 해당 시설 필터 (시설명, 매치 목록) */
  facilityFilter?: { facilityName: string; groups: import('../types/selected-group').SelectedGroup[] } | null;
  /** 시설 필터 해제 */
  onClearFacilityFilter?: () => void;
  /** 검색·지역 바는 지도 상단에서 제어. 목록 필터용만 전달 */
  searchQuery?: string;
  hideClosed?: boolean;
  onlyRanker?: boolean;
  gender?: 'male' | 'female' | null;
  includeCompleted?: boolean;
}

const GroupListPanel = ({ selectedCategory, onGroupClick, refreshTrigger, selectedRegion: propSelectedRegion, onRegionChange, selectedCity: propSelectedCity, onCityChange, selectedDays = [], onDaysChange, filterDate = null, mapBounds = null, matchType = 'general', onMatchTypeChange, matchTypeTheme = false, onGroupsChange, onLoadingChange, facilityFilter = null, onClearFacilityFilter, searchQuery: propSearchQuery = '', hideClosed: propHideClosed = true, onlyRanker: propOnlyRanker = false, gender: propGender = null, includeCompleted: propIncludeCompleted = false }: GroupListPanelProps) => {
  const { user } = useAuth();
  const propRegion = propSelectedRegion ?? (propSelectedCity as string) ?? null;
  const onRegionChangeActual = onRegionChange ?? (onCityChange ? (r: string) => onCityChange(r as KoreanCity) : undefined);
  const userCoords = useMemo(() => {
    if (!user) return null;
    const userCity = getUserCity(user.id, { residenceAddress: user.residenceAddress, residenceSido: user.residenceSido });
    if (!userCity || userCity === '전체') return null;
    return getCityCoordinates(userCity);
  }, [user?.id, user?.residenceAddress, user?.residenceSido]);
  const [selectedRegion, setSelectedRegion] = useState<string>(propRegion || '전체');
  const searchQuery = propSearchQuery;
  const hideClosed = propHideClosed;
  const onlyRanker = propOnlyRanker;
  const gender = propGender;
  const includeCompleted = propIncludeCompleted;

  useEffect(() => {
    if (propRegion) setSelectedRegion(propRegion);
  }, [propRegion]);

  useEffect(() => {
    if (!propRegion && user?.id) {
      const userCity = getUserCity(user.id);
      if (userCity) {
        setSelectedRegion(userCity);
        onRegionChangeActual?.(userCity);
      }
    }
  }, [propRegion, onRegionChangeActual, user?.id]);

  const theme = matchTypeTheme ? MATCH_TYPE_THEME[matchType] : null;
  // 테마 있을 때: 패널 전체를 매치 종류별 10% 투명도 단색으로 채움
  const borderClass = theme ? 'border-r border-[var(--color-border-card)]' : 'border-l border-r border-[var(--color-border-card)]';
  const themeBg10 = theme ? theme.accentRgba.replace('0.15', '0.10') : null;
  const headerBg = themeBg10 ? { background: themeBg10 } : undefined;
  const panelBg = themeBg10 ? { background: themeBg10 } : undefined;

  return (
    <div 
      data-guide="group-list-panel"
      className={`w-full md:w-96 p-2.5 md:p-3 flex flex-col h-full min-h-0 max-h-[55vh] md:max-h-none ${borderClass}`}
      style={{
        ...(panelBg || {}),
        backgroundColor: theme ? undefined : 'var(--color-bg-card)',
      }}
    >
      {/* 매치 종류 탭: 일반 매치 | 랭크 매치 | 이벤트매치 */}
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
                {type === 'general' ? '일반 매치' : type === 'rank' ? '랭크 매치' : '이벤트매치'}
              </button>
            );
          })}
        </div>
      )}

      {/* 시설 필터 해제: 검색·지역은 지도 상단 바에서 제어 */}
      {facilityFilter && onClearFacilityFilter && (
        <div className="mb-2">
          <button
            onClick={onClearFacilityFilter}
            className="w-full p-2 border border-amber-500/60 rounded-lg bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 transition-colors text-xs font-medium"
            title="시설 필터 해제"
          >
            필터 해제
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        <GroupList 
          selectedCategory={selectedCategory} 
          searchQuery={searchQuery}
          selectedRegion={selectedRegion}
          selectedDays={selectedDays}
          filterDate={filterDate}
          hideClosed={hideClosed}
          onlyRanker={onlyRanker}
          gender={gender}
          includeCompleted={includeCompleted}
          onGroupClick={onGroupClick}
          refreshTrigger={refreshTrigger}
          mapBounds={mapBounds}
          matchType={matchType}
          userCoords={userCoords}
          onGroupsChange={onGroupsChange}
          onLoadingChange={onLoadingChange}
          groupsOverride={facilityFilter?.groups ?? undefined}
        />
      </div>
    </div>
  );
};

export default GroupListPanel;
