import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  UserCircleIcon,
  EnvelopeIcon,
  LockClosedIcon,
  PhoneIcon,
  CameraIcon,
  PencilIcon,
  TrashIcon,
  UserGroupIcon,
  PlusCircleIcon,
  HeartIcon,
  CalendarIcon,
  ArrowRightOnRectangleIcon,
  MapPinIcon,
  TrophyIcon,
  BuildingOfficeIcon,
  XMarkIcon,
  CheckCircleIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { showError, showSuccess, showWarning, showInfo, showConfirm } from '../utils/swal';
import ToggleSwitch from './ToggleSwitch';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import { SPORTS_LIST } from '../constants/sports';
import { useNavigate } from 'react-router-dom';
import Tooltip from './Tooltip';
import LoadingSpinner from './LoadingSpinner';
import SportsStatisticsModal from './SportsStatisticsModal';

interface UserProfileData {
  id: number;
  email: string | null;
  nickname: string | null;
  tag: string | null;
  realName: string | null;
  gender: string | null;
  ageRange: string | null;
  birthDate: string | null;
  residenceSido: string | null;
  residenceSigungu: string | null;
  interestedSports: string[];
  skillLevel: string | null;
  isProfileComplete: boolean;
  createdAt: string;
  marketingEmailConsent: boolean;
  marketingSmsConsent: boolean;
  phone: string | null;
  // 좌표는 사용하지 않음
  profileImage?: string | null;
  businessNumber?: string | null;
  businessNumberVerified?: boolean;
  nicknameChangedAt?: string | null;
  socialAccounts: {
    kakao: boolean;
    naver: boolean;
    google: boolean;
  };
}

// 급수 계산 함수
const calculateRank = (competitions: number, bestResult: string): string => {
  if (competitions === 0) return '미등급';
  
  // 대회 참가 횟수와 성적을 기반으로 급수 계산
  // 예시: 1-2회 참가 = 초급, 3-5회 = 중급, 6회 이상 = 고급
  // 실제 성적(순위, 기록 등)도 고려할 수 있음
  if (competitions >= 10) return '1급';
  if (competitions >= 7) return '2급';
  if (competitions >= 5) return '3급';
  if (competitions >= 3) return '4급';
  if (competitions >= 1) return '5급';
  return '미등급';
};

const MyInfoPage = () => {
  const { user: authUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [nickname, setNickname] = useState('');
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [phone, setPhone] = useState('');
  const [userLocation, setUserLocation] = useState<{ address: string } | null>(null);
  const [isSavingLocation, setIsSavingLocation] = useState(false);
  const [isEditingBusinessNumber, setIsEditingBusinessNumber] = useState(false);
  const [businessNumber, setBusinessNumber] = useState('');
  const [isVerifyingBusinessNumber, setIsVerifyingBusinessNumber] = useState(false);
  const [showFacilityRegistrationModal, setShowFacilityRegistrationModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [showStatisticsModal, setShowStatisticsModal] = useState(false);


  // 사용자 정보 로드 함수 (외부에서도 호출 가능하도록 useCallback 사용)
  const fetchUserData = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await api.get<UserProfileData>('/api/auth/me');
      
      // 저장된 프로필 사진 확인 (localStorage에서)
      // 현재 사용자 ID와 일치하는 프로필 사진만 사용 (재가입 시 이전 사진 방지)
      const savedProfileImage = localStorage.getItem(`profileImage_${data.id}`);
      // 현재 사용자 ID와 일치하는지 확인 (안전장치)
      const profileDataWithImage = (savedProfileImage && data.id) 
        ? { ...data, profileImage: savedProfileImage }
        : data;
      
      // 다른 사용자의 프로필 사진이 localStorage에 남아있을 수 있으므로 정리
      // 현재 사용자 ID와 일치하지 않는 프로필 사진 삭제
      if (data.id) {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('profileImage_')) {
            const userIdFromKey = parseInt(key.replace('profileImage_', ''));
            if (!isNaN(userIdFromKey) && userIdFromKey !== data.id) {
              // 다른 사용자의 프로필 사진이면 삭제
              localStorage.removeItem(key);
            }
          }
        }
      }
      
      setProfileData(profileDataWithImage);
      setNickname(data.nickname || '');
      setPhone(data.phone || '');
      setBusinessNumber(data.businessNumber || '');
      
      // localStorage에 저장된 주소가 있으면 그대로 사용
        const savedLocation = localStorage.getItem('userLocation');
        if (savedLocation) {
          try {
            const location = JSON.parse(savedLocation);
          if (location.address && !location.address.startsWith('위도:')) {
            setUserLocation({ address: location.address });
            } else {
              setUserLocation(null);
            }
          } catch (e) {
            setUserLocation(null);
          }
        } else {
        setUserLocation(null);
      }
    } catch (error) {
      console.error('사용자 정보 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 사용자 정보 로드 (authUser 변경 시)
  useEffect(() => {
    if (authUser) {
      fetchUserData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser]); // fetchUserData는 useCallback으로 안정적이므로 dependency에서 제외

  // 페이지 포커스 시 데이터 새로고침 (가이드 완료 후 내정보 페이지로 이동했을 때)
  useEffect(() => {
    const handleFocus = () => {
      if (authUser && !isLoading) {
        // 약간의 지연을 두어 서버 업데이트가 완료된 후 데이터 가져오기
        setTimeout(() => {
          fetchUserData();
        }, 500);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser, isLoading]); // fetchUserData는 useCallback으로 안정적이므로 dependency에서 제외

  // userLocationUpdated 이벤트 리스너 (주소 저장 시 즉시 반영) - 별도 useEffect로 분리
  useEffect(() => {
    const handleLocationUpdate = (event: CustomEvent) => {
      const { address } = event.detail || {};
      if (address && !address.startsWith('위도:')) {
        setUserLocation({ address });
      } else {
        const savedLocation = localStorage.getItem('userLocation');
        if (savedLocation) {
          try {
            const location = JSON.parse(savedLocation);
            if (location.address && !location.address.startsWith('위도:')) {
              setUserLocation({ address: location.address });
              return;
            }
          } catch (e) {
            // 무시
          }
        }
        setUserLocation(null);
      }
    };

    const eventHandler = (event: Event) => {
      handleLocationUpdate(event as CustomEvent);
    };
    window.addEventListener('userLocationUpdated', eventHandler);

    return () => {
      window.removeEventListener('userLocationUpdated', eventHandler);
    };
  }, []); // 빈 dependency 배열로 한 번만 등록

  // 자동 역지오코딩 제거 - 주소는 주소 검색으로만 등록

  // 활동 기록 상태
  const [activityStats, setActivityStats] = useState({
    joinedGroups: 0,
    createdGroups: 0,
    favoriteGroups: 0,
    upcomingGroups: 0,
  });

  // 팔로워/팔로잉 수 상태
  const [followStats, setFollowStats] = useState({
    followers: 0,
    following: 0,
  });

  // 운동별 성적 및 급수 상태
  const [sportRecords, setSportRecords] = useState<Record<string, {
    competitions: number;
    bestResult: string;
    rank: string;
  }>>({});
  
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [selectedSport, setSelectedSport] = useState<string>('');
  const [competitionName, setCompetitionName] = useState('');
  const [competitionResult, setCompetitionResult] = useState('');
  const [competitionDate, setCompetitionDate] = useState('');
  const [sportRank, setSportRank] = useState<string>('미등급');
  
  // 모달 배경 클릭 감지용 (드래그와 클릭 구분)
  const modalMouseDownRef = useRef<{ x: number; y: number } | null>(null);

  // 활동 기록 데이터 가져오기
  useEffect(() => {
    const fetchActivityStats = async () => {
      if (!authUser || !profileData) return;
      
      try {
        const userId = profileData.id;
        
        // 모든 매치 가져오기 (나중에 API에 participant/creator 필터 추가 필요)
        // TODO: API에 /api/groups/my-participations, /api/groups/my-creations 엔드포인트 추가
        const allGroupsResponse = await api.get<{ groups: any[]; total: number }>('/api/groups?limit=1000');
        const allGroups = allGroupsResponse.groups || [];

        // 생성한 매치 수 (creatorId로 필터링)
        const createdGroups = allGroups.filter((group: any) => group.creatorId === userId);
        const createdCount = createdGroups.length;

        // 참여한 매치 수 (각 매치의 상세 정보를 가져와서 확인)
        // 참여 여부는 각 매치의 상세 API를 호출해야 정확히 알 수 있음
        // 일단 생성한 매치를 제외한 모든 매치를 가져와서 확인
        let joinedCount = 0;
        try {
          // 각 매치의 상세 정보를 가져와서 isUserParticipant 확인
          const participationChecks = await Promise.allSettled(
            allGroups
              .filter((group: any) => group.creatorId !== userId) // 생성한 매치 제외
              .slice(0, 50) // 성능을 위해 최대 50개만 확인
              .map((group: any) => api.get(`/api/groups/${group.id}`))
          );
          
          joinedCount = participationChecks.filter(
            (result) => result.status === 'fulfilled' && (result.value as any)?.isUserParticipant === true
          ).length;
        } catch (error) {
          console.error('참여 매치 확인 실패:', error);
        }

        // 찜한 매치 수 (API가 있다면)
        // TODO: 찜한 매치 API 구현 후 활성화
        const favoritesCount = 0;

        // 참여 예정 매치 수 (참여한 매치 중 미래 매치)
        // TODO: meetingTime 파싱 로직 구현 필요
        const upcomingCount = 0;

        // 운동별 성적 데이터 가져오기 (로컬 스토리지에서)
        // TODO: 백엔드 API 구현 후 변경
        const savedRecords = localStorage.getItem(`sportRecords_${userId}`);
        const records = savedRecords ? JSON.parse(savedRecords) : {};
        setSportRecords(records);

        setActivityStats({
          joinedGroups: joinedCount,
          createdGroups: createdCount,
          favoriteGroups: favoritesCount,
          upcomingGroups: upcomingCount,
        });
      } catch (error) {
        console.error('활동 기록 조회 실패:', error);
        // 에러 발생 시 기본값 유지
      }
    };

    if (authUser && profileData) {
      fetchActivityStats();
    }
  }, [authUser, profileData]);

  // 팔로워/팔로잉 수 가져오기
  useEffect(() => {
    const fetchFollowStats = async () => {
      if (!authUser || !profileData) return;

      try {
        const [followers, following] = await Promise.all([
          api.get<Array<{ id: number }>>('/api/users/followers'),
          api.get<Array<{ id: number }>>('/api/users/following'),
        ]);

        setFollowStats({
          followers: followers.length,
          following: following.length,
        });
      } catch (error) {
        console.error('팔로워 통계 조회 실패:', error);
        // 에러 발생 시 기본값 유지
      }
    };

    if (authUser && profileData) {
      fetchFollowStats();
    }
  }, [authUser, profileData]);

  const handleProfileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profileData) return;

    // 파일 크기 제한 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      await showWarning('파일 크기는 5MB 이하여야 합니다.', '파일 크기 제한');
      return;
    }

    // 파일 타입 확인
    if (!file.type.startsWith('image/')) {
      await showWarning('이미지 파일만 업로드 가능합니다.', '파일 형식 오류');
      return;
    }

    try {
      // FormData 생성
      const formData = new FormData();
      formData.append('profileImage', file);

      // 서버에 업로드
      const response = await api.put('/api/auth/me', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // 성공 시 프로필 데이터 업데이트
      if (response) {
        // 서버에서 반환된 이미지 URL 사용 또는 base64로 표시
        const reader = new FileReader();
        reader.onloadend = () => {
          setProfileData({ ...profileData, profileImage: reader.result as string });
          // localStorage에도 임시 저장 (서버 응답이 없을 경우 대비)
          localStorage.setItem(`profileImage_${profileData.id}`, reader.result as string);
        };
        reader.readAsDataURL(file);
        await showSuccess('프로필 사진이 저장되었습니다.', '프로필 사진 업로드');
      }
    } catch (error) {
      console.error('프로필 사진 업로드 실패:', error);
      // API가 아직 구현되지 않았을 경우 localStorage에 임시 저장
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData({ ...profileData, profileImage: reader.result as string });
        localStorage.setItem(`profileImage_${profileData.id}`, reader.result as string);
        showInfo('프로필 사진이 임시로 저장되었습니다. (서버 저장 기능은 준비 중입니다)', '임시 저장');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNicknameSave = async () => {
    if (!profileData) return;
    
    // 닉네임이 변경되지 않았으면 그냥 취소
    if (nickname === profileData.nickname) {
      setIsEditingNickname(false);
      return;
    }

    // 3개월 제한 체크
    if (profileData.nicknameChangedAt) {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      const lastChange = new Date(profileData.nicknameChangedAt);
      
      if (lastChange > threeMonthsAgo) {
        const daysRemaining = Math.ceil(
          (lastChange.getTime() + 90 * 24 * 60 * 60 * 1000 - Date.now()) / (1000 * 60 * 60 * 24)
        );
        await showWarning(
          `닉네임은 3개월에 한 번만 변경할 수 있습니다. ${daysRemaining}일 후에 변경 가능합니다.`,
          '닉네임 변경 제한'
        );
        setNickname(profileData.nickname || '');
        setIsEditingNickname(false);
        return;
      }
    }

    try {
      const updatedData = await api.put<{ nickname: string; tag: string | null; nicknameChangedAt: string | null }>('/api/auth/me', { nickname });
      setProfileData({ ...profileData, nickname: updatedData.nickname, tag: updatedData.tag, nicknameChangedAt: updatedData.nicknameChangedAt });
      setIsEditingNickname(false);
      await showSuccess('닉네임이 변경되었습니다.', '닉네임 변경');
    } catch (error) {
      console.error('닉네임 저장 실패:', error);
      const errorMessage = error instanceof Error ? error.message : '닉네임 변경에 실패했습니다.';
      await showError(errorMessage, '닉네임 변경 실패');
      setNickname(profileData.nickname || '');
      setIsEditingNickname(false);
    }
  };

  const handlePhoneSave = async () => {
    if (!profileData) return;
    try {
      // TODO: 전화번호 저장 로직
      // const updatedData = await api.put('/api/auth/me', { phone });
      setProfileData({ ...profileData, phone });
      setIsEditingPhone(false);
    } catch (error) {
      console.error('전화번호 저장 실패:', error);
    }
  };

  const handleBusinessNumberVerify = async () => {
    if (!profileData || !businessNumber) return;

    // 사업자번호 형식 검증 (XXX-XX-XXXXX)
    const businessNumberRegex = /^\d{3}-\d{2}-\d{5}$/;
    if (!businessNumberRegex.test(businessNumber)) {
      await showWarning('사업자번호는 XXX-XX-XXXXX 형식으로 입력해주세요. (예: 123-45-67890)', '사업자번호 형식 오류');
      return;
    }

    setIsVerifyingBusinessNumber(true);
    try {
      const updatedUser = await api.post<{ businessNumber: string; businessNumberVerified: boolean }>('/api/auth/verify-business-number', {
        businessNumber,
      });
      
      setProfileData({
        ...profileData,
        businessNumber: updatedUser.businessNumber,
        businessNumberVerified: updatedUser.businessNumberVerified,
      });
      setIsEditingBusinessNumber(false);
      // 시설 등록 안내 모달 표시
      setShowFacilityRegistrationModal(true);
    } catch (error) {
      console.error('사업자번호 검증 실패:', error);
      await showError(error instanceof Error ? error.message : '사업자번호 검증에 실패했습니다.', '사업자번호 검증 실패');
    } finally {
      setIsVerifyingBusinessNumber(false);
    }
  };

  const handlePasswordChange = () => {
    // TODO: 비밀번호 변경 모달/페이지 이동
    console.log('비밀번호 변경');
  };

  const handleLogout = async () => {
    const confirmed = await showConfirm('로그아웃 하시겠습니까?', '로그아웃');
    if (confirmed) {
      logout();
    }
  };

  const handleWithdraw = () => {
    setShowWithdrawModal(true);
  };

  const handleWithdrawConfirm = async () => {
    if (!profileData) return;

    setIsWithdrawing(true);
    try {
      await api.delete('/api/auth/withdraw');
      
      // 회원 탈퇴 시 localStorage에서 해당 사용자의 프로필 사진 삭제
      if (profileData.id) {
        localStorage.removeItem(`profileImage_${profileData.id}`);
      }
      
      // 모든 프로필 사진 관련 localStorage 항목 정리 (안전장치)
      // profileImage_로 시작하는 모든 키를 찾아서 삭제
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('profileImage_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      await showSuccess('회원 탈퇴가 완료되었습니다.', '회원 탈퇴');
      logout();
      navigate('/login');
    } catch (error) {
      console.error('회원 탈퇴 실패:', error);
      await showError(error instanceof Error ? error.message : '회원 탈퇴에 실패했습니다.', '회원 탈퇴 실패');
    } finally {
      setIsWithdrawing(false);
      setShowWithdrawModal(false);
    }
  };

  const handleSocialDisconnect = async (provider: string) => {
    if (!profileData) return;
    const confirmed = await showConfirm(`${provider} 계정 연결을 해제하시겠습니까?`, '소셜 계정 연결 해제');
    if (confirmed) {
      try {
        // TODO: 소셜 계정 연결 해제 API 호출
        // await api.delete(`/api/auth/social/${provider}`);
        setProfileData({
          ...profileData,
          socialAccounts: { ...profileData.socialAccounts, [provider]: false },
        });
      } catch (error) {
        console.error('소셜 계정 연결 해제 실패:', error);
      }
    }
  };

  const handleMarketingConsentChange = async (type: 'email' | 'sms', value: boolean) => {
    if (!profileData) return;
    try {
      // TODO: 마케팅 동의 업데이트 API 호출
      // await api.put('/api/auth/me', { [`marketing${type === 'email' ? 'Email' : 'Sms'}Consent`]: value });
      setProfileData({
        ...profileData,
        [`marketing${type === 'email' ? 'Email' : 'Sms'}Consent`]: value,
      });
    } catch (error) {
      console.error('마케팅 동의 업데이트 실패:', error);
    }
  };

  // 주소 검색으로 위치 설정
  const handleSearchAddress = () => {
    // Daum Postcode API 스크립트 로드
    const script = document.createElement('script');
    script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
    
    const openPostcode = () => {
      if (typeof window !== 'undefined' && (window as any).daum) {
        new (window as any).daum.Postcode({
          oncomplete: async (data: any) => {
            const fullAddress = data.address; // 선택한 주소
            
            // 주소만 저장
            try {
              setIsSavingLocation(true);

              const locationData = {
                address: fullAddress,
              };

              setUserLocation(locationData);
              
              // localStorage에 저장
              localStorage.setItem('userLocation', JSON.stringify(locationData));
              
              // 커스텀 이벤트 발생
              window.dispatchEvent(new CustomEvent('userLocationUpdated', {
                detail: locationData
              }));

              await showSuccess('주소가 저장되었습니다.', '주소 저장');
            } catch (error) {
              console.error('주소 저장 실패:', error);
              const errorMessage = error instanceof Error ? error.message : '주소 저장에 실패했습니다. 다시 시도해주세요.';
              await showError(errorMessage, '주소 저장 실패');
            } finally {
              setIsSavingLocation(false);
            }
          },
          width: '100%',
          height: '100%',
        }).open();
      }
    };
    
    // 이미 로드되어 있으면 바로 실행
    if (typeof window !== 'undefined' && (window as any).daum) {
      openPostcode();
    } else {
      script.onload = () => {
        openPostcode();
      };
      document.head.appendChild(script);
    }
  };

  if (isLoading || !profileData) {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto w-full min-h-[400px] relative">
        <LoadingSpinner fullScreen={false} message="사용자 정보를 불러오는 중..." />
      </div>
    );
  }

  // 멤버십은 아직 구현되지 않았으므로 기본값 사용
  const membership = '일반'; // TODO: 실제 멤버십 정보 가져오기
  const joinDate = profileData.createdAt ? new Date(profileData.createdAt).toISOString().split('T')[0] : '';

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto w-full space-y-6 pb-12">
      <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] mb-6 md:mb-8">내 정보</h1>

      {/* 프로필 요약 */}
      <section className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-card)] p-6">
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4">프로필 요약</h2>
        <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
          {/* 프로필 사진 */}
          <div className="relative">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-[var(--color-bg-secondary)] flex items-center justify-center overflow-hidden">
              {profileData.profileImage ? (
                <img src={profileData.profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <UserCircleIcon className="w-20 h-20 text-[var(--color-text-secondary)]" />
              )}
            </div>
            <label className="absolute bottom-0 right-0 bg-[var(--color-blue-primary)] text-white rounded-full p-2 cursor-pointer hover:opacity-90 transition-opacity">
              <CameraIcon className="w-4 h-4" />
              <input
                type="file"
                accept="image/*"
                onChange={handleProfileImageChange}
                className="hidden"
              />
            </label>
          </div>

          {/* 닉네임 및 정보 */}
          <div className="flex-1 w-full md:w-auto text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start space-x-3 mb-2">
              {isEditingNickname ? (
                <div className="flex items-center space-x-2 flex-1">
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="flex-1 px-3 py-1 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
                    autoFocus
                  />
                  <button
                    onClick={handleNicknameSave}
                    className="px-3 py-1 bg-[var(--color-blue-primary)] text-white rounded-lg hover:opacity-90"
                  >
                    저장
                  </button>
                  <button
                    onClick={() => {
                      setNickname(profileData.nickname || '');
                      setIsEditingNickname(false);
                    }}
                    className="px-3 py-1 bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] rounded-lg hover:opacity-80"
                  >
                    취소
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-2xl font-bold text-[var(--color-text-primary)]">
                        {profileData.nickname || '닉네임 없음'}
                      </h3>
                      {profileData.tag && (
                        <span className="text-lg text-[var(--color-text-secondary)]">
                          {profileData.tag}
                        </span>
                      )}
                    </div>
                    {profileData.realName && (
                      <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                        실명: {profileData.realName}
                      </p>
                    )}
                    {profileData.nicknameChangedAt && (() => {
                      const lastChange = new Date(profileData.nicknameChangedAt);
                      const threeMonthsAgo = new Date();
                      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
                      const canChange = lastChange <= threeMonthsAgo;
                      const daysRemaining = canChange ? 0 : Math.ceil(
                        (lastChange.getTime() + 90 * 24 * 60 * 60 * 1000 - Date.now()) / (1000 * 60 * 60 * 24)
                      );
                      return (
                        <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                          {canChange ? '닉네임 변경 가능' : `${daysRemaining}일 후 변경 가능`}
                        </p>
                      );
                    })()}
                  </div>
                  <button
                    onClick={() => {
                      // 3개월 제한 체크
                      if (profileData.nicknameChangedAt) {
                        const threeMonthsAgo = new Date();
                        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
                        const lastChange = new Date(profileData.nicknameChangedAt);
                        
                        if (lastChange > threeMonthsAgo) {
                          const daysRemaining = Math.ceil(
                            (lastChange.getTime() + 90 * 24 * 60 * 60 * 1000 - Date.now()) / (1000 * 60 * 60 * 24)
                          );
                          showWarning(
                            `닉네임은 3개월에 한 번만 변경할 수 있습니다. ${daysRemaining}일 후에 변경 가능합니다.`,
                            '닉네임 변경 제한'
                          );
                          return;
                        }
                      }
                      setIsEditingNickname(true);
                    }}
                    className="p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-blue-primary)] transition-colors"
                    title={profileData.nicknameChangedAt && (() => {
                      const lastChange = new Date(profileData.nicknameChangedAt);
                      const threeMonthsAgo = new Date();
                      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
                      if (lastChange > threeMonthsAgo) {
                        const daysRemaining = Math.ceil(
                          (lastChange.getTime() + 90 * 24 * 60 * 60 * 1000 - Date.now()) / (1000 * 60 * 60 * 24)
                        );
                        return `${daysRemaining}일 후 변경 가능`;
                      }
                      return '닉네임 변경';
                    })()}
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
            {/* 타이틀/역할 */}
            <div className="flex items-center space-x-2 text-sm flex-wrap gap-2 mt-2">
              <span className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-semibold">
                {membership}
              </span>
              {profileData.businessNumberVerified && (
                <span className="px-3 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-full font-semibold flex items-center gap-1">
                  <BuildingOfficeIcon className="w-4 h-4" />
                  체육센터 사장님
                </span>
              )}
            </div>
            
            {/* 가입일 및 팔로워/팔로잉 수 */}
            <div className="mt-3 space-y-2">
              {joinDate && (
                <div className="text-sm text-[var(--color-text-secondary)]">
                  가입일: {new Date(joinDate).toLocaleDateString('ko-KR')}
                </div>
              )}
              <div className="flex items-center space-x-4 text-sm">
                <button
                  onClick={() => navigate('/followers')}
                  className="flex items-center space-x-1 text-[var(--color-text-primary)] hover:text-[var(--color-blue-primary)] transition-colors cursor-pointer"
                >
                  <span className="font-semibold">{followStats.followers}</span>
                  <span className="text-[var(--color-text-secondary)]">팔로워</span>
                </button>
                <span className="text-[var(--color-text-secondary)]">•</span>
                <button
                  onClick={() => navigate('/followers')}
                  className="flex items-center space-x-1 text-[var(--color-text-primary)] hover:text-[var(--color-blue-primary)] transition-colors cursor-pointer"
                >
                  <span className="font-semibold">{followStats.following}</span>
                  <span className="text-[var(--color-text-secondary)]">팔로잉</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 계정 정보 */}
      <section className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-card)] p-6">
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4">계정 정보</h2>
        <div className="space-y-4">
          {/* 이메일 (수정 불가) */}
          <div className="flex items-center justify-between py-3 border-b border-[var(--color-border-card)]">
            <div className="flex items-center space-x-3">
              <EnvelopeIcon className="w-5 h-5 text-[var(--color-text-secondary)]" />
              <div>
                <div className="text-sm text-[var(--color-text-secondary)]">이메일</div>
                <div className="text-[var(--color-text-primary)] font-medium">
                  {profileData.email || '이메일 없음'}
                </div>
              </div>
            </div>
            <span className="text-xs text-[var(--color-text-secondary)] bg-[var(--color-bg-secondary)] px-2 py-1 rounded">수정 불가</span>
          </div>

          {/* 비밀번호 변경 */}
          <div className="flex items-center justify-between py-3 border-b border-[var(--color-border-card)]">
            <div className="flex items-center space-x-3">
              <LockClosedIcon className="w-5 h-5 text-[var(--color-text-secondary)]" />
              <div>
                <div className="text-sm text-[var(--color-text-secondary)]">비밀번호</div>
                <div className="text-[var(--color-text-primary)]">••••••••</div>
              </div>
            </div>
            <button
              onClick={handlePasswordChange}
              className="px-4 py-2 bg-[var(--color-blue-primary)] text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
            >
              변경
            </button>
          </div>

          {/* 연결된 소셜 계정 */}
          <div className="pt-3">
            <div className="text-sm text-[var(--color-text-secondary)] mb-3">연결된 소셜 계정</div>
            {profileData.socialAccounts &&
            !profileData.socialAccounts.kakao &&
            !profileData.socialAccounts.naver &&
            !profileData.socialAccounts.google ? (
              <p className="text-sm text-[var(--color-text-secondary)]">연결된 소셜 계정이 없습니다.</p>
            ) : (
              <div className="space-y-2">
                {profileData.socialAccounts?.kakao && (
                <div className="flex items-center justify-between py-2 px-3 bg-[#FEE500] bg-opacity-10 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-[var(--color-text-primary)]">카카오톡</span>
                  </div>
                  <button
                    onClick={() => handleSocialDisconnect('kakao')}
                    className="text-xs text-red-500 hover:underline"
                  >
                    연결 해제
                  </button>
                </div>
              )}
              {profileData.socialAccounts?.naver && (
                <div className="flex items-center justify-between py-2 px-3 bg-[#03C75A] bg-opacity-10 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-[var(--color-text-primary)]">네이버</span>
                  </div>
                  <button
                    onClick={() => handleSocialDisconnect('naver')}
                    className="text-xs text-red-500 hover:underline"
                  >
                    연결 해제
                  </button>
                </div>
              )}
              {profileData.socialAccounts?.google && (
                <div className="flex items-center justify-between py-2 px-3 bg-gray-100 bg-opacity-10 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-[var(--color-text-primary)]">구글</span>
                  </div>
                  <button
                    onClick={() => handleSocialDisconnect('google')}
                    className="text-xs text-red-500 hover:underline"
                  >
                    연결 해제
                  </button>
                </div>
              )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 연락처 정보 */}
      <section className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-card)] p-6">
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4">연락처 정보</h2>
        <div className="space-y-4">
          {/* 휴대전화 번호 */}
          <div className="flex items-center justify-between py-3 border-b border-[var(--color-border-card)]">
            <div className="flex items-center space-x-3 flex-1">
              <PhoneIcon className="w-5 h-5 text-[var(--color-text-secondary)]" />
              {isEditingPhone ? (
                <div className="flex items-center space-x-2 flex-1">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="flex-1 px-3 py-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
                    placeholder="010-1234-5678"
                  />
                  <button
                    onClick={handlePhoneSave}
                    className="px-3 py-2 bg-[var(--color-blue-primary)] text-white rounded-lg hover:opacity-90"
                  >
                    저장
                  </button>
                  <button
                    onClick={() => {
                      setPhone(profileData.phone || '');
                      setIsEditingPhone(false);
                    }}
                    className="px-3 py-2 bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] rounded-lg hover:opacity-80"
                  >
                    취소
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <div className="text-sm text-[var(--color-text-secondary)]">휴대전화 번호</div>
                    <div className="text-[var(--color-text-primary)] font-medium">
                      {profileData.phone || '등록된 전화번호 없음'}
                    </div>
                  </div>
                  <button
                    onClick={() => setIsEditingPhone(true)}
                    className="ml-auto p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-blue-primary)] transition-colors"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* 위치 정보 */}
          <div className="pt-3 border-t border-[var(--color-border-card)]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <MapPinIcon className="w-5 h-5 text-[var(--color-text-secondary)]" />
                <span className="text-[var(--color-text-primary)] font-medium">주소</span>
              </div>
              <button
                onClick={handleSearchAddress}
                disabled={isSavingLocation}
                className="px-4 py-2 bg-[var(--color-blue-primary)] text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingLocation ? '저장 중...' : '주소 검색'}
              </button>
            </div>
            {userLocation && userLocation.address && !userLocation.address.startsWith('위도:') ? (
              <div className="mt-2 p-3 bg-[var(--color-bg-secondary)] rounded-lg">
                <div className="text-sm text-[var(--color-text-secondary)] mb-1">저장된 위치</div>
                <div className="text-[var(--color-text-primary)] font-medium">
                  {userLocation.address}
                </div>
              </div>
            ) : (
              <div className="mt-2 text-sm text-[var(--color-text-secondary)]">
                저장된 주소가 없습니다. '주소 검색' 버튼을 클릭하여 주소를 저장하세요.
              </div>
            )}
          </div>

          {/* 사업자번호 (사업자 회원만 표시) */}
          {(profileData.businessNumber || profileData.businessNumberVerified) && (
            <div className="pt-3 border-t border-[var(--color-border-card)]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <BuildingOfficeIcon className="w-5 h-5 text-[var(--color-text-secondary)]" />
                  <div>
                    <div className="text-sm text-[var(--color-text-secondary)]">사업자번호</div>
                    <div className="text-xs text-[var(--color-text-secondary)]">
                      {profileData.businessNumberVerified 
                        ? '검증 완료 - 체육센터 등록 가능' 
                        : '체육센터 사장님만 등록 가능'}
                    </div>
                  </div>
                </div>
              </div>
            {isEditingBusinessNumber ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={businessNumber}
                    onChange={(e) => {
                      // 숫자와 하이픈만 허용
                      const value = e.target.value.replace(/[^\d-]/g, '');
                      // 자동으로 하이픈 추가 (XXX-XX-XXXXX)
                      let formatted = value.replace(/-/g, '');
                      if (formatted.length > 3) {
                        formatted = formatted.slice(0, 3) + '-' + formatted.slice(3);
                      }
                      if (formatted.length > 6) {
                        formatted = formatted.slice(0, 6) + '-' + formatted.slice(6, 11);
                      }
                      setBusinessNumber(formatted);
                    }}
                    placeholder="사업자번호를 입력해주세요"
                    maxLength={12}
                    className="flex-1 px-3 py-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
                  />
                  <Tooltip content="사업자번호는 자동으로 하이픈(-)이 추가됩니다. 숫자만 입력해주세요. (형식: XXX-XX-XXXXX)" />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleBusinessNumberVerify}
                    disabled={isVerifyingBusinessNumber}
                    className="flex-1 px-4 py-2 bg-[var(--color-blue-primary)] text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isVerifyingBusinessNumber ? '검증 중...' : '검증하기'}
                  </button>
                  <button
                    onClick={() => {
                      setBusinessNumber(profileData.businessNumber || '');
                      setIsEditingBusinessNumber(false);
                    }}
                    className="px-4 py-2 bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] rounded-lg hover:opacity-80 transition-opacity text-sm font-medium"
                  >
                    취소
                  </button>
                </div>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  검증 완료 후 체육센터를 등록할 수 있습니다.
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="text-[var(--color-text-primary)] font-medium">
                  {profileData.businessNumber || '등록된 사업자번호 없음'}
                </div>
                {!profileData.businessNumberVerified && (
                  <button
                    onClick={() => setIsEditingBusinessNumber(true)}
                    className="px-4 py-2 bg-[var(--color-blue-primary)] text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
                  >
                    등록/검증
                  </button>
                )}
              </div>
            )}
            </div>
          )}

          {/* 수신 동의 */}
          <div className="pt-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <EnvelopeIcon className="w-5 h-5 text-[var(--color-text-secondary)]" />
                <span className="text-[var(--color-text-primary)]">이메일 마케팅 수신 동의</span>
              </div>
              <ToggleSwitch
                isOn={profileData.marketingEmailConsent}
                handleToggle={() => handleMarketingConsentChange('email', !profileData.marketingEmailConsent)}
                label=""
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <PhoneIcon className="w-5 h-5 text-[var(--color-text-secondary)]" />
                <span className="text-[var(--color-text-primary)]">SMS 마케팅 수신 동의</span>
              </div>
              <ToggleSwitch
                isOn={profileData.marketingSmsConsent}
                handleToggle={() => handleMarketingConsentChange('sms', !profileData.marketingSmsConsent)}
                label=""
              />
            </div>
          </div>
        </div>
      </section>

      {/* 활동 기록 */}
      <section className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-card)] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">활동 기록</h2>
          <button
            onClick={() => setShowStatisticsModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
          >
            <ChartBarIcon className="w-5 h-5" />
            운동 통계 보기
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="flex flex-col items-center p-4 bg-[var(--color-bg-primary)] rounded-lg hover:bg-[var(--color-bg-secondary)] transition-colors cursor-pointer">
            <UserGroupIcon className="w-8 h-8 text-[var(--color-blue-primary)] mb-2" />
            <div className="text-2xl font-bold text-[var(--color-text-primary)]">{activityStats.joinedGroups}</div>
            <div className="text-sm text-[var(--color-text-secondary)]">참여한 매치</div>
          </div>
          <div className="flex flex-col items-center p-4 bg-[var(--color-bg-primary)] rounded-lg hover:bg-[var(--color-bg-secondary)] transition-colors cursor-pointer">
            <PlusCircleIcon className="w-8 h-8 text-[var(--color-blue-primary)] mb-2" />
            <div className="text-2xl font-bold text-[var(--color-text-primary)]">{activityStats.createdGroups}</div>
            <div className="text-sm text-[var(--color-text-secondary)]">생성한 매치</div>
          </div>
          <div className="flex flex-col items-center p-4 bg-[var(--color-bg-primary)] rounded-lg hover:bg-[var(--color-bg-secondary)] transition-colors cursor-pointer">
            <HeartIcon className="w-8 h-8 text-[var(--color-blue-primary)] mb-2" />
            <div className="text-2xl font-bold text-[var(--color-text-primary)]">{activityStats.favoriteGroups}</div>
            <div className="text-sm text-[var(--color-text-secondary)]">찜한 매치</div>
          </div>
          <div className="flex flex-col items-center p-4 bg-[var(--color-bg-primary)] rounded-lg hover:bg-[var(--color-bg-secondary)] transition-colors cursor-pointer">
            <CalendarIcon className="w-8 h-8 text-[var(--color-blue-primary)] mb-2" />
            <div className="text-2xl font-bold text-[var(--color-text-primary)]">{activityStats.upcomingGroups}</div>
            <div className="text-sm text-[var(--color-text-secondary)]">참여 예정</div>
          </div>
        </div>
      </section>

      {/* 운동별 성적 및 급수 */}
      <section className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-card)] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">운동별 성적 및 급수</h2>
          <button
            onClick={() => setIsRecordModalOpen(true)}
            className="px-4 py-2 bg-[var(--color-blue-primary)] text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
          >
            성적 추가
          </button>
        </div>
        {Object.keys(sportRecords).length === 0 ? (
          <div className="text-center py-8 text-[var(--color-text-secondary)]">
            <TrophyIcon className="w-12 h-12 mx-auto mb-2 text-[var(--color-text-secondary)] opacity-50" />
            <p>등록된 대회 성적이 없습니다.</p>
            <p className="text-sm mt-1">성적을 추가하여 급수를 받아보세요!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(sportRecords).map(([sport, record]) => (
              <div key={sport} className="p-4 bg-[var(--color-bg-primary)] rounded-lg border border-[var(--color-border-card)]">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">{sport}</h3>
                  <span className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-sm font-semibold">
                    {record.rank || '미등급'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-[var(--color-text-secondary)]">참가 대회:</span>
                    <span className="ml-2 font-medium text-[var(--color-text-primary)]">{record.competitions}회</span>
                  </div>
                  {record.bestResult && (
                    <div>
                      <span className="text-[var(--color-text-secondary)]">최고 성적:</span>
                      <span className="ml-2 font-medium text-[var(--color-text-primary)]">{record.bestResult}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 대회 성적 추가 모달 */}
      {isRecordModalOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4"
          onMouseDown={(e) => {
            // 모달 내용이 아닌 배경을 클릭한 경우에만 기록
            if (e.target === e.currentTarget) {
              modalMouseDownRef.current = { x: e.clientX, y: e.clientY };
            }
          }}
          onMouseUp={(e) => {
            // 모달 내용이 아닌 배경을 클릭한 경우에만 처리
            if (e.target === e.currentTarget && modalMouseDownRef.current) {
              const distance = Math.sqrt(
                Math.pow(e.clientX - modalMouseDownRef.current.x, 2) +
                Math.pow(e.clientY - modalMouseDownRef.current.y, 2)
              );
              // 5px 이내 이동이면 클릭으로 간주, 그 이상이면 드래그로 간주
              if (distance < 5) {
                setIsRecordModalOpen(false);
              }
              modalMouseDownRef.current = null;
            }
          }}
        >
          <div className="bg-[var(--color-bg-card)] rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4">대회 성적 추가</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">운동 종목</label>
                <select
                  value={selectedSport}
                  onChange={(e) => setSelectedSport(e.target.value)}
                  className="w-full px-4 py-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]"
                >
                  <option value="">선택하세요</option>
                  {SPORTS_LIST.map((sport) => (
                    <option key={sport} value={sport}>{sport}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">대회명</label>
                <input
                  type="text"
                  value={competitionName}
                  onChange={(e) => setCompetitionName(e.target.value)}
                  placeholder="대회명을 입력해주세요"
                  className="w-full px-4 py-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">성적</label>
                <input
                  type="text"
                  value={competitionResult}
                  onChange={(e) => setCompetitionResult(e.target.value)}
                  placeholder="성적을 입력해주세요"
                  className="w-full px-4 py-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">대회 날짜</label>
                <input
                  type="date"
                  value={competitionDate}
                  onChange={(e) => setCompetitionDate(e.target.value)}
                  className="w-full px-4 py-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] date-input-dark"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">급수</label>
                <input
                  type="text"
                  value={sportRank}
                  onChange={(e) => setSportRank(e.target.value)}
                  placeholder="급수를 입력해주세요"
                  className="w-full px-4 py-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]"
                />
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                  운동별로 급수 체계가 다를 수 있습니다 (예: 배드민턴 A~E급, 기타 1~5급 등)
                </p>
              </div>
              <div className="flex space-x-3 pt-2">
                <button
                  onClick={() => {
                    if (!selectedSport || !competitionName) {
                      showWarning('운동 종목과 대회명을 입력해주세요.', '입력 오류');
                      return;
                    }
                    
                    const userId = profileData?.id;
                    if (!userId) return;

                    const updatedRecords = { ...sportRecords };
                    if (!updatedRecords[selectedSport]) {
                      updatedRecords[selectedSport] = {
                        competitions: 0,
                        bestResult: '',
                        rank: '미등급',
                      };
                    }
                    
                    updatedRecords[selectedSport].competitions += 1;
                    if (!updatedRecords[selectedSport].bestResult || 
                        (competitionResult && competitionResult.includes('우승'))) {
                      updatedRecords[selectedSport].bestResult = competitionResult || '참가';
                    }
                    // 사용자가 입력한 급수 사용
                    updatedRecords[selectedSport].rank = sportRank;

                    setSportRecords(updatedRecords);
                    localStorage.setItem(`sportRecords_${userId}`, JSON.stringify(updatedRecords));

                    // 폼 초기화
                    setSelectedSport('');
                    setCompetitionName('');
                    setCompetitionResult('');
                    setCompetitionDate('');
                    setSportRank('미등급');
                    setIsRecordModalOpen(false);
                  }}
                  className="flex-1 px-4 py-2 bg-[var(--color-blue-primary)] text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
                >
                  저장
                </button>
                <button
                  onClick={() => {
                    setSelectedSport('');
                    setCompetitionName('');
                    setCompetitionResult('');
                    setCompetitionDate('');
                    setSportRank('미등급');
                    setIsRecordModalOpen(false);
                  }}
                  className="flex-1 px-4 py-2 bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] rounded-lg hover:opacity-80 transition-opacity font-medium"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 시설 등록 안내 모달 */}
      {showFacilityRegistrationModal && (
        <div 
          className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              modalMouseDownRef.current = { x: e.clientX, y: e.clientY };
            }
          }}
          onMouseUp={(e) => {
            if (e.target === e.currentTarget && modalMouseDownRef.current) {
              const dx = e.clientX - modalMouseDownRef.current.x;
              const dy = e.clientY - modalMouseDownRef.current.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              if (distance < 5) {
                setShowFacilityRegistrationModal(false);
              }
              modalMouseDownRef.current = null;
            }
          }}
        >
          <div 
            className="bg-[var(--color-bg-card)] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[var(--color-border-card)]"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-[var(--color-bg-card)] border-b border-[var(--color-border-card)] p-4 md:p-6 flex items-center justify-between z-10">
              <h2 className="text-xl md:text-2xl font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                <CheckCircleIcon className="w-6 h-6 text-green-500" />
                사업자번호 검증 완료
              </h2>
              <button
                onClick={() => setShowFacilityRegistrationModal(false)}
                className="p-2 hover:bg-[var(--color-bg-secondary)] rounded-lg transition-colors"
              >
                <XMarkIcon className="w-6 h-6 text-[var(--color-text-primary)]" />
              </button>
            </div>

            <div className="p-4 md:p-6 space-y-6">
              {/* 성공 메시지 */}
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-green-700 dark:text-green-400 font-medium">
                  🎉 사업자번호 검증이 완료되었습니다! 이제 체육센터를 등록할 수 있습니다.
                </p>
              </div>

              {/* 시설 등록 안내 */}
              <div>
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
                  <BuildingOfficeIcon className="w-5 h-5 text-[var(--color-blue-primary)]" />
                  시설 등록 가이드
                </h3>
                <div className="space-y-3">
                  <div className="p-4 bg-[var(--color-bg-primary)] rounded-lg border border-[var(--color-border-card)]">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--color-blue-primary)] text-white flex items-center justify-center font-bold">
                        1
                      </div>
                      <div>
                        <h4 className="font-semibold text-[var(--color-text-primary)] mb-1">시설 예약 페이지로 이동</h4>
                        <p className="text-sm text-[var(--color-text-secondary)]">
                          시설 예약 페이지에서 '시설 등록' 버튼을 클릭하세요.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-[var(--color-bg-primary)] rounded-lg border border-[var(--color-border-card)]">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--color-blue-primary)] text-white flex items-center justify-center font-bold">
                        2
                      </div>
                      <div>
                        <h4 className="font-semibold text-[var(--color-text-primary)] mb-1">시설 정보 입력</h4>
                        <ul className="text-sm text-[var(--color-text-secondary)] space-y-1 list-disc list-inside">
                          <li>시설명과 종류를 선택하세요</li>
                          <li>주소 찾기 버튼으로 위치를 설정하세요</li>
                          <li>운영 시간과 가격 정보를 입력하세요 (선택사항)</li>
                          <li>편의시설을 선택하세요 (선택사항)</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-[var(--color-bg-primary)] rounded-lg border border-[var(--color-border-card)]">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--color-blue-primary)] text-white flex items-center justify-center font-bold">
                        3
                      </div>
                      <div>
                        <h4 className="font-semibold text-[var(--color-text-primary)] mb-1">시설 등록 완료</h4>
                        <p className="text-sm text-[var(--color-text-secondary)]">
                          등록된 시설은 시설 예약 페이지에서 확인할 수 있으며, 사용자들이 예약할 수 있습니다.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 버튼 */}
              <div className="flex gap-3 pt-4 border-t border-[var(--color-border-card)]">
                <button
                  onClick={() => setShowFacilityRegistrationModal(false)}
                  className="flex-1 px-4 py-3 bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] rounded-lg font-semibold hover:opacity-80 transition-opacity"
                >
                  나중에 하기
                </button>
                <button
                  onClick={() => {
                    setShowFacilityRegistrationModal(false);
                    navigate('/facility-reservation');
                  }}
                  className="flex-1 px-4 py-3 bg-[var(--color-blue-primary)] text-white rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <BuildingOfficeIcon className="w-5 h-5" />
                  시설 등록하러 가기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 회원 탈퇴 확인 모달 */}
      {showWithdrawModal && (
        <div 
          className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              modalMouseDownRef.current = { x: e.clientX, y: e.clientY };
            }
          }}
          onMouseUp={(e) => {
            if (e.target === e.currentTarget && modalMouseDownRef.current) {
              const dx = e.clientX - modalMouseDownRef.current.x;
              const dy = e.clientY - modalMouseDownRef.current.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              if (distance < 5) {
                setShowWithdrawModal(false);
              }
              modalMouseDownRef.current = null;
            }
          }}
        >
          <div 
            className="bg-[var(--color-bg-card)] rounded-2xl shadow-2xl max-w-md w-full border border-[var(--color-border-card)]"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                  <TrashIcon className="w-6 h-6 text-red-500" />
                </div>
                <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                  회원 탈퇴
                </h2>
              </div>

              <div className="space-y-4 mb-6">
                <p className="text-[var(--color-text-primary)]">
                  정말 회원 탈퇴를 하시겠습니까?
                </p>
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-700 dark:text-red-400 font-medium mb-2">
                    ⚠️ 탈퇴 시 주의사항
                  </p>
                  <ul className="text-xs text-red-600 dark:text-red-400 space-y-1 list-disc list-inside">
                    <li>탈퇴 후 복구가 불가능합니다</li>
                    <li>모든 개인정보가 삭제됩니다</li>
                    <li>작성한 매치, 댓글 등 모든 활동 내역이 삭제됩니다</li>
                    <li>등록한 시설 정보가 삭제됩니다</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowWithdrawModal(false)}
                  disabled={isWithdrawing}
                  className="flex-1 px-4 py-3 bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] rounded-lg font-semibold hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  취소
                </button>
                <button
                  onClick={handleWithdrawConfirm}
                  disabled={isWithdrawing}
                  className="flex-1 px-4 py-3 bg-red-500 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isWithdrawing ? '처리 중...' : '탈퇴하기'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 운동 통계 모달 */}
      {showStatisticsModal && profileData && (
        <SportsStatisticsModal
          userId={profileData.id}
          isOpen={showStatisticsModal}
          onClose={() => setShowStatisticsModal(false)}
        />
      )}

      {/* 로그아웃 및 회원 탈퇴 */}
      <div className="flex justify-between items-center pt-4 border-t border-[var(--color-border-card)]">
        <button
          onClick={handleLogout}
          className="flex items-center space-x-2 px-4 py-2 bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] rounded-lg hover:bg-[var(--color-bg-primary)] transition-colors text-sm font-medium"
        >
          <ArrowRightOnRectangleIcon className="w-4 h-4" />
          <span>로그아웃</span>
        </button>
        <button
          onClick={handleWithdraw}
          className="flex items-center space-x-2 text-[var(--color-text-secondary)] hover:text-red-500 transition-colors text-sm"
        >
          <TrashIcon className="w-4 h-4" />
          <span>회원 탈퇴</span>
        </button>
      </div>
    </div>
  );
};

export default MyInfoPage;
