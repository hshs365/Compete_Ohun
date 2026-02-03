import React, { useState, useRef, useEffect } from 'react';
import { XMarkIcon, MapPinIcon, BuildingOfficeIcon, PhoneIcon, ClockIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { api } from '../utils/api';
import NaverMap from './NaverMap';
import Tooltip from './Tooltip';
import { showError, showSuccess, showWarning } from '../utils/swal';

export interface FacilityForEdit {
  id: number;
  name: string;
  type: string;
  address: string;
  phone?: string | null;
  operatingHours?: string | null;
  price?: string | null;
  description?: string | null;
  amenities?: string[];
  availableSports?: string[];
  latitude?: number | null;
  longitude?: number | null;
  reservationSlotHours?: number;
}

interface CreateFacilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  facility?: FacilityForEdit;
}

const facilityTypes = ['체육센터', '체육관', '축구장', '풋살장', '테니스장', '수영장', '골프연습장', '기타'];

const AVAILABLE_SPORTS = ['축구', '풋살', '농구', '배드민턴', '테니스', '수영', '골프', '탁구', '배구', '볼링', '당구', '요가', '필라테스', '클라이밍', '러닝', '등산', '야구', '기타'];

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => ({
  value: String(i).padStart(2, '0'),
  label: i === 0 ? '오전 12' : i < 12 ? `오전 ${i}` : i === 12 ? '오후 12' : `오후 ${i - 12}`,
}));
const MINUTE_OPTIONS_30 = [
  { value: '00', label: '00' },
  { value: '30', label: '30' },
];

const parseOperatingHours = (hours: string | null | undefined): { start: string; end: string } => {
  if (!hours || typeof hours !== 'string') return { start: '09:00', end: '21:00' };
  const parts = hours.split(/\s*-\s*/).map((s) => s.trim());
  if (parts.length >= 2) return { start: parts[0], end: parts[1] };
  return { start: '09:00', end: '21:00' };
};

const parsePrice = (price: string | null | undefined): { priceType: 'hourly' | 'daily' | 'monthly' | 'package'; price: string } => {
  if (!price || typeof price !== 'string') return { priceType: 'hourly', price: '' };
  const hourly = /시간당|시간\s*당/i.test(price);
  const daily = /일일|일\s*일/i.test(price);
  const monthly = /월간|월\s*간/i.test(price);
  const pkg = /패키지/i.test(price);
  const priceType = hourly ? 'hourly' : daily ? 'daily' : monthly ? 'monthly' : pkg ? 'package' : 'hourly';
  const numMatch = price.replace(/,/g, '').match(/(\d+)/);
  const priceStr = numMatch ? Number(numMatch[1]).toLocaleString() : '';
  return { priceType, price: priceStr };
};

const CreateFacilityModal: React.FC<CreateFacilityModalProps> = ({ isOpen, onClose, onSuccess, facility: initialFacility }) => {
  // 사용자 위치 가져오기 (localStorage 또는 기본값)
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

  const [formData, setFormData] = useState({
    name: '',
    type: '체육센터',
    address: '',
    coordinates: getUserLocation(),
    phone: '',
    operatingHoursStart: '09:00',
    operatingHoursEnd: '21:00',
    reservationSlotHours: 2,
    priceType: 'hourly' as 'hourly' | 'daily' | 'monthly' | 'package',
    price: '',
    description: '',
    amenities: [] as string[],
    availableSports: [] as string[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [mapKey, setMapKey] = useState(0);
  const [mapZoom, setMapZoom] = useState(15);
  const modalMouseDownRef = useRef<{ x: number; y: number } | null>(null);

  // 수정 모드: initialFacility가 있으면 폼 초기화
  useEffect(() => {
    if (!isOpen) return;
    if (initialFacility) {
      const { start, end } = parseOperatingHours(initialFacility.operatingHours);
      const { priceType, price } = parsePrice(initialFacility.price);
      const coords: [number, number] = initialFacility.latitude != null && initialFacility.longitude != null
        ? [Number(initialFacility.latitude), Number(initialFacility.longitude)]
        : getUserLocation();
      setFormData({
        name: initialFacility.name ?? '',
        type: initialFacility.type ?? '체육센터',
        address: initialFacility.address ?? '',
        coordinates: coords,
        phone: initialFacility.phone ?? '',
        operatingHoursStart: start,
        operatingHoursEnd: end,
        reservationSlotHours: initialFacility.reservationSlotHours ?? 2,
        priceType,
        price,
        description: initialFacility.description ?? '',
        amenities: initialFacility.amenities ?? [],
        availableSports: initialFacility.availableSports ?? [],
      });
    } else {
      setFormData({
        name: '',
        type: '체육센터',
        address: '',
        coordinates: getUserLocation(),
        phone: '',
        operatingHoursStart: '09:00',
        operatingHoursEnd: '21:00',
        reservationSlotHours: 2,
        priceType: 'hourly',
        price: '',
        description: '',
        amenities: [],
        availableSports: [],
      });
    }
  }, [isOpen, initialFacility]);

  const commonAmenities = ['주차', '샤워실', '락커룸', '매점', '카페', '프로샵', '관람석', '간이탈의실', '수영용품 판매'];

  const handleChange = (field: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAmenityToggle = (amenity: string) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const handleAvailableSportToggle = (sport: string) => {
    setFormData((prev) => ({
      ...prev,
      availableSports: prev.availableSports.includes(sport)
        ? prev.availableSports.filter((s) => s !== sport)
        : [...prev.availableSports, sport],
    }));
  };

  // 주소 찾기 버튼 클릭 (다음 주소 검색 API)
  const handleSearchAddress = () => {
    if (typeof window !== 'undefined' && (window as any).daum) {
      new (window as any).daum.Postcode({
        oncomplete: (data: any) => {
          let fullAddress = data.address; // 최종 주소
          let extraAddress = ''; // 참고항목

          if (data.addressType === 'R') {
            if (data.bname !== '') {
              extraAddress += data.bname;
            }
            if (data.buildingName !== '') {
              extraAddress += extraAddress !== '' ? `, ${data.buildingName}` : data.buildingName;
            }
            fullAddress += extraAddress !== '' ? ` (${extraAddress})` : '';
          }

          // 주소로 좌표 검색 (카카오맵 API 또는 역지오코딩)
          handleAddressToCoordinates(fullAddress);
        },
        width: '100%',
        height: '100%',
      }).open();
    } else {
      // 다음 주소 검색 API 스크립트 로드
      const script = document.createElement('script');
      script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
      script.onload = () => {
        handleSearchAddress();
      };
      document.head.appendChild(script);
    }
  };

  // 주소를 좌표로 변환 (지오코딩)
  const handleAddressToCoordinates = async (address: string) => {
    if (!address || address.trim().length === 0) return;
    
    try {
      const NAVER_CLIENT_ID = import.meta.env.VITE_NAVER_MAP_CLIENT_ID;
      const NAVER_CLIENT_SECRET = import.meta.env.VITE_NAVER_MAP_CLIENT_SECRET;
      
      // 디버깅: API 키 확인
      console.log('네이버 지도 API 키 확인:', NAVER_CLIENT_ID ? '설정됨 ✅' : '없음 ❌');
      
      // 네이버 지도 Geocoding API 사용
      if (NAVER_CLIENT_ID && NAVER_CLIENT_SECRET) {
        try {
          console.log('네이버 지도 Geocoding API 호출 중:', address);
          const response = await fetch(
            `https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(address)}`,
            {
              headers: {
                'X-NCP-APIGW-API-KEY-ID': NAVER_CLIENT_ID,
                'X-NCP-APIGW-API-KEY': NAVER_CLIENT_SECRET,
              },
            }
          );
          
          console.log('네이버 지도 API 응답 상태:', response.status);
          
          if (response.ok) {
            const data = await response.json();
            console.log('네이버 지도 API 응답 데이터:', data);
            if (data.status === 'OK' && data.addresses && data.addresses.length > 0) {
              const { y, x } = data.addresses[0];
              const newCoordinates: [number, number] = [parseFloat(y), parseFloat(x)];
              
              console.log('변환된 좌표:', newCoordinates);
              
              setFormData((prev) => ({
                ...prev,
                coordinates: newCoordinates,
                address: address, // 주소도 함께 업데이트
              }));
              // 지도 확대 레벨 설정 (주소 선택 시 확대)
              setMapZoom(3);
              // 지도 표시
              setShowMap(true);
              // 지도 확대를 위해 key 변경 (NaverMap 컴포넌트 리렌더링)
              setMapKey((prev) => prev + 1);
              return;
            } else {
              console.warn('네이버 지도 API: 검색 결과 없음');
              await showError('주소를 좌표로 변환할 수 없습니다. 주소를 확인해주세요.', '주소 변환 실패');
            }
          } else {
            const errorData = await response.json().catch(() => ({}));
            console.error('네이버 지도 API 오류:', response.status, errorData);
            await showError('주소를 좌표로 변환할 수 없습니다. 주소를 확인해주세요.', '주소 변환 실패');
          }
        } catch (error) {
          console.error('네이버 지도 API 호출 실패:', error);
          await showError('주소 검색에 실패했습니다. 네이버 지도 API 키를 확인해주세요.', '주소 검색 실패');
        }
      } else {
        await showWarning('네이버 지도 API 키가 설정되지 않았습니다. 주소 검색 기능을 사용할 수 없습니다.', 'API 키 없음');
      }
    } catch (error) {
      console.error('주소 변환 실패:', error);
    }
  };

  // 마커 위치 변경 핸들러 (네이버 지도)
  const handleMarkerDragEnd = async (lat: number, lng: number) => {
    const newCoordinates: [number, number] = [lat, lng];
    
    setFormData((prev) => ({
      ...prev,
      coordinates: newCoordinates,
    }));
    
    // 마커 드래그 시에도 확대 레벨 조정
    setMapZoom(3);

    // 좌표를 주소로 변환 (역지오코딩)
    try {
      const NAVER_CLIENT_ID = import.meta.env.VITE_NAVER_MAP_CLIENT_ID;
      const NAVER_CLIENT_SECRET = import.meta.env.VITE_NAVER_MAP_CLIENT_SECRET;
      
      // 네이버 지도 Reverse Geocoding API 사용
      if (NAVER_CLIENT_ID && NAVER_CLIENT_SECRET) {
        try {
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
              // 도로명 주소 우선, 없으면 지번 주소 사용
              const roadAddress = result.land?.name;
              const region = result.region;
              
              let fullAddress = '';
              
              if (roadAddress && region) {
                // 도로명 주소 구성
                const area1 = region.area1?.name || '';
                const area2 = region.area2?.name || '';
                const area3 = region.area3?.name || '';
                fullAddress = `${area1} ${area2} ${area3} ${roadAddress}`.trim();
              } else if (region) {
                // 지번 주소 사용
                const area1 = region.area1?.name || '';
                const area2 = region.area2?.name || '';
                const area3 = region.area3?.name || '';
                const area4 = region.area4?.name || '';
                fullAddress = `${area1} ${area2} ${area3} ${area4}`.trim();
              }
              
              if (fullAddress) {
                setFormData((prev) => ({
                  ...prev,
                  address: fullAddress,
                }));
                console.log('✅ 마커 위치 주소 업데이트:', fullAddress);
                return;
              }
            }
          }
        } catch (error) {
          console.error('네이버 지도 API 호출 실패:', error);
        }
      } else {
        console.warn('네이버 지도 API 키가 설정되지 않아 주소 변환을 수행할 수 없습니다.');
      }
    } catch (error) {
      console.error('주소 변환 실패:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.address) {
      await showWarning('시설명과 주소는 필수 입력 항목입니다.', '입력 오류');
      return;
    }

    setIsSubmitting(true);
    try {
      // 운영 시간 포맷팅
      const operatingHours = formData.operatingHoursStart && formData.operatingHoursEnd
        ? `${formData.operatingHoursStart} - ${formData.operatingHoursEnd}`
        : undefined;

      // 가격에서 콤마 제거 (숫자만 추출)
      const priceValue = formData.price ? formData.price.replace(/,/g, '') : undefined;
      
      // 가격 타입과 가격을 합쳐서 문자열로 저장 (예: "시간당 10,000원" 또는 "일일 50,000원")
      const priceString = priceValue 
        ? `${formData.priceType === 'hourly' ? '시간당' : formData.priceType === 'daily' ? '일일' : formData.priceType === 'monthly' ? '월간' : '패키지'} ${formData.price}원`
        : undefined;

      const payload = {
        name: formData.name,
        type: formData.type,
        address: formData.address,
        latitude: formData.coordinates[0],
        longitude: formData.coordinates[1],
        phone: formData.phone || undefined,
        operatingHours,
        price: priceString,
        description: formData.description || undefined,
        amenities: formData.amenities,
        availableSports: formData.availableSports,
        reservationSlotHours: formData.reservationSlotHours,
      };

      if (initialFacility?.id) {
        await api.patch(`/api/facilities/${initialFacility.id}`, payload);
        if (onSuccess) onSuccess();
        onClose();
        await showSuccess('시설이 수정되었습니다.', '시설 수정');
      } else {
        await api.post('/api/facilities', payload);
        setFormData({
          name: '',
          type: '체육센터',
          address: '',
          coordinates: getUserLocation(),
          phone: '',
          operatingHoursStart: '09:00',
          operatingHoursEnd: '21:00',
          reservationSlotHours: 2,
          priceType: 'hourly',
          price: '',
          description: '',
          amenities: [],
          availableSports: [],
        });
        setShowMap(false);
        if (onSuccess) onSuccess();
        onClose();
        await showSuccess('시설이 등록되었습니다.', '시설 등록');
      }
    } catch (error) {
      console.error(initialFacility?.id ? '시설 수정 실패' : '시설 등록 실패', error);
      await showError(
        error instanceof Error ? error.message : initialFacility?.id ? '시설 수정에 실패했습니다.' : '시설 등록에 실패했습니다.',
        initialFacility?.id ? '시설 수정 실패' : '시설 등록 실패',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
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
            onClose();
          }
          modalMouseDownRef.current = null;
        }
      }}
    >
      <div
        className="bg-[var(--color-bg-card)] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[var(--color-border-card)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-[var(--color-bg-card)] border-b border-[var(--color-border-card)] p-4 md:p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-[var(--color-text-primary)]">
              {initialFacility?.id ? '시설 수정' : '시설 등록'}
            </h2>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">
              {initialFacility?.id
                ? '시설 정보를 수정한 뒤 저장해주세요.'
                : '시설 정보를 입력하여 등록해주세요. 등록된 시설은 사용자들이 예약할 수 있습니다.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--color-bg-secondary)] rounded-lg transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-[var(--color-text-primary)]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-6">
          {/* 시설명 */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
              시설명 <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full px-4 py-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
              placeholder="시설명을 입력해주세요"
            />
          </div>

          {/* 시설 종류 */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
              <BuildingOfficeIcon className="w-4 h-4 inline mr-1" />
              시설 종류 <span className="text-red-500">*</span>
            </label>
            <select
              id="type"
              required
              value={formData.type}
              onChange={(e) => handleChange('type', e.target.value)}
              className="w-full px-4 py-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
            >
              {facilityTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* 위치 */}
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
              <MapPinIcon className="w-4 h-4 inline mr-1" />
              위치 <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2 mb-2">
              <input
                id="address"
                type="text"
                required
                readOnly
                value={formData.address}
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
            </div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-[var(--color-text-secondary)]">
                주소 찾기 버튼을 클릭하거나 지도에서 마커를 드래그하여 위치를 선택하세요.
              </p>
              <button
                type="button"
                onClick={() => setShowMap(!showMap)}
                className="text-xs text-[var(--color-blue-primary)] hover:underline"
              >
                {showMap ? '지도 숨기기' : '지도 보기'}
              </button>
            </div>
            {showMap && (
              <div 
                className="mt-2 border border-[var(--color-border-card)] rounded-lg overflow-hidden" 
                style={{ height: '300px' }}
              >
                <NaverMap
                  key={mapKey}
                  center={formData.coordinates}
                  zoom={mapZoom}
                  onMarkerDragEnd={handleMarkerDragEnd}
                />
              </div>
            )}
          </div>

          {/* 전화번호 */}
          <div>
            <label htmlFor="phone" className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-primary)] mb-2">
              <PhoneIcon className="w-4 h-4" />
              전화번호 <span className="text-xs text-[var(--color-text-secondary)] font-normal">(선택사항)</span>
              <Tooltip content="전화번호는 자동으로 하이픈(-)이 추가됩니다. 숫자만 입력해주세요." />
            </label>
            <input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => {
                // 전화번호 형식 자동 변환 (하이픈 추가)
                const value = e.target.value.replace(/[^\d]/g, '');
                let formatted = value;
                
                // 모바일 번호 (010, 011, 016, 017, 018, 019로 시작)
                if (value.startsWith('010') || value.startsWith('011') || 
                    value.startsWith('016') || value.startsWith('017') || 
                    value.startsWith('018') || value.startsWith('019')) {
                  if (value.length > 3) {
                    formatted = value.slice(0, 3) + '-' + value.slice(3);
                  }
                  if (value.length > 7) {
                    formatted = value.slice(0, 3) + '-' + value.slice(3, 7) + '-' + value.slice(7, 11);
                  }
                }
                // 서울 지역번호 (02로 시작)
                else if (value.startsWith('02')) {
                  if (value.length > 2) {
                    formatted = value.slice(0, 2) + '-' + value.slice(2);
                  }
                  if (value.length > 6) {
                    formatted = value.slice(0, 2) + '-' + value.slice(2, 6) + '-' + value.slice(6, 10);
                  }
                }
                // 기타 지역번호 (3자리로 시작: 031, 032, 033, 041, 042, 043, 044, 051, 052, 053, 054, 055, 061, 062, 063, 064 등)
                else if (value.length >= 3) {
                  if (value.length > 3) {
                    formatted = value.slice(0, 3) + '-' + value.slice(3);
                  }
                  if (value.length > 6) {
                    formatted = value.slice(0, 3) + '-' + value.slice(3, 6) + '-' + value.slice(6, 10);
                  }
                }
                
                handleChange('phone', formatted);
              }}
              className="w-full px-4 py-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
              placeholder="전화번호를 입력해주세요"
              maxLength={13}
            />
          </div>

          {/* 운영시간 + 예약 단위 (같은 라인) */}
          <div className="flex flex-wrap items-end gap-6">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                <ClockIcon className="w-4 h-4 inline mr-1" />
                운영시간 <span className="text-xs text-[var(--color-text-secondary)] font-normal">(선택, 30분 단위)</span>
              </label>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-[var(--color-text-secondary)] shrink-0">시작</span>
                  <select
                    id="operatingHoursStart"
                    value={formData.operatingHoursStart.split(':')[0]}
                    onChange={(e) => {
                      const m = (formData.operatingHoursStart.split(':')[1] === '30') ? '30' : '00';
                      handleChange('operatingHoursStart', `${e.target.value}:${m}`);
                    }}
                    className="w-20 px-2 py-1.5 text-sm border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
                  >
                    {HOUR_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <span className="text-[var(--color-text-primary)] font-medium">:</span>
                  <select
                    value={(formData.operatingHoursStart.split(':')[1] === '30') ? '30' : '00'}
                    onChange={(e) => {
                      const h = formData.operatingHoursStart.split(':')[0];
                      handleChange('operatingHoursStart', `${h}:${e.target.value}`);
                    }}
                    className="w-14 px-2 py-1.5 text-sm border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
                  >
                    {MINUTE_OPTIONS_30.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <span className="text-[var(--color-text-secondary)]">~</span>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-[var(--color-text-secondary)] shrink-0">종료</span>
                  <select
                    value={formData.operatingHoursEnd.split(':')[0]}
                    onChange={(e) => {
                      const m = (formData.operatingHoursEnd.split(':')[1] === '30') ? '30' : '00';
                      handleChange('operatingHoursEnd', `${e.target.value}:${m}`);
                    }}
                    className="w-20 px-2 py-1.5 text-sm border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
                  >
                    {HOUR_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <span className="text-[var(--color-text-primary)] font-medium">:</span>
                  <select
                    value={(formData.operatingHoursEnd.split(':')[1] === '30') ? '30' : '00'}
                    onChange={(e) => {
                      const h = formData.operatingHoursEnd.split(':')[0];
                      handleChange('operatingHoursEnd', `${h}:${e.target.value}`);
                    }}
                    className="w-14 px-2 py-1.5 text-sm border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
                  >
                    {MINUTE_OPTIONS_30.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                예약 단위 <span className="text-xs text-[var(--color-text-secondary)] font-normal">(선택)</span>
              </label>
              <p className="text-xs text-[var(--color-text-secondary)] mb-1">기본 2시간 단위</p>
              <select
                value={formData.reservationSlotHours}
                onChange={(e) => setFormData((prev) => ({ ...prev, reservationSlotHours: Number(e.target.value) }))}
                className="w-[120px] px-2 py-1.5 text-sm border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
              >
                {[1, 2, 3, 4].map((h) => (
                  <option key={h} value={h}>{h}시간</option>
                ))}
              </select>
            </div>
          </div>

          {/* 가격 */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
              가격 <span className="text-xs text-[var(--color-text-secondary)] font-normal">(선택사항)</span>
            </label>
            <div className="space-y-3">
              {/* 가격 타입 선택 */}
              <div>
                <label className="block text-xs text-[var(--color-text-secondary)] mb-2">
                  가격 타입
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleChange('priceType', 'hourly')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      formData.priceType === 'hourly'
                        ? 'bg-[var(--color-blue-primary)] text-white'
                        : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-card)]'
                    }`}
                  >
                    시간당
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChange('priceType', 'daily')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      formData.priceType === 'daily'
                        ? 'bg-[var(--color-blue-primary)] text-white'
                        : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-card)]'
                    }`}
                  >
                    일일
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChange('priceType', 'monthly')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      formData.priceType === 'monthly'
                        ? 'bg-[var(--color-blue-primary)] text-white'
                        : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-card)]'
                    }`}
                  >
                    월간
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChange('priceType', 'package')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      formData.priceType === 'package'
                        ? 'bg-[var(--color-blue-primary)] text-white'
                        : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-card)]'
                    }`}
                  >
                    패키지
                  </button>
                </div>
              </div>
              {/* 가격 입력 */}
              <div>
                <label htmlFor="price" className="block text-xs text-[var(--color-text-secondary)] mb-2">
                  {formData.priceType === 'hourly' && '시간당'}
                  {formData.priceType === 'daily' && '일일'}
                  {formData.priceType === 'monthly' && '월간'}
                  {formData.priceType === 'package' && '패키지'} 가격
                </label>
                <div className="relative">
                  <input
                    id="price"
                    type="text"
                    value={formData.price}
                    onChange={(e) => {
                      // 숫자만 추출
                      const numbers = e.target.value.replace(/[^\d]/g, '');
                      // 천단위 콤마 추가
                      const formatted = numbers ? parseInt(numbers, 10).toLocaleString() : '';
                      handleChange('price', formatted);
                    }}
                    className="w-full px-4 py-2 pr-12 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
                    placeholder="가격을 입력해주세요"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] text-sm">
                    원
                  </span>
                </div>
                {formData.price && (
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                    {formData.priceType === 'hourly' && '시간당'}
                    {formData.priceType === 'daily' && '일일'}
                    {formData.priceType === 'monthly' && '월간'}
                    {formData.priceType === 'package' && '패키지'} {formData.price}원
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 설명 */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
              시설 설명 <span className="text-xs text-[var(--color-text-secondary)] font-normal">(선택사항)</span>
            </label>
            <textarea
              id="description"
              rows={4}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="w-full px-4 py-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)] resize-none"
              placeholder="시설에 대한 설명을 작성해주세요..."
            />
          </div>

          {/* 가능한 운동 종목 (체육센터·체육관 등 다목적 시설용) */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
              가능한 운동 종목 <span className="text-xs text-[var(--color-text-secondary)] font-normal">(선택사항)</span>
            </label>
            <p className="text-xs text-[var(--color-text-secondary)] mb-3">
              이 시설에서 가능한 운동을 선택해주세요. (체육센터·체육관 등 다목적 시설에 유용)
            </p>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_SPORTS.map((sport) => (
                <button
                  key={sport}
                  type="button"
                  onClick={() => handleAvailableSportToggle(sport)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    formData.availableSports.includes(sport)
                      ? 'bg-[var(--color-blue-primary)] text-white'
                      : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-card)]'
                  }`}
                >
                  {sport}
                  {formData.availableSports.includes(sport) && <span className="ml-1">✓</span>}
                </button>
              ))}
            </div>
          </div>

          {/* 편의시설 */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
              편의시설 <span className="text-xs text-[var(--color-text-secondary)] font-normal">(선택사항)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {commonAmenities.map((amenity) => (
                <button
                  key={amenity}
                  type="button"
                  onClick={() => handleAmenityToggle(amenity)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    formData.amenities.includes(amenity)
                      ? 'bg-[var(--color-blue-primary)] text-white'
                      : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-card)]'
                  }`}
                >
                  {amenity}
                  {formData.amenities.includes(amenity) && <span className="ml-1">✓</span>}
                </button>
              ))}
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex space-x-3 pt-4 border-t border-[var(--color-border-card)]">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] rounded-lg font-semibold hover:opacity-80 transition-opacity"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-[var(--color-blue-primary)] text-white rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '등록 중...' : '시설 등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateFacilityModal;

