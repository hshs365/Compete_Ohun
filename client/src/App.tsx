import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import GroupListPanel from './components/GroupListPanel';
import HomeMatchTypeChoice from './components/HomeMatchTypeChoice';
import HomeCategoryChoice from './components/HomeCategoryChoice';
import NaverMapPanel from './components/NaverMapPanel';
import type { SelectedGroup } from './types/selected-group';
import GroupDetail from './components/GroupDetail';
import MultiStepCreateGroup from './components/MultiStepCreateGroup';
import NotificationPanel from './components/NotificationPanel';
import { api } from './utils/api';
import { getUserCity, extractCityFromAddress, type KoreanCity } from './utils/locationUtils';
import MyInfoPage from './components/MyInfoPage'; // MyInfoPage 컴포넌트 import
import MyActivityPage from './components/MyActivityPage';
import MySchedulePage from './components/MySchedulePage'; // MySchedulePage 컴포넌트 import
import ContactPage from './components/ContactPage'; // ContactPage 컴포넌트 import
import SettingsPage from './components/SettingsPage'; // SettingsPage 컴포넌트 import
import LoginPage from './components/LoginPage'; // LoginPage 컴포넌트 import
import MultiStepRegister from './components/MultiStepRegister'; // MultiStepRegister 컴포넌트 import
import CompleteProfilePage from './components/CompleteProfilePage'; // CompleteProfilePage 컴포넌트 import
import OAuthCallbackPage from './components/OAuthCallbackPage'; // OAuthCallbackPage 컴포넌트 import
import NoticePage from './components/NoticePage'; // NoticePage 컴포넌트 import
import FacilityReservationPage from './components/FacilityReservationPage';
import FacilityDetailPage from './components/FacilityDetailPage';
import FacilityRegisterPage from './components/FacilityRegisterPage';
import HallOfFamePage from './components/HallOfFamePage'; // HallOfFamePage 컴포넌트 import
import SportsEquipmentPage from './components/SportsEquipmentPage';
import SportsEquipmentDetailPage from './components/SportsEquipmentDetailPage';
import ProductRegisterPage from './components/ProductRegisterPage';
import FollowersPage from './components/FollowersPage'; // FollowersPage 컴포넌트 import
import GuidePage from './components/GuidePage';
import TeamsPage from './components/TeamsPage'; // TeamsPage 컴포넌트 import
import TeamDetailPage from './components/TeamDetailPage'; // TeamDetailPage 컴포넌트 import
import CreateTeamPage from './components/CreateTeamPage'; // CreateTeamPage 컴포넌트 import
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoadingSpinner from './components/LoadingSpinner';
import { QuestionMarkCircleIcon, UserCircleIcon } from '@heroicons/react/24/outline';
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
  const location = useLocation();
  const [userProfile, setUserProfile] = useState<{ businessNumberVerified?: boolean; isAdmin?: boolean } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const saved = localStorage.getItem('home_category');
    return saved === '' || saved === null ? null : saved;
  });
  const [selectedGroup, setSelectedGroup] = useState<SelectedGroup | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [allGroups, setAllGroups] = useState<SelectedGroup[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  // localStorage에서 저장된 도시 선택 복원 (초기에는 null로 시작)
  const [selectedCity, setSelectedCity] = useState<KoreanCity | null>(null);
  const [selectedDays, setSelectedDays] = useState<number[]>([]); // 검색 옵션: 선택된 요일
  /** 매치 종류: 일반 매치 | 랭크매치 | 이벤트매치 (홈에서 탭으로 전환) */
  const [matchType, setMatchType] = useState<'general' | 'rank' | 'event'>(() => {
    if (typeof window === 'undefined') return 'general';
    const saved = localStorage.getItem('home_match_type') as 'general' | 'rank' | 'event' | null;
    return saved === 'rank' || saved === 'event' ? saved : 'general';
  });
  /** 홈 진입 시 종목을 선택했는지. false면 종목 선택 화면, true면 세 분할 또는 목록·지도 */
  const [hasSelectedCategory, setHasSelectedCategory] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('home_entered_match_view') === '1' || !!localStorage.getItem('home_category');
  });
  /** 홈 진입 시 매치 종류를 선택했는지. false면 세 분할 선택 화면, true면 목록·지도 표시 */
  const [hasEnteredMatchView, setHasEnteredMatchView] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('home_entered_match_view') === '1';
  });
  const [mapLayers, setMapLayers] = useState({
    rankers: false,
    events: false,
    popularSpots: false,
  });

  // 로그인 여부에 따른 지역 설정: 미로그인 시 전국, 로그인 시 사용자 위치 기반
  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      setSelectedCity('전체');
      return;
    }
    const userCity = getUserCity(user.id);
    if (userCity) {
      setSelectedCity(userCity);
    }
  }, [user, isLoading]);

  // 로그인된 사용자만: 위치 변경 시 selectedCity 업데이트
  useEffect(() => {
    if (!user) return;

    const handleLocationUpdate = () => {
      const userCity = getUserCity(user.id);
      if (userCity) {
        setSelectedCity((prev) => {
          if (prev === '전체') return prev;
          return userCity;
        });
      }
    };

    handleLocationUpdate();
    window.addEventListener('userLocationUpdated', handleLocationUpdate);
    const handleStorageChange = (e: StorageEvent) => {
      const locationKey = user?.id ? `userLocation_${user.id}` : 'userLocation';
      if (e.key === locationKey) {
        handleLocationUpdate();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('userLocationUpdated', handleLocationUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [user]);

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

  // 사업자 여부(이벤트매치 생성 권한) 조회
  useEffect(() => {
    if (!user) {
      setUserProfile(null);
      return;
    }
    api.get<{ businessNumberVerified?: boolean; isAdmin?: boolean }>('/api/auth/me').then(setUserProfile).catch(() => setUserProfile(null));
  }, [user]);

  // 시설 예약 모달 "매치 생성하러 가기" 또는 이벤트매치 페이지 "이벤트매치 개최" 클릭 시 홈으로 이동 후 생성 모달 열기
  const navigate = useNavigate();
  useEffect(() => {
    const state = location.state as { openCreate?: boolean; matchType?: string; category?: string } | null;
    if (state?.openCreate && state?.matchType) {
      if (state.category) setSelectedCategory(state.category);
      setMatchType(state.matchType as 'general' | 'rank' | 'event');
      setHasEnteredMatchView(true);
      setHasSelectedCategory(true);
      setIsCreateModalOpen(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate]);

  // 사이드바 홈 버튼 클릭 시 초기화면(종목 선택)으로 리셋
  useEffect(() => {
    const handleHomeReset = () => {
      setSelectedCategory(null);
      setHasSelectedCategory(false);
      setHasEnteredMatchView(false);
      setMatchType('general');
    };
    window.addEventListener('homeReset', handleHomeReset);
    return () => window.removeEventListener('homeReset', handleHomeReset);
  }, []);

  const [searchParams, setSearchParams] = useSearchParams();

  const handleGroupClick = (group: SelectedGroup) => {
    setSelectedGroup(group);
  };

  const handleCloseDetail = () => {
    setSelectedGroup(null);
  };

  // URL 쿼리 ?group=id 로 들어온 경우 해당 모임 자동 선택 (내정보 → 매치 목록 보기)
  useEffect(() => {
    const groupId = searchParams.get('group');
    if (!groupId || isLoadingGroups) return;
    const id = parseInt(groupId, 10);
    if (Number.isNaN(id)) return;
    const inList = allGroups.find((g) => g.id === id);
    if (inList) {
      setSelectedGroup(inList);
      setSearchParams({}, { replace: true });
      return;
    }
    api.get<{ id: number; name: string; location: string; latitude: number; longitude: number; participantCount: number; category: string; description?: string; meetingTime?: string; contact?: string; equipment?: string[] }>(`/api/groups/${id}`)
      .then((g) => {
        const selected: SelectedGroup = {
          id: g.id,
          name: g.name,
          location: g.location,
          coordinates: [Number(g.latitude), Number(g.longitude)],
          memberCount: g.participantCount,
          category: g.category,
          description: g.description,
          meetingTime: g.meetingTime,
          contact: g.contact,
          equipment: g.equipment || [],
        };
        setSelectedGroup(selected);
        setSearchParams({}, { replace: true });
      })
      .catch(() => {
        setSearchParams({}, { replace: true });
      });
  }, [searchParams, isLoadingGroups, allGroups]);

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

  // 모든 그룹 목록 가져오기 (지도 마커용) — 매치 종류 선택 후에만 실행
  useEffect(() => {
    if (!hasEnteredMatchView) {
      setIsLoadingGroups(false);
      setAllGroups([]);
      return;
    }
    const fetchAllGroups = async () => {
      try {
        setIsLoadingGroups(true);
        const category = selectedCategory === '전체' || selectedCategory === null ? undefined : selectedCategory;
        const queryParams = new URLSearchParams();
        
        if (category) {
          queryParams.append('category', category);
        }
        if (matchType === 'rank') {
          queryParams.append('onlyRanker', 'true');
          queryParams.append('type', 'normal');
        } else if (matchType === 'event') {
          queryParams.append('type', 'event');
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

          // meetingTime 파싱 (다양한 형식 지원)
          let meetingDate: Date | null = null;
          const meetingTimeStr = group.meetingTime.trim();

          if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(meetingTimeStr)) {
            // datetime-local 형식 (YYYY-MM-DDTHH:MM...)
            meetingDate = new Date(meetingTimeStr.slice(0, 16));
          } else if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(meetingTimeStr)) {
            // "YYYY-MM-DD HH:MM ~ ..." 또는 "YYYY-MM-DD HH:MM" 형식
            const startPart = meetingTimeStr.split('~')[0]?.trim() || meetingTimeStr;
            meetingDate = new Date(startPart.replace(' ', 'T') + ':00');
          } else if (/^\d{4}-\d{2}-\d{2}$/.test(meetingTimeStr)) {
            // "YYYY-MM-DD" 형식
            meetingDate = new Date(meetingTimeStr + 'T00:00:00');
          } else {
            // YYYY-MM-DD 추출 시도 (예: "2026-02-05 13:00 ~ 15:00")
            const dateMatch = meetingTimeStr.match(/^\d{4}-\d{2}-\d{2}/);
            if (dateMatch) {
              meetingDate = new Date(dateMatch[0] + 'T00:00:00');
            } else {
              meetingDate = new Date(meetingTimeStr);
            }
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
  }, [hasEnteredMatchView, selectedCategory, selectedCity, refreshTrigger, matchType]);

  // 홈 진입 시 1단계: 종목 선택 화면
  if (!hasSelectedCategory) {
    return (
      <div className="flex flex-col h-full w-full overflow-hidden" style={{ height: '100%', display: 'flex', backgroundColor: '#0f172a' }}>
        <main className="flex-1 relative overflow-hidden flex flex-col" style={{ minHeight: 0 }}>
          <HomeCategoryChoice
            onSelect={(cat) => {
              setSelectedCategory(cat);
              setHasSelectedCategory(true);
              try {
                localStorage.setItem('home_category', cat ?? '');
              } catch (e) {
                /* ignore */
              }
            }}
          />
        </main>
      </div>
    );
  }

  // 홈 진입 시 2단계: 세 분할 선택 화면 (일반/랭크/이벤트)
  if (!hasEnteredMatchView) {
    return (
      <div className="flex flex-col h-full w-full overflow-hidden" style={{ height: '100%', display: 'flex', backgroundColor: '#0f172a' }}>
        <main className="flex-1 relative overflow-hidden flex flex-col" style={{ minHeight: 0 }}>
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-[#0f172a]">
            <button
              type="button"
              onClick={() => setHasSelectedCategory(false)}
              className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            >
              ← 종목 변경
            </button>
            <span className="text-sm text-[var(--color-text-secondary)]">
              종목: {selectedCategory ?? '전체'}
            </span>
          </div>
          <HomeMatchTypeChoice
            onSelect={(type) => {
              setMatchType(type);
              setIsLoadingGroups(true);
              setHasEnteredMatchView(true);
              try {
                localStorage.setItem('home_entered_match_view', '1');
                localStorage.setItem('home_match_type', type);
              } catch (e) {
                /* ignore */
              }
            }}
          />
        </main>
      </div>
    );
  }

  // 매치 종류별 테마 색 (지도 상단 라벨 등에 사용, 목록 패널은 GroupListPanel에서 단색 채움)
  const matchTheme = { general: '#60a5fa', rank: '#d97706', event: '#7c3aed' } as const;
  const themeAccent = matchTheme[matchType];

  return (
    <div
      className={`flex flex-col h-full w-full overflow-hidden ${selectedGroup ? 'md:grid md:grid-cols-2' : 'md:flex md:flex-row'}`}
      style={{ height: '100%' }}
    >
      {/* 좌측: 목록(항상). 상세 선택 시에만 50% 영역으로 목록+상세, 미선택 시 목록 너비만 차지하고 나머지는 지도 */}
      <div className="flex flex-col min-w-0 min-h-0 flex-1 md:flex-none md:flex md:flex-row md:min-h-0 order-1 md:flex-shrink-0">
        {/* 모바일: 상세보기일 때만 뒤로가기 버튼 */}
        {selectedGroup && (
          <div className="md:hidden flex-shrink-0 w-full border-b border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-2">
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
        )}
        {/* 목록 패널: 항상 표시 (데스크톱 고정, 모바일은 미선택 시에만) */}
        <div className={selectedGroup ? 'hidden md:block flex-shrink-0' : 'flex-shrink-0 w-full md:w-auto'}>
          <GroupListPanel 
            selectedCategory={selectedCategory} 
            onGroupClick={handleGroupClick}
            refreshTrigger={refreshTrigger}
            selectedCity={selectedCity}
            onCityChange={setSelectedCity}
            selectedDays={selectedDays}
            onDaysChange={setSelectedDays}
            matchType={matchType}
            onMatchTypeChange={(type) => {
              setMatchType(type);
              setSelectedGroup(null); // 매치 타입 전환 시 열린 상세 패널 닫기 (선택 지역은 유지)
              setIsLoadingGroups(true);
              try {
                localStorage.setItem('home_match_type', type);
              } catch (e) {
                /* ignore */
              }
            }}
            matchTypeTheme
          />
        </div>
        {/* 상세 패널: 목록에서 매치 클릭 시에만 생성·펼쳐짐, 좌측 50% 안에서 나머지 공간 차지 */}
        {selectedGroup && (
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
            <GroupDetail 
              group={selectedGroup} 
              onClose={handleCloseDetail}
              onParticipantChange={handleParticipantChange}
            />
          </div>
        )}
      </div>

      {/* 지도: 상세 미선택 시 나머지 공간 전체, 상세 선택 시 우측 50% */}
      <main className="flex-1 min-w-0 relative overflow-hidden order-2" style={{ height: '100%', minHeight: 0 }}>
        {isLoadingGroups ? (
          <LoadingSpinner overlay message="매치 목록을 불러오는 중..." />
        ) : (
          <>
            {/* 지도 상단: 왼쪽 초기 화면으로 돌아가기, 오른쪽 현재 종목·매치 유형 (테마 색상) */}
            <div
              className="absolute top-0 left-0 right-0 z-[100] py-2.5 flex items-center justify-between gap-2 text-sm font-semibold text-white shadow-lg"
              style={{ background: themeAccent }}
            >
              <button
                type="button"
                onClick={() => {
                  setHasEnteredMatchView(false);
                  setHasSelectedCategory(false);
                  try {
                    localStorage.removeItem('home_entered_match_view');
                  } catch (e) {
                    /* ignore */
                  }
                }}
                className="flex-shrink-0 px-4 py-1.5 flex items-center gap-1.5 hover:bg-white/20 active:bg-white/30 rounded-lg transition-colors"
                aria-label="초기 화면으로"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>초기 화면</span>
              </button>
              <span className="flex-1 text-center truncate px-2">
                {selectedCategory ?? '전체'} · {matchType === 'general' ? '일반 매치' : matchType === 'rank' ? '랭크매치' : '이벤트매치'}
              </span>
              <span className="w-[4.5rem] flex-shrink-0" aria-hidden />
            </div>
            <NaverMapPanel 
              selectedGroup={selectedGroup}
              allGroups={allGroups}
              onCreateGroupClick={
                matchType === 'event' && !userProfile?.businessNumberVerified && !userProfile?.isAdmin
                  ? undefined
                  : () => setIsCreateModalOpen(true)
              }
              onGroupClick={handleGroupClick}
              selectedCity={selectedCity}
              selectedCategory={selectedCategory}
              mapLayers={mapLayers}
              matchType={matchType}
            />
            {/* 가이드 버튼 - 지도 영역 왼쪽 하단, 가이드 페이지로 이동 */}
            <button
              onClick={() => navigate('/guide')}
              className="absolute bottom-6 left-6 z-50 w-10 h-10 bg-[var(--color-bg-card)] border border-[var(--color-border-card)] rounded-lg shadow-lg flex items-center justify-center hover:bg-[var(--color-bg-secondary)] transition-colors group"
              title="가이드"
              aria-label="가이드"
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
        initialCategory={selectedCategory ?? undefined}
        initialMatchType={matchType}
      />
    </div>
  );
};

// 로그인 필요 시 페이지 내 안내 화면 (캡쳐처럼 현재 페이지에서 안내 후 로그인으로 이어짐)
const LoginRequiredView = () => {
  const navigate = useNavigate();
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[var(--color-bg-primary)]">
      <div className="flex flex-col items-center max-w-sm w-full rounded-2xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-8 shadow-lg text-center">
        <UserCircleIcon className="w-16 h-16 text-[var(--color-text-secondary)] mb-4" aria-hidden />
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-1">
          로그인이 필요합니다
        </h2>
        <p className="text-sm text-[var(--color-text-secondary)] mb-6">
          이 서비스를 이용하려면 로그인해 주세요.
        </p>
        <button
          type="button"
          onClick={() => navigate('/login', { replace: true })}
          className="w-full py-3 px-4 rounded-xl font-medium text-white bg-[var(--color-blue-primary)] hover:opacity-90 transition-opacity"
        >
          로그인하기
        </button>
      </div>
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
    return <LoginRequiredView />;
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
            <Route path="my-activity" element={
              <ProtectedRoute>
                <MyActivityPage />
              </ProtectedRoute>
            } />
            <Route path="my-schedule" element={
              <ProtectedRoute>
                <MySchedulePage />
              </ProtectedRoute>
            } />
            <Route path="facility-reservation/register" element={
              <ProtectedRoute>
                <FacilityRegisterPage />
              </ProtectedRoute>
            } />
            <Route path="facility-reservation/:id" element={
              <ProtectedRoute>
                <FacilityDetailPage />
              </ProtectedRoute>
            } />
            <Route path="facility-reservation" element={
              <ProtectedRoute>
                <FacilityReservationPage />
              </ProtectedRoute>
            } />
            <Route path="sports-equipment/register" element={
              <ProtectedRoute>
                <ProductRegisterPage />
              </ProtectedRoute>
            } />
            <Route path="sports-equipment/:id" element={
              <ProtectedRoute>
                <SportsEquipmentDetailPage />
              </ProtectedRoute>
            } />
            <Route path="sports-equipment" element={
              <ProtectedRoute>
                <SportsEquipmentPage />
              </ProtectedRoute>
            } />
            <Route path="event-match" element={<Navigate to="/" replace />} />
            <Route path="teams" element={
              <ProtectedRoute>
                <TeamsPage />
              </ProtectedRoute>
            } />
            <Route path="teams/create" element={
              <ProtectedRoute>
                <CreateTeamPage />
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
            <Route path="guide" element={<GuidePage />} />
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

function getInitialTheme(): string {
  if (typeof window === 'undefined') return 'light';
  const saved = localStorage.getItem('theme');
  if (saved === 'dark' || saved === 'light') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function App() {
  const [theme, setTheme] = useState<string>(getInitialTheme);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  // 시스템 테마 변경 시 반영 (저장된 테마가 없을 때만)
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (localStorage.getItem('theme')) return;
      setTheme(media.matches ? 'dark' : 'light');
    };
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, []);

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
