import React, { useState, useEffect, useRef } from 'react';
import { XMarkIcon, MapPinIcon, UsersIcon, TagIcon, CalendarIcon, WrenchScrewdriverIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import type { SelectedGroup } from '../types/selected-group';
import { SPORTS_LIST, getMinParticipantsForSport } from '../constants/sports';
import { getEquipmentBySport } from '../constants/equipment';
import { api } from '../utils/api';
import NaverMap from './NaverMap';
import { showError, showSuccess, showWarning } from '../utils/swal';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (groupData: Omit<SelectedGroup, 'id'>) => void;
  onSuccess?: () => void; // 매치 생성 성공 시 콜백
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

  // 오늘 날짜에 오후 6시를 기본값으로 설정
  const getDefaultDateTime = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return {
      date: `${year}-${month}-${day}`,
      time: '18:00', // 오후 6시
    };
  };

  const defaultDateTime = getDefaultDateTime();

  const [formData, setFormData] = useState({
    name: '',
    location: '',
    coordinates: getUserLocation(),
    memberCount: 1,
    category: '배드민턴',
    description: '',
    meetingDate: defaultDateTime.date, // 오늘 날짜
    meetingTime: defaultDateTime.time, // 오후 6시
    maxParticipants: '', // 최대 참여자 수
    equipment: [] as string[],
  });

  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [mapKey, setMapKey] = useState(0);
  const [mapZoom, setMapZoom] = useState(15); // 지도 리렌더링을 위한 key
  const addressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // 모달 배경 클릭 감지용 (드래그와 클릭 구분)
  const modalMouseDownRef = useRef<{ x: number; y: number } | null>(null);
  const categories = SPORTS_LIST;

  // 모달이 열릴 때 이전 그룹 데이터 불러오기
  useEffect(() => {
    const loadPreviousGroup = async () => {
      if (!isOpen) {
        // 모달이 닫힐 때 폼 초기화
        const resetDateTime = getDefaultDateTime();
        setFormData({
          name: '',
          location: '',
          coordinates: getUserLocation(),
          memberCount: 1,
          category: '배드민턴',
          description: '',
          meetingDate: resetDateTime.date,
          meetingTime: resetDateTime.time,
          maxParticipants: '',
          equipment: [],
        });
        setSelectedEquipment([]);
        setShowMap(false);
        return;
      }

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
        }>>('/api/groups/my-groups');

        // 가장 최근에 만든 그룹이 있으면 데이터 불러오기
        if (myGroups && myGroups.length > 0) {
          const latestGroup = myGroups[0];
          
          // 일시는 제외하고 나머지 필드만 채우기
          const resetDateTime = getDefaultDateTime();
          // 좌표를 숫자로 명시적으로 변환
          const latitude = typeof latestGroup.latitude === 'string' 
            ? parseFloat(latestGroup.latitude) 
            : Number(latestGroup.latitude);
          const longitude = typeof latestGroup.longitude === 'string' 
            ? parseFloat(latestGroup.longitude) 
            : Number(latestGroup.longitude);
          
          // 좌표가 유효한지 확인
          if (isNaN(latitude) || isNaN(longitude)) {
            // 좌표가 유효하지 않으면 기본 위치 사용
            setFormData({
              name: latestGroup.name,
              location: latestGroup.location,
              coordinates: getUserLocation(),
              memberCount: 1,
              category: latestGroup.category,
              description: latestGroup.description || '',
              meetingDate: resetDateTime.date,
              meetingTime: resetDateTime.time,
              maxParticipants: latestGroup.maxParticipants ? latestGroup.maxParticipants.toString() : '',
              equipment: [],
            });
          } else {
            setFormData({
              name: latestGroup.name,
              location: latestGroup.location,
              coordinates: [latitude, longitude] as [number, number],
              memberCount: 1,
              category: latestGroup.category,
              description: latestGroup.description || '',
              meetingDate: resetDateTime.date, // 일시는 기본값 유지 (오늘 오후 6시)
              meetingTime: resetDateTime.time,
              maxParticipants: latestGroup.maxParticipants ? latestGroup.maxParticipants.toString() : '',
              equipment: [],
            });
          }
          
          // 준비물도 설정
          if (latestGroup.equipment && latestGroup.equipment.length > 0) {
            setSelectedEquipment(latestGroup.equipment);
          } else {
            setSelectedEquipment([]);
          }

          // 지도 위치 업데이트
          setMapZoom(3);
          setMapKey((prev) => prev + 1);
        } else {
          // 이전 그룹이 없으면 기본값으로 초기화
          const resetDateTime = getDefaultDateTime();
          setFormData({
            name: '',
            location: '',
            coordinates: getUserLocation(),
            memberCount: 1,
            category: '배드민턴',
            description: '',
            meetingDate: resetDateTime.date,
            meetingTime: resetDateTime.time,
            maxParticipants: '',
            equipment: [],
          });
          setSelectedEquipment([]);
        }
      } catch (error) {
        // 에러가 발생해도 기본값으로 초기화
        console.log('이전 그룹 데이터를 불러올 수 없습니다:', error);
        const resetDateTime = getDefaultDateTime();
        setFormData({
          name: '',
          location: '',
          coordinates: getUserLocation(),
          memberCount: 1,
          category: '배드민턴',
          description: '',
          meetingDate: resetDateTime.date,
          meetingTime: resetDateTime.time,
          maxParticipants: '',
          equipment: [],
        });
        setSelectedEquipment([]);
      }
    };

    loadPreviousGroup();
  }, [isOpen]);

  // 카테고리 변경 시 해당 운동의 준비물 목록 업데이트 및 최소 인원 자동 설정
  useEffect(() => {
    const equipmentList = getEquipmentBySport(formData.category);
    // 기존 선택된 준비물 중 현재 운동에 해당하는 것만 유지
    setSelectedEquipment((prev) => 
      prev.filter((item) => equipmentList.includes(item))
    );
    
    // 운동별 최소 인원 자동 설정
    const minParticipants = getMinParticipantsForSport(formData.category);
    if (minParticipants !== null) {
      // 최소 인원이 설정된 경우, maxParticipants가 최소 인원보다 작으면 업데이트
      setFormData((prev) => {
        const currentMax = prev.maxParticipants ? parseInt(prev.maxParticipants, 10) : null;
        if (currentMax === null || currentMax < minParticipants) {
          return {
            ...prev,
            maxParticipants: minParticipants.toString(),
          };
        }
        return prev;
      });
    }
  }, [formData.category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 위치가 비어있는지 확인
    if (!formData.location || formData.location.trim() === '') {
      await showWarning('위치를 선택해주세요. 주소 찾기 버튼을 클릭하거나 지도에서 마커를 드래그하여 위치를 선택하세요.', '위치 선택 필요');
      return;
    }

    setIsSubmitting(true);

    try {
      // API 호출로 매치 생성
      // 날짜와 시간을 합쳐서 meetingTime 문자열 생성
      let meetingTimeString: string | undefined = undefined;
      if (formData.meetingDate && formData.meetingTime) {
        meetingTimeString = `${formData.meetingDate} ${formData.meetingTime}`;
      } else if (formData.meetingDate) {
        meetingTimeString = formData.meetingDate;
      } else if (formData.meetingTime) {
        meetingTimeString = formData.meetingTime;
      }

      // 좌표를 숫자로 명시적으로 변환
      const latitude = Number(formData.coordinates[0]);
      const longitude = Number(formData.coordinates[1]);
      
      // 좌표 유효성 검사
      if (isNaN(latitude) || isNaN(longitude)) {
        await showError('위치 좌표가 유효하지 않습니다. 주소 찾기 버튼을 클릭하거나 지도에서 마커를 드래그하여 위치를 다시 선택해주세요.', '위치 좌표 오류');
        setIsSubmitting(false);
        return;
      }

      // 운동별 최소 인원 계산
      const minParticipants = getMinParticipantsForSport(formData.category);
      
      const groupData = {
        name: formData.name,
        location: formData.location,
        latitude: latitude,
        longitude: longitude,
        category: formData.category,
        description: formData.description || undefined,
        meetingTime: meetingTimeString,
        maxParticipants: formData.maxParticipants && formData.maxParticipants.trim() !== '' 
          ? parseInt(formData.maxParticipants, 10) 
          : undefined,
        minParticipants: minParticipants || undefined,
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
      });

      // 폼 초기화 (기본값으로 오늘 오후 6시 설정)
      const resetDateTime = getDefaultDateTime();
      setFormData({
        name: '',
        location: '',
        coordinates: [37.5665, 126.9780],
        memberCount: 1,
        category: '배드민턴',
        description: '',
        meetingDate: resetDateTime.date,
        meetingTime: resetDateTime.time,
        maxParticipants: '',
        equipment: [],
      });
      setSelectedEquipment([]);

      // 성공 콜백 호출
      if (onSuccess) {
        onSuccess();
      }

      onClose();
    } catch (error) {
      console.error('매치 생성 실패:', error);
      await showError(error instanceof Error ? error.message : '매치 생성에 실패했습니다.', '매치 생성 실패');
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
                location: address, // 주소도 함께 업데이트
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
                  location: fullAddress,
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

  const currentEquipmentList = getEquipmentBySport(formData.category);

  if (!isOpen) return null;

  return (
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
        {/* 헤더 */}
        <div className="sticky top-0 bg-[var(--color-bg-card)] border-b border-[var(--color-border-card)] p-4 md:p-6 flex items-center justify-between z-10">
          <h2 className="text-xl md:text-2xl font-bold text-[var(--color-text-primary)]">새 매치 만들기</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--color-bg-secondary)] rounded-lg transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-[var(--color-text-primary)]" />
          </button>
        </div>

        {/* 폼 내용 */}
        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-6">
          {/* 매치 이름 */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
              매치 이름 <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full px-4 py-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
              placeholder="매치명을 입력해주세요"
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
                readOnly
                value={formData.location}
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
            
            {/* 지도 영역 */}
            {showMap && (
              <div className="mt-2 border border-[var(--color-border-card)] rounded-lg overflow-hidden" style={{ height: '300px' }}>
                <NaverMap
                  key={mapKey}
                  center={formData.coordinates}
                  zoom={mapZoom}
                  onMarkerDragEnd={handleMarkerDragEnd}
                />
              </div>
            )}
          </div>

          {/* 매치 일정 */}
          <div>
            <label htmlFor="meetingDateTime" className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
              <CalendarIcon className="w-4 h-4 inline mr-1" />
              매치 일정 <span className="text-xs text-[var(--color-text-secondary)] font-normal">(선택사항)</span>
            </label>
            <input
              id="meetingDateTime"
              type="datetime-local"
              value={formData.meetingDate && formData.meetingTime 
                ? `${formData.meetingDate}T${formData.meetingTime}` 
                : ''}
              onChange={(e) => {
                const value = e.target.value;
                if (value) {
                  const [date, time] = value.split('T');
                  setFormData((prev) => ({
                    ...prev,
                    meetingDate: date || '',
                    meetingTime: time || '',
                  }));
                } else {
                  setFormData((prev) => ({
                    ...prev,
                    meetingDate: '',
                    meetingTime: '',
                  }));
                }
              }}
              min={new Date().toISOString().slice(0, 16)} // 현재 시간 이후만 선택 가능
              className="w-full px-4 py-3 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)] date-input-dark"
            />
            <p className="text-xs text-[var(--color-text-secondary)] mt-2">
              📅 날짜와 시간을 한 번에 선택할 수 있습니다. 매치 일정이 없으면 비워두세요.
            </p>
          </div>

          {/* 최대 참여자 수 */}
          <div>
            <label htmlFor="maxParticipants" className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
              <UsersIcon className="w-4 h-4 inline mr-1" />
              최대 참여자 수 <span className="text-xs text-[var(--color-text-secondary)] font-normal">(선택사항)</span>
            </label>
            <input
              id="maxParticipants"
              type="number"
              min="1"
              max="1000"
              value={formData.maxParticipants}
              onChange={(e) => {
                const value = e.target.value;
                // 숫자만 입력 가능하도록 검증
                if (value === '' || (/^\d+$/.test(value) && parseInt(value, 10) >= 1 && parseInt(value, 10) <= 1000)) {
                  handleChange('maxParticipants', value);
                }
              }}
              className="w-full px-4 py-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
              placeholder="최대 참여자 수를 입력해주세요"
            />
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">
              매치에 참가할 수 있는 최대 인원 수를 설정하세요. (1~1000명)
            </p>
          </div>

          {/* 매치 설명 */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
              매치 설명
            </label>
            <textarea
              id="description"
              rows={4}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="w-full px-4 py-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)] resize-none"
              placeholder="매치에 대한 간단한 설명을 작성해주세요..."
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
              {isSubmitting ? '생성 중...' : '매치 만들기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;


