import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import GroupListPanel from './components/GroupListPanel';
import CategoryFilter from './components/CategoryFilter';
import NaverMapPanel from './components/NaverMapPanel';
import type { SelectedGroup } from './types/selected-group';
import GroupDetail from './components/GroupDetail';
import MultiStepCreateGroup from './components/MultiStepCreateGroup';
import NotificationPanel from './components/NotificationPanel';
import MapControlPanel from './components/MapControlPanel';
import { api } from './utils/api';
import { getUserCity, extractCityFromAddress, type KoreanCity } from './utils/locationUtils';
import MyInfoPage from './components/MyInfoPage'; // MyInfoPage 컴포넌트 import
import MySchedulePage from './components/MySchedulePage'; // MySchedulePage 컴포넌트 import
import ContactPage from './components/ContactPage'; // ContactPage 컴포넌트 import
import SettingsPage from './components/SettingsPage'; // SettingsPage 컴포넌트 import
import LoginPage from './components/LoginPage'; // LoginPage 컴포넌트 import
import MultiStepRegister from './components/MultiStepRegister'; // MultiStepRegister 컴포넌트 import
import CompleteProfilePage from './components/CompleteProfilePage'; // CompleteProfilePage 컴포넌트 import
import OAuthCallbackPage from './components/OAuthCallbackPage'; // OAuthCallbackPage 컴포넌트 import
import NoticePage from './components/NoticePage'; // NoticePage 컴포넌트 import
import FacilityReservationPage from './components/FacilityReservationPage'; // FacilityReservationPage 컴포넌트 import
import HallOfFamePage from './components/HallOfFamePage'; // HallOfFamePage 컴포넌트 import
import FavoritesPage from './components/FavoritesPage'; // FavoritesPage 컴포넌트 import
import SportsEquipmentPage from './components/SportsEquipmentPage'; // SportsEquipmentPage 컴포넌트 import
import EventMatchPage from './components/EventMatchPage'; // EventMatchPage 컴포넌트 import
import FollowersPage from './components/FollowersPage'; // FollowersPage 컴포넌트 import
import TeamsPage from './components/TeamsPage'; // TeamsPage 컴포넌트 import
import TeamDetailPage from './components/TeamDetailPage'; // TeamDetailPage 컴포넌트 import
import { AuthProvider, useAuth } from './contexts/AuthContext';
import WelcomeGuide from './components/WelcomeGuide';
import LoadingSpinner from './components/LoadingSpinner';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import './style.css';

// 테마 컨텍스트 생성
type ThemeContextType = {
  theme: string;
  setTheme: (theme: string) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

// 기존 대시보드 레이아웃
const DashboardLayout = () => {
  const { user, isLoading } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<SelectedGroup | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [allGroups, setAllGroups] = useState<SelectedGroup[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  // localStorage에서 저장된 도시 선택 복원 (초기에는 null로 시작)
  const [selectedCity, setSelectedCity] = useState<KoreanCity | null>(null);
  const [selectedDays, setSelectedDays] = useState<number[]>([]); // 검색 옵션: 선택된 요일
  const [showWelcomeGuide, setShowWelcomeGuide] = useState(false);
  const [mapLayers, setMapLayers] = useState({
    rankers: false,
    events: false,
    popularSpots: false,
  });

  // 사용자 위치 기반으로 초기 도시 설정 (localStorage의 selectedCity 무시)
  useEffect(() => {
    const userCity = getUserCity();
    if (userCity) {
      setSelectedCity(userCity);
    }
  }, []);

  // 사용자 위치 변경 시 selectedCity 업데이트
  useEffect(() => {
    const handleLocationUpdate = () => {
      const userCity = getUserCity();
      if (userCity) {
        // '전체'가 아닐 때만 자동 업데이트 (사용자가 '전체'를 선택한 경우 유지)
        setSelectedCity((prev) => {
          if (prev === '전체') {
            return prev; // '전체' 선택은 유지
          }
          return userCity; // 새로운 위치의 도시로 업데이트
        });
      }
    };

    // 초기 로드 시 한 번 실행
    handleLocationUpdate();

    // userLocationUpdated 이벤트 리스너
    window.addEventListener('userLocationUpdated', handleLocationUpdate);
    
    // storage 이벤트 리스너 (다른 탭에서 변경 시)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'userLocation') {
        handleLocationUpdate();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('userLocationUpdated', handleLocationUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // selectedCity 변경 시 localStorage에 저장 (단, '전체'가 아닐 때만)
  useEffect(() => {
    if (selectedCity && selectedCity !== '전체') {
      try {
        localStorage.setItem('selectedCity', selectedCity);
      } catch (e) {
        // 무시
      }
    }
  }, [selectedCity]);

  // 신규 사용자 체크 및 가이드 표시
  useEffect(() => {
    if (!isLoading && user) {
      // 가이드가 이미 완료되었는지 확인
      const guideCompleted = localStorage.getItem('welcome_guide_completed');
      if (!guideCompleted) {
        // 회원가입 후 첫 방문인 경우 가이드 표시
        setShowWelcomeGuide(true);
      }
    }
  }, [user, isLoading]);

  const handleGroupClick = (group: SelectedGroup) => {
    setSelectedGroup(group);
  };

  const handleCloseDetail = () => {
    setSelectedGroup(null);
  };

  const handleCreateGroup = (groupData: Omit<SelectedGroup, 'id'>) => {
    // API 호출은 CreateGroupModal에서 처리
  };

  const handleGroupCreated = () => {
    // 모임 생성 성공 시 목록 새로고침
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleParticipantChange = () => {
    // 참가자 수 변경 시 목록 새로고침
    setRefreshTrigger((prev) => prev + 1);
  };

  // 카테고리 변경 시 상세보기 닫기
  const handleCategoryChange = (category: string | null) => {
    setSelectedCategory(category);
    // 상세보기가 열려있으면 닫기
    if (selectedGroup) {
      setSelectedGroup(null);
    }
  };

  // 모든 그룹 목록 가져오기 (지도 마커용)
  useEffect(() => {
    const fetchAllGroups = async () => {
      try {
        setIsLoadingGroups(true);
        const category = selectedCategory === '전체' || selectedCategory === null ? undefined : selectedCategory;
        const queryParams = new URLSearchParams();
        
        if (category) {
          queryParams.append('category', category);
        }
        queryParams.append('limit', '1000'); // 충분히 많은 데이터 가져오기 (지역 필터링을 위해)

        const response = await api.get<{ groups: any[]; total: number }>(
          `/api/groups?${queryParams.toString()}`
        );

        let mappedGroups: SelectedGroup[] = response.groups.map((group) => ({
          id: group.id,
          name: group.name,
          location: group.location,
          coordinates: [parseFloat(group.latitude.toString()), parseFloat(group.longitude.toString())] as [number, number],
          memberCount: group.participantCount,
          category: group.category,
          description: group.description || undefined,
          meetingTime: group.meetingTime || undefined,
          contact: group.contact || undefined,
          equipment: group.equipment || [],
        }));

        // ⭐ 날짜 필터링: 오늘부터 7일 이내 모임만 표시
        const today = new Date();
        today.setHours(0, 0, 0, 0); // 오늘 00:00:00

        const sevenDaysLater = new Date(today);
        sevenDaysLater.setDate(today.getDate() + 7); // 7일 후 00:00:00

        mappedGroups = mappedGroups.filter((group) => {
          // 일정이 없으면 표시하지 않음
          if (!group.meetingTime) return false;

          // meetingTime 파싱
          let meetingDate: Date | null = null;
          const meetingTimeStr = group.meetingTime.trim();

          if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(meetingTimeStr)) {
            // datetime-local 형식 (YYYY-MM-DDTHH:MM)
            meetingDate = new Date(meetingTimeStr);
          } else if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}$/.test(meetingTimeStr)) {
            // "YYYY-MM-DD HH:MM" 형식
            meetingDate = new Date(meetingTimeStr.replace(' ', 'T'));
          } else if (/^\d{4}-\d{2}-\d{2}$/.test(meetingTimeStr)) {
            // "YYYY-MM-DD" 형식
            meetingDate = new Date(meetingTimeStr + 'T00:00:00');
          } else {
            // 기타 형식 시도
            meetingDate = new Date(meetingTimeStr);
          }

          if (!meetingDate || isNaN(meetingDate.getTime())) {
            return false; // 파싱 실패 시 표시하지 않음
          }

          // 날짜만 비교 (시간 제외)
          const meetingDateOnly = new Date(meetingDate);
          meetingDateOnly.setHours(0, 0, 0, 0);

          // 오늘부터 7일 이내인지 확인
          return meetingDateOnly >= today && meetingDateOnly < sevenDaysLater;
        });

        // ⭐ 지역 필터링: 선택된 도시에 해당하는 모임만 표시
        if (selectedCity && selectedCity !== '전체') {
          mappedGroups = mappedGroups.filter((group) => {
            const groupCity = extractCityFromAddress(group.location);
            return groupCity === selectedCity;
          });
        }

        setAllGroups(mappedGroups);
      } catch (err) {
        console.error('모임 목록 조회 실패:', err);
        setAllGroups([]);
      } finally {
        setIsLoadingGroups(false);
      }
    };

    fetchAllGroups();
  }, [selectedCategory, selectedCity, refreshTrigger]);

  return (
    <div className="flex flex-col md:flex-row h-full w-full overflow-hidden" style={{ height: '100%', display: 'flex' }}>
      {/* 모바일: 카테고리 필터를 상단에 */}
      <div className="md:hidden w-full border-b border-[var(--color-border-card)] flex-shrink-0">
        <CategoryFilter
          selectedCategory={selectedCategory}
          setSelectedCategory={handleCategoryChange}
          selectedCity={selectedCity}
        />
      </div>
      
      {/* 데스크톱: GroupListPanel과 CategoryFilter */}
      <div className="hidden md:flex flex-shrink-0">
        <GroupListPanel 
          selectedCategory={selectedCategory} 
          onGroupClick={handleGroupClick}
          refreshTrigger={refreshTrigger}
          selectedCity={selectedCity}
          onCityChange={setSelectedCity}
          selectedDays={selectedDays}
          onDaysChange={setSelectedDays}
        />
        <CategoryFilter
          selectedCategory={selectedCategory}
          setSelectedCategory={handleCategoryChange}
          selectedCity={selectedCity}
        />
      </div>
      
      {/* 모바일: GroupListPanel을 상단에 (상세보기 열릴 때는 숨김) */}
      {!selectedGroup && (
        <div className="md:hidden w-full border-b border-[var(--color-border-card)] flex-shrink-0">
          <GroupListPanel 
            selectedCategory={selectedCategory} 
            onGroupClick={handleGroupClick}
            refreshTrigger={refreshTrigger}
          />
        </div>
      )}
      
      {/* 상세보기 패널 (데스크톱: 우측, 모바일: 전체) */}
      {selectedGroup && (
        <>
          {/* 모바일: 뒤로가기 버튼 */}
          <div className="md:hidden w-full border-b border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-2 flex-shrink-0">
            <button
              onClick={handleCloseDetail}
              className="flex items-center space-x-2 text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] px-3 py-2 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>목록으로</span>
            </button>
          </div>
          <GroupDetail 
            group={selectedGroup} 
            onClose={handleCloseDetail}
            onParticipantChange={handleParticipantChange}
          />
        </>
      )}
      
      {/* 지도 영역 */}
      <main className="flex-1 relative overflow-hidden" style={{ height: '100%', minHeight: 0, flex: '1 1 0%' }}>
        {isLoadingGroups ? (
          <LoadingSpinner overlay message="매치 목록을 불러오는 중..." />
        ) : (
          <>
            <NaverMapPanel 
              selectedGroup={selectedGroup}
              allGroups={allGroups}
              onCreateGroupClick={() => setIsCreateModalOpen(true)}
              onGroupClick={handleGroupClick}
              selectedCity={selectedCity}
              selectedCategory={selectedCategory}
              mapLayers={mapLayers}
            />
            {/* 지도 제어 패널 - 네이버지도 스타일 */}
            <MapControlPanel
              selectedCity={selectedCity}
              onToggleRankerMeetings={(enabled) => setMapLayers((prev) => ({ ...prev, rankers: enabled }))}
              onToggleEventMatches={(enabled) => setMapLayers((prev) => ({ ...prev, events: enabled }))}
              onTogglePopularSpots={(enabled) => setMapLayers((prev) => ({ ...prev, popularSpots: enabled }))}
            />
            {/* 가이드 다시보기 버튼 - 지도 영역 왼쪽 하단 */}
            <button
              onClick={() => setShowWelcomeGuide(true)}
              className="absolute bottom-6 left-6 z-[9998] w-10 h-10 bg-[var(--color-bg-card)] border border-[var(--color-border-card)] rounded-lg shadow-lg flex items-center justify-center hover:bg-[var(--color-bg-secondary)] transition-colors group"
              title="가이드 다시보기"
              aria-label="가이드 다시보기"
            >
              <QuestionMarkCircleIcon className="w-5 h-5 text-[var(--color-text-primary)] group-hover:text-[var(--color-blue-primary)] transition-colors" />
            </button>
          </>
        )}
      </main>
      
      {/* 새 모임 만들기 모달 */}
      <MultiStepCreateGroup
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateGroup}
        onSuccess={handleGroupCreated}
      />

      {/* 환영 가이드 모달 */}
      {showWelcomeGuide && (
        <WelcomeGuide 
          onClose={() => {
            setShowWelcomeGuide(false);
            // 가이드가 완료되었는지 확인 (닫기만 한 경우와 완료한 경우 구분)
            const guideCompleted = localStorage.getItem('welcome_guide_completed');
            if (!guideCompleted) {
              // 완료하지 않고 닫은 경우, 다음에 다시 표시하지 않도록 설정
              localStorage.setItem('welcome_guide_completed', 'true');
            }
          }} 
        />
      )}
    </div>
  );
};

// 인증 필요 라우트 가드 (개인 정보가 필요한 페이지)
const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner fullScreen message="인증 정보를 확인하는 중..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!user.isProfileComplete) {
    return <Navigate to="/auth/complete-profile" replace />;
  }

  return children;
};

// 공개 라우트 가드 (로그인 없이 접근 가능)
const PublicRoute = ({ children }: { children: React.ReactElement }) => {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner fullScreen message="로딩 중..." />;
  }

  return children;
};

// 메인 레이아웃 컴포넌트
const MainLayout = () => {
  return (
    <PublicRoute>
      <div className="flex h-screen bg-[var(--color-bg-primary)] overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <Routes>
            {/* 공개 접근 가능한 페이지 */}
            <Route index element={<DashboardLayout />} />
            <Route path="hall-of-fame" element={<HallOfFamePage />} />
            <Route path="notice" element={<NoticePage />} />
            <Route path="contact" element={<ContactPage />} />
            
            {/* 인증이 필요한 페이지 */}
            <Route path="my-info" element={
              <ProtectedRoute>
                <MyInfoPage />
              </ProtectedRoute>
            } />
            <Route path="my-schedule" element={
              <ProtectedRoute>
                <MySchedulePage />
              </ProtectedRoute>
            } />
            <Route path="facility-reservation" element={
              <ProtectedRoute>
                <FacilityReservationPage />
              </ProtectedRoute>
            } />
            <Route path="favorites" element={
              <ProtectedRoute>
                <FavoritesPage />
              </ProtectedRoute>
            } />
            <Route path="sports-equipment" element={
              <ProtectedRoute>
                <SportsEquipmentPage />
              </ProtectedRoute>
            } />
            <Route path="event-match" element={
              <ProtectedRoute>
                <EventMatchPage />
              </ProtectedRoute>
            } />
            <Route path="teams" element={
              <ProtectedRoute>
                <TeamsPage />
              </ProtectedRoute>
            } />
            <Route path="teams/:teamId" element={
              <ProtectedRoute>
                <TeamDetailPage />
              </ProtectedRoute>
            } />
            <Route path="followers" element={
              <ProtectedRoute>
                <FollowersPage />
              </ProtectedRoute>
            } />
            <Route path="settings" element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
        {/* 알림 패널 - 사이드바 상단에 고정 (모든 페이지에서 표시) */}
        <NotificationPanel />
      </div>
    </PublicRoute>
  );
};

function App() {
  const [theme, setTheme] = useState<string>(() => {
    // 초기 테마를 localStorage에서 읽어오기
    return localStorage.getItem('theme') || 'light';
  });

  useEffect(() => {
    
    // 테마 변경 시 document에 dark 클래스 추가/제거 및 localStorage 저장
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<MultiStepRegister />} />
            <Route path="/auth/complete-profile" element={<CompleteProfilePage />} />
            <Route path="/auth/oauth/callback" element={<OAuthCallbackPage />} />
            <Route path="/*" element={<MainLayout />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeContext.Provider>
  );
}

export default App;
