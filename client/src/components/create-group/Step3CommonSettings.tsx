import React, { useState, useEffect } from 'react';
import { MapPinIcon, CalendarIcon, UsersIcon, MagnifyingGlassIcon, TagIcon, BuildingOfficeIcon, CurrencyDollarIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import NaverMap from '../NaverMap';
import { api } from '../../utils/api';
import { getMinParticipantsForSport } from '../../constants/sports';
import { extractCityFromAddress, getUserCity, getRegionDisplayName } from '../../utils/locationUtils';

interface Step3CommonSettingsProps {
  category: string;
  name: string;
  onNameChange: (name: string) => void;
  location: string;
  coordinates: [number, number];
  onLocationChange: (location: string, coordinates: [number, number]) => void;
  meetingDate: string;
  meetingTime: string;
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
  selectedFacility: { id: number; name: string; address: string } | null;
  onSelectedFacilityChange: (facility: { id: number; name: string; address: string } | null) => void;
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
}) => {
  const [showFacilitySearch, setShowFacilitySearch] = useState(false);
  const [facilitySearchQuery, setFacilitySearchQuery] = useState('');
  const [facilities, setFacilities] = useState<any[]>([]);
  const [isSearchingFacilities, setIsSearchingFacilities] = useState(false);
  const [reservationDate, setReservationDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState<{ startTime: string; endTime: string }[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [reserving, setReserving] = useState(false);
  const prevCategoryRef = React.useRef<string>('');

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
          : getUserCity();
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
        
        queryParams.append('limit', '20');

        const response = await api.get<{ facilities: any[]; total: number }>(
          `/api/facilities?${queryParams.toString()}`
        );
        setFacilities(response.facilities || []);
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
  }, [showFacilitySearch, facilitySearchQuery, category, location, coordinates]);

  // 시설 선택 핸들러
  const handleSelectFacility = (facility: any) => {
    if (facility.latitude && facility.longitude) {
      onLocationChange(facility.address, [parseFloat(facility.latitude), parseFloat(facility.longitude)]);
      onFacilityIdChange(facility.id);
      onSelectedFacilityChange({
        id: facility.id,
        name: facility.name,
        address: facility.address,
      });
      setFacilitySearchQuery('');
      setReservationDate('');
      setAvailableSlots([]);
      onReservationIdChange?.(null);
    }
  };

  // 시설 선택 해제
  const handleClearFacility = () => {
    onFacilityIdChange(null);
    onSelectedFacilityChange(null);
    onReservationIdChange?.(null);
    setReservationDate('');
    setAvailableSlots([]);
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

  return (
    <div className="space-y-6">
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

      {/* 매치 이름 */}
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

      {/* 위치: 내 정보 주소 기준 → 가까운 시설 목록에서 선택 (또는 주소 직접 입력) */}
      <div>
        <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
          <MapPinIcon className="w-4 h-4 inline mr-1" />
          위치 <span className="text-red-500">*</span>
        </label>
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
        
        {/* 가까운 시설 목록 (거리순, 해당 종목) — 클릭 시 위치가 해당 시설 주소로 설정 */}
        {showFacilitySearch && (
          <div className="mb-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-card)]">
            <div className="p-3 border-b border-[var(--color-border-card)] flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-[var(--color-text-primary)]">
                {category && category !== '전체' ? `${category} 가능한 시설 (가까운 순)` : '시설 목록'}
              </span>
              <input
                type="text"
                value={facilitySearchQuery}
                onChange={(e) => setFacilitySearchQuery(e.target.value)}
                placeholder="시설명·주소로 검색..."
                className="flex-1 max-w-[220px] px-3 py-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
              />
            </div>
            <div className="max-h-52 overflow-y-auto">
              {isSearchingFacilities ? (
                <div className="p-4 text-center text-sm text-[var(--color-text-secondary)]">
                  검색 중...
                </div>
              ) : facilities.length > 0 ? (
                facilities.map((facility) => (
                  <button
                    key={facility.id}
                    type="button"
                    onClick={() => handleSelectFacility(facility)}
                    className="w-full text-left p-3 hover:bg-[var(--color-bg-secondary)] border-b border-[var(--color-border-card)] last:border-b-0 transition-colors"
                  >
                    <div className="font-medium text-[var(--color-text-primary)]">{facility.name}</div>
                    <div className="text-sm text-[var(--color-text-secondary)] mt-1">{facility.address}</div>
                    {facility.type && (
                      <div className="text-xs text-[var(--color-text-secondary)] mt-1">
                        {facility.type}
                      </div>
                    )}
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-sm text-[var(--color-text-secondary)]">
                  {facilitySearchQuery.trim()
                    ? '검색 결과가 없습니다.'
                    : '해당 지역·종목에 등록된 시설이 없습니다. 주소 직접 입력으로 위치를 설정할 수 있습니다.'}
                </div>
              )}
            </div>
          </div>
        )}
        
        {selectedFacility && (
          <div className="mb-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400 mb-1">
                  <BuildingOfficeIcon className="w-4 h-4" />
                  <span>선택된 시설</span>
                  {reservationId != null && (
                    <span className="text-xs bg-green-500/20 text-green-600 dark:text-green-400 px-2 py-0.5 rounded">
                      예약 완료
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
              <button
                type="button"
                onClick={handleClearFacility}
                className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] px-2 py-1"
              >
                해제
              </button>
            </div>
            {reservationId == null && (
              <div className="border-t border-green-500/20 pt-3">
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
              </div>
            )}
          </div>
        )}
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
        
        {showMap && (
          <div className="mt-2 border border-[var(--color-border-card)] rounded-lg overflow-hidden" style={{ height: '300px' }}>
            <NaverMap
              key={mapKey}
              center={coordinates}
              zoom={mapZoom}
              onMarkerDragEnd={onMarkerDragEnd}
            />
          </div>
        )}
      </div>

      {/* 매치 일정 — timeStepHourOnly면 날짜+시간(시 단위) 별도 선택 */}
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

      {/* 최소/최대 참여자 수 */}
      <div className="grid grid-cols-2 gap-4">
        {/* 최소 참여자 수 */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
            <UsersIcon className="w-4 h-4 inline mr-1" />
            최소 참여자 수 <span className="text-xs text-[var(--color-text-secondary)] font-normal">(선택사항)</span>
          </label>
          <input
            type="number"
            min="1"
            max="1000"
            value={effectiveMinParticipants}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '' || (/^\d+$/.test(value) && parseInt(value, 10) >= 1 && parseInt(value, 10) <= 1000)) {
                onMinParticipantsChange(value);
              }
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

      {/* 성별 제한 설정 */}
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

      {/* 참가비 설정 */}
      <div className="border-t border-[var(--color-border-card)] pt-6">
        <div className="flex items-center gap-3 mb-4">
          <CurrencyDollarIcon className="w-5 h-5 text-[var(--color-text-secondary)]" />
          <h3 className="text-base font-bold text-[var(--color-text-primary)]">참가비 설정</h3>
        </div>
        
        <div className="space-y-4">
          <label className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border-card)] cursor-pointer hover:bg-[var(--color-bg-secondary)] transition-colors">
            <input
              type="checkbox"
              checked={hasFee}
              onChange={(e) => {
                onHasFeeChange(e.target.checked);
                if (!e.target.checked) {
                  onFeeAmountChange('');
                }
              }}
              className="w-4 h-4 text-[var(--color-blue-primary)] rounded focus:ring-[var(--color-blue-primary)]"
            />
            <span className="text-sm text-[var(--color-text-primary)]">참가비가 있습니다</span>
          </label>

          {hasFee && (
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                참가비 금액 (원)
              </label>
              <input
                type="text"
                value={feeAmount}
                onChange={(e) => {
                  // 숫자만 추출 (콤마 제거)
                  const numericValue = e.target.value.replace(/,/g, '');
                  if (numericValue === '' || /^\d+$/.test(numericValue)) {
                    // 천단위 콤마 추가
                    const formattedValue = numericValue === '' ? '' : parseInt(numericValue, 10).toLocaleString();
                    onFeeAmountChange(numericValue); // 실제 값은 숫자만 저장
                  }
                }}
                onBlur={(e) => {
                  // 포커스 해제 시 포맷팅된 값 표시
                  if (feeAmount && feeAmount !== '') {
                    const numericValue = feeAmount.replace(/,/g, '');
                    const formattedValue = parseInt(numericValue, 10).toLocaleString();
                    // 표시용으로만 포맷팅 (실제 저장값은 숫자)
                  }
                }}
                className="w-full px-4 py-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
                placeholder="참가비 금액을 입력하세요"
              />
              {feeAmount && feeAmount !== '' && (
                <div className="text-xs text-[var(--color-text-secondary)] mt-1">
                  입력 금액: {parseInt(feeAmount.replace(/,/g, ''), 10).toLocaleString()}원
                </div>
              )}
              <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                참가비가 있으면 금액을 입력해주세요. (향후 결제 시스템 연동 예정)
              </p>
            </div>
          )}

          {hasFee && feeAmount && parseInt(feeAmount, 10) > 0 && (
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="text-sm text-[var(--color-text-primary)] mb-2">
                <strong>결제 정보</strong>
              </div>
              <div className="text-sm text-[var(--color-text-secondary)] mb-3">
                참가비: {parseInt(feeAmount, 10).toLocaleString()}원
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-medium text-[var(--color-text-primary)]">
                  결제 수단 (향후 확장)
                </label>
                <select
                  disabled
                  className="w-full px-3 py-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] cursor-not-allowed"
                >
                  <option>결제 시스템 연동 예정</option>
                </select>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                  💳 결제 시스템은 향후 구현 예정입니다.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Step3CommonSettings;
