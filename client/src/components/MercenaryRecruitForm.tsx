import React, { useState, useCallback, useEffect } from 'react';
import { XMarkIcon, MagnifyingGlassIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { SPORT_ICONS, SPORT_POINT_COLORS, SPORT_CHIP_STYLES, MAIN_CATEGORIES } from '../constants/sports';
import { EQUIPMENT_OPTIONS } from '../constants/equipment';
import { MERCENARY_RECRUIT_FORM, type RecruitFieldDef } from '../constants/mercenaryRecruitForm';
import { api } from '../utils/api';
import { showSuccess, showError } from '../utils/swal';
import NaverMap from './NaverMap';
import DarkDatePicker from './DarkDatePicker';
import TimeRangeSlider from './TimeRangeSlider';

interface MercenaryRecruitFormProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSport: string;
  onSuccess?: () => void;
}

const SPORT_OPTIONS = (MAIN_CATEGORIES as readonly string[]).filter((c) => c !== '전체');
const TOTAL_STEPS = 4;

const MercenaryRecruitForm: React.FC<MercenaryRecruitFormProps> = ({
  isOpen,
  onClose,
  selectedSport,
  onSuccess,
}) => {
  const isAllMode = selectedSport === '전체';
  const [step, setStep] = useState(1);
  const [modalSport, setModalSport] = useState<string>(() =>
    SPORT_OPTIONS.find((s) => MERCENARY_RECRUIT_FORM[s]) ?? SPORT_OPTIONS[0] ?? '배드민턴'
  );
  const effectiveSport = isAllMode ? modalSport : selectedSport;
  const schema = MERCENARY_RECRUIT_FORM[effectiveSport];
  const pointColor = SPORT_POINT_COLORS[effectiveSport] ?? SPORT_POINT_COLORS['전체'];
  const chipStyle = SPORT_CHIP_STYLES[effectiveSport] ?? SPORT_CHIP_STYLES['전체'];

  const getTodayString = useCallback(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  /** 스키마 기준 기본값: 희망급수/경기방식→상관없음, 포지션→전체 */
  const getDefaultValues = useCallback((sport: string): Record<string, string | string[] | boolean> => {
    const s = MERCENARY_RECRUIT_FORM[sport];
    if (!s?.fields?.length) return {};
    const defaults: Record<string, string | string[] | boolean> = {};
    for (const f of s.fields) {
      if (f.type === 'select') {
        const hasAll = f.options?.some((o) => o.value === '' || o.value === 'all');
        defaults[f.key] = hasAll ? (f.options?.find((o) => o.value === 'all')?.value ?? f.options?.find((o) => o.value === '')?.value ?? '') : '';
      } else if (f.type === 'multiselect' && f.options?.some((o) => o.value === 'all')) {
        defaults[f.key] = ['all'];
      }
    }
    return defaults;
  }, []);

  useEffect(() => {
    if (isOpen && isAllMode) {
      setModalSport(SPORT_OPTIONS.find((s) => MERCENARY_RECRUIT_FORM[s]) ?? SPORT_OPTIONS[0] ?? '배드민턴');
    }
  }, [isOpen, isAllMode]);

  // 종목 변경 시 구인 조건(step4) 기본값 갱신
  useEffect(() => {
    if (!isOpen) return;
    setValues((prev) => ({ ...getDefaultValues(effectiveSport), ...prev }));
  }, [effectiveSport, isOpen, getDefaultValues]);

  useEffect(() => {
    if (!isOpen) return;
    setStep(1);
    const defSport = isAllMode ? (SPORT_OPTIONS.find((s) => MERCENARY_RECRUIT_FORM[s]) ?? SPORT_OPTIONS[0] ?? '배드민턴') : selectedSport;
    setValues(getDefaultValues(defSport));
    setTitle('');
    setLocation('');
    setCoordinates([36.3504, 127.3845]);
    setMeetingDate(getTodayString());
    setMeetingStartTime('18:00');
    setMeetingEndTime('20:00');
    setRecruitCount('1');
    setGenderRestriction('');
    setSelectedEquipment([]);
    setMapKey((k) => k + 1);
  }, [isOpen, getTodayString, isAllMode, selectedSport, getDefaultValues]);

  const [values, setValues] = useState<Record<string, string | string[] | boolean>>({});
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [coordinates, setCoordinates] = useState<[number, number]>([36.3504, 127.3845]);
  const [showMap, setShowMap] = useState(true);
  const [mapKey, setMapKey] = useState(0);
  const [meetingDate, setMeetingDate] = useState(() => getTodayString());
  const [meetingStartTime, setMeetingStartTime] = useState('18:00');
  const [meetingEndTime, setMeetingEndTime] = useState('20:00');
  const [recruitCount, setRecruitCount] = useState('1');
  const [genderRestriction, setGenderRestriction] = useState<'male' | 'female' | ''>('');
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSearchAddress = useCallback(() => {
    const openPostcode = () => {
      if (typeof window !== 'undefined' && (window as any).daum) {
        new (window as any).daum.Postcode({
          oncomplete: (data: any) => {
            let fullAddress = data.address || '';
            let extraAddress = '';
            if (data.addressType === 'R') {
              if (data.bname !== '') extraAddress += data.bname;
              if (data.buildingName !== '') extraAddress += extraAddress ? `, ${data.buildingName}` : data.buildingName;
              fullAddress += extraAddress ? ` (${extraAddress})` : '';
            }
            setLocation(fullAddress);
            setMapKey((k) => k + 1);
          },
          width: '100%',
          height: '100%',
        }).open();
      } else {
        const script = document.createElement('script');
        script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
        script.onload = openPostcode;
        document.head.appendChild(script);
      }
    };
    openPostcode();
  }, []);

  const addressToCoordinates = useCallback(async (address: string): Promise<[number, number] | null> => {
    if (!address?.trim()) return null;
    const trimmed = address.trim();
    const naver = typeof window !== 'undefined' ? (window as any).naver : null;
    if (naver?.maps?.Service?.geocode) {
      try {
        const coords = await new Promise<[number, number] | null>((resolve) => {
          naver.maps.Service.geocode({ query: trimmed }, (status: number, response: any) => {
            if (status === naver.maps.Service.Status.OK && response?.v2?.addresses?.length > 0) {
              const { y, x } = response.v2.addresses[0];
              resolve([parseFloat(y), parseFloat(x)]);
            } else resolve(null);
          });
        });
        return coords;
      } catch {
        return null;
      }
    }
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
            return [parseFloat(y), parseFloat(x)];
          }
        }
      } catch {
        return null;
      }
    }
    return null;
  }, []);

  React.useEffect(() => {
    if (!location?.trim()) return;
    addressToCoordinates(location).then((coords) => {
      if (coords) {
        setCoordinates(coords);
        setShowMap(true);
      }
    });
  }, [location, addressToCoordinates]);

  const handleMarkerDragEnd = useCallback(async (lat: number, lng: number) => {
    setCoordinates([lat, lng]);
    const NAVER_CLIENT_ID = import.meta.env.VITE_NAVER_MAP_CLIENT_ID;
    const NAVER_CLIENT_SECRET = import.meta.env.VITE_NAVER_MAP_CLIENT_SECRET;
    if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) return;
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
      if (!response.ok) return;
      const data = await response.json();
      if (data.status !== 'OK' || !data.results?.length) return;
      const result = data.results[0];
      const region = result.region;
      const roadAddress = result.land?.name;
      let fullAddress = '';
      if (roadAddress && region) {
        const a1 = region.area1?.name || '';
        const a2 = region.area2?.name || '';
        const a3 = region.area3?.name || '';
        fullAddress = `${a1} ${a2} ${a3} ${roadAddress}`.trim();
      } else if (region) {
        const a1 = region.area1?.name || '';
        const a2 = region.area2?.name || '';
        const a3 = region.area3?.name || '';
        const a4 = region.area4?.name || '';
        fullAddress = `${a1} ${a2} ${a3} ${a4}`.trim();
      }
      if (fullAddress) setLocation(fullAddress);
    } catch {
      /* ignore */
    }
  }, []);

  const handleFieldChange = (key: string, value: string | string[] | boolean) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const renderField = (field: RecruitFieldDef) => {
    const value = values[field.key];
    const baseInputClass = 'w-full px-3 py-2.5 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border-card)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] text-sm focus:outline-none focus:ring-2';
    const focusRing = { ['--tw-ring-color' as string]: pointColor };

    if (field.type === 'select') {
      const hasDefaultOpt = (field.options ?? []).some((o) => o.value === '' || o.value === 'all');
      return (
        <select
          value={typeof value === 'string' ? value : (hasDefaultOpt ? (field.options?.find((o) => o.value === 'all')?.value ?? field.options?.find((o) => o.value === '')?.value ?? '') : '')}
          onChange={(e) => handleFieldChange(field.key, e.target.value)}
          className={baseInputClass}
          style={focusRing}
        >
          {!hasDefaultOpt && <option value="">선택해 주세요</option>}
          {(field.options ?? []).map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      );
    }
    if (field.type === 'multiselect') {
      const arr = Array.isArray(value) ? value : [];
      const opts = field.options ?? [];
      const toggle = (v: string) => {
        const next = arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
        handleFieldChange(field.key, next);
      };
      return (
        <div className="flex flex-wrap gap-2">
          {opts.map((o) => {
            const active = arr.includes(o.value);
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => toggle(o.value)}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors border touch-manipulation min-h-[44px] flex items-center ${
                  active ? 'text-white' : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] border-[var(--color-border-card)]'
                }`}
                style={active ? { backgroundColor: pointColor, borderColor: pointColor } : undefined}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      );
    }
    if (field.type === 'checkbox') {
      const checked = value === true;
      return (
        <label className="flex items-center gap-2 cursor-pointer min-h-[44px]">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => handleFieldChange(field.key, e.target.checked)}
            className="w-5 h-5 rounded border-[var(--color-border-card)] text-[var(--color-blue-primary)] focus:ring-2 focus:ring-offset-0"
          />
          <span className="text-sm text-[var(--color-text-secondary)]">제공합니다</span>
        </label>
      );
    }
    return null;
  };

  /** 선택한 경기 일시(날짜+시작시간)가 현재보다 이전이면 true */
  const isMeetingTimeInPast = useCallback(() => {
    if (!meetingDate || !meetingStartTime) return false;
    const [y, m, d] = meetingDate.split('-').map(Number);
    const [hh, mm] = meetingStartTime.split(':').map((v) => parseInt(v, 10) || 0);
    const selected = new Date(y, (m ?? 1) - 1, d ?? 1, hh, mm, 0);
    return selected.getTime() <= Date.now();
  }, [meetingDate, meetingStartTime]);

  const canProceedStep = () => {
    if (step === 1) return title.trim().length > 0 && location.trim().length > 0;
    if (step === 2) return !isMeetingTimeInPast();
    if (step === 3) return true;
    if (step === 4) {
      if (!schema?.fields?.length) return true;
      const required = schema.fields.filter((f) => f.required);
      for (const f of required) {
        const v = values[f.key];
        if (v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)) return false;
      }
      return true;
    }
    return true;
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS && canProceedStep()) setStep((s) => s + 1);
  };
  const handlePrev = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // 아직 마지막 단계가 아니면 다음 단계로만 이동(필수 입력 검사 없음)
    if (step < TOTAL_STEPS) {
      handleNext();
      return;
    }
    if (!schema || schema.fields.length === 0) {
      showError('이 종목은 아직 용병 구인 폼을 지원하지 않습니다.', '안내');
      return;
    }
    const required = schema.fields.filter((f) => f.required);
    for (const f of required) {
      const v = values[f.key];
      if (v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)) {
        showError(`${f.label}을(를) 입력해 주세요.`, '필수 입력');
        return;
      }
    }
    if (!title.trim()) {
      showError('제목을 입력해 주세요.', '필수 입력');
      return;
    }
    if (!location.trim()) {
      showError('장소를 입력해 주세요.', '필수 입력');
      return;
    }
    if (isMeetingTimeInPast()) {
      showError('경기 일시는 현재 시간 이후로 설정해 주세요.', '일시 오류');
      return;
    }

    setIsSubmitting(true);
    try {
      const sportSpecificData: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(values)) {
        if (v === undefined || v === null) continue;
        if (Array.isArray(v)) {
          const filtered = v.filter((x) => x !== 'all');
          if (filtered.length > 0) sportSpecificData[k] = filtered;
        } else {
          // '' 또는 'all'(상관없음)도 전송 — 백엔드에서 유효값으로 처리
          sportSpecificData[k] = v;
        }
      }
      const meetingDateTime = meetingDate && meetingStartTime
        ? `${meetingDate}T${meetingStartTime}:00`
        : meetingDate
          ? `${meetingDate}T18:00:00`
          : undefined;
      const payload = {
        name: title.trim(),
        location: location.trim(),
        latitude: Number(coordinates[0]),
        longitude: Number(coordinates[1]),
        category: effectiveSport,
        meetingDateTime: meetingDateTime || undefined,
        meetingEndTime: meetingDate && meetingEndTime ? meetingEndTime : undefined,
        // 용병 모집: 생성자 포함 총 인원 = 1(본인) + recruitCount(용병 수)
        maxParticipants: 1 + Math.min(19, Math.max(1, parseInt(recruitCount, 10) || 1)),
        sportSpecificData: Object.keys(sportSpecificData).length > 0 ? sportSpecificData : undefined,
        genderRestriction: genderRestriction === 'male' || genderRestriction === 'female' ? genderRestriction : undefined,
        equipment: selectedEquipment.length > 0 ? selectedEquipment : undefined,
        type: 'normal' as const,
        isMercenaryRecruit: true,
      };
      await api.post('/api/groups', payload);
      onClose();
      onSuccess?.();
      await showSuccess('용병 구인 글이 등록되었습니다.', '등록 완료');
    } catch (err: unknown) {
      const errAny = err as { message?: string; response?: { data?: { message?: string | string[] } } };
      const msg =
        errAny?.response?.data?.message
          ? (Array.isArray(errAny.response.data.message) ? errAny.response.data.message[0] : errAny.response.data.message)
          : err instanceof Error ? err.message : '등록에 실패했습니다.';
      showError(String(msg), '등록 실패');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden />
      <div
        className="relative w-full max-w-lg min-h-[55dvh] md:min-h-[50vh] max-h-[90dvh] md:max-h-[85vh] flex flex-col bg-[var(--color-bg-card)] border border-[var(--color-border-card)] rounded-t-2xl md:rounded-2xl shadow-xl overflow-hidden"
        role="dialog"
        aria-labelledby="mercenary-recruit-title"
      >
        {/* 헤더: 제목 + 단계 표시 + 닫기 */}
        <div className="shrink-0 flex items-center justify-between p-4 border-b border-[var(--color-border-card)] bg-[var(--color-bg-card)]">
          <h2 id="mercenary-recruit-title" className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
            <span aria-hidden>{SPORT_ICONS[effectiveSport] ?? '🏃'}</span>
            {effectiveSport} 용병 구하기
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="닫기"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="shrink-0 px-4 pb-2 flex gap-1.5">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`flex-1 h-1.5 rounded-full transition-colors ${s <= step ? '' : 'bg-[var(--color-bg-secondary)]'}`}
              style={s <= step ? { backgroundColor: pointColor } : undefined}
              aria-hidden
            />
          ))}
        </div>

        <form
          onSubmit={handleSubmit}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && step < TOTAL_STEPS) {
              e.preventDefault();
              handleNext();
            }
          }}
          className="flex flex-col flex-1 min-h-0"
        >
          <div className="flex-1 overflow-y-auto px-4 py-4 pb-4">
            {/* Step 1: 종목 + 제목 + 장소 */}
            {step === 1 && (
              <div className="space-y-5 animate-fade-in">
                {isAllMode && (
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">종목 선택</label>
                    <div className="flex flex-wrap gap-2">
                      {SPORT_OPTIONS.map((sport) => {
                        const hasForm = !!MERCENARY_RECRUIT_FORM[sport];
                        const isActive = modalSport === sport;
                        const sportChip = SPORT_CHIP_STYLES[sport] ?? SPORT_CHIP_STYLES['전체'];
                        const sportColor = SPORT_POINT_COLORS[sport] ?? SPORT_POINT_COLORS['전체'];
                        return (
                          <button
                            key={sport}
                            type="button"
                            onClick={() => hasForm && setModalSport(sport)}
                            disabled={!hasForm}
                            className={`flex-shrink-0 px-4 py-2.5 rounded-full text-sm font-medium transition-colors border min-h-[44px] touch-manipulation ${
                              isActive ? `${sportChip.bg} ${sportChip.border} text-[var(--color-text-primary)]` : hasForm ? 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] border-[var(--color-border-card)]' : 'opacity-50 cursor-not-allowed border-[var(--color-border-card)]'
                            }`}
                            style={isActive ? { borderColor: sportColor + '80' } : undefined}
                          >
                            <span className="mr-1" aria-hidden>{SPORT_ICONS[sport] ?? '●'}</span>
                            {sport}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">제목 <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="예: 토요일 오전 배드민턴 A조 구합니다"
                    className="w-full px-4 py-3 rounded-xl bg-[var(--color-bg-primary)] border border-[var(--color-border-card)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] text-base focus:outline-none focus:ring-2 min-h-[48px]"
                    style={{ ['--tw-ring-color' as string]: pointColor }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">장소 <span className="text-red-400">*</span></label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={location}
                      readOnly
                      placeholder="주소 찾기로 위치를 선택하세요"
                      className="flex-1 px-4 py-3 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-card)] text-[var(--color-text-primary)] text-base min-h-[48px] cursor-pointer"
                      onClick={handleSearchAddress}
                      style={{ ['--tw-ring-color' as string]: pointColor }}
                      aria-label="장소 (주소 찾기로 선택)"
                    />
                    <button
                      type="button"
                      onClick={handleSearchAddress}
                      className="px-4 py-3 rounded-xl font-medium text-white shrink-0 flex items-center gap-1.5 min-h-[48px] touch-manipulation"
                      style={{ backgroundColor: pointColor }}
                    >
                      <MagnifyingGlassIcon className="w-5 h-5" aria-hidden />
                      <span className="text-sm">주소 찾기</span>
                    </button>
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)] mb-2">주소 찾기 또는 지도에서 마커를 드래그해 위치를 선택하세요.</p>
                  <button type="button" onClick={() => setShowMap(!showMap)} className="text-xs py-2 -m-1 min-h-[44px] touch-manipulation" style={{ color: pointColor }}>
                    {showMap ? '지도 숨기기' : '지도 보기'}
                  </button>
                  {showMap && (
                    <div className="mt-2 border border-[var(--color-border-card)] rounded-xl overflow-hidden" style={{ height: '200px' }}>
                      <NaverMap key={mapKey} center={coordinates} zoom={11} onMarkerDragEnd={handleMarkerDragEnd} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: 날짜 + 경기 시간 */}
            {step === 2 && (
              <div className="space-y-5 animate-fade-in">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">날짜</label>
                  <DarkDatePicker value={meetingDate} onChange={setMeetingDate} placeholder="연도-월-일" pointColor={pointColor} minDate={new Date()} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">경기 시간</label>
                  <TimeRangeSlider
                    startTime={meetingStartTime}
                    endTime={meetingEndTime}
                    onChange={(start, end) => { setMeetingStartTime(start); setMeetingEndTime(end); }}
                    pointColor={pointColor}
                  />
                </div>
                {meetingStartTime && meetingEndTime && (
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    선택된 시간: <span className="font-semibold" style={{ color: pointColor }}>{meetingStartTime} ~ {meetingEndTime}</span>
                  </p>
                )}
                {isMeetingTimeInPast() && (
                  <p className="text-sm text-red-500 mt-1">
                    경기 일시는 현재 시간 이후로 설정해 주세요.
                  </p>
                )}
              </div>
            )}

            {/* Step 3: 성별 제한 + 모집 인원 */}
            {step === 3 && (
              <div className="space-y-5 animate-fade-in">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">성별 제한</label>
                  <select
                    value={genderRestriction}
                    onChange={(e) => setGenderRestriction(e.target.value as 'male' | 'female' | '')}
                    className="w-full px-4 py-3 rounded-xl bg-[var(--color-bg-primary)] border border-[var(--color-border-card)] text-[var(--color-text-primary)] text-base focus:outline-none focus:ring-2 min-h-[48px]"
                    style={{ ['--tw-ring-color' as string]: pointColor }}
                  >
                    <option value="">상관없음</option>
                    <option value="male">남자만</option>
                    <option value="female">여자만</option>
                  </select>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1">모집할 용병의 성별을 선택하세요.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">모집 인원</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={recruitCount}
                    onChange={(e) => setRecruitCount(e.target.value)}
                    placeholder="1"
                    className="w-full px-4 py-3 rounded-xl bg-[var(--color-bg-primary)] border border-[var(--color-border-card)] text-[var(--color-text-primary)] text-base focus:outline-none focus:ring-2 min-h-[48px]"
                    style={{ ['--tw-ring-color' as string]: pointColor }}
                  />
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1">직접 입력 (1~20명)</p>
                </div>
              </div>
            )}

            {/* Step 4: 구인 조건 + 준비물 */}
            {step === 4 && (
              <div className="space-y-5 animate-fade-in">
                <div className={`pt-3 border-t border-[var(--color-border-card)] ${chipStyle.bg} ${chipStyle.border} border rounded-xl p-4`}>
                  <p className="text-sm font-medium text-[var(--color-text-primary)] mb-3">종목별 구인 조건</p>
                  {EQUIPMENT_OPTIONS[effectiveSport]?.length > 0 && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">준비물</label>
                      <p className="text-xs text-[var(--color-text-secondary)] mb-2">필수 준비물을 갖춘 용병만 참가할 수 있습니다.</p>
                      <div className="flex flex-wrap gap-2">
                        {EQUIPMENT_OPTIONS[effectiveSport].map((o) => {
                          const active = selectedEquipment.includes(o.value);
                          return (
                            <button
                              key={o.value}
                              type="button"
                              onClick={() => setSelectedEquipment((prev) => prev.includes(o.value) ? prev.filter((x) => x !== o.value) : [...prev, o.value])}
                              className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors border touch-manipulation min-h-[44px] flex items-center ${
                                active ? 'text-white' : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] border-[var(--color-border-card)]'
                              }`}
                              style={active ? { backgroundColor: pointColor, borderColor: pointColor } : undefined}
                            >
                              {o.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {!schema || schema.fields.length === 0 ? (
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      {isAllMode ? '위 단계에서 종목을 선택해 주세요.' : '이 종목은 아직 구인 조건을 지원하지 않습니다.'}
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {schema.fields.map((field) => (
                        <div key={field.key}>
                          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                            {field.label} {field.required && <span className="text-red-400">*</span>}
                          </label>
                          {renderField(field)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 하단 버튼: 단계 전환 시에도 여유 있게 */}
          <div className="shrink-0 pt-5 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] border-t border-[var(--color-border-card)] bg-[var(--color-bg-card)]">
            <div className="flex gap-3">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="flex-1 py-3.5 rounded-xl font-semibold text-[var(--color-text-primary)] bg-[var(--color-bg-secondary)] border border-[var(--color-border-card)] flex items-center justify-center gap-1 min-h-[48px] touch-manipulation"
                >
                  <ChevronLeftIcon className="w-5 h-5" />
                  이전
                </button>
              ) : (
                <button type="button" onClick={onClose} className="flex-1 py-3.5 rounded-xl font-semibold text-[var(--color-text-secondary)] bg-[var(--color-bg-secondary)] border border-[var(--color-border-card)] min-h-[48px] touch-manipulation">
                  취소
                </button>
              )}
              {step < TOTAL_STEPS ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleNext();
                  }}
                  disabled={!canProceedStep()}
                  className="flex-[2] py-3.5 rounded-xl font-semibold text-white flex items-center justify-center gap-1 min-h-[48px] touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: pointColor }}
                >
                  다음
                  <ChevronRightIcon className="w-5 h-5" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting || !schema?.fields?.length}
                  className="flex-[2] py-3.5 rounded-xl font-semibold text-white min-h-[48px] touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: pointColor }}
                >
                  {isSubmitting ? '등록 중...' : '등록하기'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
      `}</style>
    </div>
  );
};

export default MercenaryRecruitForm;
