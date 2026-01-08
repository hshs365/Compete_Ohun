import React, { useState, useEffect } from 'react';
import {
  BuildingOfficeIcon,
  MapPinIcon,
  PhoneIcon,
  ClockIcon,
  StarIcon,
  FunnelIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import CreateFacilityModal from './CreateFacilityModal';
import { showInfo } from '../utils/swal';

interface Facility {
  id: number;
  name: string;
  type: string;
  address: string;
  phone: string | null;
  operatingHours: string | null;
  rating: number;
  reviewCount: number;
  price: string | null;
  image?: string | null;
  description?: string | null;
  amenities?: string[];
  latitude?: number | null;
  longitude?: number | null;
}

const FacilityReservationPage = () => {
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState<string>('전체');
  const [selectedArea, setSelectedArea] = useState<string>('전체');
  const [searchQuery, setSearchQuery] = useState('');
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<{ businessNumberVerified?: boolean } | null>(null);

  // 사용자 프로필 정보 가져오기 (사업자번호 검증 여부 확인)
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const profile = await api.get<{ businessNumberVerified?: boolean }>('/api/auth/me');
        setUserProfile(profile);
      } catch (error) {
        console.error('사용자 프로필 조회 실패:', error);
      }
    };
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  // 시설 목록 가져오기
  useEffect(() => {
    const fetchFacilities = async () => {
      setIsLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (selectedType && selectedType !== '전체') {
          queryParams.append('type', selectedType);
        }
        if (selectedArea && selectedArea !== '전체') {
          queryParams.append('area', selectedArea);
        }
        if (searchQuery) {
          queryParams.append('search', searchQuery);
        }
        queryParams.append('limit', '100');

        const response = await api.get<{ facilities: Facility[]; total: number }>(
          `/api/facilities?${queryParams.toString()}`
        );
        setFacilities(response.facilities);
      } catch (error) {
        console.error('시설 목록 조회 실패:', error);
        setFacilities([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFacilities();
  }, [selectedType, selectedArea, searchQuery]);

  const facilityTypes = ['전체', '체육센터', '체육관', '풋살장', '테니스장', '수영장', '골프연습장', '기타'];
  const areas = ['전체', '서울', '경기', '인천', '부산', '대구', '대전', '광주'];

  // 필터링된 시설 목록
  const filteredFacilities = facilities;

  const handleReservation = async (facilityId: number) => {
    // TODO: 예약 페이지로 이동 또는 예약 모달 열기
    console.log('예약하기:', facilityId);
    const facility = facilities.find((f) => f.id === facilityId);
    await showInfo(`${facility?.name || '시설'} 예약 페이지로 이동합니다.`, '예약 안내');
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<StarIconSolid key={i} className="w-4 h-4 text-yellow-400" />);
    }
    if (hasHalfStar) {
      stars.push(<StarIconSolid key="half" className="w-4 h-4 text-yellow-400 opacity-50" />);
    }
    for (let i = stars.length; i < 5; i++) {
      stars.push(<StarIcon key={i} className="w-4 h-4 text-gray-300" />);
    }
    return stars;
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto w-full pb-12">
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)]">
        시설 예약
      </h1>
        {userProfile?.businessNumberVerified && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-blue-primary)] text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            <PlusIcon className="w-5 h-5" />
            시설 등록
          </button>
        )}
      </div>

      {/* 필터 및 검색 */}
      <div className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-card)] p-4 md:p-6 mb-6">
        {/* 검색창 */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="시설명으로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
          />
        </div>

        {/* 필터 버튼들 */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* 시설 종류 */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
              <FunnelIcon className="w-4 h-4 inline mr-1" />
              시설 종류
            </label>
            <div className="flex flex-wrap gap-2">
              {facilityTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedType === type
                      ? 'bg-[var(--color-blue-primary)] text-white'
                      : 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] border border-[var(--color-border-card)] hover:bg-[var(--color-bg-secondary)]'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* 지역 */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
              <MapPinIcon className="w-4 h-4 inline mr-1" />
              지역
            </label>
            <div className="flex flex-wrap gap-2">
              {areas.map((area) => (
                <button
                  key={area}
                  onClick={() => setSelectedArea(area)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedArea === area
                      ? 'bg-[var(--color-blue-primary)] text-white'
                      : 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] border border-[var(--color-border-card)] hover:bg-[var(--color-bg-secondary)]'
                  }`}
                >
                  {area}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 결과 개수 */}
      <div className="mb-4">
        <p className="text-[var(--color-text-secondary)] text-sm">
          {isLoading ? (
            '시설 목록을 불러오는 중...'
          ) : (
            <>
              총 <span className="font-semibold text-[var(--color-text-primary)]">{filteredFacilities.length}</span>
              개의 시설이 있습니다.
            </>
          )}
        </p>
      </div>

      {/* 시설 등록 모달 */}
      <CreateFacilityModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          // 시설 목록 새로고침
          const queryParams = new URLSearchParams();
          if (selectedType && selectedType !== '전체') {
            queryParams.append('type', selectedType);
          }
          if (selectedArea && selectedArea !== '전체') {
            queryParams.append('area', selectedArea);
          }
          if (searchQuery) {
            queryParams.append('search', searchQuery);
          }
          queryParams.append('limit', '100');

          api.get<{ facilities: Facility[]; total: number }>(
            `/api/facilities?${queryParams.toString()}`
          ).then((response) => {
            setFacilities(response.facilities);
          }).catch((error) => {
            console.error('시설 목록 조회 실패:', error);
          });
        }}
      />

      {/* 시설 목록 */}
      {filteredFacilities.length === 0 ? (
        <div className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-card)] p-12 text-center">
          <BuildingOfficeIcon className="w-16 h-16 mx-auto text-[var(--color-text-secondary)] mb-4" />
          <p className="text-[var(--color-text-secondary)] text-lg">
            검색 조건에 맞는 시설이 없습니다.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filteredFacilities.map((facility) => (
            <div
              key={facility.id}
              className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-card)] overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            >
              {/* 시설 이미지 */}
              <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                {facility.image ? (
                  <img src={facility.image} alt={facility.name} className="w-full h-full object-cover" />
                ) : (
                  <BuildingOfficeIcon className="w-24 h-24 text-white opacity-50" />
                )}
              </div>

              {/* 시설 정보 */}
              <div className="p-4 md:p-6">
                {/* 시설명 및 타입 */}
                <div className="mb-2">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-xl font-bold text-[var(--color-text-primary)]">{facility.name}</h3>
                    <span className="px-2 py-1 bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] text-xs rounded">
                      {facility.type}
                    </span>
                  </div>
                </div>

                {/* 평점 */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center">{renderStars(facility.rating)}</div>
                  <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                    {facility.rating}
                  </span>
                  <span className="text-sm text-[var(--color-text-secondary)]">
                    ({facility.reviewCount})
                  </span>
                </div>

                {/* 주소 */}
                <div className="flex items-start gap-2 mb-2">
                  <MapPinIcon className="w-4 h-4 text-[var(--color-text-secondary)] mt-1 flex-shrink-0" />
                  <p className="text-sm text-[var(--color-text-secondary)] flex-1">{facility.address}</p>
                </div>

                {/* 전화번호 */}
                <div className="flex items-center gap-2 mb-2">
                  <PhoneIcon className="w-4 h-4 text-[var(--color-text-secondary)]" />
                  <p className="text-sm text-[var(--color-text-secondary)]">{facility.phone}</p>
                </div>

                {/* 운영시간 */}
                <div className="flex items-center gap-2 mb-3">
                  <ClockIcon className="w-4 h-4 text-[var(--color-text-secondary)]" />
                  <p className="text-sm text-[var(--color-text-secondary)]">{facility.operatingHours}</p>
                </div>

                {/* 편의시설 */}
                {facility.amenities && facility.amenities.length > 0 && (
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-1">
                      {facility.amenities.map((amenity, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)] text-xs rounded"
                        >
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 가격 및 예약 버튼 */}
                <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border-card)]">
                  {facility.price ? (
                    <p className="text-lg font-bold text-[var(--color-blue-primary)]">{facility.price}</p>
                  ) : (
                    <p className="text-sm text-[var(--color-text-secondary)]">가격 문의</p>
                  )}
                  <button
                    onClick={() => handleReservation(facility.id)}
                    className="px-4 py-2 bg-[var(--color-blue-primary)] text-white rounded-lg font-semibold hover:opacity-90 transition-opacity text-sm"
                  >
                    예약하기
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FacilityReservationPage;

