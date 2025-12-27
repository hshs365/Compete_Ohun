import React, { useState, useEffect, useRef } from 'react';
import { XMarkIcon, MapPinIcon, UsersIcon, TagIcon, CalendarIcon, PhoneIcon, WrenchScrewdriverIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import type { SelectedGroup } from './MapPanel';
import { SPORTS_LIST } from '../constants/sports';
import { getEquipmentBySport } from '../constants/equipment';
import { api } from '../utils/api';
import KakaoMap from './KakaoMap';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (groupData: Omit<SelectedGroup, 'id'>) => void;
  onSuccess?: () => void; // 모임 생성 성공 시 콜백
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ isOpen, onClose, onSubmit, onSuccess }) => {
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
    location: '',
    coordinates: getUserLocation(),
    memberCount: 1,
    category: '배드민턴',
    description: '',
    meetingTime: '',
    contact: '',
    equipment: [] as string[],
  });

  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [mapKey, setMapKey] = useState(0);
  const [mapZoom, setMapZoom] = useState(15); // 지도 리렌더링을 위한 key
  const addressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const categories = SPORTS_LIST;

  // 카테고리 변경 시 해당 운동의 준비물 목록 업데이트
  useEffect(() => {
    const equipmentList = getEquipmentBySport(formData.category);
    // 기존 선택된 준비물 중 현재 운동에 해당하는 것만 유지
    setSelectedEquipment((prev) => 
      prev.filter((item) => equipmentList.includes(item))
    );
  }, [formData.category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // API 호출로 모임 생성
      const groupData = {
        name: formData.name,
        location: formData.location,
        latitude: formData.coordinates[0],
        longitude: formData.coordinates[1],
        category: formData.category,
        description: formData.description || undefined,
        meetingTime: formData.meetingTime || undefined,
        contact: formData.contact || undefined,
        equipment: selectedEquipment,
      };

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

      // 기존 onSubmit 콜백도 호출 (호환성 유지)
      onSubmit({
        name: createdGroup.name,
        location: createdGroup.location,
        coordinates: [createdGroup.latitude, createdGroup.longitude] as [number, number],
        memberCount: createdGroup.participantCount,
        category: createdGroup.category,
        description: createdGroup.description || undefined,
        meetingTime: createdGroup.meetingTime || undefined,
        contact: createdGroup.contact || undefined,
      });

      // 폼 초기화
      setFormData({
        name: '',
        location: '',
        coordinates: [37.5665, 126.9780],
        memberCount: 1,
        category: '배드민턴',
        description: '',
        meetingTime: '',
        contact: '',
        equipment: [],
      });
      setSelectedEquipment([]);

      // 성공 콜백 호출
      if (onSuccess) {
        onSuccess();
      }

      onClose();
    } catch (error) {
      console.error('모임 생성 실패:', error);
      alert(error instanceof Error ? error.message : '모임 생성에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleEquipmentToggle = (equipment: string) => {
    setSelectedEquipment((prev) => {
      if (prev.includes(equipment)) {
        return prev.filter((item) => item !== equipment);
      } else {
        return [...prev, equipment];
      }
    });
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
      const KAKAO_REST_API_KEY = import.meta.env.VITE_KAKAO_REST_API_KEY;
      
      // 디버깅: API 키 확인
      console.log('카카오맵 API 키 확인:', KAKAO_REST_API_KEY ? '설정됨 ✅' : '없음 ❌');
      
      // 1순위: 카카오맵 API (한국 주소에 최적화, API 키 필요)
      if (KAKAO_REST_API_KEY) {
        try {
          console.log('카카오맵 API 호출 중:', address);
          const response = await fetch(
            `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`,
            {
              headers: {
                Authorization: `KakaoAK ${KAKAO_REST_API_KEY}`,
              },
            }
          );
          
          console.log('카카오맵 API 응답 상태:', response.status);
          
          if (response.ok) {
            const data = await response.json();
            console.log('카카오맵 API 응답 데이터:', data);
            if (data.documents && data.documents.length > 0) {
              const { y, x } = data.documents[0];
              const newCoordinates: [number, number] = [parseFloat(y), parseFloat(x)];
              
              console.log('변환된 좌표:', newCoordinates);
              
              setFormData((prev) => ({
                ...prev,
                coordinates: newCoordinates,
                location: address, // 주소도 함께 업데이트
              }));
              // 지도 확대 레벨 설정 (주소 선택 시 확대)
              setMapZoom(3);
              // 지도 표시
              setShowMap(true);
              // 지도 확대를 위해 key 변경 (KakaoMap 컴포넌트 리렌더링)
              setMapKey((prev) => prev + 1);
              return;
            } else {
              console.warn('카카오맵 API: 검색 결과 없음');
            }
          } else {
            const errorData = await response.json().catch(() => ({}));
            console.error('카카오맵 API 오류:', response.status, errorData);
          }
        } catch (error) {
          console.warn('카카오맵 API 호출 실패, OpenStreetMap으로 대체:', error);
        }
      }
      
      // 2순위: OpenStreetMap Nominatim API (무료, API 키 불필요, 한국 주소는 정확도 낮을 수 있음)
      console.log('OpenStreetMap API 호출 중 (대체 방법)');
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
          {
            headers: {
              'User-Agent': 'OhunApp/1.0', // Nominatim은 User-Agent 필수
            },
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            const { lat, lon } = data[0];
            const newCoordinates: [number, number] = [parseFloat(lat), parseFloat(lon)];
            
            console.log('OpenStreetMap 변환된 좌표:', newCoordinates);
            
            setFormData((prev) => ({
              ...prev,
              coordinates: newCoordinates,
              location: address, // 주소도 함께 업데이트
            }));
            // 지도 확대 레벨 설정 (주소 선택 시 확대)
            setMapZoom(3);
            // 지도 표시
            setShowMap(true);
            setMapKey((prev) => prev + 1); // 지도 리렌더링
            return;
          }
        }
      } catch (error) {
        console.error('OpenStreetMap API 호출 실패:', error);
      }
      
      // 모든 방법 실패 시 경고
      console.warn('주소를 좌표로 변환할 수 없습니다. 주소를 확인해주세요.');
    } catch (error) {
      console.error('주소 변환 실패:', error);
    }
  };

  // 마커 위치 변경 핸들러 (카카오맵)
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
      const KAKAO_REST_API_KEY = import.meta.env.VITE_KAKAO_REST_API_KEY;
      
      // 1순위: 카카오맵 API (한국 주소에 최적화)
      if (KAKAO_REST_API_KEY) {
        try {
          const response = await fetch(
            `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${lng}&y=${lat}`,
            {
              headers: {
                Authorization: `KakaoAK ${KAKAO_REST_API_KEY}`,
              },
            }
          );
          
          if (response.ok) {
            const data = await response.json();
            if (data.documents && data.documents.length > 0) {
              const address = data.documents[0].address;
              const fullAddress = address
                ? `${address.region_1depth_name} ${address.region_2depth_name} ${address.region_3depth_name || ''}`.trim()
                : '';
              
              if (fullAddress) {
                setFormData((prev) => ({
                  ...prev,
                  location: fullAddress,
                }));
                return;
              }
            }
          }
        } catch (error) {
          console.warn('카카오맵 API 호출 실패, OpenStreetMap으로 대체:', error);
        }
      }
      
      // 2순위: OpenStreetMap Nominatim API (무료, API 키 불필요)
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
          {
            headers: {
              'User-Agent': 'OhunApp/1.0',
            },
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data && data.address) {
            const addr = data.address;
            // 한국 주소 형식으로 변환 시도
            const fullAddress = addr.road 
              ? `${addr.road}${addr.house_number ? ' ' + addr.house_number : ''}`
              : data.display_name || '';
            
            if (fullAddress) {
              setFormData((prev) => ({
                ...prev,
                location: fullAddress,
              }));
            }
          }
        }
      } catch (error) {
        console.error('OpenStreetMap API 호출 실패:', error);
      }
    } catch (error) {
      console.error('주소 변환 실패:', error);
    }
  };

  const currentEquipmentList = getEquipmentBySport(formData.category);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-[var(--color-bg-card)] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[var(--color-border-card)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="sticky top-0 bg-[var(--color-bg-card)] border-b border-[var(--color-border-card)] p-4 md:p-6 flex items-center justify-between z-10">
          <h2 className="text-xl md:text-2xl font-bold text-[var(--color-text-primary)]">새 모임 만들기</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--color-bg-secondary)] rounded-lg transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-[var(--color-text-primary)]" />
          </button>
        </div>

        {/* 폼 내용 */}
        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-6">
          {/* 모임 이름 */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
              모임 이름 <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full px-4 py-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
              placeholder="예: 강남 배드민턴 클럽"
            />
          </div>

          {/* 카테고리 */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
              <TagIcon className="w-4 h-4 inline mr-1" />
              카테고리 <span className="text-red-500">*</span>
            </label>
            <select
              id="category"
              required
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              className="w-full px-4 py-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* 위치 */}
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
              <MapPinIcon className="w-4 h-4 inline mr-1" />
              위치 <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2 mb-2">
              <input
                id="location"
                type="text"
                required
                value={formData.location}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData((prev) => ({ ...prev, location: value }));
                  
                  // 이전 타이머 취소
                  if (addressTimeoutRef.current) {
                    clearTimeout(addressTimeoutRef.current);
                  }
                  
                  // 주소 입력 시 좌표 변환 (디바운싱: 800ms 대기)
                  if (value.trim().length > 0) {
                    addressTimeoutRef.current = setTimeout(() => {
                      handleAddressToCoordinates(value);
                    }, 800);
                  }
                }}
                className="flex-1 px-4 py-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
                placeholder="예: 서울시 강남구"
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
            
            {/* 지도 영역 */}
            {showMap && (
              <div className="mt-2 border border-[var(--color-border-card)] rounded-lg overflow-hidden" style={{ height: '300px' }}>
                <KakaoMap
                  key={mapKey}
                  center={formData.coordinates}
                  zoom={mapZoom}
                  onMarkerDragEnd={handleMarkerDragEnd}
                />
              </div>
            )}
          </div>

          {/* 모임 시간 */}
          <div>
            <label htmlFor="meetingTime" className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
              <CalendarIcon className="w-4 h-4 inline mr-1" />
              모임 시간
            </label>
            <input
              id="meetingTime"
              type="text"
              value={formData.meetingTime}
              onChange={(e) => handleChange('meetingTime', e.target.value)}
              className="w-full px-4 py-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
              placeholder="예: 매주 토요일 10:00"
            />
          </div>

          {/* 연락처 */}
          <div>
            <label htmlFor="contact" className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
              <PhoneIcon className="w-4 h-4 inline mr-1" />
              연락처
            </label>
            <input
              id="contact"
              type="tel"
              value={formData.contact}
              onChange={(e) => handleChange('contact', e.target.value)}
              className="w-full px-4 py-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
              placeholder="예: 010-1234-5678"
            />
          </div>

          {/* 모임 설명 */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
              모임 설명
            </label>
            <textarea
              id="description"
              rows={4}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="w-full px-4 py-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)] resize-none"
              placeholder="모임에 대한 간단한 설명을 작성해주세요..."
            />
          </div>

          {/* 준비물 선택 */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
              <WrenchScrewdriverIcon className="w-4 h-4 inline mr-1" />
              준비물 (선택)
            </label>
            <div className="border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] p-3">
              <p className="text-xs text-[var(--color-text-secondary)] mb-3">
                {formData.category}에 필요한 준비물을 선택해주세요.
              </p>
              <div className="flex flex-wrap gap-2">
                {currentEquipmentList.length > 0 ? (
                  currentEquipmentList.map((equipment) => (
                    <button
                      key={equipment}
                      type="button"
                      onClick={() => handleEquipmentToggle(equipment)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        selectedEquipment.includes(equipment)
                          ? 'bg-[var(--color-blue-primary)] text-white'
                          : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-card)]'
                      }`}
                    >
                      {equipment}
                      {selectedEquipment.includes(equipment) && (
                        <span className="ml-1">✓</span>
                      )}
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-[var(--color-text-secondary)] italic">
                    준비물 목록이 없습니다.
                  </p>
                )}
              </div>
              {selectedEquipment.length > 0 && (
                <div className="mt-3 pt-3 border-t border-[var(--color-border-card)]">
                  <p className="text-xs text-[var(--color-text-secondary)] mb-1">선택된 준비물:</p>
                  <p className="text-sm text-[var(--color-text-primary)]">
                    {selectedEquipment.join(', ')}
                  </p>
                </div>
              )}
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
              {isSubmitting ? '생성 중...' : '모임 만들기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;


