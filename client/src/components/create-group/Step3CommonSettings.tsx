import React, { useState, useEffect } from 'react';
import { MapPinIcon, CalendarIcon, UsersIcon, MagnifyingGlassIcon, TagIcon, BuildingOfficeIcon, CurrencyDollarIcon, UserGroupIcon, PlusCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import NaverMap from '../NaverMap';
import { api } from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import { getMinParticipantsForSport } from '../../constants/sports';
import { extractCityFromAddress, getUserCity, getRegionDisplayName } from '../../utils/locationUtils';

/** 위경도 거리(km) — 하버사인 */
function distanceKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

interface Step3CommonSettingsProps {
  category: string;
  name: string;
  onNameChange: (name: string) => void;
  location: string;
  coordinates: [number, number];
  onLocationChange: (location: string, coordinates: [number, number]) => void;
  meetingDate: string;
  meetingTime: string;
  meetingEndDate?: string;
  meetingEndTime?: string;
  onDateTimeChange: (date: string, time: string) => void;
  maxParticipants: string;
  onMaxParticipantsChange: (value: string) => void;
  minParticipants: string;
  onMinParticipantsChange: (value: string) => void;
  genderRestriction: 'male' | 'female' | null;
  onGenderRestrictionChange: (gender: 'male' | 'female' | null) => void;
  hasFee: boolean;
  onHasFeeChange: (hasFee: boolean) => void;
  feeAmount: string;
  onFeeAmountChange: (value: string) => void;
  facilityId: number | null;
  onFacilityIdChange: (facilityId: number | null) => void;
  selectedFacility: { id: number; name: string; address: string; image?: string | null } | null;
  onSelectedFacilityChange: (facility: { id: number; name: string; address: string; image?: string | null } | null) => void;
  /** 가계약 2순위 시설 (선택) */
  facilityId2?: number | null;
  onFacilityId2Change?: (facilityId: number | null) => void;
  selectedFacility2?: { id: number; name: string; address: string; image?: string | null } | null;
  onSelectedFacility2Change?: (facility: { id: number; name: string; address: string; image?: string | null } | null) => void;
  /** 가계약 3순위 시설 (선택) */
  facilityId3?: number | null;
  onFacilityId3Change?: (facilityId: number | null) => void;
  selectedFacility3?: { id: number; name: string; address: string; image?: string | null } | null;
  onSelectedFacility3Change?: (facility: { id: number; name: string; address: string; image?: string | null } | null) => void;
  /** 시설 예약 완료 시 설정 (다음 단계 진행 조건, 없으면 선택사항) */
  reservationId?: number | null;
  onReservationIdChange?: (id: number | null) => void;
  showMap: boolean;
  onToggleMap: () => void;
  mapKey: number;
  mapZoom: number;
  onMarkerDragEnd: (lat: number, lng: number) => void;
  /** true면 상단 설명 문구 숨김 */
  hideDescription?: boolean;
  /** true면 매치 일정을 시간 단위(분 제외)로만 선택 */
  timeStepHourOnly?: boolean;
  /** 3파전 등 고정 최소 인원 (있으면 빈 값일 때 이 값으로 표시) */
  defaultMinParticipants?: number;
  /** true면 매치 일정 입력란 숨김 (이전 단계에서 이미 선택된 일정 사용, 해당 일정에 예약 가능한 시설만 표시) */
  scheduleReadOnly?: boolean;
  /** 설정 시 해당 섹션만 렌더 (매치명/성별/일자/위치/참가비 단계 분리용) */
  onlySection?: 'name' | 'gender' | 'location' | 'fee' | null;
}

const Step3CommonSettings: React.FC<Step3CommonSettingsProps> = ({
  category,
  name,
  onNameChange,
  location,
  coordinates,
  onLocationChange,
  meetingDate,
  meetingTime,
  meetingEndDate,
  meetingEndTime,
  onDateTimeChange,
  maxParticipants,
  onMaxParticipantsChange,
  minParticipants,
  onMinParticipantsChange,
  genderRestriction,
  onGenderRestrictionChange,
  hasFee,
  onHasFeeChange,
  feeAmount,
  onFeeAmountChange,
  facilityId,
  onFacilityIdChange,
  selectedFacility,
  onSelectedFacilityChange,
  facilityId2 = null,
  onFacilityId2Change = () => {},
  selectedFacility2 = null,
  onSelectedFacility2Change = () => {},
  facilityId3 = null,
  onFacilityId3Change = () => {},
  selectedFacility3 = null,
  onSelectedFacility3Change = () => {},
  reservationId = null,
  onReservationIdChange = () => {},
  showMap,
  onToggleMap,
  mapKey,
  mapZoom,
  onMarkerDragEnd,
  hideDescription = false,
  timeStepHourOnly = false,
  defaultMinParticipants,
  scheduleReadOnly = false,
  onlySection = null,
}) => {
  const { user } = useAuth();
  const showName = onlySection == null || onlySection === 'name';
  const showGender = onlySection == null || onlySection === 'gender';
  const showLocation = onlySection == null || onlySection === 'location';
  const showFee = onlySection == null || onlySection === 'fee';
  const showSchedule = onlySection == null;
  const showMinMax = onlySection == null; // 참여자 수는 별도 단계로 분리
  const locationOnlyFacility = onlySection === 'location'; // 시설 선택으로만 주소 결정, 주소 입력/접기 버튼 없음
  const [showFacilitySearch, setShowFacilitySearch] = useState(onlySection === 'location');
  /** 1=1순위(위치 설정), 2=2순위, 3=3순위. 가계약 시 2·3순위 선택 시 사용 */
  const [selectingFacilityRank, setSelectingFacilityRank] = useState<1 | 2 | 3>(1);
  const [facilitySearchQuery, setFacilitySearchQuery] = useState('');
  const [facilities, setFacilities] = useState<any[]>([]);
  const [facilityTotal, setFacilityTotal] = useState(0);
  const [facilityPage, setFacilityPage] = useState(1);
  const FACILITY_PAGE_SIZE = 5;
  const [isSearchingFacilities, setIsSearchingFacilities] = useState(false);
  const [reservationDate, setReservationDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState<{ startTime: string; endTime: string }[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [reserving, setReserving] = useState(false);
  const prevCategoryRef = React.useRef<string>('');
  /** 선택된 시설 좌표 (미니 지도 1,2,3 마커용) */
  const [selected1Coords, setSelected1Coords] = useState<[number, number] | null>(null);
  const [selected2Coords, setSelected2Coords] = useState<[number, number] | null>(null);
  const [selected3Coords, setSelected3Coords] = useState<[number, number] | null>(null);
  /** 리스트에서 클릭한 시설 미리보기 (해당 시설만 지도에 표시). 선택 버튼이 아닌 카드 클릭 시 설정 */
  const [mapPreviewCoords, setMapPreviewCoords] = useState<[number, number] | null>(null);

  // 선택 해제 시 좌표 초기화 (부모에서 null로 바뀐 경우)
  useEffect(() => {
    if (!selectedFacility) setSelected1Coords(null);
    if (!selectedFacility2) setSelected2Coords(null);
    if (!selectedFacility3) setSelected3Coords(null);
  }, [selectedFacility, selectedFacility2, selectedFacility3]);

  // scheduleReadOnly일 때 1순위 시설 선택 시 예약 날짜를 매치 일정 날짜로 자동 설정
  useEffect(() => {
    if (scheduleReadOnly && facilityId && meetingDate && meetingDate.length === 10 && !reservationDate) {
      setReservationDate(meetingDate);
    }
  }, [scheduleReadOnly, facilityId, meetingDate, reservationDate]);

  // 종목이 있고 (주소 또는 좌표)가 있으면 시설 목록 패널 자동 표시 — 가까운 시설부터 노출
  useEffect(() => {
    const hasLocation = Boolean(location?.trim());
    const hasCoordinates = Boolean(coordinates?.[0] != null && coordinates?.[1] != null);
    if (category && category !== '전체' && (hasLocation || hasCoordinates)) {
      setShowFacilitySearch(true);
    }
  }, [location, category, coordinates]);

  // 카테고리 변경 시 최소인원 자동 설정 (최소인원이 비어있을 때만)
  useEffect(() => {
    if (category && category !== prevCategoryRef.current) {
      prevCategoryRef.current = category;
      // 최소인원이 비어있거나 0일 때만 자동 설정
      if (!minParticipants || minParticipants === '0' || minParticipants === '') {
        const minParticipantsValue = getMinParticipantsForSport(category);
        if (minParticipantsValue) {
          onMinParticipantsChange(minParticipantsValue.toString());
        }
      }
    }
  }, [category, minParticipants, onMinParticipantsChange]);

  // 시설 검색: 오운 등록 시설 중 해당 지역·종목 가능한 시설만
  useEffect(() => {
    const loadRecommendedFacilities = async () => {
      if (!showFacilitySearch) {
        setFacilities([]);
        return;
      }

      setIsSearchingFacilities(true);
      try {
        const queryParams = new URLSearchParams();
        
        // 종목(카테고리) 필터 - 해당 종목 가능한 시설만
        if (category && category !== '전체') {
          queryParams.append('category', category);
        }
        
        // 지역 필터: 주소에서 추출 또는 사용자 현재 지역 (시설 주소와 매칭되도록 짧은 이름 사용)
        const region = location?.trim()
          ? extractCityFromAddress(location)
          : getUserCity(user?.id);
        if (region && region !== '전체') {
          const areaSearch = getRegionDisplayName(region);
          if (areaSearch && areaSearch !== '전국') {
            queryParams.append('area', areaSearch);
          }
        }
        
        if (facilitySearchQuery.trim()) {
          queryParams.append('search', facilitySearchQuery);
        }
        
        if (coordinates[0] && coordinates[1]) {
          queryParams.append('latitude', coordinates[0].toString());
          queryParams.append('longitude', coordinates[1].toString());
        }
        // 이전 단계에서 선택한 매치 일정(시작~종료)에 예약 가능한 시설만 조회
        if (meetingDate && meetingTime && meetingDate.length === 10 && meetingTime.length >= 5) {
          queryParams.append('availableDate', meetingDate);
          queryParams.append('availableTime', meetingTime.slice(0, 5)); // HH:mm
          if (meetingEndTime && meetingEndTime.length >= 5) {
            queryParams.append('availableEndTime', meetingEndTime.slice(0, 5));
          }
          if (meetingEndDate && meetingEndDate !== meetingDate) {
            queryParams.append('availableEndDate', meetingEndDate);
          }
        }
        
        queryParams.append('limit', String(FACILITY_PAGE_SIZE));
        queryParams.append('page', String(facilityPage));

        const response = await api.get<{ facilities: any[]; total: number }>(
          `/api/facilities?${queryParams.toString()}`
        );
        setFacilities(response.facilities || []);
        setFacilityTotal(response.total ?? 0);
      } catch (error) {
        console.error('시설 검색 실패:', error);
        setFacilities([]);
      } finally {
        setIsSearchingFacilities(false);
      }
    };

    if (facilitySearchQuery.trim()) {
      const debounceTimer = setTimeout(() => {
        loadRecommendedFacilities();
      }, 300);
      return () => clearTimeout(debounceTimer);
    } else {
      loadRecommendedFacilities();
    }
  }, [showFacilitySearch, facilitySearchQuery, category, location, coordinates, facilityPage, meetingDate, meetingTime, meetingEndTime, meetingEndDate]);

  // 검색 조건·위치 변경 시 시설 목록 1페이지로 초기화
  useEffect(() => {
    setFacilityPage(1);
  }, [facilitySearchQuery, category, location]);

  // 시설 선택 핸들러 (1순위는 위치도 설정, 2·3순위는 가계약용. 중복 선택 방지)
  // locationOnlyFacility일 때는 "선택" 버튼으로 빈 순위에 자동 등록 (1 → 2 → 3)
  const handleSelectFacility = async (facility: any) => {
    const imageUrl = facility.image || (Array.isArray(facility.images) && facility.images.length > 0 ? facility.images[0] : null);
    const info = { id: facility.id, name: facility.name, address: facility.address, image: imageUrl ?? undefined };
    const lat = facility.latitude != null ? parseFloat(facility.latitude) : null;
    const lng = facility.longitude != null ? parseFloat(facility.longitude) : null;
    const coords: [number, number] | null = lat != null && lng != null && !isNaN(lat) && !isNaN(lng) ? [lat, lng] : null;

    const isDuplicate = facility.id === facilityId || facility.id === facilityId2 || facility.id === facilityId3;
    if (isDuplicate) {
      const { showError } = await import('../../utils/swal');
      showError('이미 선택된 시설입니다. 다른 시설을 선택해 주세요.', '중복 선택');
      return;
    }

    if (locationOnlyFacility) {
      setMapPreviewCoords(null); // 순위에 등록하면 미리보기 해제 → 지도는 1·2·3 마커로 복귀
      // 빈 순위 중 가장 빠른 순위에 자동 등록
      if (!selectedFacility) {
        if (coords) onLocationChange(facility.address, coords);
        onFacilityIdChange(facility.id);
        onSelectedFacilityChange(info);
        setSelected1Coords(coords);
        setReservationDate('');
        setAvailableSlots([]);
        onReservationIdChange?.(null);
      } else if (!selectedFacility2) {
        onFacilityId2Change(facility.id);
        onSelectedFacility2Change(info);
        setSelected2Coords(coords);
      } else if (!selectedFacility3) {
        onFacilityId3Change(facility.id);
        onSelectedFacility3Change(info);
        setSelected3Coords(coords);
      }
      setFacilitySearchQuery('');
      return;
    }

    if (selectingFacilityRank === 2) {
      if (facility.id === facilityId) {
        const { showError } = await import('../../utils/swal');
        showError('이미 1순위로 선택된 시설입니다. 다른 시설을 선택해 주세요.', '중복 선택');
        return;
      }
      if (facility.id === facilityId3) {
        const { showError } = await import('../../utils/swal');
        showError('이미 3순위로 선택된 시설입니다. 다른 시설을 선택해 주세요.', '중복 선택');
        return;
      }
    }
    if (selectingFacilityRank === 3) {
      if (facility.id === facilityId) {
        const { showError } = await import('../../utils/swal');
        showError('이미 1순위로 선택된 시설입니다. 다른 시설을 선택해 주세요.', '중복 선택');
        return;
      }
      if (facility.id === facilityId2) {
        const { showError } = await import('../../utils/swal');
        showError('이미 2순위로 선택된 시설입니다. 다른 시설을 선택해 주세요.', '중복 선택');
        return;
      }
    }

    if (selectingFacilityRank === 1 && facility.latitude && facility.longitude) {
      onLocationChange(facility.address, [parseFloat(facility.latitude), parseFloat(facility.longitude)]);
      onFacilityIdChange(facility.id);
      onSelectedFacilityChange(info);
      setSelected1Coords(coords);
      setReservationDate('');
      setAvailableSlots([]);
      onReservationIdChange?.(null);
    } else if (selectingFacilityRank === 2) {
      onFacilityId2Change(facility.id);
      onSelectedFacility2Change(info);
      setSelected2Coords(coords);
    } else if (selectingFacilityRank === 3) {
      onFacilityId3Change(facility.id);
      onSelectedFacility3Change(info);
      setSelected3Coords(coords);
    }
    setFacilitySearchQuery('');
    setShowFacilitySearch(false);
  };

  // 시설 선택 해제
  const handleClearFacility = () => {
    onFacilityIdChange(null);
    onSelectedFacilityChange(null);
    onReservationIdChange?.(null);
    setReservationDate('');
    setAvailableSlots([]);
    setSelected1Coords(null);
  };

  // 선택한 시설 + 날짜가 있으면 예약 가능 시간대 로드
  useEffect(() => {
    if (!facilityId || !reservationDate || reservationDate.length !== 10) {
      setAvailableSlots([]);
      return;
    }
    const loadSlots = async () => {
      setLoadingSlots(true);
      try {
        const slots = await api.get<{ startTime: string; endTime: string }[]>(
          `/api/reservations/facility/${facilityId}/available-slots?date=${reservationDate}`
        );
        setAvailableSlots(Array.isArray(slots) ? slots : []);
      } catch (e) {
        console.error('예약 가능 시간 조회 실패:', e);
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };
    loadSlots();
  }, [facilityId, reservationDate]);

  // 슬롯 선택 시 예약 생성 후 매치 일정 자동 반영
  const handleReserveSlot = async (date: string, startTime: string, endTime: string) => {
    if (!facilityId) return;
    setReserving(true);
    try {
      const reservation = await api.post<{ id: number }>('/api/reservations', {
        facilityId,
        reservationDate: date,
        startTime,
        endTime,
        numberOfPeople: 1,
      });
      onDateTimeChange(date, startTime);
      onReservationIdChange?.(reservation.id);
      setAvailableSlots((prev) => prev.filter((s) => !(s.startTime === startTime && s.endTime === endTime)));
    } catch (error) {
      console.error('예약 실패:', error);
      const msg = error instanceof Error ? error.message : '예약에 실패했습니다.';
      const { showError } = await import('../../utils/swal');
      showError(msg, '시설 예약 실패');
    } finally {
      setReserving(false);
    }
  };

  /** 순위에 등록한 시설들에 대해 가예약 생성 → 시설주 캘린더에 "가예약중 - 매치장 닉네임" 표시 */
  const handleProvisionalBulk = async (date: string, startTime: string, endTime: string) => {
    const ids = [facilityId, facilityId2, facilityId3].filter((id): id is number => id != null);
    if (ids.length === 0) return;
    setReserving(true);
    try {
      const res = await api.post<{ created: number; reservationIds: number[] }>('/api/reservations/provisional-bulk', {
        facilityIds: ids,
        reservationDate: date,
        startTime: startTime.slice(0, 5),
        endTime: endTime.slice(0, 5),
      });
      // 가예약 성공 시 예약 ID를 설정 (다음 단계 진행 검증용)
      if (res.reservationIds?.length > 0) {
        onReservationIdChange?.(res.reservationIds[0]);
      }
      const { showSuccess } = await import('../../utils/swal');
      showSuccess(res.created > 0 ? `${res.created}개 시설에 가예약을 걸었습니다. 매치 확정 시 1순위만 확정되고 나머지는 자동 해제됩니다.` : '가예약을 걸었습니다. (이미 해당 시간에 예약이 있는 시설은 제외됨)', '가예약');
    } catch (error) {
      console.error('가예약 실패:', error);
      const msg = error instanceof Error ? error.message : '가예약에 실패했습니다.';
      const { showError } = await import('../../utils/swal');
      showError(msg, '가예약 실패');
    } finally {
      setReserving(false);
    }
  };
  // 주소 찾기 버튼 클릭 (다음 주소 검색 API)
  const handleSearchAddress = () => {
    if (typeof window !== 'undefined' && (window as any).daum) {
      new (window as any).daum.Postcode({
        oncomplete: (data: any) => {
          let fullAddress = data.address || '';
          let extraAddress = '';

          if (data.addressType === 'R') {
            if (data.bname !== '') {
              extraAddress += data.bname;
            }
            if (data.buildingName !== '') {
              extraAddress += extraAddress !== '' ? `, ${data.buildingName}` : data.buildingName;
            }
            fullAddress += extraAddress !== '' ? ` (${extraAddress})` : '';
          }

          // 주소만 먼저 반영 (지도/좌표는 주소 기준 동기화 useEffect에서 갱신)
          onLocationChange(fullAddress, coordinates);
        },
        width: '100%',
        height: '100%',
      }).open();
    } else {
      const script = document.createElement('script');
      script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
      script.onload = () => {
        handleSearchAddress();
      };
      document.head.appendChild(script);
    }
  };

  // 주소 → 좌표 변환 (네이버 지도 SDK 지오코더 우선·CORS 없음, 실패 시 카카오 주소 검색)
  const addressToCoordinates = React.useCallback(async (address: string): Promise<[number, number] | null> => {
    if (!address || address.trim().length === 0) return null;
    const trimmed = address.trim();

    // 1) 네이버 지도 JS SDK 지오코더 (브라우저에서 CORS 없이 동작, 별도 REST 키 불필요)
    const naver = typeof window !== 'undefined' ? (window as any).naver : null;
    if (naver?.maps?.Service?.geocode) {
      try {
        const coords = await new Promise<[number, number] | null>((resolve) => {
          naver.maps.Service.geocode({ query: trimmed }, (status: number, response: any) => {
            if (status === naver.maps.Service.Status.OK && response?.v2?.addresses?.length > 0) {
              const { y, x } = response.v2.addresses[0];
              resolve([parseFloat(y), parseFloat(x)]);
            } else {
              resolve(null);
            }
          });
        });
        if (coords) return coords;
      } catch (e) {
        console.warn('네이버 지도 지오코더 실패:', e);
      }
    }

    // 2) 카카오 주소 검색 (폴백)
    const KAKAO_KEY = import.meta.env.VITE_KAKAO_REST_API_KEY;
    if (KAKAO_KEY) {
      try {
        const res = await fetch(
          `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(trimmed)}`,
          { headers: { Authorization: `KakaoAK ${KAKAO_KEY}` } }
        );
        if (res.ok) {
          const data = await res.json();
          if (data.documents?.length > 0) {
            const { y, x } = data.documents[0];
            return [parseFloat(y), parseFloat(x)];
          }
        }
      } catch (e) {
        console.warn('카카오 주소 검색 실패:', e);
      }
    }

    return null;
  }, []);

  const handleAddressToCoordinates = React.useCallback(async (address: string) => {
    const coords = await addressToCoordinates(address);
    if (coords) onLocationChange(address, coords);
  }, [addressToCoordinates, onLocationChange]);

  // 주소 기준 동기화: 주소가 바뀌면 해당 주소로 지오코드 후 좌표 갱신 (지도가 선택한 주소 위치로 표시되도록)
  const lastGeocodedAddressRef = React.useRef<string>('');
  useEffect(() => {
    if (!location || location.trim().length === 0) return;
    if (lastGeocodedAddressRef.current === location.trim()) return;
    lastGeocodedAddressRef.current = location.trim();
    handleAddressToCoordinates(location);
  }, [location, handleAddressToCoordinates]);

  const effectiveMinParticipants = minParticipants || (defaultMinParticipants != null ? String(defaultMinParticipants) : '');
  /** 최소 참여자 수는 이 값 이하로 내려갈 수 없음 (종목/매치 방식에 따른 최소치) */
  const minParticipantsFloor = defaultMinParticipants ?? getMinParticipantsForSport(category) ?? 1;

  return (
    <div className="space-y-6">
      {onlySection == null && (
        <div className="mb-6">
          <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
            매치 기본 정보
          </h3>
          {!hideDescription && (
            <p className="text-sm text-[var(--color-text-secondary)]">
              매치 이름, 위치, 일정, 인원 수를 설정하세요.
            </p>
          )}
        </div>
      )}
      {onlySection === 'location' && (
        <div className="mb-6">
          <h3 className="text-xl font-bold text-[var(--color-text-primary)]">
            시설예약
          </h3>
        </div>
      )}

      {/* 매치 이름 */}
      {showName && (
      <div>
        <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
          <TagIcon className="w-4 h-4 inline mr-1" />
          매치 이름 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          className="w-full px-4 py-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
          placeholder="매치명을 입력해주세요"
        />
      </div>
      )}

      {/* 위치: 시설 선택 전용(onlySection location)이면 인풋·접기·주소입력 버튼 없음, 목록·지도만 */}
      {showLocation && (
      <div>
        {!locationOnlyFacility && (
          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
            <MapPinIcon className="w-4 h-4 inline mr-1" />
            위치 <span className="text-red-500">*</span>
          </label>
        )}
        {!locationOnlyFacility && (
        <div className="flex gap-2 mb-2 flex-wrap">
          <input
            type="text"
            required
            readOnly
            value={location}
            className="flex-1 min-w-[200px] px-4 py-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] cursor-not-allowed"
            placeholder="아래 가까운 시설 목록에서 시설을 선택하세요"
          />
          <button
            type="button"
            onClick={() => {
              setSelectingFacilityRank(1);
              setShowFacilitySearch(!showFacilitySearch);
              if (!showFacilitySearch) {
                setFacilitySearchQuery('');
              }
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-opacity flex items-center gap-2 whitespace-nowrap ${
              facilityId
                ? 'bg-green-500 text-white hover:opacity-90'
                : 'bg-[var(--color-blue-primary)] text-white hover:opacity-90'
            }`}
          >
            <BuildingOfficeIcon className="w-4 h-4" />
            {showFacilitySearch ? '시설 목록 접기' : '가까운 시설 보기'}
          </button>
          <button
            type="button"
            onClick={handleSearchAddress}
            className="px-4 py-2 rounded-lg font-medium border border-[var(--color-border-card)] bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-primary)] hover:text-[var(--color-text-primary)] transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <MagnifyingGlassIcon className="w-4 h-4" />
            주소 직접 입력
          </button>
        </div>
        )}

        {/* 위치 단계: 통합 상단 슬롯(1·2·3) → 하단 리스트(60%) & 지도(40%) */}
        {locationOnlyFacility && (
          <>
            {/* 통합 상단 바: 1·2·3순위 슬롯 — 빈칸은 '시설을 선택하세요', 선택 시 시설명만 */}
            <div className="mb-6 p-4 bg-[var(--color-bg-card)] border border-[var(--color-border-card)] rounded-xl">
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((rank) => {
                  const fac = rank === 1 ? selectedFacility : rank === 2 ? selectedFacility2 : selectedFacility3;
                  const clearRank1 = () => { handleClearFacility(); };
                  const clearRank2 = () => { onFacilityId2Change(null); onSelectedFacility2Change(null); setSelected2Coords(null); };
                  const clearRank3 = () => { onFacilityId3Change(null); onSelectedFacility3Change(null); setSelected3Coords(null); };
                  return (
                    <div
                      key={rank}
                      className={`rounded-xl border-2 p-4 min-h-[56px] flex items-center gap-3 ${fac ? 'bg-green-500/10 border-green-500/30' : 'bg-[var(--color-bg-primary)] border-[var(--color-border-card)] border-dashed'}`}
                    >
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[var(--color-bg-secondary)] border border-[var(--color-border-card)] text-xs font-bold text-[var(--color-text-secondary)] flex items-center justify-center" aria-label={`${rank}순위`}>{rank}</span>
                      {fac ? (
                        <>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-[var(--color-text-primary)] truncate">{fac.name}</div>
                          </div>
                          <button type="button" onClick={rank === 1 ? clearRank1 : rank === 2 ? clearRank2 : clearRank3} className="flex-shrink-0 p-1.5 rounded-lg text-[var(--color-text-secondary)] hover:bg-red-500/20 hover:text-red-500" title="해제"><XMarkIcon className="w-5 h-5" /></button>
                        </>
                      ) : (
                        <span className="text-sm text-[var(--color-text-secondary)] flex-1">시설을 선택하세요</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* 가까운 시설 목록 — locationOnlyFacility면 좌 60% / 우 40% (리스트 | 지도) */}
        {(showFacilitySearch || locationOnlyFacility) && (
          <div className={locationOnlyFacility ? 'grid grid-cols-1 md:grid-cols-5 gap-6 mb-6' : 'mb-2'}>
            <div className={locationOnlyFacility ? 'md:col-span-3 border border-[var(--color-border-card)] rounded-xl bg-[var(--color-bg-card)] overflow-hidden' : 'border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-card)]'}>
              <div className="p-4 border-b border-[var(--color-border-card)] flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-[var(--color-text-primary)]">
                  {locationOnlyFacility
                    ? (category && category !== '전체' ? `${category} 가능한 시설 (가까운 순)` : '시설 목록')
                    : selectingFacilityRank === 1
                      ? (category && category !== '전체' ? `${category} 가능한 시설 (가까운 순)` : '시설 목록')
                      : `${selectingFacilityRank}순위 시설 선택`}
                </span>
                <input
                  type="text"
                  value={facilitySearchQuery}
                  onChange={(e) => setFacilitySearchQuery(e.target.value)}
                  placeholder="시설명·주소로 검색..."
                  className="flex-1 max-w-[220px] px-3 py-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
                />
              </div>
              <div className={locationOnlyFacility ? 'max-h-[320px] overflow-y-auto' : 'max-h-52 overflow-y-auto'}>
                {isSearchingFacilities ? (
                  <div className="p-4 text-center text-sm text-[var(--color-text-secondary)]">검색 중...</div>
                ) : facilities.length > 0 ? (
                  (() => {
                    const excludedIds = new Set<number>();
                    let list: typeof facilities;
                    if (locationOnlyFacility) {
                      if (facilityId != null) excludedIds.add(facilityId);
                      if (facilityId2 != null) excludedIds.add(facilityId2);
                      if (facilityId3 != null) excludedIds.add(facilityId3);
                      list = facilities.filter((f) => !excludedIds.has(f.id));
                    } else {
                      if (selectingFacilityRank === 2) {
                        if (facilityId != null) excludedIds.add(facilityId);
                        if (facilityId3 != null) excludedIds.add(facilityId3);
                      } else if (selectingFacilityRank === 3) {
                        if (facilityId != null) excludedIds.add(facilityId);
                        if (facilityId2 != null) excludedIds.add(facilityId2);
                      }
                      list = excludedIds.size > 0 ? facilities.filter((f) => !excludedIds.has(f.id)) : facilities;
                    }
                    const hasCoords = coordinates[0] != null && coordinates[1] != null;
                    return list.length > 0 ? (
                      <>
                        {!locationOnlyFacility && selectingFacilityRank >= 2 && excludedIds.size > 0 && (
                          <div className="px-3 py-2 text-xs text-[var(--color-text-secondary)] bg-[var(--color-bg-secondary)] border-b border-[var(--color-border-card)]">
                            이미 1·2순위로 선택된 시설은 목록에서 제외됩니다.
                          </div>
                        )}
                        {list.map((facility) => {
                          const thumbUrl = facility.image || (Array.isArray(facility.images) && facility.images.length > 0 ? facility.images[0] : null);
                          const distKm = hasCoords && facility.latitude != null && facility.longitude != null
                            ? distanceKm(coordinates[0], coordinates[1], parseFloat(facility.latitude), parseFloat(facility.longitude))
                            : null;
                          const timeLabel = meetingDate && meetingTime && meetingEndTime
                            ? `${meetingTime.slice(0, 5)} ~ ${meetingEndTime.slice(0, 5)}`
                            : null;
                          return locationOnlyFacility ? (
                            <div
                              key={facility.id}
                              role="button"
                              tabIndex={0}
                              onClick={(e) => {
                                const target = e.target as HTMLElement;
                                if (target.closest('button')) return;
                                handleSelectFacility(facility);
                                setMapPreviewCoords(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  handleSelectFacility(facility);
                                  setMapPreviewCoords(null);
                                }
                              }}
                              className="flex items-center gap-4 p-4 border-b border-[var(--color-border-card)] last:border-b-0 hover:bg-[var(--color-bg-secondary)] cursor-pointer transition-colors"
                            >
                              <div className="flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-[var(--color-bg-secondary)] border border-[var(--color-border-card)]">
                                {thumbUrl ? (
                                  <img src={thumbUrl} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[var(--color-text-secondary)]"><BuildingOfficeIcon className="w-7 h-7" /></div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-medium text-[var(--color-text-primary)]">{facility.name}</div>
                                <div className="text-xs text-[var(--color-text-secondary)] truncate mt-0.5">{facility.address}</div>
                                <div className="flex items-center gap-2 mt-1.5 text-xs text-[var(--color-text-secondary)]">
                                  {distKm != null && <span>{distKm < 1 ? (distKm * 1000).toFixed(0) + 'm' : distKm.toFixed(1) + 'km'}</span>}
                                  {timeLabel && <span>예약 가능: {timeLabel}</span>}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <button
                              key={facility.id}
                              type="button"
                              onClick={() => handleSelectFacility(facility)}
                              className="w-full text-left p-3 hover:bg-[var(--color-bg-secondary)] border-b border-[var(--color-border-card)] last:border-b-0 transition-colors flex gap-3 items-start"
                            >
                              <div className="flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-[var(--color-bg-secondary)] border border-[var(--color-border-card)]">
                                {thumbUrl ? (
                                  <img src={thumbUrl} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[var(--color-text-secondary)]"><BuildingOfficeIcon className="w-7 h-7" /></div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-medium text-[var(--color-text-primary)]">{facility.name}</div>
                                <div className="text-sm text-[var(--color-text-secondary)] mt-0.5 truncate">{facility.address}</div>
                                {facility.type && <div className="text-xs text-[var(--color-text-secondary)] mt-1">{facility.type}</div>}
                              </div>
                            </button>
                          );
                        })}
                      </>
                    ) : (
                      <div className="p-4 text-center text-sm text-[var(--color-text-secondary)]">
                        {locationOnlyFacility
                          ? '이미 1·2·3순위를 모두 선택했거나 해당 일정에 예약 가능한 시설이 없습니다.'
                          : selectingFacilityRank === 2
                            ? '1·3순위에 이미 선택된 시설을 제외하면 선택 가능한 시설이 없습니다.'
                            : '1·2순위에 이미 선택된 시설을 제외하면 선택 가능한 시설이 없습니다.'}
                      </div>
                    );
                  })()
                ) : (
                  <div className="p-4 text-center text-sm text-[var(--color-text-secondary)]">
                    {facilitySearchQuery.trim()
                      ? '검색 결과가 없습니다.'
                      : locationOnlyFacility
                        ? '해당 지역·종목에 등록된 시설이 없습니다. 다른 일정을 선택해 보세요.'
                        : '해당 지역·종목에 등록된 시설이 없습니다. 주소 직접 입력으로 위치를 설정할 수 있습니다.'}
                  </div>
                )}
              </div>
              {!isSearchingFacilities && facilityTotal > FACILITY_PAGE_SIZE && (
                <div className="flex items-center justify-between gap-2 px-3 py-2 border-t border-[var(--color-border-card)] bg-[var(--color-bg-secondary)] rounded-b-lg">
                  <span className="text-xs text-[var(--color-text-secondary)]">
                    {Math.min((facilityPage - 1) * FACILITY_PAGE_SIZE + 1, facilityTotal)}–{Math.min(facilityPage * FACILITY_PAGE_SIZE, facilityTotal)} / 총 {facilityTotal}개
                  </span>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => setFacilityPage((p) => Math.max(1, p - 1))} disabled={facilityPage <= 1} className="px-2 py-1 text-sm font-medium rounded border border-[var(--color-border-card)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] disabled:opacity-40 disabled:cursor-not-allowed hover:enabled:bg-[var(--color-bg-secondary)]">이전</button>
                    <button type="button" onClick={() => setFacilityPage((p) => Math.min(Math.ceil(facilityTotal / FACILITY_PAGE_SIZE), p + 1))} disabled={facilityPage >= Math.ceil(facilityTotal / FACILITY_PAGE_SIZE)} className="px-2 py-1 text-sm font-medium rounded border border-[var(--color-border-card)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] disabled:opacity-40 disabled:cursor-not-allowed hover:enabled:bg-[var(--color-bg-secondary)]">다음</button>
                  </div>
                </div>
              )}
            </div>
            {/* locationOnlyFacility: 우측 40% 지도 (선택한 1·2·3순위 시설 마커) */}
            {locationOnlyFacility && (
              <div className="md:col-span-2 border border-[var(--color-border-card)] rounded-xl overflow-hidden bg-[var(--color-bg-card)]" style={{ minHeight: '280px' }}>
                <p className="text-xs font-medium text-[var(--color-text-secondary)] p-3 border-b border-[var(--color-border-card)]">
                  {mapPreviewCoords ? '클릭한 시설 위치' : '선택한 시설 위치'}
                </p>
                <div className="h-64">
                  <NaverMap
                    key={mapPreviewCoords ? `preview-${mapPreviewCoords.join('-')}` : `location-map-${selected1Coords?.join('-')}-${selected2Coords?.join('-')}-${selected3Coords?.join('-')}`}
                    center={mapPreviewCoords ?? coordinates}
                    zoom={mapPreviewCoords ? 15 : 9}
                    showCenterMarker={false}
                    markers={mapPreviewCoords
                      ? [{ lat: mapPreviewCoords[0], lng: mapPreviewCoords[1], id: 0, name: '' }]
                      : [
                          ...(selected1Coords ? [{ lat: selected1Coords[0], lng: selected1Coords[1], id: 1, name: '1' }] : []),
                          ...(selected2Coords ? [{ lat: selected2Coords[0], lng: selected2Coords[1], id: 2, name: '2' }] : []),
                          ...(selected3Coords ? [{ lat: selected3Coords[0], lng: selected3Coords[1], id: 3, name: '3' }] : []),
                        ]}
                  />
                </div>
              </div>
            )}
          </div>
        )}


        {selectedFacility && !locationOnlyFacility && (
          <div className="mb-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex gap-3 flex-1 min-w-0">
                <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-[var(--color-bg-secondary)] border border-[var(--color-border-card)]">
                  {selectedFacility.image ? (
                    <img src={selectedFacility.image} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--color-text-secondary)]">
                      <BuildingOfficeIcon className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400 mb-1">
                    <span>선택된 시설</span>
                    {locationOnlyFacility && (
                      <span className="text-xs text-[var(--color-text-secondary)]">
                        (매치 생성 시 가예약)
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-[var(--color-text-primary)] font-semibold">
                    {selectedFacility.name}
                  </div>
                  <div className="text-xs text-[var(--color-text-secondary)] mt-1">
                    {selectedFacility.address}
                  </div>
                </div>
              </div>
<button
                    type="button"
                    onClick={handleClearFacility}
                    className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] px-2 py-1"
                  >
                    해제
                  </button>
            </div>
            {/* 가계약 2·3순위 시설 — 눈에 띄는 카드 UI */}
            <div className="mt-4 pt-4 border-t border-green-500/20">
              <p className="text-sm font-medium text-[var(--color-text-primary)] mb-1">
                가계약 2·3순위 시설 (선택)
              </p>
              <p className="text-xs text-[var(--color-text-secondary)] mb-3">
                인원 마감 시 1순위 → 2순위 → 3순위 순으로 빈 자리가 있는 시설이 자동 예약됩니다.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 2순위 */}
                <div className={`rounded-xl border-2 p-3 min-h-[72px] flex flex-col justify-center ${selectedFacility2 ? 'bg-emerald-500/15 border-emerald-500/50' : 'bg-[var(--color-bg-primary)] border-amber-500/40'}`}>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                      2순위
                    </span>
                    {selectedFacility2 ? (
                      <button
                        type="button"
                        onClick={() => { onFacilityId2Change(null); onSelectedFacility2Change(null); }}
                        className="p-1 rounded-lg text-red-500 hover:bg-red-500/10"
                        title="해제"
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    ) : null}
                  </div>
                  {selectedFacility2 ? (
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-[var(--color-bg-secondary)] border border-[var(--color-border-card)]">
                        {selectedFacility2.image ? (
                          <img src={selectedFacility2.image} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[var(--color-text-secondary)]">
                            <BuildingOfficeIcon className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                          {selectedFacility2.name}
                        </div>
                        <div className="text-xs text-[var(--color-text-secondary)] truncate">
                          {selectedFacility2.address}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { setSelectingFacilityRank(2); setShowFacilitySearch(true); setFacilitySearchQuery(''); }}
                      className="flex items-center justify-center gap-2 w-full py-2 rounded-lg border-2 border-dashed border-amber-500/50 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 font-medium text-sm"
                    >
                      <PlusCircleIcon className="w-5 h-5" />
                      2순위 시설 선택하기
                    </button>
                  )}
                </div>
                {/* 3순위 */}
                <div className={`rounded-xl border-2 p-3 min-h-[72px] flex flex-col justify-center ${selectedFacility3 ? 'bg-emerald-500/15 border-emerald-500/50' : 'bg-[var(--color-bg-primary)] border-amber-500/40'}`}>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                      3순위
                    </span>
                    {selectedFacility3 ? (
                      <button
                        type="button"
                        onClick={() => { onFacilityId3Change(null); onSelectedFacility3Change(null); }}
                        className="p-1 rounded-lg text-red-500 hover:bg-red-500/10"
                        title="해제"
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    ) : null}
                  </div>
                  {selectedFacility3 ? (
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-[var(--color-bg-secondary)] border border-[var(--color-border-card)]">
                        {selectedFacility3.image ? (
                          <img src={selectedFacility3.image} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[var(--color-text-secondary)]">
                            <BuildingOfficeIcon className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                          {selectedFacility3.name}
                        </div>
                        <div className="text-xs text-[var(--color-text-secondary)] truncate">
                          {selectedFacility3.address}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { setSelectingFacilityRank(3); setShowFacilitySearch(true); setFacilitySearchQuery(''); }}
                      className="flex items-center justify-center gap-2 w-full py-2 rounded-lg border-2 border-dashed border-amber-500/50 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 font-medium text-sm"
                    >
                      <PlusCircleIcon className="w-5 h-5" />
                      3순위 시설 선택하기
                    </button>
                  )}
                </div>
              </div>
            </div>
            {!locationOnlyFacility && reservationId == null && (
              <div className="border-t border-green-500/20 pt-3">
                {!scheduleReadOnly && (
                  <>
                    <p className="text-xs font-medium text-[var(--color-text-primary)] mb-2">예약할 날짜 선택</p>
                    <input
                      type="date"
                      value={reservationDate}
                      onChange={(e) => setReservationDate(e.target.value)}
                      min={(() => {
                        const d = new Date();
                        const y = d.getFullYear();
                        const m = String(d.getMonth() + 1).padStart(2, '0');
                        const day = String(d.getDate()).padStart(2, '0');
                        return `${y}-${m}-${day}`;
                      })()}
                      className="w-full max-w-[200px] px-3 py-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] text-sm date-input-dark"
                    />
                    {reservationDate && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-[var(--color-text-primary)] mb-2">예약 가능한 시간 (2시간 단위)</p>
                        {loadingSlots ? (
                          <p className="text-xs text-[var(--color-text-secondary)]">로딩 중...</p>
                        ) : availableSlots.length === 0 ? (
                          <p className="text-xs text-[var(--color-text-secondary)]">해당 날짜에 예약 가능한 시간이 없습니다.</p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {availableSlots.map((slot) => (
                              <button
                                key={`${slot.startTime}-${slot.endTime}`}
                                type="button"
                                disabled={reserving}
                                onClick={() => handleReserveSlot(reservationDate, slot.startTime, slot.endTime)}
                                className="px-3 py-2 text-sm rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border-card)] text-[var(--color-text-primary)] hover:bg-[var(--color-blue-primary)] hover:text-white hover:border-[var(--color-blue-primary)] transition-colors disabled:opacity-50"
                              >
                                {slot.startTime} ~ {slot.endTime}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}
        {!locationOnlyFacility && (
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-[var(--color-text-secondary)]">
            내 정보 주소 기준으로 가까운 시설이 나열됩니다. 시설을 클릭하면 위치가 해당 시설 주소로 설정됩니다.
          </p>
          <button
            type="button"
            onClick={onToggleMap}
            className="text-xs text-[var(--color-blue-primary)] hover:underline"
          >
            {showMap ? '지도 숨기기' : '지도 보기'}
          </button>
        </div>
        )}
        
        {showMap && !locationOnlyFacility && (
          <div className="mt-2 border border-[var(--color-border-card)] rounded-lg overflow-hidden" style={{ height: '300px' }}>
            <NaverMap
              key={mapKey}
              center={coordinates}
              zoom={mapZoom}
              onMarkerDragEnd={onMarkerDragEnd}
              showCenterMarker={true}
              markers={undefined}
            />
          </div>
        )}
      </div>
      )}

      {/* 매치 일정 — scheduleReadOnly면 이전 단계에서 선택된 일정 사용(입력란 숨김) */}
      {showSchedule && !scheduleReadOnly && (
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
            <CalendarIcon className="w-4 h-4 inline mr-1" />
            매치 일정 <span className="text-red-500">*</span>
          </label>
          {timeStepHourOnly ? (
            <div className="flex gap-2 flex-wrap items-center">
              <input
                type="date"
                required
                value={meetingDate}
                onChange={(e) => onDateTimeChange(e.target.value || '', meetingTime)}
                min={(() => {
                  const d = new Date();
                  const y = d.getFullYear();
                  const m = String(d.getMonth() + 1).padStart(2, '0');
                  const day = String(d.getDate()).padStart(2, '0');
                  return `${y}-${m}-${day}`;
                })()}
                className="flex-1 min-w-[140px] px-4 py-3 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)] date-input-dark"
              />
              <select
                required
                value={meetingTime ? (parseInt(meetingTime.slice(0, 2), 10) < 12 ? 'am' : 'pm') : ''}
                onChange={(e) => {
                  const period = e.target.value as 'am' | 'pm' | '';
                  if (!period) {
                    onDateTimeChange(meetingDate, '');
                    return;
                  }
                  const h = meetingTime ? parseInt(meetingTime.slice(0, 2), 10) : 0;
                  const hour12Raw = h === 0 ? 12 : h <= 12 ? h : h - 12;
                  const hour24 = period === 'am' ? (hour12Raw === 12 ? 0 : hour12Raw) : (hour12Raw === 12 ? 12 : hour12Raw + 12);
                  onDateTimeChange(meetingDate, `${String(hour24).padStart(2, '0')}:00`);
                }}
                className="w-20 px-3 py-3 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
              >
                <option value="">-</option>
                <option value="am">오전</option>
                <option value="pm">오후</option>
              </select>
              <select
                required
                value={meetingTime ? (() => {
                  const h = parseInt(meetingTime.slice(0, 2), 10);
                  if (h === 0) return 12;
                  if (h <= 12) return h;
                  return h - 12;
                })() : ''}
                onChange={(e) => {
                  const hour12 = e.target.value === '' ? null : parseInt(e.target.value, 10);
                  if (hour12 == null) {
                    onDateTimeChange(meetingDate, '');
                    return;
                  }
                  const period = meetingTime ? (parseInt(meetingTime.slice(0, 2), 10) < 12 ? 'am' : 'pm') : 'am';
                  const hour24 = period === 'am' ? (hour12 === 12 ? 0 : hour12) : (hour12 === 12 ? 12 : hour12 + 12);
                  onDateTimeChange(meetingDate, `${String(hour24).padStart(2, '0')}:00`);
                }}
                className="w-20 px-3 py-3 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
              >
                <option value="">-</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                  <option key={n} value={n}>{n}시</option>
                ))}
              </select>
            </div>
          ) : (
            <input
              type="datetime-local"
              value={meetingDate && meetingTime 
                ? `${meetingDate}T${meetingTime}` 
                : ''}
              onChange={(e) => {
                const value = e.target.value;
                if (value) {
                  const [date, time] = value.split('T');
                  onDateTimeChange(date || '', time || '');
                } else {
                  onDateTimeChange('', '');
                }
              }}
              min={(() => {
                const d = new Date();
                d.setTime(d.getTime() + 2 * 60 * 60 * 1000);
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                const h = String(d.getHours()).padStart(2, '0');
                const min = String(d.getMinutes()).padStart(2, '0');
                return `${y}-${m}-${day}T${h}:${min}`;
              })()}
              className="w-full px-4 py-3 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)] date-input-dark"
            />
          )}
          <p className="text-xs text-[var(--color-text-secondary)] mt-2">
            📅 모임 생성은 최소 2시간 전까지 가능합니다. {timeStepHourOnly ? '날짜와 시간(오전·시)은 필수 선택입니다.' : '날짜·시간을 선택하세요.'}
          </p>
        </div>
      )}
      {(scheduleReadOnly && (showSchedule || showLocation)) && meetingDate && meetingTime && (
        <div className="p-5 rounded-xl border-2 border-[var(--color-blue-primary)]/40 bg-gradient-to-br from-[var(--color-blue-primary)]/5 to-transparent shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[var(--color-blue-primary)]/20 flex items-center justify-center">
              <CalendarIcon className="w-6 h-6 text-[var(--color-blue-primary)]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-[var(--color-blue-primary)] uppercase tracking-wide mb-0.5">
                매치 일정 · 가예약 시간
              </div>
              <div className="text-lg font-bold text-[var(--color-text-primary)]">
                {meetingDate} {meetingTime.slice(0, 5)}
                {meetingEndTime && meetingEndTime.length >= 5 && (
                  <span className="font-normal text-[var(--color-text-primary)]">
                    {' '}~ {meetingEndDate && meetingEndDate !== meetingDate ? `${meetingEndDate} ` : ''}{meetingEndTime.slice(0, 5)}
                  </span>
                )}
              </div>
              <p className="text-sm text-[var(--color-text-secondary)] mt-2">
                매치 생성 시 선택한 시설에 가예약됩니다. 이 항목은 생성 후 수정할 수 없으며, 아래 목록은 이 시간대 예약 가능한 시설만 표시됩니다.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 최소/최대 참여자 수 */}
      {showMinMax && (
      <div className="grid grid-cols-2 gap-4">
        {/* 최소 참여자 수 */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
            <UsersIcon className="w-4 h-4 inline mr-1" />
            최소 참여자 수 <span className="text-xs text-[var(--color-text-secondary)] font-normal">(선택사항)</span>
          </label>
          <input
            type="number"
            min={minParticipantsFloor}
            max="1000"
            value={effectiveMinParticipants}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '') {
                onMinParticipantsChange('');
                return;
              }
              if (!/^\d+$/.test(value)) return;
              const n = parseInt(value, 10);
              if (n < 1 || n > 1000) return;
              if (n < minParticipantsFloor) {
                onMinParticipantsChange(String(minParticipantsFloor));
                return;
              }
              onMinParticipantsChange(value);
            }}
            className="w-full px-4 py-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
            placeholder={defaultMinParticipants != null ? String(defaultMinParticipants) : '최소 인원'}
          />
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            {defaultMinParticipants === 33 ? '3파전 진행은 33명이 필요한 매치입니다.' : '매치 성사에 필요한 최소 인원 수입니다.'}
          </p>
        </div>

        {/* 최대 참여자 수 */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
            <UsersIcon className="w-4 h-4 inline mr-1" />
            최대 참여자 수 <span className="text-xs text-[var(--color-text-secondary)] font-normal">(선택사항)</span>
          </label>
          <input
            type="number"
            min="1"
            max="1000"
            value={maxParticipants}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '' || (/^\d+$/.test(value) && parseInt(value, 10) >= 1 && parseInt(value, 10) <= 1000)) {
                onMaxParticipantsChange(value);
              }
            }}
            className="w-full px-4 py-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
            placeholder="최대 인원"
          />
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            매치에 참가할 수 있는 최대 인원 수입니다.
          </p>
        </div>
      </div>
      )}

      {/* 성별 제한 설정 */}
      {showGender && (
      <div className="border-t border-[var(--color-border-card)] pt-6">
        <div className="flex items-center gap-3 mb-4">
          <UserGroupIcon className="w-5 h-5 text-[var(--color-text-secondary)]" />
          <h3 className="text-base font-bold text-[var(--color-text-primary)]">성별 제한 (선택사항)</h3>
        </div>
        
        <div className="space-y-3">
          <p className="text-sm text-[var(--color-text-secondary)] mb-3">
            특정 성별만 참가 가능하도록 제한할 수 있습니다.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => onGenderRestrictionChange(null)}
              className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                genderRestriction === null
                  ? 'border-[var(--color-blue-primary)] bg-blue-50 dark:bg-blue-900/20 text-[var(--color-blue-primary)] font-medium'
                  : 'border-[var(--color-border-card)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] hover:border-[var(--color-blue-primary)]/50'
              }`}
            >
              제한 없음
            </button>
            <button
              type="button"
              onClick={() => onGenderRestrictionChange('male')}
              className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                genderRestriction === 'male'
                  ? 'border-[var(--color-blue-primary)] bg-blue-50 dark:bg-blue-900/20 text-[var(--color-blue-primary)] font-medium'
                  : 'border-[var(--color-border-card)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] hover:border-[var(--color-blue-primary)]/50'
              }`}
            >
              남자만
            </button>
            <button
              type="button"
              onClick={() => onGenderRestrictionChange('female')}
              className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                genderRestriction === 'female'
                  ? 'border-[var(--color-blue-primary)] bg-blue-50 dark:bg-blue-900/20 text-[var(--color-blue-primary)] font-medium'
                  : 'border-[var(--color-border-card)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] hover:border-[var(--color-blue-primary)]/50'
              }`}
            >
              여자만
            </button>
          </div>
        </div>
      </div>
      )}

      {/* 참가비 안내 (축구는 참가 시 10,000P 고정, 설정 불필요) */}
      {showFee && category === '축구' && (
      <div className="border-t border-[var(--color-border-card)] pt-6">
        <div className="flex items-center gap-3 mb-4">
          <CurrencyDollarIcon className="w-5 h-5 text-[var(--color-text-secondary)]" />
          <h3 className="text-base font-bold text-[var(--color-text-primary)]">참가비 (포인트)</h3>
        </div>
        <div className="p-4 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-card)]">
          <p className="text-sm text-[var(--color-text-primary)]">
            참가 시 <strong>10,000P</strong>가 필요합니다.
          </p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            매치 당일이 아닌 전일 이전 참가 시 8,000P (2,000P 할인)
          </p>
        </div>
      </div>
      )}
    </div>
  );
};

export default Step3CommonSettings;
