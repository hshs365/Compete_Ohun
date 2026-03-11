import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  BuildingOfficeIcon,
  MapPinIcon,
  PhoneIcon,
  ClockIcon,
  ArrowLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { StarIcon } from '@heroicons/react/24/outline';
import { api } from '../utils/api';
import LoadingSpinner from './LoadingSpinner';
import NaverMap from './NaverMap';

const WEEKDAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

const getImageUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
  return base + url;
};

interface FacilityDetail {
  id: number | string;
  name: string;
  type: string;
  address: string;
  phone: string | null;
  operatingHours: string | null;
  price: string | null;
  description: string | null;
  amenities: string[];
  availableSports?: string[];
  image: string | null;
  images?: string[] | null;
  rating: number;
  reviewCount: number;
  reservationSlotHours?: number;
  latitude?: number | null;
  longitude?: number | null;
  source?: 'public';
}

const DEFAULT_MAP_CENTER: [number, number] = [37.5665, 126.978]; // 서울

const FacilityDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [facility, setFacility] = useState<FacilityDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [calendarReservations, setCalendarReservations] = useState<
    { id: number; reservationDate: string; startTime: string; endTime: string; status: string }[]
  >([]);
  const [calendarLoading, setCalendarLoading] = useState(false);

  const stateFacility = (location.state as { facility?: FacilityDetail })?.facility;
  const isPublicFacility = id === 'detail' && stateFacility;

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError(true);
      return;
    }
    if (isPublicFacility && stateFacility) {
      setFacility({
        ...stateFacility,
        description: stateFacility.description ?? null,
        amenities: stateFacility.amenities ?? [],
        availableSports: stateFacility.availableSports ?? [],
        image: null,
        images: null,
      });
      setLoading(false);
      setError(false);
      return;
    }
    const numId = parseInt(id, 10);
    if (Number.isNaN(numId)) {
      setLoading(false);
      setError(true);
      return;
    }
    setLoading(true);
    setError(false);
    api
      .get<FacilityDetail>(`/api/facilities/${numId}`)
      .then((data) => {
        setFacility(data);
        setSelectedImageIndex(0);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id, isPublicFacility, stateFacility]);

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

  // 사설 시설일 때 1주일 예약 현황 로드
  const isPrivateFacility = facility && facility.source !== 'public' && typeof facility.id === 'number';
  useEffect(() => {
    if (!isPrivateFacility || typeof facility?.id !== 'number') return;
    const today = new Date();
    const startDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const end = new Date(today);
    end.setDate(end.getDate() + 6);
    const endDateStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;
    setCalendarLoading(true);
    api
      .get<{ id: number; reservationDate: string; startTime: string; endTime: string; status: string }[]>(
        `/api/reservations/facility/${facility.id}/calendar?startDate=${startDate}&endDate=${endDateStr}`
      )
      .then((data) => setCalendarReservations(Array.isArray(data) ? data : []))
      .catch(() => setCalendarReservations([]))
      .finally(() => setCalendarLoading(false));
  }, [isPrivateFacility, facility?.id]);

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
      stars.push(<StarIcon key={i} className="w-5 h-5 text-[var(--color-text-secondary)] opacity-60" />);
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
    <div className="flex flex-col w-full bg-[var(--color-bg-primary)]">
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

      <div className="max-w-4xl mx-auto w-full px-4 py-6 space-y-6 pb-12">
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

          </section>

          {/* 사설 시설만: 1주일 예약 현황 캘린더 (인라인) */}
          {facility.source !== 'public' && typeof facility.id === 'number' && (
            <section className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-card)] overflow-hidden">
              <div className="flex items-center gap-2 p-3 border-b border-[var(--color-border-card)]">
                <CalendarDaysIcon className="w-5 h-5 text-[var(--color-text-secondary)]" />
                <p className="text-sm font-medium text-[var(--color-text-primary)]">예약 현황 (1주일)</p>
              </div>
              <div className="p-4">
                {calendarLoading && (
                  <div className="py-6 text-center text-[var(--color-text-secondary)] text-sm">불러오는 중...</div>
                )}
                {!calendarLoading && (() => {
                  const today = new Date();
                  const byDate: Record<string, typeof calendarReservations> = {};
                  calendarReservations.forEach((r) => {
                    if (!byDate[r.reservationDate]) byDate[r.reservationDate] = [];
                    byDate[r.reservationDate].push(r);
                  });
                  const weekDays: { date: string; label: string; dayName: string }[] = [];
                  for (let i = 0; i < 7; i++) {
                    const d = new Date(today);
                    d.setDate(d.getDate() + i);
                    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                    weekDays.push({
                      date: dateStr,
                      label: `${d.getMonth() + 1}/${d.getDate()}`,
                      dayName: WEEKDAY_NAMES[d.getDay()],
                    });
                  }
                  return (
                    <div className="space-y-3">
                      {weekDays.map(({ date, label, dayName }) => (
                        <div
                          key={date}
                          className="rounded-xl border border-[var(--color-border-card)] bg-[var(--color-bg-primary)] p-3"
                        >
                          <div className="text-sm font-medium text-[var(--color-text-primary)] mb-2">
                            {label} ({dayName})
                          </div>
                          {byDate[date]?.length ? (
                            <ul className="space-y-1.5">
                              {[...byDate[date]]
                                .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
                                .map((r) => (
                                  <li key={r.id} className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                                    <ClockIcon className="w-4 h-4 shrink-0" />
                                    <span>
                                      {r.startTime} ~ {r.endTime}
                                      {r.status === 'provisional' && (
                                        <span className="ml-1 text-amber-500">(가예약)</span>
                                      )}
                                    </span>
                                  </li>
                                ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-[var(--color-text-secondary)]">예약 없음</p>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </section>
          )}

          {/* 지도 (축척 표시, zoom 12 ≈ 축척 100m) */}
          <section className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-card)] overflow-hidden">
            <p className="text-sm text-[var(--color-text-secondary)] p-3 border-b border-[var(--color-border-card)]">위치</p>
            <div className="h-[280px] w-full relative">
              <NaverMap
                center={
                  facility.latitude != null && facility.longitude != null
                    ? [facility.latitude, facility.longitude]
                    : DEFAULT_MAP_CENTER
                }
                zoom={12}
                showCenterMarker={false}
                showScaleControl={true}
                markers={
                  facility.latitude != null && facility.longitude != null
                    ? [{ lat: facility.latitude, lng: facility.longitude, name: facility.name }]
                    : []
                }
              />
            </div>
          </section>
      </div>

    </div>
  );
};

export default FacilityDetailPage;
