import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  UserCircleIcon,
  EnvelopeIcon,
  LockClosedIcon,
  PhoneIcon,
  CameraIcon,
  PencilIcon,
  TrashIcon,
  ArrowRightOnRectangleIcon,
  MapPinIcon,
  TrophyIcon,
  BuildingOfficeIcon,
  ShieldCheckIcon,
  XMarkIcon,
  ChartBarIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { showError, showSuccess, showWarning, showInfo, showConfirm } from '../utils/swal';
import ToggleSwitch from './ToggleSwitch';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from './LoadingSpinner';
import SportsStatisticsModal from './SportsStatisticsModal';
import { getEarnedTitles, getCountByCategory } from '../utils/titles';
import { getOhunRankStyle } from '../constants/ohunRank';

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
  sportPositions?: { sport: string; positions: string[] }[];
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
  isAdmin?: boolean;
  nicknameChangedAt?: string | null;
  socialAccounts: {
    kakao: boolean;
    naver: boolean;
    google: boolean;
  };
  realName?: string | null;
  athleteVerified?: boolean;
  athleteData?: { sport?: string; subSport?: string; registeredYear?: number; [key: string]: unknown } | null;
  /** 종목별 오운 랭크 (S~F). 랭크매치 참여 후 심판이 승패 기록한 종목만 포함 */
  effectiveRanks?: Record<string, string>;
}

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
  const [showFacilityRegistrationModal, setShowFacilityRegistrationModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [showStatisticsModal, setShowStatisticsModal] = useState(false);
  const [showChangeBusinessNumberModal, setShowChangeBusinessNumberModal] = useState(false);
  const [changeBusinessNumberStep, setChangeBusinessNumberStep] = useState<1 | 2>(1);
  const [changeBusinessNumberPassword, setChangeBusinessNumberPassword] = useState('');
  const [changeBusinessNumberNew, setChangeBusinessNumberNew] = useState('');
  const [isChangingBusinessNumber, setIsChangingBusinessNumber] = useState(false);
  const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);

  const closeChangeBusinessNumberModal = () => {
    setShowChangeBusinessNumberModal(false);
    setChangeBusinessNumberStep(1);
    setChangeBusinessNumberPassword('');
    setChangeBusinessNumberNew('');
  };

  // 사업자번호 형식 (하이픈 자동)
  const formatBusinessNumber = (value: string) => {
    const normalized = value.replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0));
    const numbers = normalized.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 5) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 5)}-${numbers.slice(5, 10)}`;
  };

  /** 1단계: 비밀번호 확인 */
  const handleVerifyPasswordForChangeBusinessNumber = async () => {
    if (!changeBusinessNumberPassword.trim()) {
      await showWarning('비밀번호를 입력해주세요.', '입력 필요');
      return;
    }
    setIsVerifyingPassword(true);
    try {
      await api.post('/api/auth/verify-password', { password: changeBusinessNumberPassword });
      setChangeBusinessNumberStep(2);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : '비밀번호가 일치하지 않습니다.';
      await showError(msg, '인증 실패');
    } finally {
      setIsVerifyingPassword(false);
    }
  };

  /** 2단계: 새 사업자번호로 변경 */
  const handleChangeBusinessNumberSubmit = async () => {
    const formatted = formatBusinessNumber(changeBusinessNumberNew);
    if (formatted.length !== 12) {
      await showWarning('사업자번호는 XXX-XX-XXXXX 형식으로 입력해주세요.', '형식 오류');
      return;
    }
    setIsChangingBusinessNumber(true);
    try {
      await api.post('/api/auth/change-business-number', {
        password: changeBusinessNumberPassword,
        newBusinessNumber: formatted,
      });
      await showSuccess('사업자번호가 변경되었습니다.', '변경 완료');
      closeChangeBusinessNumberModal();
      fetchUserData();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : '사업자번호 변경에 실패했습니다.';
      await showError(msg, '변경 실패');
    } finally {
      setIsChangingBusinessNumber(false);
    }
  };

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
  // 내가 참가한/생성한 모임 목록 (API 연동)
  const [myParticipations, setMyParticipations] = useState<Array<{ id: number; name: string; category: string; meetingTime: string | null; location: string; participantCount: number; creator?: { nickname: string } }>>([]);
  const [myCreations, setMyCreations] = useState<Array<{ id: number; name: string; category: string; meetingTime: string | null; location: string; participantCount: number }>>([]);

  // 팔로워/팔로잉 수 상태
  const [followStats, setFollowStats] = useState({
    followers: 0,
    following: 0,
  });

  const [isAthleteRegistering, setIsAthleteRegistering] = useState(false);
  /** 랭크 매치 점수가 있는 종목을 시간에 따라 자동 전환 (오운 랭크 패널) */
  const [rankCycleIndex, setRankCycleIndex] = useState(0);

  // 모달 배경 클릭 감지용 (드래그와 클릭 구분)
  const modalMouseDownRef = useRef<{ x: number; y: number } | null>(null);

  const handleAthleteRegister = async () => {
    if (!profileData?.realName?.trim()) {
      await showWarning('선수 등록을 위해 먼저 실명을 등록해 주세요.', '실명 필요');
      return;
    }
    setIsAthleteRegistering(true);
    try {
      const res = await api.post<{ success: boolean; message?: string }>('/api/users/athlete-register');
      if (res?.success) {
        const data = await api.get<UserProfileData>('/api/auth/me');
        const savedProfileImage = profileData?.id ? localStorage.getItem(`profileImage_${profileData.id}`) : null;
        const profileDataWithImage = (savedProfileImage && data?.id)
          ? { ...data, profileImage: savedProfileImage }
          : { ...data, profileImage: data?.profileImageUrl ?? null };
        setProfileData(profileDataWithImage);
        await showSuccess('대한체육회 선수로 등록되어 있습니다. 선수 뱃지가 적용되었습니다.', '선수 등록 완료');
      } else {
        await showError(res?.message ?? '선수 등록에 실패했습니다.', '선수 등록 실패');
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      const msg = e?.response?.data?.message ?? (e?.message as string) ?? '선수 등록 요청에 실패했습니다.';
      await showError(msg, '선수 등록 실패');
    } finally {
      setIsAthleteRegistering(false);
    }
  };

  // 활동 기록 데이터 가져오기 (내가 참가한/생성한 모임 API 연동)
  useEffect(() => {
    const fetchActivityStats = async () => {
      if (!authUser || !profileData) return;

      try {
        const userId = profileData.id;

        const [participations, creations] = await Promise.all([
          api.get<Array<{ id: number; name: string; category: string; meetingTime: string | null; location: string; participantCount: number; creator?: { nickname: string } }>>('/api/groups/my-participations'),
          api.get<Array<{ id: number; name: string; category: string; meetingTime: string | null; location: string; participantCount: number }>>('/api/groups/my-creations'),
        ]);

        const participationsList = Array.isArray(participations) ? participations : [];
        const creationsList = Array.isArray(creations) ? creations : [];

        setMyParticipations(participationsList);
        setMyCreations(creationsList);

        // 찜한 매치 수 (API 구현 후 활성화)
        const favoritesCount = 0;
        // 참여 예정 매치 수 (meetingTime 파싱 로직 구현 후)
        const upcomingCount = 0;

        setActivityStats({
          joinedGroups: participationsList.length,
          createdGroups: creationsList.length,
          favoriteGroups: favoritesCount,
          upcomingGroups: upcomingCount,
        });
      } catch (error) {
        console.error('활동 기록 조회 실패:', error);
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

  // 오운 랭크: 점수가 있는 종목을 일정 간격으로 자동 전환 (3초)
  useEffect(() => {
    const entries = Object.entries(profileData?.effectiveRanks || {});
    if (entries.length <= 1) return;
    const t = setInterval(
      () => setRankCycleIndex((i) => (i + 1) % entries.length),
      3000
    );
    return () => clearInterval(t);
  }, [profileData?.effectiveRanks]);

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

  // 획득 타이틀: 참여·생성 매치 종목별 횟수 기반 (일반 + 애호가/마스터)
  const earnedTitles = (() => {
    const countByCategory = getCountByCategory(myParticipations, myCreations);
    return getEarnedTitles(countByCategory);
  })();

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

  const joinDate = profileData.createdAt ? new Date(profileData.createdAt).toISOString().split('T')[0] : '';
  const effectiveRanks = profileData.effectiveRanks || {};
  const rankEntries = Object.entries(effectiveRanks);

  return (
    <div className="flex flex-col flex-1 w-full min-h-0 bg-[var(--color-bg-primary)]">
      {/* 히어로 / 상단 (스포츠용품 페이지와 동일 톤) */}
      <header className="flex-shrink-0 bg-[var(--color-bg-card)] border-b border-[var(--color-border-card)]">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12">
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)] mb-2">
            내 정보
          </h1>
          <p className="text-[var(--color-text-secondary)] max-w-2xl">
            프로필과 오운 랭크를 확인하고, 계정을 관리하세요.
          </p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto w-full px-4 md:px-6 py-6 space-y-6 pb-12">
      {/* 프로필 요약 (랭크 매치 참여 시에만 오운 랭크 패널 표시) */}
      <section className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-card)] overflow-hidden shadow-sm">
        {/* 오운 랭크 패널: 랭크 티어가 있는 사용자만 표시. 점수 있는 종목 자동 전환, 클릭 시 명예의전당 */}
        {rankEntries.length > 0 && (
          <button
            type="button"
            onClick={() => navigate('/hall-of-fame')}
            className="w-full text-left px-6 py-4 md:py-5 bg-[var(--color-bg-secondary)]/60 border-b border-[var(--color-border-card)] hover:bg-[var(--color-bg-secondary)]/80 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)] focus:ring-inset"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3 min-w-0">
                <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider flex items-center gap-1.5 shrink-0">
                  <TrophyIcon className="w-4 h-4 text-amber-500" />
                  오운 랭크
                </span>
                <div className="flex items-center gap-2 min-h-[2.25rem]" key={rankCycleIndex}>
                  {(() => {
                    const [sport, rank] = rankEntries[rankCycleIndex % rankEntries.length];
                    return (
                      <span
                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-r ${getOhunRankStyle(rank)} shadow-sm animate-[fadeIn_0.3s_ease-out]`}
                        title={`${sport} ${rank}랭크`}
                      >
                        <TrophyIcon className="w-4 h-4 opacity-90" />
                        {sport} <span className="opacity-95">{rank}</span>
                      </span>
                    );
                  })()}
                </div>
              </div>
              <span className="text-xs font-medium text-[var(--color-blue-primary)] flex items-center gap-1 shrink-0">
                명예의전당 보기
                <ChevronRightIcon className="w-4 h-4" />
              </span>
            </div>
          </button>
        )}

        <div className="p-6">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">프로필 요약</h2>
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* 프로필 사진 */}
            <div className="relative">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-[var(--color-bg-secondary)] flex items-center justify-center overflow-hidden ring-2 ring-[var(--color-border-card)]">
                {profileData.profileImage ? (
                  <img src={profileData.profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <UserCircleIcon className="w-20 h-20 text-[var(--color-text-secondary)]" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-[var(--color-blue-primary)] text-white rounded-full p-2 cursor-pointer hover:opacity-90 transition-opacity shadow-md">
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
                      className="flex-1 px-3 py-2 border border-[var(--color-border-card)] rounded-xl bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
                      autoFocus
                    />
                    <button
                      onClick={handleNicknameSave}
                      className="px-4 py-2 bg-[var(--color-blue-primary)] text-white rounded-xl hover:opacity-90 transition-opacity font-medium text-sm"
                    >
                      저장
                    </button>
                    <button
                      onClick={() => {
                        setNickname(profileData.nickname || '');
                        setIsEditingNickname(false);
                      }}
                      className="px-4 py-2 bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] rounded-xl hover:opacity-80 transition-opacity text-sm"
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
            {/* 타이틀 뱃지: 활동 기반 획득 타이틀(일반/애호가/마스터) + 비즈니스·선수. 사업자는 '일반' 제외 */}
            <div className="flex items-center space-x-2 text-sm flex-wrap gap-2 mt-2">
              {earnedTitles
                .filter((title) => !profileData.businessNumberVerified || title !== '일반')
                .map((title) => (
                  <span
                    key={title}
                    className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-semibold"
                  >
                    {title}
                  </span>
                ))}
              {profileData.businessNumberVerified && (
                <span className="px-3 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-full font-semibold flex items-center gap-1">
                  <BuildingOfficeIcon className="w-4 h-4" />
                  비즈니스
                </span>
              )}
              {profileData.isAdmin && (
                <span className="px-3 py-1 bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-full font-semibold flex items-center gap-1" title="시설·상품 등록, 이벤트매치 개최 등 모든 기능 이용 가능">
                  <ShieldCheckIcon className="w-4 h-4" />
                  관리자
                </span>
              )}
              {profileData.athleteVerified && (
                <span className="px-3 py-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-full font-semibold flex items-center gap-1" title={profileData.athleteData?.sport ? `종목: ${profileData.athleteData.sport}` : undefined}>
                  <TrophyIcon className="w-4 h-4" />
                  선수
                  {profileData.athleteData?.sport && (
                    <span className="opacity-90 text-xs">({profileData.athleteData.sport})</span>
                  )}
                </span>
              )}
            </div>
            {!profileData.athleteVerified && (
              <div className="mt-2">
                <button
                  type="button"
                  onClick={handleAthleteRegister}
                  disabled={isAthleteRegistering || !profileData.realName?.trim()}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border-2 border-[var(--color-border-card)] bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-primary)] hover:border-[var(--color-blue-primary)]/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <TrophyIcon className="w-4 h-4" />
                  {isAthleteRegistering ? '조회 중...' : '선수 등록'}
                </button>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                  대한체육회 스포츠지원포털에 등록된 선수라면 실명으로 조회 후 선수 뱃지를 받을 수 있습니다.
                </p>
              </div>
            )}
            
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
        </div>
      </section>

      {/* 계정 정보 */}
      <section className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-card)] p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">계정 정보</h2>
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
              className="px-4 py-2.5 bg-[var(--color-blue-primary)] text-white rounded-xl hover:opacity-90 transition-opacity text-sm font-medium"
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
      <section className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-card)] p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">연락처 정보</h2>
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
                    className="flex-1 px-3 py-2 border border-[var(--color-border-card)] rounded-xl bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
                    placeholder="010-1234-5678"
                  />
                  <button
                    onClick={handlePhoneSave}
                    className="px-4 py-2 bg-[var(--color-blue-primary)] text-white rounded-xl hover:opacity-90 transition-opacity text-sm font-medium"
                  >
                    저장
                  </button>
                  <button
                    onClick={() => {
                      setPhone(profileData.phone || '');
                      setIsEditingPhone(false);
                    }}
                    className="px-4 py-2 bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] rounded-xl hover:opacity-80 transition-opacity text-sm"
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

          {/* 사업자번호 (사업자 회원, 가입 시 인증 완료된 경우만 표시·읽기 전용) */}
          {profileData.businessNumber && profileData.businessNumberVerified && (
            <div className="pt-3 border-t border-[var(--color-border-card)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <BuildingOfficeIcon className="w-5 h-5 text-[var(--color-text-secondary)]" />
                  <div>
                    <div className="text-sm text-[var(--color-text-secondary)]">사업자번호</div>
                    <div className="text-xs text-[var(--color-text-secondary)]">
                      가입 시 인증 완료 · 체육센터/스포츠용품 등록 가능
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-2 text-[var(--color-text-primary)] font-medium">
                {profileData.businessNumber}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowChangeBusinessNumberModal(true)}
                  className="text-sm font-medium px-3 py-1.5 rounded-lg border border-[var(--color-border-card)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] transition-colors"
                >
                  사업자번호 변경
                </button>
                <button
                  type="button"
                  onClick={() => setShowFacilityRegistrationModal(true)}
                  className="text-sm text-[var(--color-blue-primary)] hover:underline"
                >
                  시설 등록 방법 보기
                </button>
              </div>
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

      {/* 활동 기록 요약 → 전용 페이지로 이동 */}
      <section className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-card)] p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-1">활동 기록</h2>
            <p className="text-sm text-[var(--color-text-secondary)]">
              참여한 매치 {activityStats.joinedGroups}건 · 생성한 매치 {activityStats.createdGroups}건
            </p>
          </div>
          <button
            onClick={() => navigate('/my-activity')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all border-2 border-[var(--color-blue-primary)] text-[var(--color-blue-primary)] bg-transparent hover:bg-[var(--color-blue-primary)] hover:text-white text-sm"
          >
            <ChartBarIcon className="w-5 h-5" />
            활동기록 보기
          </button>
        </div>
      </section>

      {/* 사업자번호 변경 모달 (2단계: 비밀번호 인증 → 새 사업자번호 입력) */}
      {showChangeBusinessNumberModal && (
        <div
          className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4"
          onMouseDown={(e) => e.target === e.currentTarget && (modalMouseDownRef.current = { x: e.clientX, y: e.clientY })}
          onMouseUp={(e) => {
            if (e.target === e.currentTarget && modalMouseDownRef.current) {
              const dx = e.clientX - modalMouseDownRef.current.x;
              const dy = e.clientY - modalMouseDownRef.current.y;
              if (Math.sqrt(dx * dx + dy * dy) < 5) closeChangeBusinessNumberModal();
              modalMouseDownRef.current = null;
            }
          }}
        >
          <div
            className="bg-[var(--color-bg-card)] rounded-2xl shadow-2xl max-w-md w-full border border-[var(--color-border-card)] p-6"
            onClick={(ev) => ev.stopPropagation()}
            onMouseDown={(ev) => ev.stopPropagation()}
            onMouseUp={(ev) => ev.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                <BuildingOfficeIcon className="w-6 h-6 text-[var(--color-blue-primary)]" />
                사업자번호 변경 {changeBusinessNumberStep === 2 && <span className="text-sm font-normal text-[var(--color-text-secondary)]">(2/2)</span>}
              </h2>
              <button
                type="button"
                onClick={closeChangeBusinessNumberModal}
                className="p-2 hover:bg-[var(--color-bg-secondary)] rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-[var(--color-text-primary)]" />
              </button>
            </div>

            {changeBusinessNumberStep === 1 ? (
              <>
                <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                  본인 확인을 위해 현재 비밀번호를 입력해주세요.
                </p>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">비밀번호</label>
                  <input
                    type="password"
                    value={changeBusinessNumberPassword}
                    onChange={(e) => setChangeBusinessNumberPassword(e.target.value)}
                    placeholder="현재 비밀번호"
                    className="w-full px-4 py-3 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
                  />
                </div>
                <div className="mt-6 flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={closeChangeBusinessNumberModal}
                    className="px-4 py-2 rounded-lg border border-[var(--color-border-card)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={handleVerifyPasswordForChangeBusinessNumber}
                    disabled={isVerifyingPassword || !changeBusinessNumberPassword.trim()}
                    className="px-4 py-2 rounded-lg bg-[var(--color-blue-primary)] text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isVerifyingPassword ? '확인 중...' : '다음'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                  변경할 새 사업자번호를 입력해주세요. API 검증 후 변경됩니다.
                </p>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">새 사업자번호</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    value={changeBusinessNumberNew}
                    onChange={(e) => setChangeBusinessNumberNew(formatBusinessNumber(e.target.value))}
                    placeholder="123-45-67890"
                    maxLength={12}
                    className="w-full px-4 py-3 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
                  />
                  <p className="mt-1 text-xs text-[var(--color-text-secondary)]">숫자만 입력하면 하이픈이 자동 추가됩니다.</p>
                </div>
                <div className="mt-6 flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setChangeBusinessNumberStep(1)}
                    className="px-4 py-2 rounded-lg border border-[var(--color-border-card)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] transition-colors"
                  >
                    이전
                  </button>
                  <button
                    type="button"
                    onClick={handleChangeBusinessNumberSubmit}
                    disabled={isChangingBusinessNumber || formatBusinessNumber(changeBusinessNumberNew).length !== 12}
                    className="px-4 py-2 rounded-lg bg-[var(--color-blue-primary)] text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isChangingBusinessNumber ? '변경 중...' : '변경하기'}
                  </button>
                </div>
              </>
            )}
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
                <BuildingOfficeIcon className="w-6 h-6 text-[var(--color-blue-primary)]" />
                시설 등록 안내
              </h2>
              <button
                onClick={() => setShowFacilityRegistrationModal(false)}
                className="p-2 hover:bg-[var(--color-bg-secondary)] rounded-lg transition-colors"
              >
                <XMarkIcon className="w-6 h-6 text-[var(--color-text-primary)]" />
              </button>
            </div>

            <div className="p-4 md:p-6 space-y-6">
              {/* 안내 메시지 */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-blue-700 dark:text-blue-400 font-medium">
                  체육센터를 등록하려면 아래 방법을 따라주세요.
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
      <div className="flex justify-between items-center pt-6 mt-2">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-primary)] transition-colors text-sm font-medium border border-[var(--color-border-card)]"
        >
          <ArrowRightOnRectangleIcon className="w-4 h-4" />
          <span>로그아웃</span>
        </button>
        <button
          onClick={handleWithdraw}
          className="flex items-center gap-2 text-[var(--color-text-secondary)] hover:text-red-500 transition-colors text-sm font-medium"
        >
          <TrashIcon className="w-4 h-4" />
          <span>회원 탈퇴</span>
        </button>
      </div>
      </div>
    </div>
  );
};

export default MyInfoPage;
