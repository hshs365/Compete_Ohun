import React, { useState, useEffect, useRef } from 'react';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon, UserPlusIcon, UserMinusIcon } from '@heroicons/react/24/outline';
import type { SelectedGroup } from '../types/selected-group';
import { api } from '../utils/api';
import { showError, showSuccess, showWarning, showConfirm } from '../utils/swal';
import { isTeamSport, getMinParticipantsForSport, SPORT_TEAM_SIZE } from '../constants/sports';
import { getEquipmentBySport } from '../constants/equipment';
import { MATCH_TYPE_THEME } from './HomeMatchTypeChoice';
import ToggleSwitch from './ToggleSwitch';

// Step 컴포넌트들
import Step1Category from './create-group/Step1Category';
import Step2GameSettings from './create-group/Step2GameSettings';
import Step2MatchSchedule from './create-group/Step2MatchSchedule';
import Step2PositionSettings from './create-group/Step2PositionSettings';
import Step2LevelSettings from './create-group/Step2LevelSettings';
import StepMatchName from './create-group/StepMatchName';
import StepGender from './create-group/StepGender';
import Step3CommonSettings from './create-group/Step3CommonSettings';
import Step4Equipment from './create-group/Step4Equipment';
import StepParticipants from './create-group/StepParticipants';
import Step5Review from './create-group/Step5Review';

type MatchType = 'general' | 'rank' | 'event';
type FreeMatchSubType = 'threeWay' | 'twoWay';

interface MultiStepCreateGroupProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (groupData: Omit<SelectedGroup, 'id'>) => void;
  onSuccess?: () => void;
  /** 진입 시 이미 선택된 종목 (있으면 카테고리 단계 생략) */
  initialCategory?: string;
  /** 진입 시 이미 선택된 매치 종류 (일반/랭크/이벤트) */
  initialMatchType?: MatchType;
}

/** 시·도별 지도 중심 좌표 (거주지 기준 초기 지도용). API가 짧은 이름(대전 등)을 줄 수 있어 별칭 포함 */
const SIDO_CENTER: Record<string, [number, number]> = {
  '서울특별시': [37.5665, 126.978],
  '서울': [37.5665, 126.978],
  '부산광역시': [35.1796, 129.0756],
  '대구광역시': [35.8714, 128.6014],
  '인천광역시': [37.4563, 126.7052],
  '광주광역시': [35.1595, 126.8526],
  '대전광역시': [36.3504, 127.3845],
  '대전': [36.3504, 127.3845],
  '울산광역시': [35.5384, 129.3114],
  '세종특별자치시': [36.4801, 127.2892],
  '경기도': [37.4138, 127.5183],
  '강원특별자치도': [37.8228, 128.1555],
  '충청북도': [36.6357, 127.4912],
  '충청남도': [36.5184, 126.8],
  '전북특별자치도': [35.7177, 127.153],
  '전라남도': [34.8161, 126.4629],
  '경상북도': [36.576, 128.5056],
  '경상남도': [35.2381, 128.6921],
  '제주특별자치도': [33.4996, 126.5312],
  '제주': [33.4996, 126.5312],
};

const SEOUL_CENTER: [number, number] = [37.5665, 126.978];

const MultiStepCreateGroup: React.FC<MultiStepCreateGroupProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onSuccess,
  initialCategory,
  initialMatchType = 'general',
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [mapKey, setMapKey] = useState(0);
  // 주소 선택 후 팝업 지도: 대략적인 위치를 알 수 있도록 줌 아웃 (15→11, 카카오 레벨 기준)
  const [mapZoom, setMapZoom] = useState(11);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [createdGroupId, setCreatedGroupId] = useState<number | null>(null);
  const [following, setFollowing] = useState<Array<{ id: number; nickname: string; tag?: string; profileImageUrl?: string }>>([]);
  const [selectedFollowers, setSelectedFollowers] = useState<number[]>([]);
  const [loadingFollowers, setLoadingFollowers] = useState(false);
  const freeMatchSubTypeRef = useRef<FreeMatchSubType | null>(null);
  /** 이전 정보 불러오기 토글 — ON일 때만 내 정보 주소·이전 매치 데이터 적용 */
  const [loadPreviousInfo, setLoadPreviousInfo] = useState(false);

  // 사용자 위치 가져오기 (좌표만)
  const getUserLocation = (): [number, number] => {
    try {
      const savedLocation = localStorage.getItem('userLocation');
      if (savedLocation) {
        const location = JSON.parse(savedLocation);
        if (location.latitude != null && location.longitude != null) {
          return [Number(location.latitude), Number(location.longitude)];
        }
      }
    } catch (e) {
      // 무시
    }
    return SEOUL_CENTER; // 서울 시청 (기본값)
  };

  // 내 정보에 저장된 주소·좌표를 기본값으로 (매치 생성자 주소 디폴트)
  const getDefaultLocation = (): { location: string; coordinates: [number, number] } => {
    try {
      const savedLocation = localStorage.getItem('userLocation');
      if (savedLocation) {
        const loc = JSON.parse(savedLocation);
        const address = loc?.address;
        const lat = loc?.latitude != null ? Number(loc.latitude) : null;
        const lng = loc?.longitude != null ? Number(loc.longitude) : null;
        if (typeof address === 'string' && address.trim() && !address.startsWith('위도:')) {
          if (lat != null && lng != null && !isNaN(lat) && !isNaN(lng)) {
            return { location: address.trim(), coordinates: [lat, lng] };
          }
          return { location: address.trim(), coordinates: getUserLocation() };
        }
        if (lat != null && lng != null && !isNaN(lat) && !isNaN(lng)) {
          return { location: '', coordinates: [lat, lng] };
        }
      }
    } catch (e) {
      // 무시
    }
    return { location: '', coordinates: getUserLocation() };
  };

  // 현재 시간(시 단위만) 기준 3시간 뒤를 기본값으로 (예: 5시 28분 → 8시)
  const getDefaultDateTime = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const startHour = (currentHour + 3) % 24;
    const endHour = (startHour + 2) % 24;
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const startHourStr = String(startHour).padStart(2, '0');
    const endHourStr = String(endHour).padStart(2, '0');
    const isNextDay = currentHour + 3 >= 24;
    const dateStr = isNextDay
      ? (() => {
          const next = new Date(now);
          next.setDate(next.getDate() + 1);
          return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`;
        })()
      : `${year}-${month}-${day}`;
    return {
      date: dateStr,
      time: `${startHourStr}:00`,
      endTime: `${endHourStr}:00`,
    };
  };

  const defaultDateTime = getDefaultDateTime();

  /** 모든 칸이 비어 있는 폼 상태 (이전 정보 불러오기 OFF일 때 사용) */
  const getEmptyFormState = (keepInitial?: boolean) => {
    const resetDateTime = getDefaultDateTime();
    const category = keepInitial && initialCategory ? initialCategory : '';
    const matchType = keepInitial && initialMatchType ? initialMatchType : 'general';
    const gameType = matchType === 'general' && category === '축구' ? 'individual' : 'team';
    const minP = category && matchType === 'general' && category !== '축구' ? (getMinParticipantsForSport(category)?.toString() ?? '') : '';
    return {
      category,
      name: '',
      location: '',
      coordinates: getUserLocation(),
      meetingDate: resetDateTime.date,
      meetingTime: resetDateTime.time,
      meetingEndDate: resetDateTime.date,
      meetingEndTime: resetDateTime.endTime ?? '20:00',
      minParticipants: minP,
      maxParticipants: '',
      genderRestriction: null as 'male' | 'female' | null,
      hasFee: false,
      feeAmount: '',
      facilityId: null as number | null,
      selectedFacility: null as { id: number; name: string; address: string; image?: string | null } | null,
      facilityId2: null as number | null,
      selectedFacility2: null as { id: number; name: string; address: string; image?: string | null } | null,
      facilityId3: null as number | null,
      selectedFacility3: null as { id: number; name: string; address: string; image?: string | null } | null,
      reservationId: null as number | null,
      description: '',
      equipment: [] as string[],
      gameType,
      matchType: matchType as MatchType,
      freeMatchSubType: null as FreeMatchSubType | null,
      teamSettings: {
        positions: [] as string[],
        balanceByExperience: false,
        balanceByRank: false,
        minPlayersPerTeam: 1,
        creatorPositionCode: '',
        creatorSlotLabel: '',
        creatorTeam: 'red' as 'red' | 'blue',
      },
    };
  };

  // 전체 폼 데이터
  const [formData, setFormData] = useState({
    category: '',
    name: '',
    location: '',
    coordinates: getUserLocation(),
    meetingDate: defaultDateTime.date,
    meetingTime: defaultDateTime.time,
    meetingEndDate: defaultDateTime.date,
    meetingEndTime: defaultDateTime.endTime ?? '20:00',
    minParticipants: '',
    maxParticipants: '',
    genderRestriction: null as 'male' | 'female' | null,
    hasFee: false,
    feeAmount: '',
    facilityId: null as number | null,
    selectedFacility: null as { id: number; name: string; address: string; image?: string | null } | null,
    facilityId2: null as number | null,
    selectedFacility2: null as { id: number; name: string; address: string; image?: string | null } | null,
    facilityId3: null as number | null,
    selectedFacility3: null as { id: number; name: string; address: string; image?: string | null } | null,
    reservationId: null as number | null,
    description: '',
    equipment: [] as string[],
    gameType: 'team' as 'team' | 'individual',
    matchType: 'general' as MatchType,
    freeMatchSubType: null as FreeMatchSubType | null,
    teamSettings: {
      positions: [] as string[],
      balanceByExperience: false,
      balanceByRank: false,
      minPlayersPerTeam: 1,
      creatorPositionCode: '' as string,
      creatorSlotLabel: '' as string,
      creatorTeam: 'red' as 'red' | 'blue',
    },
  });

  /** API에서 이전 그룹 목록 가져와 localStorage에 저장한 뒤, 해당 카테고리 이전 예약 적용 */
  const runLoadPreviousGroup = async (categoryToLoad: string) => {
    try {
      const myGroups = await api.get<Array<{
        id: number;
        name: string;
        location: string;
        latitude: number;
        longitude: number;
        category: string;
        description: string | null;
        meetingTime: string | null;
        equipment: string[];
        maxParticipants: number | null;
        minParticipants: number | null;
        hasFee: boolean;
        feeAmount: number | null;
        facilityId: number | null;
      }>>('/api/groups/my-groups');
      if (myGroups?.length > 0) {
        const resetDateTime = getDefaultDateTime();
        myGroups.forEach((group) => {
          const latitude = typeof group.latitude === 'string' ? parseFloat(group.latitude) : Number(group.latitude);
          const longitude = typeof group.longitude === 'string' ? parseFloat(group.longitude) : Number(group.longitude);
          if (!isNaN(latitude) && !isNaN(longitude)) {
            const bookingData = {
              category: group.category,
              name: group.name,
              location: group.location,
              coordinates: [latitude, longitude] as [number, number],
              meetingDate: resetDateTime.date,
              meetingTime: resetDateTime.time,
              minParticipants: group.minParticipants ? group.minParticipants.toString() : '',
              maxParticipants: group.maxParticipants ? group.maxParticipants.toString() : '',
              hasFee: group.hasFee || false,
              feeAmount: group.feeAmount ? group.feeAmount.toString() : '',
              facilityId: group.facilityId || null,
              selectedFacility: null,
              reservationId: null,
              description: group.description || '',
              equipment: group.equipment || [],
            };
            localStorage.setItem(`lastGroupBooking_${group.category}`, JSON.stringify(bookingData));
          }
        });
      }
      if (categoryToLoad) loadPreviousBooking(categoryToLoad);
    } catch (e) {
      if (categoryToLoad) loadPreviousBooking(categoryToLoad);
    }
  };

  // 이전 예약 내역 불러오기 (localStorage에서, 카테고리별)
  const loadPreviousBooking = (category: string) => {
    if (!category) return;
    
    try {
      const savedBooking = localStorage.getItem(`lastGroupBooking_${category}`);
      if (savedBooking) {
        const booking = JSON.parse(savedBooking);
        const resetDateTime = getDefaultDateTime();
        
        // 해당 카테고리의 데이터로 완전히 교체 (freeMatchSubType 등 현재 단계 선택값은 유지)
        setFormData((prev) => ({
          ...prev,
          category: category,
          name: booking.name || '',
          location: booking.location || prev.location,
          coordinates: booking.coordinates || prev.coordinates,
          meetingDate: booking.meetingDate || resetDateTime.date,
          meetingTime: booking.meetingTime || resetDateTime.time,
          meetingEndDate: booking.meetingEndDate || booking.meetingDate || resetDateTime.date,
          meetingEndTime: (booking.meetingEndTime || resetDateTime.endTime) ?? '20:00',
          minParticipants: booking.minParticipants || '',
          maxParticipants: booking.maxParticipants || '',
          genderRestriction: booking.genderRestriction || null,
          hasFee: booking.hasFee || false,
          feeAmount: booking.feeAmount || '',
          facilityId: booking.facilityId || null,
          selectedFacility: booking.selectedFacility || null,
          reservationId: booking.reservationId ?? null,
          description: booking.description || '',
          equipment: booking.equipment || [],
          gameType: booking.gameType || prev.gameType,
          teamSettings: booking.teamSettings || prev.teamSettings,
          freeMatchSubType: prev.freeMatchSubType,
        }));
        
        if (booking.coordinates) {
          setMapZoom(15);
          setMapKey((prev) => prev + 1);
        }
      } else {
        // 해당 카테고리의 저장된 데이터가 없으면 기본값으로 초기화 (위치는 내 정보 주소 유지)
        const resetDateTime = getDefaultDateTime();
        const defaultLoc = getDefaultLocation();
        setFormData((prev) => ({
          ...prev,
          category: category,
          name: '',
          description: '',
          equipment: [],
          minParticipants: '',
          maxParticipants: '',
          genderRestriction: null,
          hasFee: false,
          feeAmount: '',
          facilityId: null,
          selectedFacility: null,
          reservationId: null,
          location: prev.location || defaultLoc.location,
          coordinates: (prev.coordinates[0] && prev.coordinates[1]) ? prev.coordinates : defaultLoc.coordinates,
        }));
      }
    } catch (error) {
      console.log('이전 예약 내역을 불러올 수 없습니다:', error);
    }
  };

  // 모달이 열릴 때 초기화
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(1);
      setLoadPreviousInfo(false);
      setFormData(getEmptyFormState(false));
      setShowMap(false);
      return;
    }

    // 모달이 열리면 기본은 빈 폼 (이전 정보 불러오기 OFF). initialCategory/initialMatchType만 유지
    setFormData(getEmptyFormState(true));

    if (initialCategory && initialMatchType) {
      freeMatchSubTypeRef.current = null;
      const minP = initialMatchType === 'general' && initialCategory === '축구' ? '' : (getMinParticipantsForSport(initialCategory)?.toString() ?? '');
      setFormData((prev) => ({
        ...prev,
        category: initialCategory,
        matchType: initialMatchType,
        gameType: initialMatchType === 'general' && initialCategory === '축구' ? 'individual' : prev.gameType,
        minParticipants: minP,
        freeMatchSubType: null,
      }));
      setCurrentStep(1);
    }

    // 모달 열릴 때 항상 내 정보 저장 위치(또는 거주지) 적용 — 지도가 서울이 아닌 사용자 주소로 표시되도록
    const defaultLoc = getDefaultLocation();
    setFormData((prev) => ({
      ...prev,
      location: defaultLoc.location || prev.location,
      coordinates:
        defaultLoc.coordinates[0] != null && defaultLoc.coordinates[1] != null
          ? defaultLoc.coordinates
          : prev.coordinates,
    }));
    if (loadPreviousInfo) {
      runLoadPreviousGroup(initialCategory || formData.category || '');
    }
  }, [isOpen]);

  // 카테고리 변경 시 — 이전 정보 불러오기가 켜져 있을 때만 해당 카테고리 저장 데이터 적용
  useEffect(() => {
    if (!isOpen) return;
    if (loadPreviousInfo && formData.category) {
      loadPreviousBooking(formData.category);
    } else if (!formData.category) {
      const resetDateTime = getDefaultDateTime();
      setFormData((prev) => ({
        ...prev,
        name: '',
        location: '',
        coordinates: getUserLocation(),
        meetingDate: resetDateTime.date,
        meetingTime: resetDateTime.time,
        meetingEndDate: resetDateTime.date,
        meetingEndTime: resetDateTime.endTime ?? '20:00',
        minParticipants: '',
        maxParticipants: '',
        hasFee: false,
        feeAmount: '',
        facilityId: null,
        selectedFacility: null,
        reservationId: null,
        description: '',
        equipment: [],
      }));
    }
  }, [formData.category, isOpen, loadPreviousInfo]);

  // 모달 열릴 때 사용자 거주지(시·도)로 지도 중심 맞추기 (저장된 위치가 없고 기본값이 서울일 때)
  useEffect(() => {
    if (!isOpen) return;
    const isSeoulDefault =
      Math.abs(formData.coordinates[0] - SEOUL_CENTER[0]) < 1e-5 &&
      Math.abs(formData.coordinates[1] - SEOUL_CENTER[1]) < 1e-5;
    if (!isSeoulDefault) return;
    api
      .get<{ residenceSido: string | null }>('/api/auth/me')
      .then((data) => {
        const sido = data?.residenceSido?.trim();
        if (sido && SIDO_CENTER[sido]) {
          setFormData((prev) => ({ ...prev, coordinates: SIDO_CENTER[sido]! }));
        }
      })
      .catch(() => {});
  }, [isOpen]);

  // 카테고리 변경 시 준비물 목록 업데이트
  useEffect(() => {
    if (formData.category) {
      const equipmentList = getEquipmentBySport(formData.category);
      setFormData((prev) => ({
        ...prev,
        equipment: prev.equipment.filter((item) => equipmentList.includes(item)),
      }));
    }
  }, [formData.category]);

  const skipCategoryStep = Boolean(initialCategory && initialMatchType);
  const isFootballGeneral = formData.category === '축구' && formData.matchType === 'general';
  const hasPositionStep = formData.category === '축구' && formData.gameType === 'team' && formData.matchType !== 'general';
  const hasLevelStep = formData.category === '축구' && formData.gameType === 'individual' && formData.matchType !== 'general';
  const isFootballSixSteps = hasPositionStep || hasLevelStep;
  // 매치 기본정보 단계: 성별 → 일자 → 위치 → 참여자 수 → 참가비 → 준비물 → 매치명(자동 제안) → 최종 확인
  const firstBasicStep = skipCategoryStep && isFootballGeneral ? 2 : isFootballSixSteps ? (skipCategoryStep ? 3 : 4) : (skipCategoryStep ? 2 : 3);
  const totalSteps = firstBasicStep + 6; // gender, schedule, location, participants, equipment, name, review

  // 다음 단계로 이동
  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  // 이전 단계로 이동
  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const genderStep = firstBasicStep;
  const scheduleStep = firstBasicStep + 1;
  const locationStep = firstBasicStep + 2;
  const participantsStep = firstBasicStep + 3;
  const equipmentStepNum = firstBasicStep + 4;
  const nameStep = firstBasicStep + 5; // 맨 마지막 입력 단계 — 일정·위치 기반 자동 제목 제안

  // 위치 단계 진입 시 지도 펼침 (시설 마커 한눈에 보기)
  useEffect(() => {
    if (isOpen && currentStep === locationStep) {
      setShowMap(true);
    }
  }, [isOpen, currentStep, locationStep]);

  const isPositionStepForValidate = hasPositionStep
    ? (skipCategoryStep ? (step: number) => step === 2 : (step: number) => step === 3)
    : () => false;

  /** 일정·위치·종목 기반 매치 제목 자동 생성 (매치명 단계에서 제안용) */
  const generateMatchName = (): string => {
    const cat = formData.category?.trim() || '운동';
    let dateStr = '';
    if (formData.meetingDate) {
      const d = new Date(formData.meetingDate + 'T12:00:00');
      const month = d.getMonth() + 1;
      const day = d.getDate();
      const weekdays = '일월화수목금토';
      const w = weekdays[d.getDay()];
      dateStr = `${month}/${day}(${w})`;
      if (formData.meetingTime?.trim()) {
        dateStr += ` ${formData.meetingTime}`;
      }
    }
    const place = formData.selectedFacility?.name?.trim()
      || formData.location?.trim()?.split(/\s+/).slice(0, 2).join(' ')
      || '장소';
    const parts = [cat, dateStr, place].filter(Boolean);
    return parts.join(' ').trim() || '새 매치';
  };

  // 매치명 단계 진입 시 제목이 비어 있으면 일정·위치 기반으로 자동 제안
  useEffect(() => {
    if (!isOpen || currentStep !== nameStep) return;
    const trimmed = (formData.name || '').trim();
    if (trimmed.length < 2) {
      const suggested = generateMatchName();
      setFormData((prev) => ({ ...prev, name: suggested }));
    }
  }, [isOpen, currentStep, nameStep]);

  const validateNameStep = async (): Promise<boolean> => {
    const trimmed = (formData.name || '').trim();
    if (trimmed.length < 2) {
      await showWarning('매치 이름을 2자 이상 입력해 주세요.', '매치명 필수');
      return false;
    }
    return true;
  };
  const validateScheduleStep = async (): Promise<boolean> => {
    if (!formData.meetingDate || !formData.meetingTime) {
      await showWarning('매치 일정(날짜·시간)을 선택해주세요.', '매치 일정 필수');
      return false;
    }
    const endDate = formData.meetingEndDate || formData.meetingDate;
    const endTime = formData.meetingEndTime?.trim() || '20:00';
    const [sh, sm] = formData.meetingTime.slice(0, 5).split(':').map(Number);
    const [eh, em] = endTime.slice(0, 5).split(':').map(Number);
    const startM = (sh ?? 0) * 60 + (sm ?? 0);
    const endM = (eh ?? 0) * 60 + (em ?? 0);
    const isOvernight = endM <= startM;
    if (isOvernight && endDate <= formData.meetingDate) {
      await showWarning('야간 운영 시 종료 일자를 익일로 설정해 주세요.', '일정 제한');
      return false;
    }
    if (!isOvernight && endDate < formData.meetingDate) {
      await showWarning('종료 일자는 시작 일자보다 이전일 수 없습니다.', '일정 제한');
      return false;
    }
    const meetingDt = new Date(`${formData.meetingDate}T${formData.meetingTime}:00`);
    const minAllowed = new Date(Date.now() + 2 * 60 * 60 * 1000);
    if (meetingDt.getTime() < minAllowed.getTime()) {
      await showWarning('모임 일시는 현재 시각으로부터 최소 2시간 이후로 설정해 주세요.', '일정 제한');
      return false;
    }
    return true;
  };
  const validateLocationStep = async (): Promise<boolean> => {
    const hasFacility = formData.facilityId != null || formData.facilityId2 != null || formData.facilityId3 != null;
    if (!hasFacility) {
      await showWarning('최소 한 개의 시설을 선택해 주세요.', '시설 선택 필요');
      return false;
    }
    if (!formData.location || formData.location.trim() === '') {
      await showWarning('시설을 선택해 주세요.', '위치 선택 필요');
      return false;
    }
    return true;
  };

  const validateStep = async (step: number): Promise<boolean> => {
    const isPositionStep = isPositionStepForValidate(step);

    if (step === nameStep) return validateNameStep();
    if (step === scheduleStep) return validateScheduleStep();
    if (step === locationStep) return validateLocationStep();

    if (skipCategoryStep && isFootballGeneral && step === 1) {
      const effectiveFree = formData.freeMatchSubType ?? freeMatchSubTypeRef.current;
      if (!effectiveFree) {
        await showWarning('3파전 또는 2파전을 선택해 주세요.', '매치 방식 선택');
        return false;
      }
      return true;
    }

    switch (step) {
      case 1:
        if (!skipCategoryStep && !formData.category) {
          await showError('운동 종목을 선택해주세요.', '카테고리 선택 필요');
          return false;
        }
        return true;
      case 2:
        return true;
      case 3:
        if (isPositionStep) {
          if (!formData.teamSettings.creatorPositionCode || formData.teamSettings.creatorPositionCode.trim() === '') {
            await showWarning('모임장이 참가할 포지션을 선택해 주세요.', '포지션 선택 필요');
            return false;
          }
          return true;
        }
        return true;
      default:
        return true;
    }
  };

  // 마커 위치 변경 핸들러
  const handleMarkerDragEnd = async (lat: number, lng: number) => {
    const newCoordinates: [number, number] = [lat, lng];
    
    setFormData((prev) => ({
      ...prev,
      coordinates: newCoordinates,
    }));
    
    setMapZoom(3);

    // 좌표를 주소로 변환
    try {
      const NAVER_CLIENT_ID = import.meta.env.VITE_NAVER_MAP_CLIENT_ID;
      const NAVER_CLIENT_SECRET = import.meta.env.VITE_NAVER_MAP_CLIENT_SECRET;
      
      if (NAVER_CLIENT_ID && NAVER_CLIENT_SECRET) {
        const response = await fetch(
          `https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode?coords=${lng},${lat}&output=json`,
          {
            headers: {
              'X-NCP-APIGW-API-KEY-ID': NAVER_CLIENT_ID,
              'X-NCP-APIGW-API-KEY': NAVER_CLIENT_SECRET,
            },
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.status === 'OK' && data.results && data.results.length > 0) {
            const result = data.results[0];
            const roadAddress = result.land?.name;
            const region = result.region;
            
            let fullAddress = '';
            
            if (roadAddress && region) {
              const area1 = region.area1?.name || '';
              const area2 = region.area2?.name || '';
              const area3 = region.area3?.name || '';
              fullAddress = `${area1} ${area2} ${area3} ${roadAddress}`.trim();
            } else if (region) {
              const area1 = region.area1?.name || '';
              const area2 = region.area2?.name || '';
              const area3 = region.area3?.name || '';
              const area4 = region.area4?.name || '';
              fullAddress = `${area1} ${area2} ${area3} ${area4}`.trim();
            }
            
            if (fullAddress) {
              setFormData((prev) => ({
                ...prev,
                location: fullAddress,
              }));
            }
          }
        }
      }
    } catch (error) {
      console.error('주소 변환 실패:', error);
    }
  };

  // 다음 버튼 클릭 핸들러
  const handleNextClick = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid) {
      handleNext();
    }
  };

  // 매치 생성
  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      let meetingTimeString: string | undefined = undefined;
      let meetingDateTime: Date | undefined = undefined;
      if (formData.meetingDate && formData.meetingTime) {
        const endDate = formData.meetingEndDate || formData.meetingDate;
        const endTime = formData.meetingEndTime?.trim() || '20:00';
        if (endDate !== formData.meetingDate) {
          meetingTimeString = `${formData.meetingDate} ${formData.meetingTime} ~ ${endDate} ${endTime}`;
        } else {
          meetingTimeString = `${formData.meetingDate} ${formData.meetingTime} ~ ${endTime}`;
        }
        const dateTimeStr = `${formData.meetingDate}T${formData.meetingTime}:00`;
        meetingDateTime = new Date(dateTimeStr);
      } else if (formData.meetingDate) {
        meetingTimeString = formData.meetingDate;
      } else if (formData.meetingTime) {
        meetingTimeString = formData.meetingTime;
      }

      const latitude = Number(formData.coordinates[0]);
      const longitude = Number(formData.coordinates[1]);
      const locationText = (formData.location || formData.selectedFacility?.address || '').trim();
      if (!locationText) {
        await showError('위치 정보가 없습니다. 위치 단계에서 시설을 선택하거나 주소를 입력해 주세요.', '위치 필요');
        setIsSubmitting(false);
        return;
      }
      if (isNaN(latitude) || isNaN(longitude)) {
        await showError('위치 좌표가 유효하지 않습니다.', '위치 좌표 오류');
        setIsSubmitting(false);
        return;
      }

      // 일정 입력 시 최소 2시간 이후만 허용
      if (meetingDateTime) {
        const minAllowed = new Date(Date.now() + 2 * 60 * 60 * 1000);
        if (meetingDateTime.getTime() < minAllowed.getTime()) {
          await showWarning('모임 일시는 현재 시각으로부터 최소 2시간 이후로 설정해 주세요.', '일정 제한');
          setIsSubmitting(false);
          return;
        }
      }

      const groupData: any = {
        name: (formData.name || '').trim() || '제목 없음',
        location: locationText,
        latitude: latitude,
        longitude: longitude,
        category: formData.category,
        description: formData.description || undefined,
        meetingTime: meetingTimeString,
        meetingDateTime: meetingDateTime ? meetingDateTime.toISOString() : undefined,
        meetingEndTime: (formData.meetingEndTime && formData.meetingEndTime.trim().length >= 5)
          ? formData.meetingEndTime.trim().slice(0, 5)
          : undefined,
        meetingEndDate: formData.meetingEndDate || undefined,
        minParticipants: formData.minParticipants && formData.minParticipants.trim() !== '' 
          ? parseInt(formData.minParticipants, 10) 
          : undefined,
        maxParticipants: formData.maxParticipants && formData.maxParticipants.trim() !== '' 
          ? parseInt(formData.maxParticipants, 10) 
          : undefined,
        genderRestriction: formData.genderRestriction || undefined,
        hasFee: formData.category === '축구',
        feeAmount: formData.category === '축구' ? 10000 : (formData.feeAmount ? parseInt(String(formData.feeAmount).replace(/,/g, ''), 10) : undefined),
        equipment: formData.equipment,
        type: formData.matchType === 'general' ? 'normal' : formData.matchType,
      };
      // 가계약: 1·2·3순위 시설 (인원 마감 시 1→2→3순으로 빈 자리 있는 시설 확정)
      const provisionalFacilityIds = [
        formData.facilityId,
        formData.facilityId2,
        formData.facilityId3,
      ].filter((id): id is number => id != null);
      if (provisionalFacilityIds.length > 0) {
        groupData.provisionalFacilityIds = provisionalFacilityIds;
      } else if (formData.facilityId) {
        groupData.facilityId = formData.facilityId;
      }

      // 팀 게임 설정이 있으면 추가
      if (isTeamSport(formData.category) && formData.gameType === 'team') {
        groupData.gameSettings = {
          gameType: formData.gameType,
          positions: formData.teamSettings.positions.length > 0 
            ? formData.teamSettings.positions 
            : undefined,
          minPlayersPerTeam: formData.teamSettings.minPlayersPerTeam || undefined,
          balanceByExperience: formData.teamSettings.balanceByExperience || undefined,
          balanceByRank: formData.teamSettings.balanceByRank || undefined,
          creatorPositionCode: formData.teamSettings.creatorPositionCode || undefined,
          creatorSlotLabel: formData.teamSettings.creatorSlotLabel || undefined,
          creatorTeam: formData.teamSettings.creatorTeam || undefined,
        };
      }

      const createdGroup = await api.post<{
        id: number;
        name: string;
        location: string;
        latitude: number;
        longitude: number;
        category: string;
        description: string | null;
        meetingTime: string | null;
        contact: string | null;
        equipment: string[];
        participantCount: number;
      }>('/api/groups', groupData);

      setCreatedGroupId(createdGroup.id);
      await showSuccess('매치가 생성되었습니다.', '매치 생성');

      // 팔로워 목록 불러오기
      let followingList: Array<{ id: number; nickname: string; tag?: string; profileImageUrl?: string }> = [];
      try {
        setLoadingFollowers(true);
        followingList = await api.get<Array<{ id: number; nickname: string; tag?: string; profileImageUrl?: string }>>('/api/users/following');
        setFollowing(followingList);
      } catch (error) {
        console.error('팔로워 목록 로드 실패:', error);
      } finally {
        setLoadingFollowers(false);
      }

      // 예약 내역을 localStorage에 저장
      const bookingData = {
        category: formData.category,
        name: formData.name,
        location: formData.location,
        coordinates: formData.coordinates,
        meetingDate: formData.meetingDate,
        meetingTime: formData.meetingTime,
        meetingEndDate: formData.meetingEndDate,
        meetingEndTime: formData.meetingEndTime,
        minParticipants: formData.minParticipants,
        maxParticipants: formData.maxParticipants,
        genderRestriction: formData.genderRestriction,
        hasFee: formData.hasFee,
        feeAmount: formData.feeAmount,
        facilityId: formData.facilityId,
        selectedFacility: formData.selectedFacility,
        reservationId: formData.reservationId,
        description: formData.description,
        equipment: formData.equipment,
        gameType: formData.gameType,
        teamSettings: formData.teamSettings,
      };
      // 카테고리별로 저장
      localStorage.setItem(`lastGroupBooking_${formData.category}`, JSON.stringify(bookingData));

      onSubmit({
        name: createdGroup.name,
        location: createdGroup.location,
        coordinates: [createdGroup.latitude, createdGroup.longitude] as [number, number],
        memberCount: createdGroup.participantCount,
        category: createdGroup.category,
        description: createdGroup.description || undefined,
        meetingTime: createdGroup.meetingTime || undefined,
      });

      // 매치 목록 새로고침
      if (onSuccess) onSuccess();

      // 팔로워가 있으면 초대 모달 표시, 없으면 바로 닫기
      if (followingList.length > 0) {
        setShowInviteModal(true);
      } else {
        onClose();
      }
    } catch (error) {
      console.error('매치 생성 실패:', error);
      const err = error as { message?: string; response?: { data?: { message?: string | string[] } } };
      let msg = '매치 생성에 실패했습니다.';
      if (err?.response?.data?.message) {
        const m = err.response.data.message;
        msg = Array.isArray(m) ? m.join('\n') : String(m);
      } else if (err?.message) {
        msg = String(err.message);
      }
      await showError(msg, '매치 생성 실패');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const modalMatchType = formData.matchType || initialMatchType;
  const modalAccentHex = MATCH_TYPE_THEME[modalMatchType]?.accentHex ?? MATCH_TYPE_THEME.general.accentHex;

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
      <div
        className="bg-[var(--color-bg-card)] rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-[var(--color-border-card)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="sticky top-0 bg-[var(--color-bg-card)] border-b border-[var(--color-border-card)] p-4 md:p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-[var(--color-text-primary)]">
              {(() => {
                const category = formData.category || initialCategory;
                const matchTypeVal = formData.matchType || initialMatchType;
                const matchTypeLabel = matchTypeVal === 'general' ? '일반 매치' : matchTypeVal === 'rank' ? '랭크매치' : matchTypeVal === 'event' ? '이벤트매치' : null;
                if (category && matchTypeLabel) return `${category} · ${matchTypeLabel} 생성`;
                return '새 매치 만들기';
              })()}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--color-bg-secondary)] rounded-lg transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-[var(--color-text-primary)]" />
          </button>
        </div>

        {/* 진행 바 */}
        <div className="px-4 md:px-6 pt-4">
          <div className="w-full bg-[var(--color-bg-secondary)] rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%`, backgroundColor: modalAccentHex }}
            />
          </div>
        </div>

        {/* 폼 내용 */}
        <div className="p-4 md:p-6">
          {/* Step 1: 카테고리 선택 (진입 시 종목·매치타입이 정해진 경우 생략) */}
          {!skipCategoryStep && currentStep === 1 && (
            <Step1Category
              category={formData.category}
              onCategoryChange={(category) => {
                const minParticipants = getMinParticipantsForSport(category);
                const defaultMinPlayersPerTeam = isTeamSport(category)
                  ? (SPORT_TEAM_SIZE[category] || 1)
                  : 1;
                setFormData((prev) => ({ 
                  ...prev, 
                  category,
                  minParticipants: minParticipants ? minParticipants.toString() : '',
                  teamSettings: {
                    ...prev.teamSettings,
                    minPlayersPerTeam: defaultMinPlayersPerTeam,
                  },
                }));
              }}
            />
          )}

          {/* Step 1(스킵 시) / Step 2: 게임 설정 — 일반+축구는 3파전/2파전만 */}
          {((skipCategoryStep && currentStep === 1) || (!skipCategoryStep && currentStep === 2)) && (
            <Step2GameSettings
              category={formData.category}
              gameType={formData.gameType}
              onGameTypeChange={(gameType) => setFormData((prev) => ({ ...prev, gameType }))}
              teamSettings={formData.teamSettings}
              onTeamSettingsChange={(teamSettings) => setFormData((prev) => ({ ...prev, teamSettings }))}
              onlyMatchType={formData.category === '축구'}
              matchType={formData.matchType}
              accentHex={modalAccentHex}
              freeMatchSubType={formData.freeMatchSubType}
              onFreeMatchSubTypeChange={(v) => {
                freeMatchSubTypeRef.current = v;
                setFormData((prev) => ({
                  ...prev,
                  freeMatchSubType: v,
                  minParticipants: v === 'threeWay' ? '33' : prev.minParticipants,
                }));
              }}
            />
          )}

          {/* Step 3: 축구 포지션 지정 → 포지션/팀 설정 (랭크만), 축구 자유 → 경기 레벨 (랭크만), 그 외 → 공통 설정 */}
          {(skipCategoryStep ? currentStep === 2 : currentStep === 3) && hasPositionStep && (
            <Step2PositionSettings
              category={formData.category}
              teamSettings={formData.teamSettings}
              onTeamSettingsChange={(teamSettings) => setFormData((prev) => ({ ...prev, teamSettings }))}
            />
          )}
          {(skipCategoryStep ? currentStep === 2 : currentStep === 3) && hasLevelStep && (
            <Step2LevelSettings
              category={formData.category}
              teamSettings={formData.teamSettings}
              onTeamSettingsChange={(teamSettings) => setFormData((prev) => ({ ...prev, teamSettings }))}
            />
          )}
          {/* 성별 */}
          {currentStep === genderStep && (
            <StepGender
              genderRestriction={formData.genderRestriction}
              onGenderRestrictionChange={(gender) =>
                setFormData((prev) => ({ ...prev, genderRestriction: gender }))
              }
            />
          )}
          {/* 일자 — 다음 단계에서 이 일정(시작~종료)에 예약 가능한 시설만 표시 */}
          {currentStep === scheduleStep && (
            <Step2MatchSchedule
              meetingDate={formData.meetingDate}
              meetingTime={formData.meetingTime}
              meetingEndDate={formData.meetingEndDate}
              meetingEndTime={formData.meetingEndTime}
              onDateTimeChange={(date, time) =>
                setFormData((prev) => ({
                  ...prev,
                  meetingDate: date,
                  meetingTime: time,
                  facilityId: null,
                  selectedFacility: null,
                  facilityId2: null,
                  selectedFacility2: null,
                  facilityId3: null,
                  selectedFacility3: null,
                  reservationId: null,
                  location: prev.facilityId != null || prev.facilityId2 != null || prev.facilityId3 != null ? '' : prev.location,
                }))
              }
              onMeetingEndTimeChange={(endTime) =>
                setFormData((prev) => ({
                  ...prev,
                  meetingEndTime: endTime,
                  facilityId: null,
                  selectedFacility: null,
                  facilityId2: null,
                  selectedFacility2: null,
                  facilityId3: null,
                  selectedFacility3: null,
                  reservationId: null,
                  location: prev.facilityId != null || prev.facilityId2 != null || prev.facilityId3 != null ? '' : prev.location,
                }))
              }
              onMeetingEndDateChange={(endDate) =>
                setFormData((prev) => ({
                  ...prev,
                  meetingEndDate: endDate,
                  facilityId: null,
                  selectedFacility: null,
                  facilityId2: null,
                  selectedFacility2: null,
                  facilityId3: null,
                  selectedFacility3: null,
                  reservationId: null,
                  location: prev.facilityId != null || prev.facilityId2 != null || prev.facilityId3 != null ? '' : prev.location,
                }))
              }
              timeStepHourOnly={isFootballGeneral}
            />
          )}
          {/* 시설예약 (시설·인원) */}
          {currentStep === locationStep && (
            <Step3CommonSettings
              onlySection="location"
              scheduleReadOnly
              category={formData.category}
              name={formData.name}
              onNameChange={(name) => setFormData((prev) => ({ ...prev, name }))}
              location={formData.location}
              coordinates={formData.coordinates}
              onLocationChange={(location, coordinates) =>
                setFormData((prev) => ({ ...prev, location, coordinates }))
              }
              meetingDate={formData.meetingDate}
              meetingTime={formData.meetingTime}
              meetingEndDate={formData.meetingEndDate}
              meetingEndTime={formData.meetingEndTime}
              onDateTimeChange={(date, time) =>
                setFormData((prev) => ({ ...prev, meetingDate: date, meetingTime: time }))
              }
              minParticipants={formData.minParticipants}
              onMinParticipantsChange={(value) =>
                setFormData((prev) => ({ ...prev, minParticipants: value }))
              }
              maxParticipants={formData.maxParticipants}
              onMaxParticipantsChange={(value) =>
                setFormData((prev) => ({ ...prev, maxParticipants: value }))
              }
              genderRestriction={formData.genderRestriction}
              onGenderRestrictionChange={(g) => setFormData((prev) => ({ ...prev, genderRestriction: g }))}
              hasFee={formData.hasFee}
              onHasFeeChange={(hasFee) =>
                setFormData((prev) => ({ ...prev, hasFee, feeAmount: hasFee ? prev.feeAmount : '' }))
              }
              feeAmount={formData.feeAmount}
              onFeeAmountChange={(value) =>
                setFormData((prev) => ({ ...prev, feeAmount: value }))
              }
              facilityId={formData.facilityId}
              onFacilityIdChange={(facilityId) =>
                setFormData((prev) => ({ ...prev, facilityId }))
              }
              selectedFacility={formData.selectedFacility}
              onSelectedFacilityChange={(facility) =>
                setFormData((prev) => ({ ...prev, selectedFacility: facility }))
              }
              facilityId2={formData.facilityId2}
              onFacilityId2Change={(id) => setFormData((prev) => ({ ...prev, facilityId2: id }))}
              selectedFacility2={formData.selectedFacility2}
              onSelectedFacility2Change={(f) => setFormData((prev) => ({ ...prev, selectedFacility2: f }))}
              facilityId3={formData.facilityId3}
              onFacilityId3Change={(id) => setFormData((prev) => ({ ...prev, facilityId3: id }))}
              selectedFacility3={formData.selectedFacility3}
              onSelectedFacility3Change={(f) => setFormData((prev) => ({ ...prev, selectedFacility3: f }))}
              reservationId={formData.reservationId}
              onReservationIdChange={(id) => setFormData((prev) => ({ ...prev, reservationId: id }))}
              showMap={showMap}
              onToggleMap={() => setShowMap(!showMap)}
              mapKey={mapKey}
              mapZoom={mapZoom}
              onMarkerDragEnd={handleMarkerDragEnd}
              defaultMinParticipants={formData.freeMatchSubType === 'threeWay' ? 33 : undefined}
            />
          )}
          {/* 참여자 수 (별도 단계, 1시간 전 미달 시 자동 취소 안내) */}
          {currentStep === participantsStep && (
            <StepParticipants
              category={formData.category}
              minParticipants={formData.minParticipants}
              onMinParticipantsChange={(v) => setFormData((prev) => ({ ...prev, minParticipants: v }))}
              maxParticipants={formData.maxParticipants}
              onMaxParticipantsChange={(v) => setFormData((prev) => ({ ...prev, maxParticipants: v }))}
              defaultMinParticipants={formData.freeMatchSubType === 'threeWay' ? 33 : undefined}
            />
          )}
          {/* 준비물 및 설명 */}
          {currentStep === equipmentStepNum && (
            <Step4Equipment
              category={formData.category}
              selectedEquipment={formData.equipment}
              onEquipmentToggle={(equipment) => {
                setFormData((prev) => ({
                  ...prev,
                  equipment: prev.equipment.includes(equipment)
                    ? prev.equipment.filter((e) => e !== equipment)
                    : [...prev.equipment, equipment],
                }));
              }}
              onEquipmentAdd={(item) => {
                const trimmed = item.trim();
                if (!trimmed) return;
                setFormData((prev) => ({
                  ...prev,
                  equipment: prev.equipment.includes(trimmed) ? prev.equipment : [...prev.equipment, trimmed],
                }));
              }}
              description={formData.description}
              onDescriptionChange={(description) => 
                setFormData((prev) => ({ ...prev, description }))
              }
            />
          )}

          {/* 매치명 — 일정·위치 기반 자동 제안, 필요 시 수정 */}
          {currentStep === nameStep && (
            <StepMatchName
              name={formData.name}
              onNameChange={(name) => setFormData((prev) => ({ ...prev, name }))}
              suggestedBy="일정과 위치를 바탕으로 제목을 자동으로 만들었어요. 그대로 사용하거나 수정할 수 있어요."
            />
          )}

          {/* 최종 확인 */}
          {currentStep === totalSteps && (
            <Step5Review
              category={formData.category}
              name={formData.name}
              location={formData.location}
              meetingDate={formData.meetingDate}
              meetingTime={formData.meetingTime}
              meetingEndDate={formData.meetingEndDate}
              meetingEndTime={formData.meetingEndTime}
              minParticipants={formData.minParticipants}
              maxParticipants={formData.maxParticipants}
              genderRestriction={formData.genderRestriction}
              hasFee={formData.hasFee}
              feeAmount={formData.feeAmount}
              selectedFacility={formData.selectedFacility}
              description={formData.description}
              selectedEquipment={formData.equipment}
              gameType={formData.gameType}
              teamSettings={formData.teamSettings}
            />
          )}
        </div>

        {/* 버튼 */}
        <div className="sticky bottom-0 bg-[var(--color-bg-card)] border-t border-[var(--color-border-card)] p-4 md:p-6 flex space-x-3">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={handlePrev}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] rounded-lg font-semibold hover:opacity-80 transition-opacity"
            >
              <ChevronLeftIcon className="w-5 h-5" />
              이전
            </button>
          )}
          {currentStep < totalSteps ? (
            <button
              type="button"
              onClick={handleNextClick}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
              style={{ backgroundColor: modalAccentHex }}
            >
              다음
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: modalAccentHex }}
            >
              {isSubmitting ? '생성 중...' : '매치 만들기'}
            </button>
          )}
        </div>

        {/* 이전 정보 불러오기 토글 — 모달 하단 */}
        <div className="px-4 md:px-6 py-3 border-t border-[var(--color-border-card)]">
          <ToggleSwitch
            label="이전 정보 불러오기"
            isOn={loadPreviousInfo}
            handleToggle={() => {
              if (loadPreviousInfo) {
                setLoadPreviousInfo(false);
                setFormData(getEmptyFormState(Boolean(initialCategory && initialMatchType)));
              } else {
                setLoadPreviousInfo(true);
                const defaultLoc = getDefaultLocation();
                setFormData((prev) => ({
                  ...prev,
                  location: defaultLoc.location,
                  coordinates: defaultLoc.coordinates,
                }));
                runLoadPreviousGroup(initialCategory || formData.category || '');
              }
            }}
          />
          {loadPreviousInfo && (
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">
              내 정보 주소와 이전에 생성한 매치 정보가 적용됩니다.
            </p>
          )}
        </div>
      </div>

      {/* 팔로워 초대 모달 */}
      {showInviteModal && createdGroupId && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div
            className="bg-[var(--color-bg-card)] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-[var(--color-border-card)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-[var(--color-bg-card)] border-b border-[var(--color-border-card)] p-4 md:p-6 flex items-center justify-between z-10">
              <h2 className="text-xl md:text-2xl font-bold text-[var(--color-text-primary)]">
                팔로워 초대하기
              </h2>
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  if (onSuccess) {
                    onSuccess();
                  }
                  onClose();
                }}
                className="p-2 hover:bg-[var(--color-bg-secondary)] rounded-lg transition-colors"
              >
                <XMarkIcon className="w-6 h-6 text-[var(--color-text-primary)]" />
              </button>
            </div>

            <div className="p-4 md:p-6">
              <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                매치에 초대할 팔로워를 선택하세요. 선택한 팔로워에게 자동으로 초대장이 전송됩니다.
              </p>

              {loadingFollowers ? (
                <div className="text-center py-8">
                  <div className="text-[var(--color-text-secondary)]">로딩 중...</div>
                </div>
              ) : following.length === 0 ? (
                <div className="text-center py-8 text-[var(--color-text-secondary)]">
                  <UserPlusIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>팔로우한 유저가 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {following.map((user) => (
                    <label
                      key={user.id}
                      className="flex items-center space-x-3 p-3 bg-[var(--color-bg-primary)] rounded-lg border border-[var(--color-border-card)] hover:bg-[var(--color-bg-secondary)] transition-colors cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedFollowers.includes(user.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedFollowers((prev) => [...prev, user.id]);
                          } else {
                            setSelectedFollowers((prev) => prev.filter((id) => id !== user.id));
                          }
                        }}
                        className="w-5 h-5 text-[var(--color-blue-primary)] rounded focus:ring-2 focus:ring-[var(--color-blue-primary)]"
                      />
                      <div className="w-10 h-10 rounded-full bg-[var(--color-bg-secondary)] flex items-center justify-center overflow-hidden">
                        {user.profileImageUrl ? (
                          <img src={user.profileImageUrl} alt={user.nickname} className="w-full h-full object-cover" />
                        ) : (
                          <UserPlusIcon className="w-6 h-6 text-[var(--color-text-secondary)]" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-[var(--color-text-primary)]">
                          {user.nickname}
                          {user.tag && <span className="text-[var(--color-text-secondary)] ml-1">#{user.tag}</span>}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              <div className="flex space-x-3 mt-6 pt-4 border-t border-[var(--color-border-card)]">
                <button
                  onClick={() => {
                    setShowInviteModal(false);
                    if (onSuccess) {
                      onSuccess();
                    }
                    onClose();
                  }}
                  className="flex-1 px-4 py-3 bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] rounded-lg font-semibold hover:opacity-80 transition-opacity"
                >
                  건너뛰기
                </button>
                <button
                  onClick={async () => {
                    if (selectedFollowers.length === 0) {
                      await showWarning('초대할 팔로워를 선택해주세요.', '선택 필요');
                      return;
                    }

                    try {
                      // 선택한 팔로워들에게 매치 초대 (자동 참가)
                      const invitePromises = selectedFollowers.map((userId) =>
                        api.post(`/api/groups/${createdGroupId}/invite`, { userId }).catch((error) => {
                          console.error(`팔로워 ${userId} 초대 실패:`, error);
                          return null;
                        })
                      );

                      await Promise.all(invitePromises);
                      await showSuccess(`${selectedFollowers.length}명의 팔로워를 초대했습니다.`, '초대 완료');
                      
                      setShowInviteModal(false);
                      if (onSuccess) {
                        onSuccess();
                      }
                      onClose();
                    } catch (error) {
                      console.error('팔로워 초대 실패:', error);
                      await showError('팔로워 초대에 실패했습니다.', '초대 실패');
                    }
                  }}
                  disabled={selectedFollowers.length === 0}
                  className="flex-1 px-4 py-3 bg-[var(--color-blue-primary)] text-white rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {selectedFollowers.length > 0 ? `${selectedFollowers.length}명 초대하기` : '초대하기'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiStepCreateGroup;
