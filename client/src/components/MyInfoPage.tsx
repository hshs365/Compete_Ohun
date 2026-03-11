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
  ArrowPathIcon,
  TrophyIcon,
  BuildingOfficeIcon,
  ShieldCheckIcon,
  XMarkIcon,
  ChartBarIcon,
  ChevronRightIcon,
  BanknotesIcon,
  IdentificationIcon,
  DocumentArrowUpIcon,
  PhotoIcon,
  StarIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { TrophyIcon as TrophySolidIcon } from '@heroicons/react/24/solid';
import { showError, showSuccess, showWarning, showInfo, showConfirm } from '../utils/swal';
import ToggleSwitch from './ToggleSwitch';
import { useAuth } from '../contexts/AuthContext';
import { api, getImageUrl } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from './LoadingSpinner';
import SportsStatisticsModal from './SportsStatisticsModal';
import { getEarnedTitles, getCountByCategory } from '../utils/titles';
import { formatPhoneNumber, PHONE_PLACEHOLDER } from '../utils/phoneFormat';
import { getAllcourtplayRankStyle, getRankDisplayLabel } from '../constants/allcourtplayRank';
import { getFollowerGrade, getFollowerGradeBadgeStyle } from '../constants/followerGrade';
import { SPORT_CHIP_STYLES, SPORT_ICONS } from '../constants/sports';
import { getMannerGradeConfig } from '../utils/mannerGrade';
import FormatNumber from './FormatNumber';
import { compressImageForOcr } from '../utils/imageCompress';

/** 업적 정의: 달성 조건 및 지급 포인트 (10배 적용) */
const ACHIEVEMENTS = [
  { id: 'first-match', icon: '🎉', title: '첫 매치', description: '첫 매치 참가 완료', points: 1000, check: (s: { joined: number }) => s.joined >= 1 },
  { id: 'first-creation', icon: '✨', title: '첫 모임 생성', description: '모임을 처음 생성함', points: 500, check: (s: { created: number }) => s.created >= 1 },
  { id: 'active-participant', icon: '🌟', title: '활발한 참가자', description: '참여 5건 이상 또는 생성 3건 이상', points: 1000, check: (s) => s.joined >= 5 || s.created >= 3 },
  { id: 'match-master', icon: '🏆', title: '매치 마스터', description: '참여 10건 이상', points: 2000, check: (s) => s.joined >= 10 },
] as const;

/** 내 프로필 상세용 (profile-summary API 응답) */
interface MyProfileSummary {
  rankMatchStats?: { totalGames: number; wins: number; losses: number; winRate: number };
  mannerScore?: number;
  preferredPosition?: string;
  totalScore?: number;
  followersCount?: number;
  followingCount?: number;
  createdAt?: string;
  residenceSido?: string;
  residenceSigungu?: string;
  earnedTitles?: string[];
  recentCompletedActivities?: Array<{ type: 'participated' | 'created'; groupId: number; name: string; category: string; date: string }>;
}

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
  /** 전체 주소 (도로명/지번 + 상세주소). 회원가입/내 정보에서 저장 */
  residenceAddress?: string | null;
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
  /** 종목별 올코트플레이 랭크 (S~F). 랭크 매치 참여 후 심판이 승패 기록한 종목만 포함 */
  effectiveRanks?: Record<string, string>;
  /** 보유 포인트 */
  points?: number;
  /** 내 지역 랭크매치 생성 시 심판 신청 알림 받기 */
  notifyRefereeRankMatchInRegion?: boolean;
}

export interface PointHistoryItem {
  id: number;
  amount: number;
  type: 'earn' | 'use' | 'adjust' | 'achievement' | 'review' | 'facility_review';
  description: string | null;
  balanceAfter: number;
  createdAt: string;
}

const MyInfoPage = () => {
  const { user: authUser, logout, checkAuth } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [nickname, setNickname] = useState('');
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [phone, setPhone] = useState('');
  const [phoneVerificationCode, setPhoneVerificationCode] = useState('');
  const [isSendingPhoneCode, setIsSendingPhoneCode] = useState(false);
  const [phoneCodeCountdown, setPhoneCodeCountdown] = useState(0);
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
  const [showPointHistoryModal, setShowPointHistoryModal] = useState(false);
  const [pointHistory, setPointHistory] = useState<PointHistoryItem[]>([]);
  const [pointHistoryLoading, setPointHistoryLoading] = useState(false);
  const [isCharging, setIsCharging] = useState(false);
  /** 내 정보 상단 탭: 프로필 / 계정정보 (용병 구하기·용병 신청 스타일) */
  const [myInfoTab, setMyInfoTab] = useState<'profile' | 'account'>('profile');
  const [showBusinessConversionModal, setShowBusinessConversionModal] = useState(false);
  const [businessConversionDocumentFile, setBusinessConversionDocumentFile] = useState<File | null>(null);
  const [isConvertingBusiness, setIsConvertingBusiness] = useState(false);
  const [businessConversionRealName, setBusinessConversionRealName] = useState('');
  type BusinessConversionStep = 'upload' | 'compare' | 'direct';
  const [businessConversionStep, setBusinessConversionStep] = useState<BusinessConversionStep>('upload');
  const [businessConversionExtracted, setBusinessConversionExtracted] = useState<{
    businessNumber: string;
    representativeName?: string;
    openingDate?: string;
  } | null>(null);
  const [businessConversionMatch, setBusinessConversionMatch] = useState<boolean | null>(null);
  const [businessConversionManual, setBusinessConversionManual] = useState({
    businessNumber: '',
    representativeName: '',
    openingDate: '',
  });
  const businessConversionFileInputRef = useRef<HTMLInputElement>(null);
  const lastFetchTimeRef = useRef<number>(0);

  const closeChangeBusinessNumberModal = () => {
    setShowChangeBusinessNumberModal(false);
    setChangeBusinessNumberStep(1);
    setChangeBusinessNumberPassword('');
    setChangeBusinessNumberNew('');
  };

  const closeBusinessConversionModal = () => {
    setShowBusinessConversionModal(false);
    setBusinessConversionDocumentFile(null);
    setBusinessConversionRealName('');
    setBusinessConversionStep('upload');
    setBusinessConversionExtracted(null);
    setBusinessConversionMatch(null);
    setBusinessConversionManual({ businessNumber: '', representativeName: '', openingDate: '' });
  };

  /** 1단계: 사업자등록증 이미지 업로드 → OCR 추출·가입자 정보 대조 (전환 없음) */
  const handleBusinessConversionSubmit = async () => {
    const realName = profileData?.realName?.trim() || businessConversionRealName.trim();
    if (!realName) {
      await showWarning(
        '실명이 등록되어 있지 않습니다. 아래에 실명(대표자명)을 입력해 주세요. 사업자등록증의 대표자명과 일치해야 합니다.',
        '실명 필요',
      );
      return;
    }
    if (!businessConversionDocumentFile) {
      await showWarning(
        '사업자등록증 이미지 파일을 첨부해 주세요. OCR로 문서에서 대표자명·사업자번호를 추출합니다.',
        '파일 필요',
      );
      return;
    }
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(businessConversionDocumentFile.type)) {
      await showWarning('사업자등록증은 이미지 파일만 업로드 가능합니다. (jpg, png 등)', '파일 형식 오류');
      return;
    }

    setIsConvertingBusiness(true);
    let fileToUpload: File;
    try {
      fileToUpload = await compressImageForOcr(businessConversionDocumentFile, 10 * 1024 * 1024);
      // Blob 기반 File이 전송 중 무효화되는 ERR_UPLOAD_FILE_CHANGED 방지: 버퍼로 복사한 새 File 사용
      const buffer = await fileToUpload.arrayBuffer();
      fileToUpload = new File([buffer], fileToUpload.name, { type: fileToUpload.type });
    } catch (compressErr) {
      setIsConvertingBusiness(false);
      await showError(
        compressErr instanceof Error ? compressErr.message : '이미지 압축에 실패했습니다. 10MB 이하 이미지를 사용해 주세요.',
        '압축 실패',
      );
      return;
    }

    try {
      const formData = new FormData();
      formData.append('document', fileToUpload);
      if (!profileData?.realName?.trim()) {
        formData.append('realName', realName);
      }

      const res = await api.request<{
        verified: boolean;
        ocrFailed?: boolean;
        message?: string;
        extracted?: { businessNumber: string; representativeName?: string; openingDate?: string };
        match?: boolean;
      }>('/api/auth/register-business-with-document', { method: 'POST', body: formData });

      if (res?.ocrFailed) {
        setBusinessConversionStep('direct');
        if (res?.message) await showWarning(res.message, 'OCR 인식 실패');
      } else if (res?.verified && res?.extracted) {
        setBusinessConversionExtracted(res.extracted);
        setBusinessConversionMatch(res?.match ?? false);
        setBusinessConversionStep('compare');
        if (!res?.match) {
          await showWarning(
            '사업자등록증의 대표자명과 등록된 실명이 일치하지 않습니다. 직접 입력으로 전환하거나, 본인 명의의 사업자등록증을 올려 주세요.',
            '대표자명 불일치',
          );
        }
      } else {
        await showError(
          res?.message || '사업자등록증 조회에 실패했습니다. 직접 입력을 이용해 주세요.',
          '조회 실패',
        );
      }
    } catch (error: unknown) {
      console.error('비즈니스 OCR 실패:', error);
      const err = error as { message?: string; response?: { data?: { message?: string } } };
      const msg =
        err?.response?.data?.message ||
        (err?.message as string) ||
        'OCR 조회에 실패했습니다. 직접 입력으로 진행해 주세요.';
      await showError(msg, '조회 실패');
    } finally {
      setIsConvertingBusiness(false);
    }
  };

  /** 2단계: OCR 대조 일치 시 전환 확정 */
  const handleBusinessConversionConfirm = async () => {
    if (!businessConversionExtracted?.businessNumber) return;
    setIsConvertingBusiness(true);
    try {
      const res = await api.request<{ verified: boolean; message?: string; businessNumber?: string }>(
        '/api/auth/register-business-confirm',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessNumber: businessConversionExtracted.businessNumber,
            representativeName: businessConversionExtracted.representativeName,
            openingDate: businessConversionExtracted.openingDate,
          }),
        },
      );
      if (res?.verified) {
        await showSuccess(
          '비즈니스 계정 전환이 완료되었습니다. 시설·상품 등록이 가능합니다.',
          '전환 완료',
        );
        closeBusinessConversionModal();
        fetchUserData();
      } else {
        await showError(res?.message || '전환에 실패했습니다.', '전환 실패');
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      await showError(
        err?.response?.data?.message || (err?.message as string) || '전환에 실패했습니다.',
        '전환 실패',
      );
    } finally {
      setIsConvertingBusiness(false);
    }
  };

  /** 직접입력 후 전환 확정 */
  const handleBusinessConversionManualSubmit = async () => {
    const realName = profileData?.realName?.trim() || businessConversionRealName.trim();
    const num = businessConversionManual.businessNumber.replace(/\D/g, '');
    if (num.length !== 10) {
      await showWarning('사업자번호는 XXX-XX-XXXXX 형식으로 입력해 주세요.', '형식 오류');
      return;
    }
    const businessNumber = `${num.slice(0, 3)}-${num.slice(3, 5)}-${num.slice(5)}`;
    const representativeName = (businessConversionManual.representativeName || realName).trim();
    if (!representativeName) {
      await showWarning('대표자명을 입력해 주세요. 등록된 실명과 일치해야 합니다.', '입력 필요');
      return;
    }

    setIsConvertingBusiness(true);
    try {
      const res = await api.request<{ verified: boolean; message?: string; businessNumber?: string }>(
        '/api/auth/register-business-confirm',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessNumber,
            representativeName,
            openingDate: businessConversionManual.openingDate.replace(/\D/g, '').slice(0, 8) || undefined,
          }),
        },
      );
      if (res?.verified) {
        await showSuccess(
          '비즈니스 계정 전환이 완료되었습니다. 시설·상품 등록이 가능합니다.',
          '전환 완료',
        );
        closeBusinessConversionModal();
        fetchUserData();
      } else {
        await showError(res?.message || '전환에 실패했습니다.', '전환 실패');
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      await showError(
        err?.response?.data?.message || (err?.message as string) || '전환에 실패했습니다.',
        '전환 실패',
      );
    } finally {
      setIsConvertingBusiness(false);
    }
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
      
      // 사용자별 주소: 1) localStorage(주소 검색으로 저장한 값) 2) 없으면 API의 residenceAddress 또는 residenceSido/residenceSigungu
      const locationKey = `userLocation_${data.id}`;
      const savedLocation = localStorage.getItem(locationKey);
      const fromApi = (data.residenceAddress && data.residenceAddress.trim())
        ? data.residenceAddress.trim()
        : [data.residenceSido, data.residenceSigungu].filter(Boolean).join(' ').trim();

      if (savedLocation) {
        try {
          const location = JSON.parse(savedLocation);
          const addr = location.address && typeof location.address === 'string' ? location.address.trim() : '';
          if (addr && !addr.startsWith('위도:')) {
            setUserLocation({ address: addr });
          } else {
            // 빈 주소나 잘못된 형식이면 localStorage 제거 후 API 값 사용
            localStorage.removeItem(locationKey);
            if (fromApi) setUserLocation({ address: fromApi });
            else setUserLocation(null);
          }
        } catch (e) {
          localStorage.removeItem(locationKey);
          if (fromApi) setUserLocation({ address: fromApi });
          else setUserLocation(null);
        }
      } else {
        if (fromApi) {
          setUserLocation({ address: fromApi });
        } else {
          setUserLocation(null);
        }
      }
    } catch (error) {
      console.error('사용자 정보 로드 실패:', error);
    } finally {
      setIsLoading(false);
      lastFetchTimeRef.current = Date.now();
    }
  }, []);

  // 사용자 정보 로드 (authUser 변경 시)
  useEffect(() => {
    if (authUser) {
      fetchUserData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser]); // fetchUserData는 useCallback으로 안정적이므로 dependency에서 제외

  // 페이지 포커스 시 데이터 새로고침 (가이드 완료 후 내 정보 페이지로 이동했을 때)
  // 15초 이상 경과한 경우에만 재요청 (불필요한 새로고침 방지)
  const FOCUS_REFRESH_INTERVAL_MS = 15000;
  useEffect(() => {
    const handleFocus = () => {
      if (!authUser || isLoading) return;
      const elapsed = Date.now() - lastFetchTimeRef.current;
      if (elapsed < FOCUS_REFRESH_INTERVAL_MS) return;
      setTimeout(() => {
        fetchUserData();
      }, 500);
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser, isLoading]);

  // userLocationUpdated 이벤트 리스너 (주소 저장 시 즉시 반영)
  useEffect(() => {
    const handleLocationUpdate = (event: CustomEvent) => {
      const { address } = event.detail || {};
      if (address && !address.startsWith('위도:')) {
        setUserLocation({ address });
      } else if (profileData?.id) {
        const locationKey = `userLocation_${profileData.id}`;
        const savedLocation = localStorage.getItem(locationKey);
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
      } else {
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
  }, [profileData?.id]);

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

  /** 타 유저 모달과 동일한 상세용 (랭크 통계·매너점수 등) */
  const [myProfileSummary, setMyProfileSummary] = useState<MyProfileSummary | null>(null);

  const [isAthleteRegistering, setIsAthleteRegistering] = useState(false);

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

        const [participations, creations, favRes] = await Promise.all([
          api.get<Array<{ id: number; name: string; category: string; meetingTime: string | null; location: string; participantCount: number; creator?: { nickname: string } }>>('/api/groups/my-participations'),
          api.get<Array<{ id: number; name: string; category: string; meetingTime: string | null; location: string; participantCount: number }>>('/api/groups/my-creations'),
          api.get<{ count: number }>('/api/groups/my-favorite-count'),
        ]);

        const participationsList = Array.isArray(participations) ? participations : [];
        const creationsList = Array.isArray(creations) ? creations : [];

        setMyParticipations(participationsList);
        setMyCreations(creationsList);

        const favoritesCount = favRes?.count ?? 0;
        // 참여 예정 매치 수 (meetingTime 파싱 로직 구현 후)
        const upcomingCount = 0;

        setActivityStats({
          joinedGroups: participationsList.length,
          createdGroups: creationsList.length,
          favoriteGroups: favoritesCount,
          upcomingGroups: upcomingCount,
        });

        // 업적 동기화: 미지급 업적 있으면 포인트 지급
        try {
          const syncRes = await api.get<{ granted: { achievementId: string; points: number }[]; totalGranted: number }>('/api/users/me/achievements/sync');
          if (syncRes?.granted?.length) {
            const total = syncRes.totalGranted ?? syncRes.granted.reduce((s, g) => s + g.points, 0);
            const updated = await api.get<UserProfileData>('/api/auth/me');
            setProfileData(updated);
            await showSuccess(`${total.toLocaleString()}P 업적 보상이 지급되었습니다.`, '업적 달성');
          }
        } catch (syncErr) {
          console.error('업적 동기화 실패:', syncErr);
        }
      } catch (error) {
        console.error('매치 기록 조회 실패:', error);
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

  // 프로필 상세 (랭크 매치 통계·매너점수 등) — 타 유저 모달과 동일 데이터
  useEffect(() => {
    if (!profileData?.id) {
      setMyProfileSummary(null);
      return;
    }
    api
      .get<MyProfileSummary>(`/api/users/${profileData.id}/profile-summary`)
      .then(setMyProfileSummary)
      .catch(() => setMyProfileSummary(null));
  }, [profileData?.id]);

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

      // 서버에 업로드 (Content-Type은 지정하지 않음 - 브라우저가 boundary 포함해 자동 설정)
      const response = await api.put<{ profileImageUrl?: string | null }>('/api/auth/me', formData);

      // 성공 시 프로필 데이터 업데이트: 서버가 반환한 URL 우선, 없으면 로컬 미리보기
      if (response) {
        const imageUrl = response.profileImageUrl ?? null;
        if (imageUrl) {
          setProfileData({ ...profileData, profileImage: imageUrl });
          if (profileData.id) localStorage.setItem(`profileImage_${profileData.id}`, imageUrl);
          checkAuth(); // AuthContext user 갱신으로 앱 전체에서 실시간 반영
        } else {
          const reader = new FileReader();
          reader.onloadend = () => {
            setProfileData({ ...profileData, profileImage: reader.result as string });
            if (profileData.id) localStorage.setItem(`profileImage_${profileData.id}`, reader.result as string);
          };
          reader.readAsDataURL(file);
        }
        await showSuccess('프로필 사진이 저장되었습니다.', '프로필 사진 업로드');
      }
    } catch (error) {
      console.error('프로필 사진 업로드 실패:', error);
      await showError('프로필 사진 저장에 실패했습니다. 네트워크를 확인하고 다시 시도해주세요.', '저장 실패');
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

  const isSmsVerificationEnabled = import.meta.env.VITE_SMS_VERIFICATION_ENABLED === 'true';

  // 연락처 인증번호 발송 요청
  const handleRequestPhoneVerification = async () => {
    if (!phone?.trim()) {
      await showWarning('전화번호를 입력해주세요.', '입력 필요');
      return;
    }
    const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;
    if (!phoneRegex.test(phone)) {
      await showWarning('올바른 전화번호 형식이 아닙니다. (예: 010-1234-5678)', '형식 오류');
      return;
    }
    setIsSendingPhoneCode(true);
    try {
      await api.post('/api/auth/me/phone/request-verification', { phone });
      setPhoneCodeCountdown(180);
      await showSuccess('인증번호가 발송되었습니다.', '인증번호 발송');
    } catch (error) {
      await showError(
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          (error instanceof Error ? error.message : '인증번호 발송에 실패했습니다.'),
        '발송 실패',
      );
    } finally {
      setIsSendingPhoneCode(false);
    }
  };

  // 연락처 인증번호 카운트다운
  useEffect(() => {
    if (phoneCodeCountdown <= 0) return;
    const t = setTimeout(() => setPhoneCodeCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phoneCodeCountdown]);

  const handlePhoneSave = async () => {
    if (!profileData) return;
    if (!phone?.trim()) {
      await showWarning('전화번호를 입력해주세요.', '입력 필요');
      return;
    }
    const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;
    if (!phoneRegex.test(phone)) {
      await showWarning('올바른 전화번호 형식이 아닙니다.', '형식 오류');
      return;
    }
    if (isSmsVerificationEnabled && phoneVerificationCode.length !== 6) {
      await showWarning('인증번호 6자리를 입력해주세요.', '인증 필요');
      return;
    }
    try {
      await api.put('/api/auth/me', {
        phone,
        ...(isSmsVerificationEnabled ? { verificationCode: phoneVerificationCode } : {}),
      });
      setProfileData({ ...profileData, phone });
      setIsEditingPhone(false);
      setPhoneVerificationCode('');
      setPhoneCodeCountdown(0);
      await showSuccess('연락처가 저장되었습니다.', '저장 완료');
    } catch (error) {
      console.error('전화번호 저장 실패:', error);
      await showError(
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          (error instanceof Error ? error.message : '연락처 저장에 실패했습니다.'),
        '저장 실패',
      );
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

  const handleRefereeRankMatchNotifyChange = async (value: boolean) => {
    if (!profileData) return;
    try {
      await api.put('/api/auth/me', { notifyRefereeRankMatchInRegion: value });
      setProfileData({ ...profileData, notifyRefereeRankMatchInRegion: value });
      showSuccess(value ? '내 지역 랭크매치 심판 알림을 켰어요.' : '내 지역 랭크매치 심판 알림을 껐어요.');
    } catch (error) {
      console.error('심판 알림 설정 업데이트 실패:', error);
      showError('설정 저장에 실패했어요. 다시 시도해 주세요.');
    }
  };

  // 획득 타이틀: 참여·생성 매치 종목별 횟수 기반 (일반 + 애호가/마스터)
  const earnedTitles = (() => {
    const countByCategory = getCountByCategory(myParticipations, myCreations);
    return getEarnedTitles(countByCategory);
  })();

  // 용병 기록: 종목별 참여 횟수·생성 횟수·급수
  const activityByCategory = (() => {
    const participationsByCategory: Record<string, number> = {};
    const creationsByCategory: Record<string, number> = {};
    myParticipations.forEach((g) => {
      participationsByCategory[g.category] = (participationsByCategory[g.category] || 0) + 1;
    });
    myCreations.forEach((g) => {
      creationsByCategory[g.category] = (creationsByCategory[g.category] || 0) + 1;
    });
    const categories = new Set([...Object.keys(participationsByCategory), ...Object.keys(creationsByCategory)]);
    return Array.from(categories)
      .filter((c) => c !== '전체')
      .sort()
      .map((category) => ({
        category,
        participations: participationsByCategory[category] || 0,
        creations: creationsByCategory[category] || 0,
      }))
      .filter((row) => row.participations > 0 || row.creations > 0);
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
            // 다음 API는 roadAddress/jibunAddress 사용. address만 쓰면 비어 있을 수 있음
            let fullAddress = (data.addressType === 'R')
              ? (data.roadAddress || data.address || '')
              : (data.jibunAddress || data.address || '');
            let extraAddress = '';
            if (data.addressType === 'R') {
              if (data.bname && data.bname !== '') extraAddress += data.bname;
              if (data.buildingName && data.buildingName !== '') {
                extraAddress += extraAddress ? `, ${data.buildingName}` : data.buildingName;
              }
              if (extraAddress) fullAddress += ` (${extraAddress})`;
            }

            if (!fullAddress.trim()) {
              await showError('주소를 선택해 주세요.', '주소 선택');
              return;
            }

            // 주소만 저장
            try {
              setIsSavingLocation(true);

              const locationData = {
                address: fullAddress.trim(),
              };

              setUserLocation(locationData);
              
              // 사용자별 localStorage 키 (계정 전환 시 혼선 방지)
              const locationKey = profileData?.id ? `userLocation_${profileData.id}` : 'userLocation';
              localStorage.setItem(locationKey, JSON.stringify(locationData));
              
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

  return (
    <div className="flex flex-col w-full min-h-full bg-[var(--color-bg-primary)]">
      {/* 히어로 / 상단 — 모바일 패딩·타이포 축소 */}
      <header className="flex-shrink-0 bg-[var(--color-bg-card)] border-b border-[var(--color-border-card)] safe-area-top">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-5 sm:py-6 md:py-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[var(--color-text-primary)] mb-1 sm:mb-2">
            내 정보
          </h1>
          <p className="text-sm sm:text-base text-[var(--color-text-secondary)] max-w-2xl">
            프로필과 계정을 관리하세요.
          </p>
        </div>
      </header>

      {/* 프로필 / 계정정보 탭 — 터치 영역 44px 이상 */}
      <div className="flex-shrink-0 bg-[var(--color-bg-card)] border-b border-[var(--color-border-card)]">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6">
          <div className="flex gap-1.5 sm:gap-2 py-2 sm:py-2.5">
            <button
              type="button"
              onClick={() => setMyInfoTab('profile')}
              className={`flex-1 min-h-[44px] py-3 rounded-xl text-sm font-semibold transition-colors active:scale-[0.98] ${
                myInfoTab === 'profile'
                  ? 'text-white bg-[var(--color-blue-primary)]'
                  : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]'
              }`}
            >
              프로필
            </button>
            <button
              type="button"
              onClick={() => setMyInfoTab('account')}
              className={`flex-1 min-h-[44px] py-3 rounded-xl text-sm font-semibold transition-colors active:scale-[0.98] ${
                myInfoTab === 'account'
                  ? 'text-white bg-[var(--color-blue-primary)]'
                  : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]'
              }`}
            >
              계정정보
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto w-full px-3 sm:px-4 md:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 pb-24 md:pb-12">
      {myInfoTab === 'profile' && (
      <>
      {/* 프로필 — 모바일: 패딩·아바타·타이포 축소 */}
      <section className="bg-[var(--color-bg-card)] rounded-xl sm:rounded-2xl border border-[var(--color-border-card)] overflow-hidden shadow-sm">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 sm:p-5 md:p-6 text-white">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="relative shrink-0">
              <div className="w-16 h-16 sm:w-[72px] sm:h-[72px] md:w-20 md:h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 sm:border-4 border-white/30 text-2xl sm:text-3xl font-bold overflow-hidden">
                {profileData.profileImage ? (
                  <img src={getImageUrl(profileData.profileImage)} alt="" className="w-full h-full object-cover" />
                ) : (
                  <UserCircleIcon className="w-12 h-12 sm:w-16 sm:h-16 text-white/90" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-white/90 text-gray-800 rounded-full p-1.5 sm:p-2 cursor-pointer hover:bg-white shadow-md touch-manipulation min-w-[36px] min-h-[36px] flex items-center justify-center">
                <CameraIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                <input type="file" accept="image/*" onChange={handleProfileImageChange} className="hidden" />
              </label>
            </div>
            <div className="flex-1 min-w-0">
              {isEditingNickname ? (
                <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2">
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="flex-1 min-w-0 w-full sm:min-w-[120px] px-3 py-2.5 sm:py-2 rounded-xl bg-white/20 text-white placeholder-white/70 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white text-base"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button onClick={handleNicknameSave} className="flex-1 sm:flex-none min-h-[44px] px-4 py-2.5 bg-white text-indigo-600 rounded-xl font-medium text-sm hover:opacity-90 active:scale-[0.98]">
                      저장
                    </button>
                    <button onClick={() => { setNickname(profileData.nickname || ''); setIsEditingNickname(false); }} className="flex-1 sm:flex-none min-h-[44px] px-4 py-2.5 bg-white/20 rounded-xl text-sm hover:bg-white/30 active:scale-[0.98]">
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-bold truncate">{profileData.nickname || '닉네임 없음'}</h2>
                  {profileData.tag && <span className="opacity-90">{profileData.tag}</span>}
                  <button
                    type="button"
                    onClick={() => {
                      if (profileData.nicknameChangedAt) {
                        const threeMonthsAgo = new Date(); threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
                        const lastChange = new Date(profileData.nicknameChangedAt);
                        if (lastChange > threeMonthsAgo) {
                          const daysRemaining = Math.ceil((lastChange.getTime() + 90 * 24 * 60 * 60 * 1000 - Date.now()) / (1000 * 60 * 60 * 24));
                          showWarning(`닉네임은 3개월에 한 번만 변경할 수 있습니다. ${daysRemaining}일 후에 변경 가능합니다.`, '닉네임 변경 제한');
                          return;
                        }
                      }
                      setIsEditingNickname(true);
                    }}
                    className="p-2 sm:p-1.5 rounded-lg text-white/80 hover:bg-white/20 touch-manipulation min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-1.5 sm:gap-2 mt-1 flex-wrap">
                {(() => {
                  const grade = getFollowerGrade(myProfileSummary?.followersCount ?? followStats.followers);
                  return grade ? (
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getFollowerGradeBadgeStyle(grade)}`}>{grade}</span>
                  ) : null;
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* 본문: 프로필 정보 · 주요 업적 · 보유 뱃지 — 모바일 패딩·그리드 */}
        <div className="p-4 sm:p-5 md:p-6 space-y-4">
          <div className="bg-[var(--color-bg-primary)] rounded-xl p-3 sm:p-4 border border-[var(--color-border-card)]">
            <h3 className="text-base sm:text-lg font-bold text-[var(--color-text-primary)] mb-2 sm:mb-3 flex items-center gap-2">
              <StarIcon className="w-5 h-5 text-yellow-500 shrink-0" />
              프로필 정보
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <div className="min-w-0 p-3 sm:p-4 rounded-xl bg-[var(--color-bg-secondary)]/50">
                <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-1">주 활동지역</p>
                <p className="text-lg sm:text-xl font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                  <MapPinIcon className="w-5 h-5 shrink-0 text-[var(--color-blue-primary)]" />
                  <span className="truncate">{profileData.residenceSido || '-'}</span>
                </p>
              </div>
              <div className="min-w-0 p-3 sm:p-4 rounded-xl bg-[var(--color-bg-secondary)]/50">
                <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-1">매너점수</p>
                <p className="text-lg sm:text-xl font-bold text-[var(--color-text-primary)] flex items-center gap-2 flex-wrap">
                  {(() => {
                    const mannerScore = profileData.mannerScore ?? myProfileSummary?.mannerScore ?? 80;
                    const mannerConfig = getMannerGradeConfig(mannerScore);
                    return (
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-base font-semibold badge-text-contrast ${mannerConfig.bg} ${mannerConfig.border}`}>
                        {mannerConfig.icon} <span>{mannerScore}</span>점
                      </span>
                    );
                  })()}
                </p>
              </div>
              <div className="min-w-0 p-3 sm:p-4 rounded-xl bg-[var(--color-bg-secondary)]/50">
                <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-1">주 종목</p>
                <div className="flex flex-wrap gap-2 mt-0.5">
                  {(profileData.interestedSports?.length ?? 0) > 0 ? (
                    profileData.interestedSports!.map((sport) => {
                      const chip = SPORT_CHIP_STYLES[sport] ?? SPORT_CHIP_STYLES['전체'];
                      return (
                        <span
                          key={sport}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold border badge-text-contrast ${chip.bg} ${chip.border}`}
                        >
                          {SPORT_ICONS[sport] ?? '●'} {sport}
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-base font-semibold text-[var(--color-text-secondary)]">전체</span>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-[var(--color-border-card)] flex items-center justify-between flex-wrap gap-2">
              <div>
                <p className="text-sm font-medium text-[var(--color-text-secondary)]">팔로워 / 팔로잉</p>
                <p className="text-base font-semibold text-[var(--color-text-primary)]">
                  <FormatNumber value={myProfileSummary?.followersCount ?? followStats.followers} /> / <FormatNumber value={myProfileSummary?.followingCount ?? followStats.following} />
                </p>
              </div>
              <button onClick={() => navigate('/followers')} className="min-h-[36px] px-4 py-2 text-sm text-[var(--color-blue-primary)] hover:underline touch-manipulation">보기</button>
            </div>
          </div>

          <div className="bg-[var(--color-bg-primary)] rounded-xl p-3 sm:p-4 border border-[var(--color-border-card)]">
            <h3 className="text-base sm:text-lg font-bold text-[var(--color-text-primary)] mb-2 sm:mb-3 flex items-center gap-2">
              <ChartBarIcon className="w-5 h-5 text-[var(--color-blue-primary)] shrink-0" />
              용병 기록
            </h3>
            {activityByCategory.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                {activityByCategory.map(({ category, participations, creations }) => {
                  const chip = SPORT_CHIP_STYLES[category] ?? SPORT_CHIP_STYLES['전체'];
                  const rank = profileData.effectiveRanks?.[category];
                  const rankLabel = rank && rank !== 'none' ? getRankDisplayLabel(category, rank) : '급수없음';
                  const hasRank = rank && rank !== 'none';
                  return (
                    <div
                      key={category}
                      className={`p-3 rounded-lg border ${chip.bg} ${chip.border}`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-lg">{SPORT_ICONS[category] ?? '●'}</span>
                        <span className="text-sm font-semibold badge-text-contrast">{category}</span>
                      </div>
                      <p className="text-xs badge-text-contrast text-[var(--color-text-secondary)]">
                        참여 {participations}건 · 생성 {creations}건
                      </p>
                      <p className="text-xs mt-1">
                        {hasRank ? (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded font-medium badge-text-contrast bg-gradient-to-r ${getAllcourtplayRankStyle(rank)}`}>
                            {rankLabel}
                          </span>
                        ) : (
                          <span className="badge-text-contrast text-[var(--color-text-secondary)]">급수없음</span>
                        )}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-[var(--color-text-secondary)] py-2">아직 용병 기록이 없어요. 매치에 참여하거나 모임을 만들면 여기에 표시돼요.</p>
            )}
          </div>

          <div className="bg-[var(--color-bg-primary)] rounded-xl p-3 sm:p-4 border border-[var(--color-border-card)]">
            <h3 className="text-base sm:text-lg font-bold text-[var(--color-text-primary)] mb-2 sm:mb-3 flex items-center gap-2">
              <TrophySolidIcon className="w-5 h-5 text-yellow-500 shrink-0" />
              주요 업적
            </h3>
            {(() => {
              const stats = { joined: activityStats.joinedGroups, created: activityStats.createdGroups };
              const achieved = ACHIEVEMENTS.filter((a) => a.check(stats));
              const challengeable = ACHIEVEMENTS.filter((a) => !a.check(stats));
              const AchievementCard = ({ a, done }: { a: (typeof ACHIEVEMENTS)[number]; done: boolean }) => (
                <div key={a.id} className={`p-3 rounded-lg border bg-[var(--color-bg-card)] border-[var(--color-border-card)] ${done ? 'ring-1 ring-amber-500/40' : 'opacity-80'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-2xl shrink-0">{a.icon}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[var(--color-text-primary)]">{a.title}</p>
                        <p className="text-xs text-[var(--color-text-secondary)]">{a.description}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-amber-500 shrink-0">+{a.points}P</span>
                  </div>
                </div>
              );
              return (
                <div className="space-y-4">
                  {achieved.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-[var(--color-text-secondary)] mb-2">달성한 업적</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
                        {achieved.map((a) => (
                          <AchievementCard key={a.id} a={a} done />
                        ))}
                      </div>
                    </div>
                  )}
                  {challengeable.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-[var(--color-text-secondary)] mb-2">도전 가능한 업적</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
                        {challengeable.map((a) => (
                          <AchievementCard key={a.id} a={a} done={false} />
                        ))}
                      </div>
                    </div>
                  )}
                  {achieved.length === 0 && challengeable.length === 0 && (
                    <p className="text-sm text-[var(--color-text-secondary)] py-2">업적 데이터를 불러오는 중...</p>
                  )}
                </div>
              );
            })()}
          </div>

          <div className="bg-[var(--color-bg-primary)] rounded-xl p-3 sm:p-4 border border-[var(--color-border-card)]">
            <h3 className="text-base sm:text-lg font-bold text-[var(--color-text-primary)] mb-2 sm:mb-3">보유 뱃지</h3>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {profileData.effectiveRanks && Object.entries(profileData.effectiveRanks).map(([sport, rank]) => (
                <span key={sport} className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r ${getAllcourtplayRankStyle(rank)}`}>
                  {sport} {getRankDisplayLabel(sport, rank)}
                </span>
              ))}
              {earnedTitles.filter((t) => !profileData.businessNumberVerified || t !== '일반').map((title) => (
                <span key={title} className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-semibold rounded-full">{title}</span>
              ))}
              {profileData.athleteVerified && (
                <span className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-semibold rounded-full flex items-center gap-1">
                  <TrophyIcon className="w-3.5 h-3.5" /> 선수 {profileData.athleteData?.sport && `(${profileData.athleteData.sport})`}
                </span>
              )}
              {(!profileData.effectiveRanks || !Object.keys(profileData.effectiveRanks).length) && !earnedTitles.length && !profileData.athleteVerified && (
                <span className="text-sm text-[var(--color-text-secondary)]">보유 뱃지가 없습니다.</span>
              )}
            </div>
          </div>
        </div>
      </section>
      </>
      )}

      {myInfoTab === 'account' && (
      <>
      {/* 계정 정보 — 모바일 패딩·터치 영역 */}
      <section className="bg-[var(--color-bg-card)] rounded-xl sm:rounded-2xl border border-[var(--color-border-card)] p-4 sm:p-5 md:p-6 shadow-sm">
        <h2 className="text-base sm:text-lg font-semibold text-[var(--color-text-primary)] mb-3 sm:mb-4">계정 정보</h2>
        <div className="space-y-3 sm:space-y-4">
          {/* 보유 포인트 + 충전하기 */}
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 py-3 border-b border-[var(--color-border-card)]">
            <button
              type="button"
              onClick={async () => {
                setShowPointHistoryModal(true);
                setPointHistoryLoading(true);
                try {
                  const list = await api.get<PointHistoryItem[]>('/api/users/my/point-history');
                  setPointHistory(list);
                } catch {
                  setPointHistory([]);
                } finally {
                  setPointHistoryLoading(false);
                }
              }}
              className="flex items-center gap-2 px-4 py-3 sm:py-2.5 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-card)] hover:border-amber-500/50 transition-colors cursor-pointer min-h-[44px] active:scale-[0.98]"
            >
              <BanknotesIcon className="w-5 h-5 text-amber-500 shrink-0" />
              <span className="text-sm text-[var(--color-text-secondary)]">보유 포인트</span>
              <span className="text-base sm:text-lg font-bold text-[var(--color-text-primary)]">{(profileData.points ?? 0).toLocaleString()} P</span>
            </button>
            <button
              type="button"
              disabled={isCharging}
              onClick={async () => {
                setIsCharging(true);
                try {
                  const res = await api.post<{ balance: number; added: number }>('/api/users/my/charge');
                  setProfileData((prev) => prev ? { ...prev, points: res.balance } : null);
                  await showSuccess(`${res.added.toLocaleString()} P가 충전되었습니다.`, '포인트 충전');
                } catch (e) {
                  const msg = e instanceof Error ? e.message : '포인트 충전에 실패했습니다.';
                  await showError(msg, '충전 실패');
                } finally {
                  setIsCharging(false);
                }
              }}
              className="min-h-[44px] px-4 py-3 sm:py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0 active:scale-[0.98]"
            >
              {isCharging ? '충전 중...' : '충전하기'}
            </button>
          </div>

          {/* 가입일 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3 border-b border-[var(--color-border-card)]">
            <div className="flex items-center space-x-3 min-w-0">
              <CalendarIcon className="w-5 h-5 text-[var(--color-text-secondary)] shrink-0" />
              <div>
                <div className="text-sm text-[var(--color-text-secondary)]">가입일</div>
                <div className="text-[var(--color-text-primary)] font-medium">
                  {joinDate ? new Date(joinDate).toLocaleDateString('ko-KR') : '-'}
                </div>
              </div>
            </div>
          </div>

          {/* 이메일 (수정 불가) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3 border-b border-[var(--color-border-card)]">
            <div className="flex items-center space-x-3 min-w-0">
              <EnvelopeIcon className="w-5 h-5 text-[var(--color-text-secondary)] shrink-0" />
              <div className="min-w-0">
                <div className="text-sm text-[var(--color-text-secondary)]">이메일</div>
                <div className="text-[var(--color-text-primary)] font-medium truncate">
                  {profileData.email || '이메일 없음'}
                </div>
              </div>
            </div>
            <span className="text-xs text-[var(--color-text-secondary)] bg-[var(--color-bg-secondary)] px-2 py-1 rounded shrink-0">수정 불가</span>
          </div>

          {/* 실명 (수정 불가) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3 border-b border-[var(--color-border-card)]">
            <div className="flex items-center space-x-3">
              <IdentificationIcon className="w-5 h-5 text-[var(--color-text-secondary)]" />
              <div>
                <div className="text-sm text-[var(--color-text-secondary)]">실명</div>
                <div className="text-[var(--color-text-primary)] font-medium">
                  {profileData.realName || '등록된 실명 없음'}
                </div>
              </div>
            </div>
            <span className="text-xs text-[var(--color-text-secondary)] bg-[var(--color-bg-secondary)] px-2 py-1 rounded">수정 불가</span>
          </div>

          {/* 비밀번호 변경 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3 border-b border-[var(--color-border-card)]">
            <div className="flex items-center space-x-3 min-w-0">
              <LockClosedIcon className="w-5 h-5 text-[var(--color-text-secondary)] shrink-0" />
              <div>
                <div className="text-sm text-[var(--color-text-secondary)]">비밀번호</div>
                <div className="text-[var(--color-text-primary)]">••••••••</div>
              </div>
            </div>
            <button
              onClick={handlePasswordChange}
              className="min-h-[44px] px-4 py-2.5 bg-[var(--color-blue-primary)] text-white rounded-xl hover:opacity-90 transition-opacity text-sm font-medium active:scale-[0.98] shrink-0"
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
                <div className="flex items-center justify-between py-2 px-3 bg-[#FEE500] rounded-lg">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-black">카카오톡</span>
                  </div>
                  <button
                    onClick={() => handleSocialDisconnect('kakao')}
                    className="text-xs text-black/70 hover:text-black hover:underline transition-colors"
                  >
                    연결 해제
                  </button>
                </div>
              )}
              {profileData.socialAccounts?.naver && (
                <div className="flex items-center justify-between py-2 px-3 bg-[#03C75A] rounded-lg">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-white">네이버</span>
                  </div>
                  <button
                    onClick={() => handleSocialDisconnect('naver')}
                    className="text-xs text-white/80 hover:text-white hover:underline transition-colors"
                  >
                    연결 해제
                  </button>
                </div>
              )}
              {profileData.socialAccounts?.google && (
                <div className="flex items-center justify-between py-2 px-3 bg-white border border-[var(--color-border-card)] rounded-lg">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-black">구글</span>
                  </div>
                  <button
                    onClick={() => handleSocialDisconnect('google')}
                    className="text-xs text-black/70 hover:text-black hover:underline transition-colors"
                  >
                    연결 해제
                  </button>
                </div>
              )}
              </div>
            )}
          </div>

          {/* 선수 등록 */}
          {!profileData.athleteVerified && (
            <div className="pt-4 mt-4 border-t border-[var(--color-border-card)]">
              <p className="text-xs text-[var(--color-text-secondary)] mb-2">
                대한체육회 스포츠지원포털에 등록된 선수라면 실명으로 조회 후 선수 뱃지를 받을 수 있습니다.
              </p>
              <button
                type="button"
                onClick={handleAthleteRegister}
                disabled={isAthleteRegistering || !profileData.realName?.trim()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--color-border-card)] bg-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <TrophyIcon className="w-3.5 h-3.5" />
                {isAthleteRegistering ? '조회 중...' : '선수 등록'}
              </button>
            </div>
          )}

          {/* 연락처 · 기타 (계정 정보 내 통합) — 모바일 패딩 */}
          <div className="pt-4 sm:pt-6 mt-4 sm:mt-6 border-t border-[var(--color-border-card)]">
            <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-3 sm:mb-4">연락처 · 기타</h3>
            <div className="divide-y divide-[var(--color-border-card)]">
          {/* 휴대전화 번호 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 py-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <PhoneIcon className="w-5 h-5 shrink-0 text-[var(--color-text-secondary)]" />
              {isEditingPhone ? (
                <div className="flex flex-col gap-3 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="tel"
                      inputMode="numeric"
                      value={phone}
                      onChange={(e) => {
                        const numbers = e.target.value.replace(/[^\d]/g, '');
                        setPhone(formatPhoneNumber(numbers));
                      }}
                      className="flex-1 min-w-0 w-full sm:min-w-[140px] px-3 py-2.5 sm:py-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] text-base focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
                      placeholder={PHONE_PLACEHOLDER}
                      maxLength={13}
                    />
                    {isSmsVerificationEnabled && (
                      <button
                        type="button"
                        onClick={handleRequestPhoneVerification}
                        disabled={isSendingPhoneCode || phoneCodeCountdown > 0}
                        className="px-4 py-2 bg-[var(--color-blue-primary)] text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSendingPhoneCode ? '발송 중...' : phoneCodeCountdown > 0 ? `${Math.floor(phoneCodeCountdown / 60)}:${String(phoneCodeCountdown % 60).padStart(2, '0')}` : '인증번호 발송'}
                      </button>
                    )}
                  </div>
                  {isSmsVerificationEnabled && (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={phoneVerificationCode}
                        onChange={(e) => setPhoneVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="인증번호 6자리"
                        className="w-32 px-3 py-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
                      />
                      <span className="text-xs text-[var(--color-text-secondary)]">SMS로 발송된 인증번호를 입력하세요</span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={handlePhoneSave}
                      className="px-4 py-2 bg-[var(--color-blue-primary)] text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium shrink-0"
                    >
                      저장
                    </button>
                    <button
                      onClick={() => {
                        setPhone(profileData.phone || '');
                        setIsEditingPhone(false);
                        setPhoneVerificationCode('');
                        setPhoneCodeCountdown(0);
                      }}
                      className="px-4 py-2 bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] rounded-lg hover:opacity-80 transition-opacity text-sm shrink-0"
                    >
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-[var(--color-text-secondary)]">휴대전화 번호</div>
                  <div className="text-[var(--color-text-primary)] font-medium truncate">
                    {profileData.phone || '등록된 전화번호 없음'}
                  </div>
                </div>
              )}
            </div>
            {!isEditingPhone && (
              <button
                type="button"
                onClick={() => {
                  setPhone(profileData.phone || '');
                  setPhoneVerificationCode('');
                  setPhoneCodeCountdown(0);
                  setIsEditingPhone(true);
                }}
                className="p-2.5 sm:p-2 shrink-0 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-blue-primary)] hover:bg-[var(--color-bg-secondary)] rounded-lg transition-colors active:scale-[0.98]"
                aria-label="휴대전화 번호 수정"
              >
                <PencilIcon className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* 주소 */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4 py-4">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <MapPinIcon className="w-5 h-5 shrink-0 text-[var(--color-text-secondary)] mt-0.5" />
              <div className="min-w-0 flex-1">
                <div className="text-sm text-[var(--color-text-secondary)] mb-1">주소</div>
                {userLocation && userLocation.address && !userLocation.address.startsWith('위도:') ? (
                  <div className="text-[var(--color-text-primary)] font-medium break-words">
                    {userLocation.address}
                  </div>
                ) : (
                  <div className="text-sm text-[var(--color-text-secondary)]">
                    저장된 주소가 없습니다.
                  </div>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={handleSearchAddress}
              disabled={isSavingLocation}
              className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 shrink-0 bg-[var(--color-blue-primary)] text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {isSavingLocation ? '저장 중...' : '변경'}
            </button>
          </div>

          {/* 비즈니스 계정 전환 (일반 회원용) */}
          {!profileData.businessNumberVerified && (
            <div className="py-4">
              <div className="flex items-start gap-3">
                <BuildingOfficeIcon className="w-5 h-5 shrink-0 text-[var(--color-text-secondary)] mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-[var(--color-text-secondary)] mb-0.5">비즈니스 계정 전환</div>
                  <p className="text-sm text-[var(--color-text-secondary)] mb-3">
                    시설·스포츠용품 등록, 이벤트매치 개최를 위해 사업자등록증으로 인증하세요. OCR로 자동 인식됩니다.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowBusinessConversionModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold hover:opacity-90 transition-opacity text-sm"
                  >
                    <DocumentArrowUpIcon className="w-5 h-5" />
                    사업자등록증으로 전환하기
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 사업자번호 (사업자 회원만) */}
          {profileData.businessNumber && profileData.businessNumberVerified && (
            <div className="py-4">
              <div className="flex items-start gap-3">
                <BuildingOfficeIcon className="w-5 h-5 shrink-0 text-[var(--color-text-secondary)] mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-[var(--color-text-secondary)] mb-0.5">사업자번호</div>
                  <div className="text-[var(--color-text-primary)] font-medium">
                    {profileData.businessNumber}
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                    가입 시 인증 완료 · 체육센터/스포츠용품 등록 가능
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-3">
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
              </div>
            </div>
          )}

          {/* 이메일 마케팅 수신 동의 */}
          <div className="flex items-center justify-between gap-4 py-4">
            <div className="flex items-center gap-3 min-w-0">
              <EnvelopeIcon className="w-5 h-5 shrink-0 text-[var(--color-text-secondary)]" />
              <div>
                <div className="text-sm text-[var(--color-text-secondary)]">이메일 마케팅 수신 동의</div>
                <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">이벤트·혜택 소식을 이메일로 받습니다.</div>
              </div>
            </div>
            <ToggleSwitch
              isOn={profileData.marketingEmailConsent}
              handleToggle={() => handleMarketingConsentChange('email', !profileData.marketingEmailConsent)}
              label=""
            />
          </div>

          {/* SMS 마케팅 수신 동의 */}
          <div className="flex items-center justify-between gap-4 py-4">
            <div className="flex items-center gap-3 min-w-0">
              <PhoneIcon className="w-5 h-5 shrink-0 text-[var(--color-text-secondary)]" />
              <div>
                <div className="text-sm text-[var(--color-text-secondary)]">SMS 마케팅 수신 동의</div>
                <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">이벤트·혜택 소식을 문자로 받습니다.</div>
              </div>
            </div>
            <ToggleSwitch
              isOn={profileData.marketingSmsConsent}
              handleToggle={() => handleMarketingConsentChange('sms', !profileData.marketingSmsConsent)}
              label=""
            />
          </div>

          {/* 심판 신청 알림 (내 지역 랭크매치) */}
          <div className="flex items-center justify-between gap-4 py-4">
            <div className="flex items-center gap-3 min-w-0">
              <TrophyIcon className="w-5 h-5 shrink-0 text-[var(--color-text-secondary)]" />
              <div>
                <div className="text-sm text-[var(--color-text-secondary)]">심판 신청 알림</div>
                <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">내가 사는 지역에 랭크매치가 생성되면 알림을 받아 심판 신청을 할 수 있어요.</div>
              </div>
            </div>
            <ToggleSwitch
              isOn={profileData.notifyRefereeRankMatchInRegion ?? false}
              handleToggle={() => handleRefereeRankMatchNotifyChange(!(profileData.notifyRefereeRankMatchInRegion ?? false))}
              label=""
            />
          </div>
            </div>
          </div>
        </div>

        {/* 로그아웃 · 회원 탈퇴 — 모바일 세로 배치·터치 영역 */}
        <div className="flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center pt-4 sm:pt-6 mt-4 sm:mt-6 border-t border-[var(--color-border-card)]">
          <button
            onClick={handleLogout}
            className="w-full sm:w-auto min-h-[48px] flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-primary)] transition-colors text-sm font-medium border border-[var(--color-border-card)] active:scale-[0.98]"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            <span>로그아웃</span>
          </button>
          <button
            onClick={handleWithdraw}
            className="w-full sm:w-auto min-h-[48px] flex items-center justify-center gap-2 text-[var(--color-text-secondary)] hover:text-red-500 transition-colors text-sm font-medium active:scale-[0.98]"
          >
            <TrashIcon className="w-5 h-5" />
            <span>회원 탈퇴</span>
          </button>
        </div>
      </section>
      </>
      )}

      {/* 사업자번호 변경 모달 (2단계: 비밀번호 인증 → 새 사업자번호 입력) */}
      {showChangeBusinessNumberModal && (
        <div
          className="fixed inset-0 bg-black/30 z-[1000] flex items-center justify-center p-4"
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

      {/* 비즈니스 계정 전환 모달 (OCR 조회 → 대조 → 전환 / 실패 시 직접입력) */}
      {showBusinessConversionModal && (
        <div
          className="fixed inset-0 bg-black/30 z-[1000] flex items-center justify-center p-4"
          onMouseDown={(e) => e.target === e.currentTarget && (modalMouseDownRef.current = { x: e.clientX, y: e.clientY })}
          onMouseUp={(e) => {
            if (e.target === e.currentTarget && modalMouseDownRef.current) {
              const dx = e.clientX - modalMouseDownRef.current.x;
              const dy = e.clientY - modalMouseDownRef.current.y;
              if (Math.sqrt(dx * dx + dy * dy) < 5) closeBusinessConversionModal();
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
                비즈니스 계정 전환
                {businessConversionStep === 'compare' && <span className="text-sm font-normal text-[var(--color-text-secondary)]">(2/2)</span>}
                {businessConversionStep === 'direct' && <span className="text-sm font-normal text-[var(--color-text-secondary)]">(직접 입력)</span>}
              </h2>
              <button
                type="button"
                onClick={closeBusinessConversionModal}
                className="p-2 hover:bg-[var(--color-bg-secondary)] rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-[var(--color-text-primary)]" />
              </button>
            </div>

            {/* 1단계: 이미지 업로드 */}
            {businessConversionStep === 'upload' && (
              <>
                <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                  사업자등록증 이미지를 올리시면 OCR로 조회한 뒤, 등록된 실명과 대조합니다. 일치할 때만 전환할 수 있습니다.
                </p>
                {profileData?.realName?.trim() ? (
                  <p className="text-sm text-[var(--color-text-primary)] mb-3">
                    등록된 실명(대표자명): <strong>{profileData.realName}</strong>
                  </p>
                ) : (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">실명 (대표자명)</label>
                    <input
                      type="text"
                      value={businessConversionRealName}
                      onChange={(e) => setBusinessConversionRealName(e.target.value)}
                      placeholder="사업자등록증의 대표자명과 동일하게 입력"
                      className="w-full px-4 py-3 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
                    />
                  </div>
                )}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">사업자등록증 이미지</label>
                  <input
                    ref={businessConversionFileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={(e) => setBusinessConversionDocumentFile(e.target.files?.[0] ?? null)}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => businessConversionFileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 px-4 py-4 border-2 border-dashed border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:border-[var(--color-blue-primary)] hover:text-[var(--color-blue-primary)] transition-colors"
                  >
                    {businessConversionDocumentFile ? (
                      <>
                        <DocumentArrowUpIcon className="w-6 h-6" />
                        <span>{businessConversionDocumentFile.name}</span>
                      </>
                    ) : (
                      <>
                        <PhotoIcon className="w-6 h-6" />
                        <span>이미지 선택 (jpg, png 등)</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={closeBusinessConversionModal} className="px-4 py-2 rounded-lg border border-[var(--color-border-card)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] transition-colors">취소</button>
                  <button
                    type="button"
                    onClick={handleBusinessConversionSubmit}
                    disabled={isConvertingBusiness || !businessConversionDocumentFile || (!profileData?.realName?.trim() && !businessConversionRealName.trim())}
                    className="px-4 py-2 rounded-lg bg-[var(--color-blue-primary)] text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isConvertingBusiness ? 'OCR 조회 중...' : 'OCR 조회'}
                  </button>
                </div>
              </>
            )}

            {/* 2단계: OCR 결과 대조 */}
            {businessConversionStep === 'compare' && businessConversionExtracted && (
              <>
                <p className="text-sm text-[var(--color-text-secondary)] mb-3">
                  OCR로 추출한 정보와 등록된 실명을 대조했습니다.
                </p>
                <div className="mb-4 p-3 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border-card)] space-y-1 text-sm">
                  <div className="text-[var(--color-text-primary)]">사업자번호: <strong>{businessConversionExtracted.businessNumber}</strong></div>
                  {businessConversionExtracted.representativeName && (
                    <div className="text-[var(--color-text-primary)]">대표자명: <strong>{businessConversionExtracted.representativeName}</strong></div>
                  )}
                  {profileData?.realName && (
                    <div className="text-[var(--color-text-secondary)]">등록 실명: {profileData.realName}</div>
                  )}
                  {businessConversionMatch ? (
                    <p className="text-green-600 dark:text-green-400 font-medium mt-2">일치합니다. 전환하기를 눌러 완료하세요.</p>
                  ) : (
                    <p className="text-amber-600 dark:text-amber-400 mt-2">대표자명이 일치하지 않습니다. 직접 입력으로 전환하거나 본인 명의 사업자등록증을 올려 주세요.</p>
                  )}
                </div>
                <div className="flex gap-2 justify-end flex-wrap">
                  <button type="button" onClick={() => { setBusinessConversionStep('upload'); setBusinessConversionExtracted(null); setBusinessConversionMatch(null); }} className="px-4 py-2 rounded-lg border border-[var(--color-border-card)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] transition-colors">다시 올리기</button>
                  {!businessConversionMatch && (
                    <button type="button" onClick={() => { setBusinessConversionStep('direct'); setBusinessConversionManual((m) => ({ ...m, businessNumber: businessConversionExtracted.businessNumber, representativeName: businessConversionExtracted.representativeName || '', openingDate: businessConversionExtracted.openingDate || '' })); }} className="px-4 py-2 rounded-lg border border-[var(--color-blue-primary)] text-[var(--color-blue-primary)] hover:bg-[var(--color-blue-primary)]/10 transition-colors">직접 입력으로 전환</button>
                  )}
                  <button
                    type="button"
                    onClick={handleBusinessConversionConfirm}
                    disabled={isConvertingBusiness || !businessConversionMatch}
                    className="px-4 py-2 rounded-lg bg-[var(--color-blue-primary)] text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isConvertingBusiness ? '전환 중...' : '전환하기'}
                  </button>
                </div>
              </>
            )}

            {/* 3단계: 직접 입력 (OCR 실패 또는 대조 불일치 시) */}
            {businessConversionStep === 'direct' && (
              <>
                <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                  사업자번호·대표자명·개업일자를 입력하세요. 등록된 실명과 일치해야 전환됩니다.
                </p>
                {profileData?.realName?.trim() && (
                  <p className="text-sm text-[var(--color-text-primary)] mb-3">등록된 실명: <strong>{profileData.realName}</strong></p>
                )}
                <div className="space-y-3 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">사업자번호 <span className="text-[var(--color-text-secondary)]">(XXX-XX-XXXXX)</span></label>
                    <input
                      type="text"
                      value={businessConversionManual.businessNumber}
                      onChange={(e) => setBusinessConversionManual((m) => ({ ...m, businessNumber: formatBusinessNumber(e.target.value) }))}
                      placeholder="000-00-00000"
                      className="w-full px-4 py-3 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">대표자명 <span className="text-[var(--color-text-secondary)]">(실명과 동일)</span></label>
                    <input
                      type="text"
                      value={businessConversionManual.representativeName}
                      onChange={(e) => setBusinessConversionManual((m) => ({ ...m, representativeName: e.target.value }))}
                      placeholder={profileData?.realName || '실명과 동일하게 입력'}
                      className="w-full px-4 py-3 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">개업일자 <span className="text-[var(--color-text-secondary)]">(선택, YYYYMMDD)</span></label>
                    <input
                      type="text"
                      value={businessConversionManual.openingDate}
                      onChange={(e) => setBusinessConversionManual((m) => ({ ...m, openingDate: e.target.value.replace(/\D/g, '').slice(0, 8) }))}
                      placeholder="20200101"
                      maxLength={8}
                      className="w-full px-4 py-3 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setBusinessConversionStep('upload')} className="px-4 py-2 rounded-lg border border-[var(--color-border-card)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] transition-colors">이미지로 다시 조회</button>
                  <button
                    type="button"
                    onClick={handleBusinessConversionManualSubmit}
                    disabled={isConvertingBusiness || businessConversionManual.businessNumber.replace(/\D/g, '').length !== 10}
                    className="px-4 py-2 rounded-lg bg-[var(--color-blue-primary)] text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isConvertingBusiness ? '전환 중...' : '전환하기'}
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
          className="fixed inset-0 bg-black/30 z-[1000] flex items-center justify-center p-4"
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
          className="fixed inset-0 bg-black/30 z-[1000] flex items-center justify-center p-4"
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

      {/* 포인트 내역 모달 */}
      {showPointHistoryModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/30" onClick={() => setShowPointHistoryModal(false)}>
          <div className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-card)] shadow-xl max-w-md w-full max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-[var(--color-border-card)]">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                <BanknotesIcon className="w-5 h-5 text-amber-500" />
                포인트 내역
              </h3>
              <button
                type="button"
                onClick={() => setShowPointHistoryModal(false)}
                className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] rounded-lg hover:bg-[var(--color-bg-secondary)] transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 min-h-0">
              {pointHistoryLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : pointHistory.length === 0 ? (
                <p className="text-center text-[var(--color-text-secondary)] py-8">포인트 획득·사용 내역이 없습니다.</p>
              ) : (
                <ul className="space-y-3">
                  {pointHistory.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-3 py-3 px-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-card)]"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-sm font-semibold shrink-0 ${
                              item.amount > 0 ? 'text-emerald-600' : 'text-red-600'
                            }`}
                          >
                            {item.amount > 0 ? '+' : ''}{item.amount.toLocaleString()} P
                          </span>
                          <span className="text-xs text-[var(--color-text-secondary)]">
                            {item.type === 'earn' || item.type === 'achievement' || item.type === 'review' || item.type === 'facility_review' ? '획득' : item.type === 'use' ? '사용' : '조정'}
                          </span>
                        </div>
                        {item.description && (
                          <p className="text-sm text-[var(--color-text-secondary)] mt-0.5 truncate" title={item.description}>
                            {item.description}
                          </p>
                        )}
                        <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                          {new Date(item.createdAt).toLocaleString('ko-KR')}
                        </p>
                      </div>
                      <span className="text-sm font-medium text-[var(--color-text-primary)] shrink-0">
                        잔액 {item.balanceAfter.toLocaleString()} P
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default MyInfoPage;
