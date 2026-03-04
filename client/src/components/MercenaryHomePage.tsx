import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import GroupList from './GroupList';
import DateFilterChips from './DateFilterChips';
import DynamicFilterBar from './DynamicFilterBar';
import MercenaryDetailDrawer from './MercenaryDetailDrawer';
import MercenaryJobseekerDashboard from './MercenaryJobseekerDashboard';
import MercenaryRecruitForm from './MercenaryRecruitForm';
import { SPORT_ICONS, MAIN_CATEGORIES, SPORT_POINT_COLORS, SPORT_CHIP_STYLES } from '../constants/sports';
import { getUserCity, getCityCoordinates } from '../utils/locationUtils';
import type { SelectedGroup } from '../types/selected-group';
import { useAuth } from '../contexts/AuthContext';
import { UserPlusIcon, UserCircleIcon } from '@heroicons/react/24/outline';

/** 용병 메인 페이지: 용병 구하기 / 용병 신청 */
const MercenaryHomePage = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'find' | 'apply'>('find');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('mercenary_category') || null;
  });
  const [filterDate, setFilterDate] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('selectedRegion') || localStorage.getItem('selectedCity') || null;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [sportFilterValues, setSportFilterValues] = useState<Record<string, string | string[]>>({});
  const [selectedGender, setSelectedGender] = useState<'male' | 'female' | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<SelectedGroup | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [recruitFormOpen, setRecruitFormOpen] = useState(false);
  const [optimisticParticipantCount, setOptimisticParticipantCount] = useState<{
    groupId: number;
    participantCount: number;
  } | null>(null);

  useEffect(() => {
    if (!optimisticParticipantCount) return;
    const t = setTimeout(() => setOptimisticParticipantCount(null), 2500);
    return () => clearTimeout(t);
  }, [optimisticParticipantCount]);

  useEffect(() => {
    if (selectedCategory) {
      try {
        localStorage.setItem('mercenary_category', selectedCategory);
      } catch (e) {
        /* ignore */
      }
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (!user && !authLoading) {
      setSelectedRegion('전체');
      return;
    }
    if (!user) return;
    const apiResidence = user.residenceAddress != null || user.residenceSido != null
      ? { residenceAddress: user.residenceAddress ?? undefined, residenceSido: user.residenceSido ?? undefined }
      : undefined;
    const userCity = getUserCity(user.id, apiResidence);
    if (userCity && (!selectedRegion || selectedRegion === '전체')) {
      setSelectedRegion(userCity);
    }
  }, [user, authLoading]);

  const userCoords = useMemo(() => {
    if (!user) return null;
    const userCity = getUserCity(user.id, { residenceAddress: user.residenceAddress, residenceSido: user.residenceSido });
    if (!userCity || userCity === '전체') return null;
    return getCityCoordinates(userCity);
  }, [user?.id, user?.residenceAddress, user?.residenceSido]);

  const handleParticipantChange = (updated?: { id: number; participantCount: number }) => {
    if (updated) {
      setOptimisticParticipantCount(updated);
    }
    setRefreshTrigger((prev) => prev + 1);
  };

  const effectiveSport = selectedCategory || '전체';
  const pointColor = SPORT_POINT_COLORS[effectiveSport] ?? SPORT_POINT_COLORS['전체'];

  return (
    <div className="flex flex-col min-h-full pb-20 md:pb-4">
      {/* 헤더 */}
      <header className="flex-shrink-0 sticky top-0 z-30 bg-[var(--color-bg-card)] border-b border-[var(--color-border-card)] safe-area-top">
        <h1 className="sr-only">용병</h1>
        <div className="flex gap-1 p-2">
          <button
            type="button"
            onClick={() => setActiveTab('find')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-colors ${
              activeTab === 'find'
                ? 'text-white'
                : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]'
            }`}
            style={activeTab === 'find' ? { backgroundColor: pointColor } : undefined}
          >
            <UserPlusIcon className="w-5 h-5" />
            용병 구하기
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('apply')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-colors ${
              activeTab === 'apply'
                ? 'text-white'
                : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]'
            }`}
            style={activeTab === 'apply' ? { backgroundColor: pointColor } : undefined}
          >
            <UserCircleIcon className="w-5 h-5" />
            용병 신청
          </button>
        </div>
      </header>

      {activeTab === 'find' ? (
        <>
          {/* 공통: 경기 날짜 필터 */}
          <section className="flex-shrink-0 px-4 py-2 bg-[var(--color-bg-card)] border-b border-[var(--color-border-card)]">
            <DateFilterChips
              selectedDate={filterDate}
              onDateChange={setFilterDate}
              daysCount={14}
            />
          </section>

          {/* 종목 필터 (종목별 상징 컬러 칩) */}
          <section className="flex-shrink-0 px-4 py-2 flex gap-2 overflow-x-auto bg-[var(--color-bg-card)]">
            {(MAIN_CATEGORIES as readonly string[]).map((cat) => {
              const isActive = (cat === '전체' && !selectedCategory) || selectedCategory === cat;
              const chipStyle = SPORT_CHIP_STYLES[cat] ?? SPORT_CHIP_STYLES['전체'];
              const catColor = SPORT_POINT_COLORS[cat] ?? SPORT_POINT_COLORS['전체'];
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat === '전체' ? null : cat);
                    setSportFilterValues({});
                  }}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                    isActive ? `${chipStyle.bg} ${chipStyle.border} ${chipStyle.text}` : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] border-transparent'
                  }`}
                  style={isActive ? { borderColor: catColor + '80' } : undefined}
                >
                  <span className="mr-1" aria-hidden>{SPORT_ICONS[cat] ?? '●'}</span>
                  {cat}
                </button>
              );
            })}
          </section>

          {/* 동적 검색·필터 바 */}
          <DynamicFilterBar
            selectedSport={selectedCategory}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            selectedRegion={selectedRegion}
            onRegionChange={setSelectedRegion}
            onOpenSearchOptions={() => {}}
            sportFilterValues={sportFilterValues}
            onSportFilterChange={(key, value) => setSportFilterValues((prev) => ({ ...prev, [key]: value }))}
            selectedGender={selectedGender}
            onGenderChange={setSelectedGender}
          />

          {/* 용병 구하기 작성 버튼 → 종목별 맞춤형 구인 폼 모달 */}
          <div className="flex-shrink-0 px-2 py-2 flex justify-end">
            <button
              type="button"
              onClick={() => setRecruitFormOpen(true)}
              className="px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-opacity hover:opacity-90"
              style={{ borderColor: pointColor, color: pointColor, backgroundColor: 'transparent' }}
            >
              용병 구하기
            </button>
          </div>

          {/* 용병 구하는 매치 목록 */}
          <div className="flex-1 min-h-0 overflow-y-auto px-2 pb-4">
            <GroupList
              selectedCategory={selectedCategory}
              searchQuery={searchQuery}
              sportFilterValues={Object.keys(sportFilterValues).length > 0 ? sportFilterValues : undefined}
              selectedRegion={selectedRegion}
              filterDate={filterDate}
              gender={selectedGender}
              hideClosed={true}
              onGroupClick={setSelectedGroup}
              refreshTrigger={refreshTrigger}
              matchType="general"
              userCoords={userCoords}
              mercenaryOnly={true}
              emptyStateSport={selectedCategory}
              onEmptyWriteClick={() => setRecruitFormOpen(true)}
              optimisticParticipantCount={optimisticParticipantCount}
            />
          </div>

          {selectedGroup && (
            <MercenaryDetailDrawer
              group={selectedGroup}
              onClose={() => setSelectedGroup(null)}
              onParticipantChange={handleParticipantChange}
              pointColor={pointColor}
            />
          )}
        </>
      ) : (
        /* 용병 신청 탭: 구직자 대시보드 (명함·활동상태·시간표·용병요청리스트) */
        <MercenaryJobseekerDashboard
          onRecruitFormOpen={() => setRecruitFormOpen(true)}
        />
      )}

      <MercenaryRecruitForm
        isOpen={recruitFormOpen}
        onClose={() => setRecruitFormOpen(false)}
        selectedSport={selectedCategory ?? '전체'}
        onSuccess={() => {
          setRecruitFormOpen(false);
          setRefreshTrigger((p) => p + 1);
        }}
      />
    </div>
  );
};

export default MercenaryHomePage;
