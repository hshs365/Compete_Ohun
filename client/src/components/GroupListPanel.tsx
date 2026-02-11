import React, { useState, useEffect } from 'react';
import GroupList from './GroupList';
import SearchOptionsModal, { type MapViewLevel } from './SearchOptionsModal';
import { MagnifyingGlassIcon, MapPinIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { KOREAN_CITIES, getRegionDisplayName, getUserCity, getCityCoordinates, getRegionChildren, parseRegionToHierarchy, type KoreanCity } from '../utils/locationUtils';
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
  /** 지도 기본 보기 단위 (시/구/동) */
  mapViewLevel?: MapViewLevel;
  onMapViewLevelChange?: (level: MapViewLevel) => void;
}

const GroupListPanel = ({ selectedCategory, onGroupClick, refreshTrigger, selectedRegion: propSelectedRegion, onRegionChange, selectedCity: propSelectedCity, onCityChange, selectedDays = [], onDaysChange, matchType = 'general', onMatchTypeChange, matchTypeTheme = false, onGroupsChange, onLoadingChange, mapViewLevel = 'sido', onMapViewLevelChange, facilityFilter = null, onClearFacilityFilter }: GroupListPanelProps) => {
  const { user } = useAuth();
  const propRegion = propSelectedRegion ?? (propSelectedCity as string) ?? null;
  const onRegionChangeActual = onRegionChange ?? (onCityChange ? (r: string) => onCityChange(r as KoreanCity) : undefined);
  // 내 주소지(도시) 좌표: 거리순 정렬용. 로그인 + 주소/도시 있으면 사용
  const userCoords = (() => {
    if (!user) return null;
    const userCity = getUserCity(user.id, { residenceAddress: user.residenceAddress, residenceSido: user.residenceSido });
    if (!userCity || userCity === '전체') return null;
    return getCityCoordinates(userCity);
  })();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>(propRegion || '전체');
  const [openRegionDropdown, setOpenRegionDropdown] = useState<1 | 2 | 3 | null>(null);
  const [isSearchOptionsOpen, setIsSearchOptionsOpen] = useState(false);
  const hierarchy = parseRegionToHierarchy(selectedRegion);
  const guList = hierarchy.sido && hierarchy.sido !== '전체' ? getRegionChildren(hierarchy.sido) : [];
  const dongList = hierarchy.gu ? getRegionChildren(hierarchy.gu) : [];
  const [hideClosed, setHideClosed] = useState(true); // 기본적으로 마감된 모임 숨기기
  const [onlyRanker, setOnlyRanker] = useState(false);
  const [gender, setGender] = useState<'male' | 'female' | null>(null);
  const [includeCompleted, setIncludeCompleted] = useState(false); // 종료된 모임 포함 여부

  // prop으로 전달된 선택 지역이 변경되면 내부 state 업데이트
  useEffect(() => {
    if (propRegion) {
      setSelectedRegion(propRegion);
    }
  }, [propRegion]);

  // 시설 필터 적용 시 검색 인풋에 시설명 표시
  useEffect(() => {
    if (facilityFilter) {
      setSearchQuery(facilityFilter.facilityName);
    }
  }, [facilityFilter]);

  // 사용자 위치 기반으로 기본 지역 설정 (prop이 없을 때만)
  useEffect(() => {
    if (!propRegion && user?.id) {
      const userCity = getUserCity(user.id);
      if (userCity) {
        setSelectedRegion(userCity);
        if (onRegionChangeActual) onRegionChangeActual(userCity);
      }
    }
  }, [propRegion, onRegionChangeActual, user?.id]);

  // 시 단위 선택 시: 구/동이 선택돼 있으면 시로 되돌려서 1개 드롭다운과 일치시키기
  useEffect(() => {
    if (mapViewLevel !== 'sido') return;
    if (hierarchy.sido && hierarchy.sido !== '전체' && hierarchy.gu) {
      setSelectedRegion(hierarchy.sido);
      onRegionChangeActual?.(hierarchy.sido);
    }
  }, [mapViewLevel, selectedRegion, hierarchy.sido, hierarchy.gu, onRegionChangeActual]);

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

      {/* 검색창 (1행) */}
      <div className="space-y-2.5 mb-3">
        <div className="relative flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-0">
            <input
              type="text"
              placeholder="매치 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-2 pl-10 pr-3 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-card)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
            />
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--color-text-secondary)]" aria-hidden />
          </div>
          {facilityFilter && onClearFacilityFilter && (
            <button
              onClick={() => {
                onClearFacilityFilter();
                setSearchQuery('');
              }}
              className="p-2 border border-amber-500/60 rounded-lg bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 transition-colors text-xs font-medium whitespace-nowrap"
              title="시설 필터 해제"
            >
              필터 해제
            </button>
          )}
        </div>

        {/* 매치지역: 시 · 구 · (동) 가로 드롭다운 + 오른쪽 끝에 지도/검색 옵션 버튼 */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <MapPinIcon className="h-4 w-4 shrink-0 text-[var(--color-text-secondary)]" aria-hidden />
          {/* 1) 시/도 */}
          <div className="relative flex-1 min-w-0">
            <button
              type="button"
              onClick={() => setOpenRegionDropdown(openRegionDropdown === 1 ? null : 1)}
              className="w-full flex items-center justify-between gap-1 px-2.5 py-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-card)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] transition-colors text-sm"
            >
              <span className="truncate">{getRegionDisplayName(hierarchy.sido)}</span>
              <svg className="h-3.5 w-3.5 shrink-0 text-[var(--color-text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {openRegionDropdown === 1 && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setOpenRegionDropdown(null)} aria-hidden />
                <div className="absolute top-full left-0 mt-1 min-w-[140px] max-h-56 overflow-y-auto bg-[var(--color-bg-card)] border border-[var(--color-border-card)] rounded-lg shadow-lg z-20 py-1">
                  {KOREAN_CITIES.map((sido) => (
                    <button
                      key={sido}
                      type="button"
                      onClick={() => {
                        setSelectedRegion(sido);
                        setOpenRegionDropdown(null);
                        onRegionChangeActual?.(sido);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm ${
                        hierarchy.sido === sido ? 'bg-[var(--color-blue-primary)] text-white' : 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]'
                      }`}
                    >
                      {getRegionDisplayName(sido)}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          {/* 2) 구 (구 단위·동 단위일 때만 표시. 시 단위일 땐 1개 드롭다운만) */}
          {hierarchy.sido && hierarchy.sido !== '전체' && guList.length > 0 && (mapViewLevel === 'gu' || mapViewLevel === 'dong') && (
            <div className="relative flex-1 min-w-0">
              <button
                type="button"
                onClick={() => guList.length > 0 && setOpenRegionDropdown(openRegionDropdown === 2 ? null : 2)}
                className="w-full flex items-center justify-between gap-1 px-2.5 py-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-card)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] transition-colors text-sm disabled:opacity-60"
                disabled={guList.length === 0}
              >
                <span className="truncate">
                  {hierarchy.gu ? (guList.find((g) => g.fullName === hierarchy.gu)?.displayName ?? hierarchy.gu) : '시 전체'}
                </span>
                <svg className="h-3.5 w-3.5 shrink-0 text-[var(--color-text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              {openRegionDropdown === 2 && guList.length > 0 && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setOpenRegionDropdown(null)} aria-hidden />
                  <div className="absolute top-full left-0 mt-1 min-w-[120px] max-h-56 overflow-y-auto bg-[var(--color-bg-card)] border border-[var(--color-border-card)] rounded-lg shadow-lg z-20 py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRegion(hierarchy.sido);
                        setOpenRegionDropdown(null);
                        onRegionChangeActual?.(hierarchy.sido);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm ${
                        !hierarchy.gu ? 'bg-[var(--color-blue-primary)] text-white' : 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]'
                      }`}
                    >
                      시 전체
                    </button>
                    {guList.map((gu) => (
                      <button
                        key={gu.fullName}
                        type="button"
                        onClick={() => {
                          setSelectedRegion(gu.fullName);
                          setOpenRegionDropdown(null);
                          onRegionChangeActual?.(gu.fullName);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm ${
                          hierarchy.gu === gu.fullName ? 'bg-[var(--color-blue-primary)] text-white' : 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]'
                        }`}
                      >
                        {gu.displayName}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
          {/* 3) 동 (구 선택 시 + 지도 기본보기 '동 단위'일 때만 표시) */}
          {hierarchy.gu && mapViewLevel === 'dong' && (
            <div className="relative flex-1 min-w-0">
              <button
                type="button"
                onClick={() => dongList.length > 0 && setOpenRegionDropdown(openRegionDropdown === 3 ? null : 3)}
                className="w-full flex items-center justify-between gap-1 px-2.5 py-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-card)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] transition-colors text-sm disabled:opacity-60"
                disabled={dongList.length === 0}
              >
                <span className="truncate">
                  {hierarchy.dong ? (dongList.find((d) => d.fullName === hierarchy.dong)?.displayName ?? hierarchy.dong) : '구 전체'}
                </span>
                <svg className="h-3.5 w-3.5 shrink-0 text-[var(--color-text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              {openRegionDropdown === 3 && dongList.length > 0 && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setOpenRegionDropdown(null)} aria-hidden />
                  <div className="absolute top-full left-0 mt-1 min-w-[100px] max-h-56 overflow-y-auto bg-[var(--color-bg-card)] border border-[var(--color-border-card)] rounded-lg shadow-lg z-20 py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRegion(hierarchy.gu);
                        setOpenRegionDropdown(null);
                        onRegionChangeActual?.(hierarchy.gu!);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm ${
                        !hierarchy.dong ? 'bg-[var(--color-blue-primary)] text-white' : 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]'
                      }`}
                    >
                      구 전체
                    </button>
                    {dongList.map((dong) => (
                      <button
                        key={dong.fullName}
                        type="button"
                        onClick={() => {
                          setSelectedRegion(dong.fullName);
                          setOpenRegionDropdown(null);
                          onRegionChangeActual?.(dong.fullName);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm ${
                          hierarchy.dong === dong.fullName ? 'bg-[var(--color-blue-primary)] text-white' : 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]'
                        }`}
                      >
                        {dong.displayName}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
          {/* 지도/검색 옵션 버튼 — 지역 행 오른쪽 끝에 배치 */}
          <button
            onClick={() => setIsSearchOptionsOpen(true)}
            className="ml-auto p-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-card)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] transition-colors shrink-0"
            aria-label="검색 옵션"
            title="검색 옵션 (요일·지도 기본 보기 등)"
          >
            <Cog6ToothIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <GroupList 
          selectedCategory={selectedCategory} 
          searchQuery={searchQuery}
          selectedRegion={selectedRegion}
          selectedDays={selectedDays}
          hideClosed={hideClosed}
          onlyRanker={onlyRanker}
          gender={gender}
          includeCompleted={includeCompleted}
          onGroupClick={onGroupClick}
          refreshTrigger={refreshTrigger}
          matchType={matchType}
          userCoords={userCoords}
          onGroupsChange={onGroupsChange}
          onLoadingChange={onLoadingChange}
          groupsOverride={facilityFilter?.groups ?? undefined}
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
        mapViewLevel={mapViewLevel}
        onMapViewLevelChange={onMapViewLevelChange}
      />
    </div>
  );
};

export default GroupListPanel;
