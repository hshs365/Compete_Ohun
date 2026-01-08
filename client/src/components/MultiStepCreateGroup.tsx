import React, { useState, useEffect, useRef } from 'react';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon, UserPlusIcon, UserMinusIcon } from '@heroicons/react/24/outline';
import type { SelectedGroup } from './MapPanel';
import { api } from '../utils/api';
import { showError, showSuccess, showWarning, showConfirm } from '../utils/swal';
import { isTeamSport, getMinParticipantsForSport } from '../constants/sports';
import { getEquipmentBySport } from '../constants/equipment';

// Step 컴포넌트들
import Step1Category from './create-group/Step1Category';
import Step2GameSettings from './create-group/Step2GameSettings';
import Step3CommonSettings from './create-group/Step3CommonSettings';
import Step4Equipment from './create-group/Step4Equipment';
import Step5Review from './create-group/Step5Review';

interface MultiStepCreateGroupProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (groupData: Omit<SelectedGroup, 'id'>) => void;
  onSuccess?: () => void;
}

const MultiStepCreateGroup: React.FC<MultiStepCreateGroupProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onSuccess,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [mapKey, setMapKey] = useState(0);
  const [mapZoom, setMapZoom] = useState(15);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [createdGroupId, setCreatedGroupId] = useState<number | null>(null);
  const [following, setFollowing] = useState<Array<{ id: number; nickname: string; tag?: string; profileImageUrl?: string }>>([]);
  const [selectedFollowers, setSelectedFollowers] = useState<number[]>([]);
  const [loadingFollowers, setLoadingFollowers] = useState(false);

  // 사용자 위치 가져오기
  const getUserLocation = (): [number, number] => {
    try {
      const savedLocation = localStorage.getItem('userLocation');
      if (savedLocation) {
        const location = JSON.parse(savedLocation);
        if (location.latitude && location.longitude) {
          return [location.latitude, location.longitude];
        }
      }
    } catch (e) {
      // 무시
    }
    return [37.5665, 126.9780]; // 서울 시청 (기본값)
  };

  // 오늘 날짜에 오후 6시를 기본값으로 설정
  const getDefaultDateTime = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return {
      date: `${year}-${month}-${day}`,
      time: '18:00',
    };
  };

  const defaultDateTime = getDefaultDateTime();

  // 전체 폼 데이터
  const [formData, setFormData] = useState({
    category: '',
    name: '',
    location: '',
    coordinates: getUserLocation(),
    meetingDate: defaultDateTime.date,
    meetingTime: defaultDateTime.time,
    minParticipants: '',
    maxParticipants: '',
    genderRestriction: null as 'male' | 'female' | null,
    hasFee: false,
    feeAmount: '',
    facilityId: null as number | null,
    selectedFacility: null as { id: number; name: string; address: string } | null,
    description: '',
    equipment: [] as string[],
    gameType: 'team' as 'team' | 'individual',
    teamSettings: {
      positions: [] as string[],
      balanceByExperience: false,
      balanceByRank: false,
      minPlayersPerTeam: 1,
    },
  });

  // 이전 예약 내역 불러오기 (localStorage에서, 카테고리별)
  const loadPreviousBooking = (category: string) => {
    if (!category) return;
    
    try {
      const savedBooking = localStorage.getItem(`lastGroupBooking_${category}`);
      if (savedBooking) {
        const booking = JSON.parse(savedBooking);
        const resetDateTime = getDefaultDateTime();
        
        // 해당 카테고리의 데이터로 완전히 교체 (카테고리 변경 시 다른 카테고리 데이터가 남지 않도록)
        setFormData((prev) => ({
          ...prev,
          category: category, // 현재 선택된 카테고리 유지
          name: booking.name || '', // 다른 카테고리의 이름이 남지 않도록 빈 문자열로 초기화
          location: booking.location || prev.location,
          coordinates: booking.coordinates || prev.coordinates,
          meetingDate: booking.meetingDate || resetDateTime.date,
          meetingTime: booking.meetingTime || resetDateTime.time,
          minParticipants: booking.minParticipants || '',
          maxParticipants: booking.maxParticipants || '',
          genderRestriction: booking.genderRestriction || null,
          hasFee: booking.hasFee || false,
          feeAmount: booking.feeAmount || '',
          facilityId: booking.facilityId || null,
          selectedFacility: booking.selectedFacility || null,
          description: booking.description || '',
          equipment: booking.equipment || [],
          gameType: booking.gameType || prev.gameType,
          teamSettings: booking.teamSettings || prev.teamSettings,
        }));
        
        if (booking.coordinates) {
          setMapZoom(15);
          setMapKey((prev) => prev + 1);
        }
      } else {
        // 해당 카테고리의 저장된 데이터가 없으면 기본값으로 초기화 (다른 카테고리 데이터가 남지 않도록)
        const resetDateTime = getDefaultDateTime();
        setFormData((prev) => ({
          ...prev,
          category: category,
          name: '', // 다른 카테고리의 이름이 남지 않도록 초기화
          description: '',
          equipment: [],
          minParticipants: '',
          maxParticipants: '',
          genderRestriction: null,
          hasFee: false,
          feeAmount: '',
          facilityId: null,
          selectedFacility: null,
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
      const resetDateTime = getDefaultDateTime();
      setFormData({
        category: '',
        name: '',
        location: '',
        coordinates: getUserLocation(),
        meetingDate: resetDateTime.date,
        meetingTime: resetDateTime.time,
        minParticipants: '',
        maxParticipants: '',
        hasFee: false,
        feeAmount: '',
        facilityId: null,
        selectedFacility: null,
        description: '',
        equipment: [],
        gameType: 'team',
        teamSettings: {
          positions: [],
          balanceByExperience: false,
          balanceByRank: false,
          minPlayersPerTeam: 1,
        },
      });
      setShowMap(false);
      return;
    }

    // 이전 그룹 데이터 불러오기 (API에서) - 모든 카테고리의 데이터를 localStorage에 저장만 함
    const loadPreviousGroup = async () => {
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

        if (myGroups && myGroups.length > 0) {
          const resetDateTime = getDefaultDateTime();
          
          // 각 그룹을 카테고리별로 localStorage에 저장
          myGroups.forEach((group) => {
            const latitude = typeof group.latitude === 'string' 
              ? parseFloat(group.latitude) 
              : Number(group.latitude);
            const longitude = typeof group.longitude === 'string' 
              ? parseFloat(group.longitude) 
              : Number(group.longitude);
            
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
                description: group.description || '',
                equipment: group.equipment || [],
              };
              // 카테고리별로 저장
              localStorage.setItem(`lastGroupBooking_${group.category}`, JSON.stringify(bookingData));
            }
          });
        }
        
        // API에서 데이터를 가져온 후, 현재 선택된 카테고리의 데이터를 불러오기
        if (formData.category) {
          loadPreviousBooking(formData.category);
        }
      } catch (error) {
        console.log('이전 그룹 데이터를 불러올 수 없습니다:', error);
        // API 실패 시 localStorage에서 불러오기 (현재 카테고리 기준)
        if (formData.category) {
          loadPreviousBooking(formData.category);
        }
      }
    };

    loadPreviousGroup();
  }, [isOpen]);

  // 카테고리 변경 시 해당 카테고리의 이전 데이터 불러오기
  useEffect(() => {
    if (isOpen && formData.category) {
      // 카테고리가 변경되면 해당 카테고리의 데이터만 불러오기
      // 기존 데이터는 유지하되, 해당 카테고리의 저장된 데이터로 덮어쓰기
      loadPreviousBooking(formData.category);
    } else if (isOpen && !formData.category) {
      // 카테고리가 없으면 기본값으로 초기화
      const resetDateTime = getDefaultDateTime();
      setFormData((prev) => ({
        ...prev,
        name: '',
        location: '',
        coordinates: getUserLocation(),
        meetingDate: resetDateTime.date,
        meetingTime: resetDateTime.time,
        minParticipants: '',
        maxParticipants: '',
        hasFee: false,
        feeAmount: '',
        facilityId: null,
        selectedFacility: null,
        description: '',
        equipment: [],
      }));
    }
  }, [formData.category, isOpen]);

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

  // 총 단계 수 (팀 게임이면 5단계, 개인 운동이면 4단계)
  const totalSteps = formData.category && isTeamSport(formData.category) ? 5 : 4;

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

  // 각 단계별 유효성 검사
  const validateStep = async (step: number): Promise<boolean> => {
    switch (step) {
      case 1:
        if (!formData.category) {
          await showError('운동 종류를 선택해주세요.', '카테고리 선택 필요');
          return false;
        }
        return true;
      case 2:
        // 팀 게임이 아니면 건너뛰기
        if (!isTeamSport(formData.category)) {
          return true;
        }
        return true;
      case 3:
        if (!formData.location || formData.location.trim() === '') {
          await showWarning('위치를 선택해주세요. 주소 찾기 버튼을 클릭하거나 지도에서 마커를 드래그하여 위치를 선택하세요.', '위치 선택 필요');
          return false;
        }
        if (!formData.name || formData.name.trim() === '') {
          await showError('매치 이름을 입력해주세요.', '매치 이름 필요');
          return false;
        }
        return true;
      case 4:
        return true;
      case 5:
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
        meetingTimeString = `${formData.meetingDate} ${formData.meetingTime}`;
        // meetingDateTime 생성 (ISO 형식)
        const dateTimeStr = `${formData.meetingDate}T${formData.meetingTime}:00`;
        meetingDateTime = new Date(dateTimeStr);
      } else if (formData.meetingDate) {
        meetingTimeString = formData.meetingDate;
      } else if (formData.meetingTime) {
        meetingTimeString = formData.meetingTime;
      }

      const latitude = Number(formData.coordinates[0]);
      const longitude = Number(formData.coordinates[1]);
      
      if (isNaN(latitude) || isNaN(longitude)) {
        await showError('위치 좌표가 유효하지 않습니다.', '위치 좌표 오류');
        setIsSubmitting(false);
        return;
      }

      const groupData: any = {
        name: formData.name,
        location: formData.location,
        latitude: latitude,
        longitude: longitude,
        category: formData.category,
        description: formData.description || undefined,
        meetingTime: meetingTimeString,
        meetingDateTime: meetingDateTime ? meetingDateTime.toISOString() : undefined,
        minParticipants: formData.minParticipants && formData.minParticipants.trim() !== '' 
          ? parseInt(formData.minParticipants, 10) 
          : undefined,
        maxParticipants: formData.maxParticipants && formData.maxParticipants.trim() !== '' 
          ? parseInt(formData.maxParticipants, 10) 
          : undefined,
        genderRestriction: formData.genderRestriction || undefined,
        hasFee: formData.hasFee || false,
        feeAmount: formData.hasFee && formData.feeAmount && formData.feeAmount.trim() !== ''
          ? parseInt(formData.feeAmount, 10)
          : undefined,
        facilityId: formData.facilityId || undefined,
        equipment: formData.equipment,
      };

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
      
      // 팔로워 목록 불러오기
      try {
        setLoadingFollowers(true);
        const followingList = await api.get<Array<{ id: number; nickname: string; tag?: string; profileImageUrl?: string }>>('/api/users/following');
        setFollowing(followingList);
        if (followingList.length > 0) {
          setShowInviteModal(true);
        }
      } catch (error) {
        console.error('팔로워 목록 로드 실패:', error);
        // 팔로워 목록 로드 실패해도 매치 생성은 성공으로 처리
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
        minParticipants: formData.minParticipants,
        maxParticipants: formData.maxParticipants,
        genderRestriction: formData.genderRestriction,
        hasFee: formData.hasFee,
        feeAmount: formData.feeAmount,
        facilityId: formData.facilityId,
        selectedFacility: formData.selectedFacility,
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

      // 팔로워가 있으면 초대 모달 표시, 없으면 바로 닫기
      if (following.length === 0) {
        if (onSuccess) {
          onSuccess();
        }
        onClose();
      }
      // 팔로워가 있으면 모달은 이미 열려있음 (위에서 setShowInviteModal(true))
    } catch (error) {
      console.error('매치 생성 실패:', error);
      await showError(error instanceof Error ? error.message : '매치 생성에 실패했습니다.', '매치 생성 실패');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

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
              새 매치 만들기
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              {currentStep} / {totalSteps} 단계
            </p>
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
              className="bg-[var(--color-blue-primary)] h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* 폼 내용 */}
        <div className="p-4 md:p-6">
          {/* Step 1: 카테고리 선택 */}
          {currentStep === 1 && (
            <Step1Category
              category={formData.category}
              onCategoryChange={(category) => {
                // 카테고리 변경 시 최소인원 자동 설정
                const minParticipants = getMinParticipantsForSport(category);
                setFormData((prev) => ({ 
                  ...prev, 
                  category,
                  minParticipants: minParticipants ? minParticipants.toString() : '',
                }));
              }}
            />
          )}

          {/* Step 2: 게임 설정 */}
          {currentStep === 2 && (
            <Step2GameSettings
              category={formData.category}
              gameType={formData.gameType}
              onGameTypeChange={(gameType) => setFormData((prev) => ({ ...prev, gameType }))}
              teamSettings={formData.teamSettings}
              onTeamSettingsChange={(teamSettings) => setFormData((prev) => ({ ...prev, teamSettings }))}
            />
          )}

          {/* Step 3: 공통 설정 */}
          {currentStep === 3 && (
            <Step3CommonSettings
              name={formData.name}
              onNameChange={(name) => setFormData((prev) => ({ ...prev, name }))}
              location={formData.location}
              coordinates={formData.coordinates}
              onLocationChange={(location, coordinates) => 
                setFormData((prev) => ({ ...prev, location, coordinates }))
              }
              meetingDate={formData.meetingDate}
              meetingTime={formData.meetingTime}
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
              onGenderRestrictionChange={(gender) =>
                setFormData((prev) => ({ ...prev, genderRestriction: gender }))
              }
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
              showMap={showMap}
              onToggleMap={() => setShowMap(!showMap)}
              mapKey={mapKey}
              mapZoom={mapZoom}
              onMarkerDragEnd={handleMarkerDragEnd}
            />
          )}

          {/* Step 4: 준비물 및 설명 */}
          {currentStep === 4 && (
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
              description={formData.description}
              onDescriptionChange={(description) => 
                setFormData((prev) => ({ ...prev, description }))
              }
            />
          )}

          {/* Step 5: 최종 확인 (팀 게임인 경우만) */}
          {currentStep === 5 && (
            <Step5Review
              category={formData.category}
              name={formData.name}
              location={formData.location}
              meetingDate={formData.meetingDate}
              meetingTime={formData.meetingTime}
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
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[var(--color-blue-primary)] text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              다음
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-[var(--color-blue-primary)] text-white rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '생성 중...' : '매치 만들기'}
            </button>
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
