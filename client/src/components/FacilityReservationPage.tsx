import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BuildingOfficeIcon,
  MapPinIcon,
  PhoneIcon,
  ClockIcon,
  StarIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { KOREAN_CITIES, getRegionDisplayName, getUserCity } from '../utils/locationUtils';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import CreateFacilityModal from './CreateFacilityModal';
import { showWarning, showSuccess, showError } from '../utils/swal';

const getImageUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
  return base + url;
};

/** DB 시설 또는 공공데이터 시설 (id가 string이면 공공) */
interface Facility {
  id: number | string;
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
  reservationSlotHours?: number;
  availableSports?: string[];
  source?: 'public';
  /** 공공데이터 관리기관명 */
  managerName?: string | null;
}

const FacilityReservationPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedSport, setSelectedSport] = useState<string>('전체');
  const [selectedArea, setSelectedArea] = useState<string>('전체');
  const [searchQuery, setSearchQuery] = useState('');
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<{ businessNumberVerified?: boolean; isAdmin?: boolean } | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'my'>('all');
  const [myFacilities, setMyFacilities] = useState<Facility[]>([]);
  const [isLoadingMy, setIsLoadingMy] = useState(false);
  const [editFacility, setEditFacility] = useState<Facility | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [publicPage, setPublicPage] = useState(1);
  const [hasMorePublic, setHasMorePublic] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // 사용자 프로필 정보 가져오기 (사업자번호 검증 여부 확인)
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const profile = await api.get<{ businessNumberVerified?: boolean; isAdmin?: boolean }>('/api/auth/me');
        setUserProfile(profile);
      } catch (error) {
        console.error('사용자 프로필 조회 실패:', error);
      }
    };
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  // 로그인 사용자의 지역 기반 기본 선택
  useEffect(() => {
    if (user?.id) {
      const city = getUserCity(user.id);
      if (city) setSelectedArea(city);
    }
  }, [user?.id]);

  // 시설 목록: DB 시설 + 공공데이터 API 병렬 호출 후 합쳐서 표시 (공공 API 실패 시에도 등록 시설은 노출)
  useEffect(() => {
    const fetchFacilities = async () => {
      setIsLoading(true);
      setPublicPage(1);
      const queryParams = new URLSearchParams();
      if (searchQuery.trim()) queryParams.append('search', searchQuery.trim());
      if (selectedSport && selectedSport !== '전체') queryParams.append('category', selectedSport);
      if (selectedArea && selectedArea !== '전체') queryParams.append('area', selectedArea);
      queryParams.append('page', '1');
      queryParams.append('limit', '9');

      const publicParams = queryParams.toString();

      try {
        const [dbRes, publicRes] = await Promise.allSettled([
          api.get<{ facilities: Facility[]; total: number }>(`/api/facilities?${publicParams}`),
          api.get<{ facilities: Facility[]; total: number; hasMore: boolean }>(
            `/api/facilities/public?${publicParams}`
          ),
        ]);

        const dbList: Facility[] =
          dbRes.status === 'fulfilled' && dbRes.value?.facilities
            ? dbRes.value.facilities
            : [];
        const publicList: Facility[] =
          publicRes.status === 'fulfilled' && publicRes.value?.facilities
            ? publicRes.value.facilities
            : [];
        if (publicRes.status === 'rejected') {
          console.warn('공공 시설 API 조회 실패:', publicRes.reason);
        }

        setFacilities([...dbList, ...publicList]);
        setHasMorePublic(
          publicRes.status === 'fulfilled' ? (publicRes.value?.hasMore ?? false) : false
        );
      } catch (error) {
        console.error('시설 목록 조회 실패:', error);
        setFacilities([]);
        setHasMorePublic(false);
      } finally {
        setIsLoading(false);
      }
    };

    if (viewMode === 'all') fetchFacilities();
  }, [viewMode, selectedSport, selectedArea, searchQuery]);

  // 공공 시설 더 불러오기 (페이지네이션)
  const loadMorePublic = async () => {
    if (loadingMore || !hasMorePublic) return;
    setLoadingMore(true);
    try {
      const nextPage = publicPage + 1;
      const queryParams = new URLSearchParams();
      if (searchQuery.trim()) queryParams.append('search', searchQuery.trim());
      if (selectedSport && selectedSport !== '전체') queryParams.append('category', selectedSport);
      if (selectedArea && selectedArea !== '전체') queryParams.append('area', selectedArea);
      queryParams.append('page', String(nextPage));
      queryParams.append('limit', '9');

      const response = await api.get<{ facilities: Facility[]; hasMore: boolean }>(
        `/api/facilities/public?${queryParams.toString()}`
      );
      const list = response.facilities || [];
      setFacilities((prev) => [...prev, ...list]);
      setHasMorePublic(response.hasMore ?? false);
      setPublicPage(nextPage);
    } catch (error) {
      console.error('시설 추가 조회 실패:', error);
      setHasMorePublic(false);
    } finally {
      setLoadingMore(false);
    }
  };

  // 내 시설 목록 (viewMode === 'my'이고 로그인 시)
  useEffect(() => {
    if (viewMode !== 'my' || !user) {
      setMyFacilities([]);
      return;
    }
    const fetchMyFacilities = async () => {
      setIsLoadingMy(true);
      try {
        const list = await api.get<Facility[]>('/api/facilities/my');
        setMyFacilities(Array.isArray(list) ? list : []);
      } catch (error) {
        console.error('내 시설 목록 조회 실패:', error);
        setMyFacilities([]);
      } finally {
        setIsLoadingMy(false);
      }
    };
    fetchMyFacilities();
  }, [viewMode, user]);

  // 필터링된 시설 목록 (전체 vs 내 시설)
  const filteredFacilities = viewMode === 'my' ? myFacilities : facilities;
  const isLoadingList = viewMode === 'my' ? isLoadingMy : isLoading;

  const handleDeleteFacility = async (facility: Facility) => {
    if (!user) return;
    const confirmed = window.confirm(`"${facility.name}" 시설을 삭제하시겠습니까? 삭제된 시설은 목록에 표시되지 않습니다.`);
    if (!confirmed) return;
    try {
      await api.delete(`/api/facilities/${facility.id}`);
      setMyFacilities((prev) => prev.filter((f) => f.id !== facility.id));
      await showSuccess('시설이 삭제되었습니다.', '시설 삭제');
    } catch (error) {
      console.error('시설 삭제 실패:', error);
      await showError(error instanceof Error ? error.message : '시설 삭제에 실패했습니다.', '시설 삭제 실패');
    }
  };

  const handleCardClick = (facility: Facility) => {
    const isPublic = typeof facility.id === 'string' || (facility as Facility & { source?: string }).source === 'public';
    if (isPublic) {
      navigate('/facility-reservation/detail', { state: { facility } });
    } else {
      navigate(`/facility-reservation/${facility.id}`);
    }
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
    <div className="flex flex-col w-full bg-[var(--color-bg-primary)]">
      {/* 히어로 / 상단 배너 (스포츠용품 페이지와 동일 스타일) */}
      <header className="flex-shrink-0 bg-[var(--color-bg-card)] border-b border-[var(--color-border-card)]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
            <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)]">
              시설
            </h1>
            {(userProfile?.businessNumberVerified || userProfile?.isAdmin) && (
              <button
                type="button"
                onClick={() => navigate('/facility-reservation/register')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl font-semibold transition-all border-2 border-[var(--color-blue-primary)] text-[var(--color-blue-primary)] bg-transparent hover:bg-[var(--color-blue-primary)] hover:text-white"
              >
                <PlusIcon className="w-5 h-5" />
                시설 등록
              </button>
            )}
          </div>
          <p className="text-[var(--color-text-secondary)] mb-4 max-w-2xl">
            지역과 종목으로 시설을 찾고 예약하세요.
          </p>
          {/* 전체 시설 / 내 시설 탭 (시설 등록 가능 사용자만) */}
          {(userProfile?.businessNumberVerified || userProfile?.isAdmin) && (
            <div className="flex gap-2 mb-6">
              <button
                type="button"
                onClick={() => setViewMode('all')}
                className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                  viewMode === 'all'
                    ? 'bg-[var(--color-blue-primary)] text-white'
                    : 'bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)] border border-[var(--color-border-card)] hover:border-[var(--color-blue-primary)]/50'
                }`}
              >
                전체 시설
              </button>
              <button
                type="button"
                onClick={() => setViewMode('my')}
                className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                  viewMode === 'my'
                    ? 'bg-[var(--color-blue-primary)] text-white'
                    : 'bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)] border border-[var(--color-border-card)] hover:border-[var(--color-blue-primary)]/50'
                }`}
              >
                내 시설
              </button>
            </div>
          )}
          {/* 검색 바 (전체 시설일 때만 표시) */}
          {viewMode === 'all' && (
            <div className="relative max-w-xl mb-6">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-secondary)]" />
              <input
                type="text"
                placeholder="시설명으로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-3 pl-12 pr-4 border border-[var(--color-border-card)] rounded-xl bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
              />
            </div>
          )}
          {/* 필터 (전체 시설일 때만 표시) */}
          {viewMode === 'all' && (
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-[var(--color-text-primary)]">종목</span>
              <select
                value={selectedSport}
                onChange={(e) => setSelectedSport(e.target.value)}
                className="py-2.5 pl-4 pr-10 border border-[var(--color-border-card)] rounded-xl bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)] appearance-none bg-no-repeat bg-[length:1rem_1rem] bg-[right_0.75rem_center]"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")` }}
              >
                <option value="전체">전체</option>
                <option value="축구">축구</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-[var(--color-text-primary)]">지역</span>
              <select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                className="py-2.5 pl-4 pr-10 border border-[var(--color-border-card)] rounded-xl bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)] appearance-none bg-no-repeat bg-[length:1rem_1rem] bg-[right_0.75rem_center]"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")` }}
              >
                {KOREAN_CITIES.map((city) => (
                  <option key={city} value={city}>{getRegionDisplayName(city)}</option>
                ))}
              </select>
            </div>
          </div>
          )}
        </div>
      </header>

      {/* 메인: 결과 개수 + 시설 그리드 (전체 스크롤에 맞춤) */}
      <div className="max-w-7xl mx-auto w-full px-4 md:px-6 py-6">
        <div className="mb-4">
          <p className="text-[var(--color-text-secondary)] text-sm">
            {isLoadingList ? '시설 목록을 불러오는 중...' : (
              <>총 <span className="font-semibold text-[var(--color-text-primary)]">{filteredFacilities.length}</span>개의 시설이 있습니다.</>
            )}
          </p>
        </div>

        {isEditModalOpen && (
          <CreateFacilityModal
            isOpen={isEditModalOpen}
            onClose={() => { setIsEditModalOpen(false); setEditFacility(null); }}
            onSuccess={() => {
              setIsEditModalOpen(false);
              setEditFacility(null);
              if (viewMode === 'my') {
                api.get<Facility[]>('/api/facilities/my').then((list) =>
                  setMyFacilities(Array.isArray(list) ? list : []),
                ).catch(() => setMyFacilities([]));
              }
            }}
            facility={editFacility ?? undefined}
          />
        )}

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
              key={String(facility.id)}
              role="button"
              tabIndex={0}
              onClick={() => handleCardClick(facility)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleCardClick(facility);
                }
              }}
              className="bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border-card)] overflow-hidden hover:shadow-lg hover:border-[var(--color-blue-primary)]/20 transition-all cursor-pointer"
            >
              {/* 시설 이미지 */}
              <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                {facility.image ? (
                  <img src={getImageUrl(facility.image)} alt={facility.name} className="w-full h-full object-cover" />
                ) : (
                  <BuildingOfficeIcon className="w-24 h-24 text-white opacity-50" />
                )}
              </div>

              {/* 시설 정보 */}
              <div className="p-4 md:p-6">
                {/* 시설명, 구분(공공/사설), 타입 */}
                <div className="mb-2">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span
                      className={`px-2 py-0.5 text-xs font-semibold rounded ${
                        facility.source === 'public'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      }`}
                    >
                      {facility.source === 'public' ? '공공' : '사설'}
                    </span>
                    <span className="px-2 py-1 bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] text-xs rounded">
                      {facility.type}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-[var(--color-text-primary)]">{facility.name}</h3>
                </div>

                {/* 평점 (공공데이터는 별점/리뷰 미제공 → 공공 카드에서는 미표시) */}
                {facility.source !== 'public' && (
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center">{renderStars(facility.rating)}</div>
                    <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                      {facility.rating}
                    </span>
                    <span className="text-sm text-[var(--color-text-secondary)]">
                      ({facility.reviewCount})
                    </span>
                  </div>
                )}

                {/* 주소 */}
                <div className="flex items-start gap-2 mb-2">
                  <MapPinIcon className="w-4 h-4 text-[var(--color-text-secondary)] mt-1 flex-shrink-0" />
                  <p className="text-sm text-[var(--color-text-secondary)] flex-1">{facility.address}</p>
                </div>

                {/* 전화번호 (값 있을 때만 표시, 공공데이터는 미제공인 경우 많음) */}
                {facility.phone && (
                  <div className="flex items-center gap-2 mb-2">
                    <PhoneIcon className="w-4 h-4 text-[var(--color-text-secondary)]" />
                    <p className="text-sm text-[var(--color-text-secondary)]">{facility.phone}</p>
                  </div>
                )}

                {/* 운영시간 (값 있을 때만 표시) */}
                {facility.operatingHours && (
                  <div className="flex items-center gap-2 mb-2">
                    <ClockIcon className="w-4 h-4 text-[var(--color-text-secondary)]" />
                    <p className="text-sm text-[var(--color-text-secondary)]">{facility.operatingHours}</p>
                  </div>
                )}

                {/* 관리기관 (공공데이터에 있을 때만 표시) */}
                {facility.source === 'public' && facility.managerName && (
                  <div className="flex items-center gap-2 mb-3">
                    <BuildingOfficeIcon className="w-4 h-4 text-[var(--color-text-secondary)]" />
                    <p className="text-sm text-[var(--color-text-secondary)]">관리기관: {facility.managerName}</p>
                  </div>
                )}

                {/* 편의시설 (공공데이터는 편의시설 항목 미표시) */}
                {facility.source !== 'public' && facility.amenities && facility.amenities.length > 0 && (
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

                {/* 가격 및 수정/삭제 (공공 시설은 가격·버튼 영역 미표시) */}
                {facility.source !== 'public' && (
                  <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border-card)]">
                    {facility.price ? (
                      <p className="text-lg font-bold text-[var(--color-blue-primary)]">{facility.price}</p>
                    ) : (
                      <p className="text-sm text-[var(--color-text-secondary)]">가격 문의</p>
                    )}
                    <div className="flex items-center gap-2">
                      {viewMode === 'my' ? (
                        <>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setEditFacility(facility); setIsEditModalOpen(true); }}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium text-sm border border-[var(--color-border-card)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] transition-colors"
                          >
                            <PencilSquareIcon className="w-4 h-4" />
                            수정
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleDeleteFacility(facility); }}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium text-sm border border-red-500/50 text-red-500 bg-transparent hover:bg-red-500/10 transition-colors"
                          >
                            <TrashIcon className="w-4 h-4" />
                            삭제
                          </button>
                        </>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        )}
        {viewMode === 'all' && hasMorePublic && (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={loadMorePublic}
              disabled={loadingMore}
              className="px-6 py-3 border border-[var(--color-border-card)] rounded-xl text-[var(--color-text-primary)] font-medium hover:bg-[var(--color-bg-secondary)] disabled:opacity-50 transition-colors"
            >
              {loadingMore ? '불러오는 중...' : '더 보기'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FacilityReservationPage;

