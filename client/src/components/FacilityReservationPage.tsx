import React, { useState } from 'react';
import {
  BuildingOfficeIcon,
  MapPinIcon,
  PhoneIcon,
  ClockIcon,
  StarIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

interface Facility {
  id: number;
  name: string;
  type: '체육센터' | '체육관' | '풋살장' | '테니스장' | '수영장' | '골프연습장' | '기타';
  address: string;
  phone: string;
  operatingHours: string;
  rating: number;
  reviewCount: number;
  price: string;
  image?: string;
  description?: string;
  amenities?: string[];
}

const FacilityReservationPage = () => {
  const [selectedType, setSelectedType] = useState<string>('전체');
  const [selectedArea, setSelectedArea] = useState<string>('전체');
  const [searchQuery, setSearchQuery] = useState('');

  // 샘플 데이터 (실제로는 API에서 가져올 데이터)
  const facilities: Facility[] = [
    {
      id: 1,
      name: '강남 스포츠센터',
      type: '체육센터',
      address: '서울특별시 강남구 테헤란로 123',
      phone: '02-1234-5678',
      operatingHours: '06:00 - 22:00',
      rating: 4.5,
      reviewCount: 128,
      price: '시간당 15,000원',
      description: '다양한 운동 기구와 시설을 갖춘 프리미엄 체육센터',
      amenities: ['주차', '샤워실', '락커룸', '매점'],
    },
    {
      id: 2,
      name: '올림픽공원 풋살장',
      type: '풋살장',
      address: '서울특별시 송파구 올림픽로 240',
      phone: '02-2345-6789',
      operatingHours: '05:00 - 24:00',
      rating: 4.8,
      reviewCount: 245,
      price: '시간당 25,000원',
      description: '인조잔디와 조명시설을 갖춘 실내 풋살장',
      amenities: ['주차', '샤워실', '간이탈의실'],
    },
    {
      id: 3,
      name: '서초 테니스 클럽',
      type: '테니스장',
      address: '서울특별시 서초구 서초대로 456',
      phone: '02-3456-7890',
      operatingHours: '07:00 - 21:00',
      rating: 4.3,
      reviewCount: 92,
      price: '시간당 30,000원',
      description: '코트 4면을 보유한 실내 테니스 클럽',
      amenities: ['주차', '샤워실', '프로샵'],
    },
    {
      id: 4,
      name: '홍대 수영장',
      type: '수영장',
      address: '서울특별시 마포구 홍익로 789',
      phone: '02-4567-8901',
      operatingHours: '06:00 - 23:00',
      rating: 4.6,
      reviewCount: 167,
      price: '시간당 12,000원',
      description: '25m 8레인 실내 수영장',
      amenities: ['주차', '샤워실', '락커룸', '수영용품 판매'],
    },
    {
      id: 5,
      name: '잠실 체육관',
      type: '체육관',
      address: '서울특별시 송파구 올림픽로 300',
      phone: '02-5678-9012',
      operatingHours: '09:00 - 20:00',
      rating: 4.4,
      reviewCount: 103,
      price: '시간당 20,000원',
      description: '농구장, 배구장 등 다목적 체육관',
      amenities: ['주차', '샤워실', '관람석'],
    },
    {
      id: 6,
      name: '강동 골프 연습장',
      type: '골프연습장',
      address: '서울특별시 강동구 천호대로 1234',
      phone: '02-6789-0123',
      operatingHours: '06:00 - 24:00',
      rating: 4.7,
      reviewCount: 89,
      price: '시간당 18,000원',
      description: '2층 구조의 실내 골프 연습장',
      amenities: ['주차', '카페', '프로샵'],
    },
  ];

  const facilityTypes = ['전체', '체육센터', '체육관', '풋살장', '테니스장', '수영장', '골프연습장', '기타'];
  const areas = ['전체', '서울', '경기', '인천', '부산', '대구', '대전', '광주'];

  // 필터링된 시설 목록
  const filteredFacilities = facilities.filter((facility) => {
    const typeMatch = selectedType === '전체' || facility.type === selectedType;
    const areaMatch = selectedArea === '전체' || facility.address.includes(selectedArea);
    const searchMatch = searchQuery === '' || facility.name.toLowerCase().includes(searchQuery.toLowerCase());
    return typeMatch && areaMatch && searchMatch;
  });

  const handleReservation = (facilityId: number) => {
    // TODO: 예약 페이지로 이동 또는 예약 모달 열기
    console.log('예약하기:', facilityId);
    alert(`${facilities.find((f) => f.id === facilityId)?.name} 예약 페이지로 이동합니다.`);
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
      <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] mb-6 md:mb-8">
        시설 예약
      </h1>

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
          총 <span className="font-semibold text-[var(--color-text-primary)]">{filteredFacilities.length}</span>
          개의 시설이 있습니다.
        </p>
      </div>

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
                  <p className="text-lg font-bold text-[var(--color-blue-primary)]">{facility.price}</p>
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

