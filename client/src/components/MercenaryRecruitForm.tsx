import React, { useState, useCallback, useEffect } from 'react';
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { SPORT_ICONS, SPORT_POINT_COLORS, SPORT_CHIP_STYLES, MAIN_CATEGORIES } from '../constants/sports';
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

const MercenaryRecruitForm: React.FC<MercenaryRecruitFormProps> = ({
  isOpen,
  onClose,
  selectedSport,
  onSuccess,
}) => {
  const isAllMode = selectedSport === '전체';
  const [modalSport, setModalSport] = useState<string>(() =>
    SPORT_OPTIONS.find((s) => MERCENARY_RECRUIT_FORM[s]) ?? SPORT_OPTIONS[0] ?? '배드민턴'
  );
  const effectiveSport = isAllMode ? modalSport : selectedSport;
  const schema = MERCENARY_RECRUIT_FORM[effectiveSport];
  const pointColor = SPORT_POINT_COLORS[effectiveSport] ?? SPORT_POINT_COLORS['전체'];
  const chipStyle = SPORT_CHIP_STYLES[effectiveSport] ?? SPORT_CHIP_STYLES['전체'];

  useEffect(() => {
    if (isOpen && isAllMode) {
      setModalSport(SPORT_OPTIONS.find((s) => MERCENARY_RECRUIT_FORM[s]) ?? SPORT_OPTIONS[0] ?? '배드민턴');
    }
  }, [isOpen, isAllMode]);

  /** 모달 열릴 때 폼 초기화 */
  useEffect(() => {
    if (!isOpen) return;
    setValues({});
    setTitle('');
    setLocation('');
    setCoordinates([36.3504, 127.3845]);
    setMeetingDate('');
    setMeetingStartTime('18:00');
    setMeetingEndTime('20:00');
    setRecruitCount('1');
    setGenderRestriction('');
    setMapKey((k) => k + 1);
  }, [isOpen]);

  const [values, setValues] = useState<Record<string, string | string[] | boolean>>({});
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [coordinates, setCoordinates] = useState<[number, number]>([36.3504, 127.3845]);
  const [showMap, setShowMap] = useState(true);
  const [mapKey, setMapKey] = useState(0);
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingStartTime, setMeetingStartTime] = useState('18:00');
  const [meetingEndTime, setMeetingEndTime] = useState('20:00');
  const [recruitCount, setRecruitCount] = useState('1');
  const [genderRestriction, setGenderRestriction] = useState<'male' | 'female' | ''>('');
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
      return (
        <select
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => handleFieldChange(field.key, e.target.value)}
          className={baseInputClass}
          style={focusRing}
        >
          <option value="">선택해 주세요</option>
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
                className={`px-4 py-3 sm:py-1.5 rounded-lg text-sm font-medium transition-colors border touch-manipulation min-h-[44px] sm:min-h-0 flex items-center ${
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
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => handleFieldChange(field.key, e.target.checked)}
            className="w-4 h-4 rounded border-[var(--color-border-card)] text-[var(--color-blue-primary)] focus:ring-2 focus:ring-offset-0"
          />
          <span className="text-sm text-[var(--color-text-secondary)]">제공합니다</span>
        </label>
      );
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

    setIsSubmitting(true);
    try {
      const sportSpecificData: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(values)) {
        if (v !== undefined && v !== null && v !== '') {
          if (Array.isArray(v)) {
            sportSpecificData[k] = v.length > 0 ? v : undefined;
          } else {
            sportSpecificData[k] = v;
          }
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
        maxParticipants: Math.min(20, Math.max(1, parseInt(recruitCount, 10) || 1)),
        sportSpecificData: Object.keys(sportSpecificData).length > 0 ? sportSpecificData : undefined,
        genderRestriction: genderRestriction === 'male' || genderRestriction === 'female' ? genderRestriction : undefined,
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
        className="relative w-full max-w-lg max-h-[85vh] md:max-h-[90vh] overflow-y-auto bg-[var(--color-bg-card)] border border-[var(--color-border-card)] rounded-t-2xl md:rounded-2xl shadow-xl pb-[env(safe-area-inset-bottom,0)]"
        role="dialog"
        aria-labelledby="mercenary-recruit-title"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-[var(--color-border-card)] bg-[var(--color-bg-card)]">
          <h2 id="mercenary-recruit-title" className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
            <span aria-hidden>{SPORT_ICONS[effectiveSport] ?? '🏃'}</span>
            {effectiveSport} 용병 구하기
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-3 -m-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="닫기"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
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
                      className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                        isActive
                          ? `${sportChip.bg} ${sportChip.border} ${sportChip.text}`
                          : hasForm
                            ? 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] border-[var(--color-border-card)] hover:border-opacity-70'
                            : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] opacity-50 border-[var(--color-border-card)] cursor-not-allowed'
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
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">제목 *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 토요일 오전 배드민턴 A조 구합니다"
              className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border-card)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] text-sm focus:outline-none focus:ring-2"
              style={{ ['--tw-ring-color' as string]: pointColor }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">장소 *</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={location}
                readOnly
                placeholder="주소 찾기로 위치를 선택하세요"
                className="flex-1 px-3 py-2.5 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border-card)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] text-sm focus:outline-none cursor-pointer"
                onClick={handleSearchAddress}
                style={{ ['--tw-ring-color' as string]: pointColor }}
                aria-label="장소 (주소 찾기로 선택)"
              />
              <button
                type="button"
                onClick={handleSearchAddress}
                className="px-4 py-2.5 rounded-lg font-medium text-white shrink-0 flex items-center gap-1"
                style={{ backgroundColor: pointColor }}
              >
                <MagnifyingGlassIcon className="w-5 h-5" aria-hidden />
                <span className="text-sm">주소 찾기</span>
              </button>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] mb-2">
              주소 찾기 버튼을 클릭하거나 지도에서 마커를 드래그하여 위치를 선택하세요. (직접 입력 불가)
            </p>
            <button
              type="button"
              onClick={() => setShowMap(!showMap)}
              className="text-xs mb-2 py-2 px-1 -m-1 touch-manipulation min-h-[44px] flex items-center"
              style={{ color: pointColor }}
            >
              {showMap ? '지도 숨기기' : '지도 보기'}
            </button>
            {showMap && (
              <div className="mt-2 border border-[var(--color-border-card)] rounded-lg overflow-hidden" style={{ height: '220px' }}>
                <NaverMap
                  key={mapKey}
                  center={coordinates}
                  zoom={11}
                  onMarkerDragEnd={handleMarkerDragEnd}
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">날짜</label>
            <DarkDatePicker
              value={meetingDate}
              onChange={setMeetingDate}
              placeholder="연도-월-일"
              pointColor={pointColor}
              minDate={new Date()}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">경기 시간</label>
            <TimeRangeSlider
              startTime={meetingStartTime}
              endTime={meetingEndTime}
              onChange={(start, end) => {
                setMeetingStartTime(start);
                setMeetingEndTime(end);
              }}
              pointColor={pointColor}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">성별 제한</label>
            <select
              value={genderRestriction}
              onChange={(e) => setGenderRestriction(e.target.value as 'male' | 'female' | '')}
              className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border-card)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:ring-2"
              style={{ ['--tw-ring-color' as string]: pointColor }}
            >
              <option value="">상관없음</option>
              <option value="male">남자만</option>
              <option value="female">여자만</option>
            </select>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">모집할 용병의 성별을 선택하세요.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">모집 인원</label>
            <input
              type="number"
              min={1}
              max={20}
              value={recruitCount}
              onChange={(e) => setRecruitCount(e.target.value)}
              placeholder="1"
              className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border-card)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] text-sm focus:outline-none focus:ring-2"
              style={{ ['--tw-ring-color' as string]: pointColor }}
            />
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">직접 입력 (1~20명)</p>
          </div>

          <div className={`pt-3 border-t border-[var(--color-border-card)] ${chipStyle.bg} ${chipStyle.border} border rounded-xl p-4`}>
            <p className="text-sm font-medium text-[var(--color-text-primary)] mb-3">종목별 구인 조건</p>
            {!schema || schema.fields.length === 0 ? (
              <p className="text-sm text-[var(--color-text-secondary)]">
                {isAllMode ? '위에서 종목을 선택해 주세요.' : '이 종목은 아직 구인 조건을 지원하지 않습니다.'}
              </p>
            ) : (
            <div className="space-y-3">
              {schema.fields.map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
                    {field.label} {field.required && <span className="text-red-400">*</span>}
                  </label>
                  {renderField(field)}
                </div>
              ))}
            </div>
            )}
          </div>

          {meetingStartTime && meetingEndTime && (
            <p className="text-sm text-[var(--color-text-secondary)]">
              선택된 시간: <span className="font-semibold" style={{ color: pointColor }}>{meetingStartTime} ~ {meetingEndTime}</span>
            </p>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl font-medium border border-[var(--color-border-card)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !schema || schema.fields.length === 0}
              className="flex-1 py-2.5 rounded-xl font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: pointColor }}
            >
              {isSubmitting ? '등록 중...' : '등록하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MercenaryRecruitForm;
