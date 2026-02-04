import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BuildingOfficeIcon,
  MapPinIcon,
  PhoneIcon,
  ClockIcon,
  ArrowLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { StarIcon } from '@heroicons/react/24/outline';
import { api } from '../utils/api';
import LoadingSpinner from './LoadingSpinner';
import ReservationModal from './ReservationModal';
import { useAuth } from '../contexts/AuthContext';
import { showWarning } from '../utils/swal';

const getImageUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
  return base + url;
};

interface FacilityDetail {
  id: number;
  name: string;
  type: string;
  address: string;
  phone: string | null;
  operatingHours: string | null;
  price: string | null;
  description: string | null;
  amenities: string[];
  availableSports: string[];
  image: string | null;
  images: string[] | null;
  rating: number;
  reviewCount: number;
  reservationSlotHours?: number;
}

const FacilityDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [facility, setFacility] = useState<FacilityDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError(true);
      return;
    }
    setLoading(true);
    setError(false);
    api
      .get<FacilityDetail>(`/api/facilities/${id}`)
      .then((data) => {
        setFacility(data);
        setSelectedImageIndex(0);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  const displayImages = facility?.images?.length
    ? facility.images
    : facility?.image
      ? [facility.image]
      : [];
  const mainImageUrl = displayImages[selectedImageIndex] ?? facility?.image;

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedImageIndex((i) => (i <= 0 ? displayImages.length - 1 : i - 1));
  };
  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedImageIndex((i) => (i >= displayImages.length - 1 ? 0 : i + 1));
  };

  const handleReservation = () => {
    if (!user) {
      showWarning('예약하려면 로그인이 필요합니다.', '로그인 필요');
      return;
    }
    if (facility) setIsReservationModalOpen(true);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    for (let i = 0; i < fullStars; i++) {
      stars.push(<StarIconSolid key={i} className="w-5 h-5 text-yellow-400" />);
    }
    if (hasHalfStar) {
      stars.push(<StarIconSolid key="half" className="w-5 h-5 text-yellow-400 opacity-50" />);
    }
    for (let i = stars.length; i < 5; i++) {
      stars.push(<StarIcon key={i} className="w-5 h-5 text-gray-300" />);
    }
    return stars;
  };

  if (loading) {
    return (
      <div className="flex flex-col flex-1 w-full min-h-0 bg-[var(--color-bg-primary)]">
        <div className="flex items-center justify-center flex-1 min-h-[300px]">
          <LoadingSpinner fullScreen={false} message="시설 정보를 불러오는 중..." />
        </div>
      </div>
    );
  }

  if (error || !facility) {
    return (
      <div className="flex flex-col flex-1 w-full min-h-0 bg-[var(--color-bg-primary)]">
        <div className="p-4 border-b border-[var(--color-border-card)] bg-[var(--color-bg-card)]">
          <button
            type="button"
            onClick={() => navigate('/facility-reservation')}
            className="flex items-center gap-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            시설 목록으로
          </button>
        </div>
        <div className="flex flex-col items-center justify-center flex-1 p-8 text-center">
          <BuildingOfficeIcon className="w-16 h-16 text-[var(--color-text-secondary)] mb-4" />
          <p className="text-[var(--color-text-secondary)] text-lg">시설을 찾을 수 없습니다.</p>
          <button
            type="button"
            onClick={() => navigate('/facility-reservation')}
            className="mt-4 px-4 py-2 bg-[var(--color-blue-primary)] text-white rounded-xl hover:opacity-90"
          >
            목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 w-full min-h-0 bg-[var(--color-bg-primary)]">
      {/* 상단: 뒤로가기 */}
      <div className="flex-shrink-0 border-b border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4">
        <div className="max-w-4xl mx-auto">
          <button
            type="button"
            onClick={() => navigate('/facility-reservation')}
            className="flex items-center gap-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            시설 목록으로
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-12">
          {/* 이미지 갤러리 */}
          <section className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-card)] overflow-hidden">
            <div className="relative aspect-video bg-[var(--color-bg-secondary)]">
              {mainImageUrl ? (
                <img
                  src={getImageUrl(mainImageUrl)}
                  alt={facility.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <BuildingOfficeIcon className="w-24 h-24 text-[var(--color-text-secondary)] opacity-50" />
                </div>
              )}
              {displayImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                  >
                    <ChevronLeftIcon className="w-6 h-6" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                  >
                    <ChevronRightIcon className="w-6 h-6" />
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {displayImages.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelectedImageIndex(i)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          i === selectedImageIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
            {/* 썸네일 목록 (이미지가 2개 이상일 때) */}
            {displayImages.length > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto border-t border-[var(--color-border-card)]">
                {displayImages.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedImageIndex(i)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      i === selectedImageIndex
                        ? 'border-[var(--color-blue-primary)]'
                        : 'border-transparent hover:border-[var(--color-border-card)]'
                    }`}
                  >
                    <img
                      src={getImageUrl(url)}
                      alt={`${facility.name} ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* 기본 정보 */}
          <section className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-card)] p-6">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)]">
                  {facility.name}
                </h1>
                <span className="inline-block mt-2 px-3 py-1 bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] text-sm rounded-lg">
                  {facility.type}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {renderStars(facility.rating)}
                <span className="text-[var(--color-text-primary)] font-semibold">{facility.rating}</span>
                <span className="text-[var(--color-text-secondary)] text-sm">({facility.reviewCount})</span>
              </div>
            </div>

            {facility.price && (
              <p className="text-xl font-bold text-[var(--color-blue-primary)] mb-4">{facility.price}</p>
            )}

            {/* 설명 */}
            {facility.description && (
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-2">설명</h2>
                <p className="text-[var(--color-text-primary)] whitespace-pre-wrap">{facility.description}</p>
              </div>
            )}

            {/* 주소 */}
            <div className="flex items-start gap-3 mb-3">
              <MapPinIcon className="w-5 h-5 text-[var(--color-text-secondary)] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-[var(--color-text-secondary)]">주소</p>
                <p className="text-[var(--color-text-primary)]">{facility.address}</p>
              </div>
            </div>

            {/* 전화번호 */}
            {facility.phone && (
              <div className="flex items-center gap-3 mb-3">
                <PhoneIcon className="w-5 h-5 text-[var(--color-text-secondary)] flex-shrink-0" />
                <div>
                  <p className="text-sm text-[var(--color-text-secondary)]">전화번호</p>
                  <p className="text-[var(--color-text-primary)]">{facility.phone}</p>
                </div>
              </div>
            )}

            {/* 운영시간 */}
            {facility.operatingHours && (
              <div className="flex items-center gap-3 mb-4">
                <ClockIcon className="w-5 h-5 text-[var(--color-text-secondary)] flex-shrink-0" />
                <div>
                  <p className="text-sm text-[var(--color-text-secondary)]">운영시간</p>
                  <p className="text-[var(--color-text-primary)]">{facility.operatingHours}</p>
                </div>
              </div>
            )}

            {/* 가능 종목 */}
            {facility.availableSports?.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-[var(--color-text-secondary)] mb-2">가능 종목</p>
                <div className="flex flex-wrap gap-2">
                  {facility.availableSports.map((s) => (
                    <span
                      key={s}
                      className="px-3 py-1 bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] text-sm rounded-lg"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 편의시설 */}
            {facility.amenities?.length > 0 && (
              <div>
                <p className="text-sm text-[var(--color-text-secondary)] mb-2">편의시설</p>
                <div className="flex flex-wrap gap-2">
                  {facility.amenities.map((a, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] text-sm rounded-lg"
                    >
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 예약하기 버튼 */}
            <div className="mt-6 pt-6 border-t border-[var(--color-border-card)]">
              <button
                type="button"
                onClick={handleReservation}
                className="w-full py-3 px-4 bg-[var(--color-blue-primary)] text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
              >
                예약하기
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* 예약 모달 */}
      <ReservationModal
        isOpen={isReservationModalOpen}
        onClose={() => setIsReservationModalOpen(false)}
        facility={{
          id: facility.id,
          name: facility.name,
          address: facility.address,
          operatingHours: facility.operatingHours,
          price: facility.price,
          facilityType: facility.type,
        }}
        onSuccess={() => setIsReservationModalOpen(false)}
      />
    </div>
  );
};

export default FacilityDetailPage;
