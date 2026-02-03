import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeftIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  PlusCircleIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { api } from '../utils/api';
import NaverMap from './NaverMap';
import Tooltip from './Tooltip';
import { showError, showSuccess, showWarning } from '../utils/swal';

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
const commonAmenities = ['주차', '샤워실', '락커룸', '매점', '카페', '프로샵', '관람석', '간이탈의실', '수영용품 판매'];

const getUserLocation = (): [number, number] => {
  try {
    const savedLocation = localStorage.getItem('userLocation');
    if (savedLocation) {
      const location = JSON.parse(savedLocation);
      if (location.latitude && location.longitude) return [location.latitude, location.longitude];
    }
  } catch {}
  return [37.5665, 126.9780];
};

const getApiBaseUrl = (): string => {
  if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL;
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')) {
    return 'http://localhost:3000';
  }
  return '';
};

const uploadFacilityImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('image', file);
  const base = getApiBaseUrl();
  const token = localStorage.getItem('remember_me') === 'true'
    ? localStorage.getItem('access_token')
    : sessionStorage.getItem('access_token') || localStorage.getItem('access_token');
  const res = await fetch(`${base}/api/facilities/upload-image`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || '이미지 업로드에 실패했습니다.');
  }
  const text = await res.text();
  try {
    return JSON.parse(text) as string;
  } catch {
    return text.replace(/^"|"$/g, '');
  }
};

const FacilityRegisterPage = () => {
  const navigate = useNavigate();
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
    imageUrls: [] as string[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [mapKey, setMapKey] = useState(0);
  const [mapZoom, setMapZoom] = useState(15);

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

  const handleImageAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setImageUploading(true);
    try {
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const url = await uploadFacilityImage(files[i]);
        urls.push(url);
      }
      setFormData((prev) => ({ ...prev, imageUrls: [...prev.imageUrls, ...urls] }));
    } catch (err: any) {
      await showError(err?.message || '이미지 업로드 실패', '업로드 실패');
    } finally {
      setImageUploading(false);
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, i) => i !== index),
    }));
  };

  const moveImage = (index: number, dir: 'left' | 'right') => {
    const next = index + (dir === 'left' ? -1 : 1);
    if (next < 0 || next >= formData.imageUrls.length) return;
    setFormData((prev) => {
      const arr = [...prev.imageUrls];
      [arr[index], arr[next]] = [arr[next], arr[index]];
      return { ...prev, imageUrls: arr };
    });
  };

  const handleSearchAddress = () => {
    if (typeof window !== 'undefined' && (window as any).daum) {
      new (window as any).daum.Postcode({
        oncomplete: (data: any) => {
          let fullAddress = data.address;
          let extraAddress = '';
          if (data.addressType === 'R') {
            if (data.bname !== '') extraAddress += data.bname;
            if (data.buildingName !== '') extraAddress += extraAddress !== '' ? `, ${data.buildingName}` : data.buildingName;
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
      script.onload = () => handleSearchAddress();
      document.head.appendChild(script);
    }
  };

  const handleAddressToCoordinates = async (address: string) => {
    if (!address?.trim()) return;
    const trimmed = address.trim();
    let coords: [number, number] | null = null;

    // 1) 네이버 지도 JS SDK 지오코더 (브라우저에서 CORS 없이 동작)
    const naver = typeof window !== 'undefined' ? (window as any).naver : null;
    if (naver?.maps?.Service?.geocode) {
      try {
        coords = await new Promise<[number, number] | null>((resolve) => {
          naver.maps.Service.geocode({ query: trimmed }, (status: number, response: any) => {
            if (status === naver.maps.Service.Status.OK && response?.v2?.addresses?.length > 0) {
              const { y, x } = response.v2.addresses[0];
              resolve([parseFloat(y), parseFloat(x)]);
            } else {
              resolve(null);
            }
          });
        });
      } catch (e) {
        console.warn('네이버 지도 지오코더 실패:', e);
      }
    }

    // 2) 카카오 주소 검색 (폴백, 브라우저에서 CORS 허용)
    if (!coords) {
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
              coords = [parseFloat(y), parseFloat(x)];
            }
          }
        } catch (e) {
          console.warn('카카오 주소 검색 실패:', e);
        }
      }
    }

    // 3) 네이버 REST API (서버용, 브라우저에서는 CORS로 실패할 수 있음)
    if (!coords) {
      const NAVER_CLIENT_ID = import.meta.env.VITE_NAVER_MAP_CLIENT_ID;
      const NAVER_CLIENT_SECRET = import.meta.env.VITE_NAVER_MAP_CLIENT_SECRET;
      if (NAVER_CLIENT_ID && NAVER_CLIENT_SECRET) {
        try {
          const response = await fetch(
            `https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(trimmed)}`,
            { headers: { 'X-NCP-APIGW-API-KEY-ID': NAVER_CLIENT_ID, 'X-NCP-APIGW-API-KEY': NAVER_CLIENT_SECRET } }
          );
          if (response.ok) {
            const data = await response.json();
            if (data.status === 'OK' && data.addresses?.length > 0) {
              const { y, x } = data.addresses[0];
              coords = [parseFloat(y), parseFloat(x)];
            }
          }
        } catch (e) {
          console.warn('네이버 REST 지오코드 실패:', e);
        }
      }
    }

    if (coords) {
      setFormData((prev) => ({ ...prev, coordinates: coords!, address }));
      setMapZoom(3);
      setShowMap(true);
      setMapKey((k) => k + 1);
    } else {
      await showError(
        '주소를 좌표로 변환할 수 없습니다. 카카오 개발자 콘솔에서 REST API 키를 발급받아 .env에 VITE_KAKAO_REST_API_KEY 로 설정해 주세요.',
        '주소 변환 실패'
      );
    }
  };

  const handleMarkerDragEnd = async (lat: number, lng: number) => {
    setFormData((prev) => ({ ...prev, coordinates: [lat, lng] }));
    setMapZoom(3);
    const NAVER_CLIENT_ID = import.meta.env.VITE_NAVER_MAP_CLIENT_ID;
    const NAVER_CLIENT_SECRET = import.meta.env.VITE_NAVER_MAP_CLIENT_SECRET;
    if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) return;
    try {
      const response = await fetch(
        `https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode?coords=${lng},${lat}&output=json`,
        { headers: { 'X-NCP-APIGW-API-KEY-ID': NAVER_CLIENT_ID, 'X-NCP-APIGW-API-KEY': NAVER_CLIENT_SECRET } }
      );
      if (!response.ok) return;
      const data = await response.json();
      if (data.status === 'OK' && data.results?.length > 0) {
        const result = data.results[0];
        const region = result.region;
        const roadAddress = result.land?.name;
        let fullAddress = '';
        if (roadAddress && region) {
          fullAddress = [region.area1?.name, region.area2?.name, region.area3?.name, roadAddress].filter(Boolean).join(' ').trim();
        } else if (region) {
          fullAddress = [region.area1?.name, region.area2?.name, region.area3?.name, region.area4?.name].filter(Boolean).join(' ').trim();
        }
        if (fullAddress) setFormData((prev) => ({ ...prev, address: fullAddress }));
      }
    } catch {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.address) {
      await showWarning('시설명과 주소는 필수 입력 항목입니다.', '입력 오류');
      return;
    }
    setIsSubmitting(true);
    try {
      const operatingHours = formData.operatingHoursStart && formData.operatingHoursEnd
        ? `${formData.operatingHoursStart} - ${formData.operatingHoursEnd}` : undefined;
      const priceValue = formData.price?.replace(/,/g, '');
      const priceString = priceValue
        ? `${formData.priceType === 'hourly' ? '시간당' : formData.priceType === 'daily' ? '일일' : formData.priceType === 'monthly' ? '월간' : '패키지'} ${formData.price}원`
        : undefined;
      await api.post('/api/facilities', {
        name: formData.name,
        type: formData.type,
        address: formData.address,
        latitude: formData.coordinates[0],
        longitude: formData.coordinates[1],
        phone: formData.phone || undefined,
        operatingHours,
        reservationSlotHours: formData.reservationSlotHours,
        price: priceString,
        description: formData.description || undefined,
        amenities: formData.amenities,
        availableSports: formData.availableSports,
        ...(formData.imageUrls.length > 0 && { images: formData.imageUrls }),
      });
      await showSuccess('시설이 등록되었습니다.', '시설 등록');
      navigate('/facility-reservation');
    } catch (err) {
      await showError(err instanceof Error ? err.message : '시설 등록에 실패했습니다.', '시설 등록 실패');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 w-full min-h-0 bg-[var(--color-bg-primary)]">
      <header className="flex-shrink-0 border-b border-[var(--color-border-card)] bg-[var(--color-bg-card)]">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-4">
          <Link
            to="/facility-reservation"
            className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-blue-primary)] mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            시설 예약 목록으로
          </Link>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">시설 등록</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            시설 정보를 입력하여 등록해주세요. 등록된 시설은 사용자들이 예약할 수 있습니다.
          </p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto max-w-4xl mx-auto w-full px-4 md:px-6 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-card)] rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">시설 정보</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">시설명 *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full px-4 py-2.5 border border-[var(--color-border-card)] rounded-xl bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
                  placeholder="시설명을 입력해주세요"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                  <BuildingOfficeIcon className="w-4 h-4 inline mr-1" />시설 종류 *
                </label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) => handleChange('type', e.target.value)}
                  className="w-full px-4 py-2.5 border border-[var(--color-border-card)] rounded-xl bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
                >
                  {facilityTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">시설 이미지 <span className="text-[var(--color-text-secondary)] font-normal">(선택)</span></label>
                <div className="flex flex-wrap items-start gap-3">
                  {formData.imageUrls.map((url, index) => (
                    <div key={`${url}-${index}`} className="relative group">
                      <div className="w-28 h-28 rounded-xl overflow-hidden border border-[var(--color-border-card)] bg-[var(--color-bg-secondary)] flex items-center justify-center">
                        <img
                          src={url.startsWith('http') ? url : getApiBaseUrl() + url}
                          alt={`시설 ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-xs font-medium">
                        {index === 0 ? '대표' : index + 1}
                      </span>
                      <div className="absolute -top-1 -right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => moveImage(index, 'left')}
                          disabled={index === 0}
                          className="p-1 rounded bg-[var(--color-bg-card)] border border-[var(--color-border-card)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] disabled:opacity-40 disabled:cursor-not-allowed"
                          title="왼쪽으로"
                        >
                          <ChevronLeftIcon className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveImage(index, 'right')}
                          disabled={index === formData.imageUrls.length - 1}
                          className="p-1 rounded bg-[var(--color-bg-card)] border border-[var(--color-border-card)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] disabled:opacity-40 disabled:cursor-not-allowed"
                          title="오른쪽으로"
                        >
                          <ChevronRightIcon className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="p-1 rounded bg-red-500/90 text-white hover:bg-red-600"
                          title="삭제"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <label className="flex flex-col items-center justify-center w-28 h-28 border-2 border-dashed border-[var(--color-border-card)] rounded-xl cursor-pointer hover:bg-[var(--color-bg-secondary)] hover:border-[var(--color-blue-primary)]/50 transition-colors">
                    <PlusCircleIcon className="w-10 h-10 text-[var(--color-text-secondary)]" />
                    <span className="text-xs text-[var(--color-text-secondary)] mt-1">이미지 추가</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleImageAdd}
                      disabled={imageUploading || isSubmitting}
                    />
                    {imageUploading && <span className="text-xs text-amber-600 mt-0.5">업로드 중...</span>}
                  </label>
                </div>
                {formData.imageUrls.length > 0 && (
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1">{formData.imageUrls.length}장 등록됨</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                  <MapPinIcon className="w-4 h-4 inline mr-1" />위치 *
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    required
                    readOnly
                    value={formData.address}
                    className="flex-1 px-4 py-2.5 border border-[var(--color-border-card)] rounded-xl bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] cursor-not-allowed"
                    placeholder="주소 찾기 버튼을 클릭하거나 지도에서 위치를 선택하세요"
                  />
                  <button
                    type="button"
                    onClick={handleSearchAddress}
                    className="px-4 py-2.5 rounded-xl bg-[var(--color-blue-primary)] text-white font-medium hover:opacity-90 flex items-center gap-2 whitespace-nowrap"
                  >
                    <MagnifyingGlassIcon className="w-4 h-4" />주소 찾기
                  </button>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-[var(--color-text-secondary)]">주소 찾기 또는 지도에서 마커를 드래그하여 위치를 선택하세요.</p>
                  <button type="button" onClick={() => setShowMap(!showMap)} className="text-xs text-[var(--color-blue-primary)] hover:underline">
                    {showMap ? '지도 숨기기' : '지도 보기'}
                  </button>
                </div>
                {showMap && (
                  <div className="mt-2 border border-[var(--color-border-card)] rounded-xl overflow-hidden" style={{ height: '300px' }}>
                    <NaverMap key={mapKey} center={formData.coordinates} zoom={mapZoom} onMarkerDragEnd={handleMarkerDragEnd} />
                  </div>
                )}
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-primary)] mb-1">
                  <PhoneIcon className="w-4 h-4" />전화번호 <span className="text-[var(--color-text-secondary)] font-normal">(선택)</span>
                  <Tooltip content="전화번호는 자동으로 하이픈이 추가됩니다. 숫자만 입력해주세요." />
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^\d]/g, '');
                    let formatted = value;
                    if (value.startsWith('010') || value.startsWith('011') || value.startsWith('016') || value.startsWith('017') || value.startsWith('018') || value.startsWith('019')) {
                      if (value.length > 3) formatted = value.slice(0, 3) + '-' + value.slice(3);
                      if (value.length > 7) formatted = value.slice(0, 3) + '-' + value.slice(3, 7) + '-' + value.slice(7, 11);
                    } else if (value.startsWith('02')) {
                      if (value.length > 2) formatted = value.slice(0, 2) + '-' + value.slice(2);
                      if (value.length > 6) formatted = value.slice(0, 2) + '-' + value.slice(2, 6) + '-' + value.slice(6, 10);
                    } else if (value.length >= 3) {
                      if (value.length > 3) formatted = value.slice(0, 3) + '-' + value.slice(3);
                      if (value.length > 6) formatted = value.slice(0, 3) + '-' + value.slice(3, 6) + '-' + value.slice(6, 10);
                    }
                    handleChange('phone', formatted);
                  }}
                  className="w-full px-4 py-2.5 border border-[var(--color-border-card)] rounded-xl bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
                  placeholder="전화번호를 입력해주세요"
                  maxLength={13}
                />
              </div>
              <div className="flex flex-wrap items-end gap-6">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                    <ClockIcon className="w-4 h-4 inline mr-1" />운영시간 <span className="text-[var(--color-text-secondary)] font-normal">(선택, 30분 단위)</span>
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-[var(--color-text-secondary)] shrink-0">시작</span>
                      <select
                        value={formData.operatingHoursStart.split(':')[0]}
                        onChange={(e) => {
                          const m = (formData.operatingHoursStart.split(':')[1] === '30') ? '30' : '00';
                          handleChange('operatingHoursStart', `${e.target.value}:${m}`);
                        }}
                        className="w-20 px-2 py-1.5 text-sm border border-[var(--color-border-card)] rounded-xl bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
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
                        className="w-14 px-2 py-1.5 text-sm border border-[var(--color-border-card)] rounded-xl bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
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
                        className="w-20 px-2 py-1.5 text-sm border border-[var(--color-border-card)] rounded-xl bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
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
                        className="w-14 px-2 py-1.5 text-sm border border-[var(--color-border-card)] rounded-xl bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
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
                    <ClockIcon className="w-4 h-4 inline mr-1" />예약 단위 <span className="text-[var(--color-text-secondary)] font-normal">(선택)</span>
                  </label>
                  <p className="text-xs text-[var(--color-text-secondary)] mb-1">기본 2시간 단위</p>
                  <select
                    value={formData.reservationSlotHours}
                    onChange={(e) => setFormData((prev) => ({ ...prev, reservationSlotHours: Number(e.target.value) }))}
                    className="w-[120px] px-2 py-1.5 text-sm border border-[var(--color-border-card)] rounded-xl bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
                  >
                    {[1, 2, 3, 4].map((h) => (
                      <option key={h} value={h}>{h}시간</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">가격 <span className="text-[var(--color-text-secondary)] font-normal">(선택)</span></label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {(['hourly', 'daily', 'monthly', 'package'] as const).map((pt) => (
                    <button
                      key={pt}
                      type="button"
                      onClick={() => handleChange('priceType', pt)}
                      className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                        formData.priceType === pt ? 'bg-[var(--color-blue-primary)] text-white' : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-card)]'
                      }`}
                    >
                      {pt === 'hourly' ? '시간당' : pt === 'daily' ? '일일' : pt === 'monthly' ? '월간' : '패키지'}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.price}
                    onChange={(e) => {
                      const numbers = e.target.value.replace(/[^\d]/g, '');
                      handleChange('price', numbers ? parseInt(numbers, 10).toLocaleString() : '');
                    }}
                    className="w-full px-4 py-2.5 pr-12 border border-[var(--color-border-card)] rounded-xl bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
                    placeholder="가격을 입력해주세요"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] text-sm">원</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">시설 설명 <span className="text-[var(--color-text-secondary)] font-normal">(선택)</span></label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className="w-full px-4 py-2.5 border border-[var(--color-border-card)] rounded-xl bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)] resize-none"
                  placeholder="시설에 대한 설명을 작성해주세요..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">가능한 운동 종목 <span className="text-[var(--color-text-secondary)] font-normal">(선택)</span></label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_SPORTS.map((sport) => (
                    <button
                      key={sport}
                      type="button"
                      onClick={() => handleAvailableSportToggle(sport)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        formData.availableSports.includes(sport) ? 'bg-[var(--color-blue-primary)] text-white' : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-card)]'
                      }`}
                    >
                      {sport}{formData.availableSports.includes(sport) && ' ✓'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">편의시설 <span className="text-[var(--color-text-secondary)] font-normal">(선택)</span></label>
                <div className="flex flex-wrap gap-2">
                  {commonAmenities.map((amenity) => (
                    <button
                      key={amenity}
                      type="button"
                      onClick={() => handleAmenityToggle(amenity)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        formData.amenities.includes(amenity) ? 'bg-[var(--color-blue-primary)] text-white' : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-card)]'
                      }`}
                    >
                      {amenity}{formData.amenities.includes(amenity) && ' ✓'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-6 flex gap-3 pt-4 border-t border-[var(--color-border-card)]">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-[var(--color-blue-primary)] text-white font-medium hover:opacity-90 disabled:opacity-50"
              >
                {isSubmitting ? '등록 중...' : '시설 등록'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/facility-reservation')}
                className="px-6 py-2.5 rounded-xl border border-[var(--color-border-card)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]"
              >
                취소
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
};

export default FacilityRegisterPage;
