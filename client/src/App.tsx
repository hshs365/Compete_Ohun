import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import GroupListPanel from './components/GroupListPanel';
import CategoryFilter from './components/CategoryFilter';
import KakaoMapPanel from './components/KakaoMapPanel';
import type { SelectedGroup } from './components/MapPanel';
import GroupDetail from './components/GroupDetail';
import CreateGroupModal from './components/CreateGroupModal';
import { api } from './utils/api';
import MyInfoPage from './components/MyInfoPage'; // MyInfoPage 컴포넌트 import
import MySchedulePage from './components/MySchedulePage'; // MySchedulePage 컴포넌트 import
import ContactPage from './components/ContactPage'; // ContactPage 컴포넌트 import
import SettingsPage from './components/SettingsPage'; // SettingsPage 컴포넌트 import
import LoginPage from './components/LoginPage'; // LoginPage 컴포넌트 import
import RegisterPage from './components/RegisterPage'; // RegisterPage 컴포넌트 import
import CompleteProfilePage from './components/CompleteProfilePage'; // CompleteProfilePage 컴포넌트 import
import OAuthCallbackPage from './components/OAuthCallbackPage'; // OAuthCallbackPage 컴포넌트 import
import NoticePage from './components/NoticePage'; // NoticePage 컴포넌트 import
import FacilityReservationPage from './components/FacilityReservationPage'; // FacilityReservationPage 컴포넌트 import
import HallOfFamePage from './components/HallOfFamePage'; // HallOfFamePage 컴포넌트 import
import FavoritesPage from './components/FavoritesPage'; // FavoritesPage 컴포넌트 import
import SportsEquipmentPage from './components/SportsEquipmentPage'; // SportsEquipmentPage 컴포넌트 import
import EventMatchPage from './components/EventMatchPage'; // EventMatchPage 컴포넌트 import
import { AuthProvider, useAuth } from './contexts/AuthContext';
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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<SelectedGroup | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [allGroups, setAllGroups] = useState<SelectedGroup[]>([]);

  const handleGroupClick = (group: SelectedGroup) => {
    setSelectedGroup(group);
  };

  const handleCloseDetail = () => {
    setSelectedGroup(null);
  };

  const handleCreateGroup = (groupData: Omit<SelectedGroup, 'id'>) => {
    // API 호출은 CreateGroupModal에서 처리하므로 여기서는 콘솔만 출력
    console.log('새 모임 생성 완료:', groupData);
  };

  const handleGroupCreated = () => {
    // 모임 생성 성공 시 목록 새로고침
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleParticipantChange = () => {
    // 참가자 수 변경 시 목록 새로고침
    setRefreshTrigger((prev) => prev + 1);
  };

  // 모든 그룹 목록 가져오기 (지도 마커용)
  useEffect(() => {
    const fetchAllGroups = async () => {
      try {
        const category = selectedCategory === '전체' || selectedCategory === null ? undefined : selectedCategory;
        const queryParams = new URLSearchParams();
        
        if (category) {
          queryParams.append('category', category);
        }
        queryParams.append('limit', '100');

        const response = await api.get<{ groups: any[]; total: number }>(
          `/api/groups?${queryParams.toString()}`
        );

        const mappedGroups: SelectedGroup[] = response.groups.map((group) => ({
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

        setAllGroups(mappedGroups);
      } catch (err) {
        console.error('모임 목록 조회 실패:', err);
        setAllGroups([]);
      }
    };

    fetchAllGroups();
  }, [selectedCategory, refreshTrigger]);

  return (
    <div className="flex flex-col md:flex-row h-full w-full overflow-hidden" style={{ height: '100%', display: 'flex' }}>
      {/* 모바일: 카테고리 필터를 상단에 */}
      <div className="md:hidden w-full border-b border-[var(--color-border-card)] flex-shrink-0">
        <CategoryFilter
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
        />
      </div>
      
      {/* 데스크톱: GroupListPanel과 CategoryFilter */}
      <div className="hidden md:flex flex-shrink-0">
        <GroupListPanel 
          selectedCategory={selectedCategory} 
          onGroupClick={handleGroupClick}
          refreshTrigger={refreshTrigger}
        />
        <CategoryFilter
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
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
        <KakaoMapPanel 
          selectedGroup={selectedGroup}
          allGroups={allGroups}
          onCreateGroupClick={() => setIsCreateModalOpen(true)}
          onGroupClick={handleGroupClick}
        />
      </main>
      
      {/* 새 모임 만들기 모달 */}
      <CreateGroupModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateGroup}
        onSuccess={handleGroupCreated}
      />
    </div>
  );
};

// 인증 필요 라우트 가드
const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)]">
        <p className="text-[var(--color-text-secondary)]">로딩 중...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!user.isProfileComplete) {
    return <Navigate to="/auth/complete-profile" replace />;
  }

  return children;
};

// 메인 레이아웃 컴포넌트
const MainLayout = () => {
  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-[var(--color-bg-primary)] overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <Routes>
            <Route index element={<DashboardLayout />} />
            <Route path="my-info" element={<MyInfoPage />} />
            <Route path="my-schedule" element={<MySchedulePage />} />
            <Route path="facility-reservation" element={<FacilityReservationPage />} />
            <Route path="hall-of-fame" element={<HallOfFamePage />} />
            <Route path="favorites" element={<FavoritesPage />} />
            <Route path="sports-equipment" element={<SportsEquipmentPage />} />
            <Route path="event-match" element={<EventMatchPage />} />
            <Route path="notice" element={<NoticePage />} />
            <Route path="contact" element={<ContactPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Routes>
        </div>
      </div>
    </ProtectedRoute>
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
            <Route path="/register" element={<RegisterPage />} />
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
