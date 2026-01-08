import React, { useState, useEffect } from 'react';
import { MapPinIcon, CalendarIcon, UsersIcon, MagnifyingGlassIcon, TagIcon, BuildingOfficeIcon, CurrencyDollarIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import NaverMap from '../NaverMap';
import { api } from '../../utils/api';
import { getMinParticipantsForSport } from '../../constants/sports';

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
  showMap: boolean;
  onToggleMap: () => void;
  mapKey: number;
  mapZoom: number;
  onMarkerDragEnd: (lat: number, lng: number) => void;
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
  showMap,
  onToggleMap,
  mapKey,
  mapZoom,
  onMarkerDragEnd,
}) => {
  const [showFacilitySearch, setShowFacilitySearch] = useState(false);
  const [facilitySearchQuery, setFacilitySearchQuery] = useState('');
  const [facilities, setFacilities] = useState<any[]>([]);
  const [isSearchingFacilities, setIsSearchingFacilities] = useState(false);
  const prevCategoryRef = React.useRef<string>('');

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

  // 운동 카테고리별 시설 타입 매핑
  const getFacilityTypeByCategory = (sportCategory: string): string | null => {
    const mapping: { [key: string]: string } = {
      '축구': '풋살장',
      '풋살': '풋살장',
      '농구': '체육관',
      '배드민턴': '체육센터',
      '테니스': '테니스장',
      '수영': '수영장',
      '골프': '골프연습장',
      '탁구': '체육센터',
      '배구': '체육관',
      '볼링': '체육센터',
      '당구': '체육센터',
    };
    return mapping[sportCategory] || null;
  };

  // 시설 검색 (카테고리별 가까운 거리순 추천)
  useEffect(() => {
    const loadRecommendedFacilities = async () => {
      if (!showFacilitySearch) {
        setFacilities([]);
        return;
      }

      setIsSearchingFacilities(true);
      try {
        const queryParams = new URLSearchParams();
        
        // 카테고리별 시설 타입 필터
        const facilityType = getFacilityTypeByCategory(category);
        if (facilityType) {
          queryParams.append('type', facilityType);
        }
        
        // 검색어가 있으면 추가
        if (facilitySearchQuery.trim()) {
          queryParams.append('search', facilitySearchQuery);
        }
        
        // 현재 위치 기반 거리순 정렬
        if (coordinates[0] && coordinates[1]) {
          queryParams.append('latitude', coordinates[0].toString());
          queryParams.append('longitude', coordinates[1].toString());
        }
        
        queryParams.append('limit', '10');

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

    // 검색어가 있으면 디바운스 적용, 없으면 즉시 로드
    if (facilitySearchQuery.trim()) {
      const debounceTimer = setTimeout(() => {
        loadRecommendedFacilities();
      }, 300);
      return () => clearTimeout(debounceTimer);
    } else {
      loadRecommendedFacilities();
    }
  }, [showFacilitySearch, facilitySearchQuery, category, coordinates]);

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
      setShowFacilitySearch(false);
      setFacilitySearchQuery('');
    }
  };

  // 시설 선택 해제
  const handleClearFacility = () => {
    onFacilityIdChange(null);
    onSelectedFacilityChange(null);
  };
  // 주소 찾기 버튼 클릭 (다음 주소 검색 API)
  const handleSearchAddress = () => {
    if (typeof window !== 'undefined' && (window as any).daum) {
      new (window as any).daum.Postcode({
        oncomplete: (data: any) => {
          let fullAddress = data.address;
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

          handleAddressToCoordinates(fullAddress);
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

  // 주소를 좌표로 변환
  const handleAddressToCoordinates = async (address: string) => {
    if (!address || address.trim().length === 0) return;
    
    try {
      const NAVER_CLIENT_ID = import.meta.env.VITE_NAVER_MAP_CLIENT_ID;
      const NAVER_CLIENT_SECRET = import.meta.env.VITE_NAVER_MAP_CLIENT_SECRET;
      
      if (NAVER_CLIENT_ID && NAVER_CLIENT_SECRET) {
        const response = await fetch(
          `https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(address)}`,
          {
            headers: {
              'X-NCP-APIGW-API-KEY-ID': NAVER_CLIENT_ID,
              'X-NCP-APIGW-API-KEY': NAVER_CLIENT_SECRET,
            },
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.status === 'OK' && data.addresses && data.addresses.length > 0) {
            const { y, x } = data.addresses[0];
            const newCoordinates: [number, number] = [parseFloat(y), parseFloat(x)];
            onLocationChange(address, newCoordinates);
          }
        }
      }
    } catch (error) {
      console.error('주소 변환 실패:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* 안내 문구 */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
          매치 기본 정보
        </h3>
        <p className="text-sm text-[var(--color-text-secondary)]">
          매치 이름, 위치, 일정, 인원 수를 설정하세요.
        </p>
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

      {/* 위치 */}
      <div>
        <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
          <MapPinIcon className="w-4 h-4 inline mr-1" />
          위치 <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            required
            readOnly
            value={location}
            className="flex-1 px-4 py-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] cursor-not-allowed"
            placeholder="주소 찾기 버튼을 클릭하거나 지도에서 위치를 선택하세요"
          />
          <button
            type="button"
            onClick={handleSearchAddress}
            className="px-4 py-2 bg-[var(--color-blue-primary)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center gap-2 whitespace-nowrap"
          >
            <MagnifyingGlassIcon className="w-4 h-4" />
            주소 찾기
          </button>
          <button
            type="button"
            onClick={() => {
              setShowFacilitySearch(!showFacilitySearch);
              if (!showFacilitySearch) {
                setFacilitySearchQuery('');
                setFacilities([]);
              }
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-opacity flex items-center gap-2 whitespace-nowrap ${
              facilityId
                ? 'bg-green-500 text-white hover:opacity-90'
                : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] border border-[var(--color-border-card)] hover:bg-[var(--color-bg-primary)]'
            }`}
          >
            <BuildingOfficeIcon className="w-4 h-4" />
            시설 검색
          </button>
        </div>
        
        {/* 시설 검색 결과 */}
        {showFacilitySearch && (
          <div className="mb-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-card)]">
            <div className="p-3 border-b border-[var(--color-border-card)]">
              <input
                type="text"
                value={facilitySearchQuery}
                onChange={(e) => setFacilitySearchQuery(e.target.value)}
                placeholder="시설명 또는 주소로 검색..."
                className="w-full px-3 py-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
              />
            </div>
            <div className="max-h-48 overflow-y-auto">
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
              ) : facilitySearchQuery.trim() ? (
                <div className="p-4 text-center text-sm text-[var(--color-text-secondary)]">
                  검색 결과가 없습니다.
                </div>
              ) : (
                <div className="p-4 text-center text-sm text-[var(--color-text-secondary)]">
                  시설명 또는 주소를 입력해주세요.
                </div>
              )}
            </div>
          </div>
        )}
        
        {selectedFacility && (
          <div className="mb-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400 mb-1">
                  <BuildingOfficeIcon className="w-4 h-4" />
                  <span>선택된 시설</span>
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
          </div>
        )}
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-[var(--color-text-secondary)]">
            주소 찾기 버튼을 클릭하거나 지도에서 마커를 드래그하여 위치를 선택하세요.
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

      {/* 매치 일정 */}
      <div>
        <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
          <CalendarIcon className="w-4 h-4 inline mr-1" />
          매치 일정 <span className="text-xs text-[var(--color-text-secondary)] font-normal">(선택사항)</span>
        </label>
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
          min={new Date().toISOString().slice(0, 16)}
          className="w-full px-4 py-3 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)] date-input-dark"
        />
        <p className="text-xs text-[var(--color-text-secondary)] mt-2">
          📅 날짜와 시간을 한 번에 선택할 수 있습니다. 매치 일정이 없으면 비워두세요.
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
            value={minParticipants}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '' || (/^\d+$/.test(value) && parseInt(value, 10) >= 1 && parseInt(value, 10) <= 1000)) {
                onMinParticipantsChange(value);
              }
            }}
            className="w-full px-4 py-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
            placeholder="최소 인원"
          />
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            매치 성사에 필요한 최소 인원 수입니다.
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
