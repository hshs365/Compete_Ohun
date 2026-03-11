import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import GroupList from './GroupList';
import DateFilterChips from './DateFilterChips';
import DynamicFilterBar from './DynamicFilterBar';
import MercenaryDetailDrawer from './MercenaryDetailDrawer';
import MercenaryQRScanner from './MercenaryQRScanner';
import MercenaryJobseekerDashboard from './MercenaryJobseekerDashboard';
import MercenaryRecruitForm from './MercenaryRecruitForm';
import { SPORT_ICONS, MAIN_CATEGORIES, SPORT_POINT_COLORS, SPORT_CHIP_STYLES } from '../constants/sports';
import { getUserCity, getCityCoordinates } from '../utils/locationUtils';
import type { SelectedGroup } from '../types/selected-group';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import { showInfo } from '../utils/swal';
import { UserPlusIcon, UserCircleIcon, PlusIcon, CameraIcon } from '@heroicons/react/24/outline';

/** 용병 메인 페이지: 용병 구하기 / 용병 신청 */
const MercenaryHomePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
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
  const [filterByActivityTime, setFilterByActivityTime] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<SelectedGroup | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [recruitFormOpen, setRecruitFormOpen] = useState(false);
  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  const [optimisticParticipantCount, setOptimisticParticipantCount] = useState<{
    groupId: number;
    participantCount: number;
  } | null>(null);
  /** 지역별(용병) 목록 종목별 개수 — 용병 신청 안 한 유저일 때 정렬용 */
  const [categoryCountsFromRegion, setCategoryCountsFromRegion] = useState<Record<string, number>>({});
  /** 내 활동 통계(종목별 참여 횟수) — 용병 명함 등록 유저일 때 정렬용 */
  const [activityCategoryStats, setActivityCategoryStats] = useState<Record<string, number>>({});

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

  // URL ?group=id 처리: 알림 등에서 구인글 상세로 진입
  useEffect(() => {
    const groupId = searchParams.get('group');
    if (!groupId) return;
    const id = parseInt(groupId, 10);
    if (Number.isNaN(id)) return;
    setSearchParams({}, { replace: true });
    api
      .get<{ id: number; name: string; location: string; latitude: number; longitude: number; participantCount: number; maxParticipants?: number | null; category: string; type?: 'normal' | 'rank' | 'event'; description?: string; meetingTime?: string; contact?: string; equipment?: string[]; isActive?: boolean }>(`/api/groups/${id}`)
      .then((g) => {
        if (g.isActive === false) {
          showInfo('취소된 매치입니다.', '취소된 매치');
          return;
        }
        const selected: SelectedGroup = {
          id: g.id,
          name: g.name,
          location: g.location,
          coordinates: [Number(g.latitude), Number(g.longitude)],
          memberCount: g.participantCount,
          maxParticipants: g.maxParticipants ?? undefined,
          category: g.category,
          type: g.type,
          description: g.description,
          meetingTime: g.meetingTime,
          contact: g.contact,
          equipment: g.equipment || [],
        };
        setActiveTab('find');
        setSelectedGroup(selected);
      })
      .catch(() => {});
  }, [searchParams, setSearchParams]);

  // 용병 명함에 종목이 등록된 유저: 종목별 참여 횟수 로드 (자주 참여한 순 정렬용)
  useEffect(() => {
    const sports = user?.interestedSports;
    if (!user || !sports?.length) {
      setActivityCategoryStats({});
      return;
    }
    api
      .get<{ categoryStats: Record<string, number> }>('/api/groups/my-activity-stats')
      .then((res) => setActivityCategoryStats(res.categoryStats ?? {}))
      .catch(() => setActivityCategoryStats({}));
  }, [user?.id, user?.interestedSports?.length]);

  /** 종목 칩 표시 순서: 용병 명함 등록 시 참여 많은 순, 미등록 시 지역별 목록 많은 순 */
  const sortedCategories = useMemo(() => {
    const rest = (MAIN_CATEGORIES as readonly string[]).filter((c) => c !== '전체');
    const hasProfile = (user?.interestedSports?.length ?? 0) > 0;
    if (hasProfile && Object.keys(activityCategoryStats).length > 0) {
      const registered = user!.interestedSports!;
      const byParticipation = [...registered].sort(
        (a, b) => (activityCategoryStats[b] ?? 0) - (activityCategoryStats[a] ?? 0)
      );
      const others = rest.filter((c) => !registered.includes(c));
      return ['전체', ...byParticipation, ...others];
    }
    const byCount = [...rest].sort(
      (a, b) => (categoryCountsFromRegion[b] ?? 0) - (categoryCountsFromRegion[a] ?? 0)
    );
    return ['전체', ...byCount];
  }, [user?.interestedSports, activityCategoryStats, categoryCountsFromRegion]);

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

          {/* 종목 필터 (종목별 상징 컬러 칩): 미등록=지역별 많은 순, 등록=참여 많은 순 */}
          <section className="flex-shrink-0 px-4 py-2 flex gap-2 overflow-x-auto bg-[var(--color-bg-card)]">
            {sortedCategories.map((cat) => {
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
                    isActive ? `${chipStyle.bg} ${chipStyle.border} text-[var(--color-text-primary)]` : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] border-transparent'
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
            showActivityCheckbox={!!user}
            filterByActivityTime={filterByActivityTime}
            onActivityTimeFilterChange={setFilterByActivityTime}
          />

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
              showEmptyWriteButton={!!user}
              optimisticParticipantCount={optimisticParticipantCount}
              onCategoryCountsChange={setCategoryCountsFromRegion}
              filterByActivityTime={filterByActivityTime}
              activityTimeSlots={user?.mercenaryAvailability}
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
        />
      )}

      {/* FAB: QR 스캔 (왼쪽) — 용병 구하기 탭, 모바일에서만 표시, 로그인 시에만 */}
      {activeTab === 'find' && user && (
        <button
          type="button"
          onClick={() => setQrScannerOpen(true)}
          className="md:hidden fixed bottom-28 left-6 z-[9010] flex items-center justify-center w-12 h-12 rounded-2xl text-white font-semibold shadow-lg hover:opacity-95 active:scale-[0.98] transition-all bg-[var(--color-bg-secondary)] border border-[var(--color-border-card)] text-[var(--color-text-primary)]"
          aria-label="QR 인증 스캔"
        >
          <CameraIcon className="w-6 h-6 shrink-0" aria-hidden />
        </button>
      )}
      {/* FAB: 용병 구하기 작성 — 용병 구하기 탭, 로그인 시에만 표시 */}
      {activeTab === 'find' && user && (
        <button
          type="button"
          onClick={() => setRecruitFormOpen(true)}
          className="fixed bottom-28 right-6 md:bottom-8 md:right-8 z-[9010] flex items-center justify-center gap-2.5 h-12 px-5 rounded-2xl text-white font-semibold text-[15px] leading-[1] shadow-lg hover:opacity-95 active:scale-[0.98] transition-all md:safe-area-bottom"
          style={{ backgroundColor: pointColor }}
          aria-label="용병 구하기 작성"
        >
          <PlusIcon className="w-5 h-5 shrink-0 stroke-[2.5]" aria-hidden />
          <span className="leading-[1] -mt-px">용병 구하기</span>
        </button>
      )}

      <MercenaryQRScanner
        isOpen={qrScannerOpen}
        onClose={() => setQrScannerOpen(false)}
      />

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
