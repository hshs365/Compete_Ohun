import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { XMarkIcon, CalendarDaysIcon, ClockIcon, UsersIcon, PhoneIcon, ChatBubbleLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { api } from '../utils/api';
import { showError, showSuccess } from '../utils/swal';

const SPORT_OPTIONS = ['축구', '풋살', '농구', '배드민턴', '테니스', '수영', '골프', '탁구', '배구', '기타'] as const;
const MATCH_TYPE_OPTIONS: { value: 'general' | 'rank' | 'event'; label: string }[] = [
  { value: 'general', label: '일반 매치' },
  { value: 'rank', label: '랭크매치' },
  { value: 'event', label: '이벤트매치' },
];

/** 시설 종류 → 종목 기본값 */
function getDefaultSportFromFacilityType(facilityType?: string | null): string {
  if (!facilityType) return '축구';
  if (facilityType.includes('축구')) return '축구';
  if (facilityType.includes('풋살')) return '풋살';
  if (facilityType.includes('농구') || facilityType === '체육관') return '농구';
  if (facilityType.includes('배드민턴')) return '배드민턴';
  if (facilityType.includes('테니스')) return '테니스';
  if (facilityType.includes('수영')) return '수영';
  if (facilityType.includes('골프')) return '골프';
  if (facilityType.includes('탁구')) return '탁구';
  if (facilityType.includes('배구')) return '배구';
  return '축구';
}

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  facility: {
    id: number;
    name: string;
    address: string;
    operatingHours?: string | null;
    price?: string | null;
    facilityType?: string | null;
  };
  onSuccess?: () => void;
}

const ReservationModal: React.FC<ReservationModalProps> = ({
  isOpen,
  onClose,
  facility,
  onSuccess,
}) => {
  const navigate = useNavigate();
  const modalMouseDownRef = useRef<{ x: number; y: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateMatchStep, setShowCreateMatchStep] = useState(false);
  const [createMatchSport, setCreateMatchSport] = useState<string>('축구');
  const [createMatchType, setCreateMatchType] = useState<'general' | 'rank' | 'event'>('general');

  useEffect(() => {
    if (isOpen) {
      setShowCreateMatchStep(false);
      setCreateMatchSport(getDefaultSportFromFacilityType(facility.facilityType));
      setCreateMatchType('general');
    }
  }, [isOpen, facility.facilityType]);

  // 오늘 날짜 기본값
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const [formData, setFormData] = useState({
    reservationDate: todayStr,
    startTime: '10:00',
    endTime: '12:00',
    numberOfPeople: 1,
    contactPhone: '',
    memo: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // 예약하기 클릭 시 매치 생성 여부 선택 단계로
    setShowCreateMatchStep(true);
  };

  const handleGoToCreateMatch = () => {
    navigate('/', { state: { openCreate: true, matchType: createMatchType, category: createMatchSport } });
    onClose();
  };

  if (!isOpen) return null;

  // 시간 옵션 생성 (06:00 ~ 23:00)
  const timeOptions: string[] = [];
  for (let h = 6; h <= 23; h++) {
    timeOptions.push(`${String(h).padStart(2, '0')}:00`);
    timeOptions.push(`${String(h).padStart(2, '0')}:30`);
  }

  return (
    <div
      className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          modalMouseDownRef.current = { x: e.clientX, y: e.clientY };
        }
      }}
      onMouseUp={(e) => {
        if (e.target === e.currentTarget && modalMouseDownRef.current) {
          const dx = e.clientX - modalMouseDownRef.current.x;
          const dy = e.clientY - modalMouseDownRef.current.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < 5) {
            onClose();
          }
          modalMouseDownRef.current = null;
        }
      }}
    >
      <div
        className="bg-[var(--color-bg-card)] rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-[var(--color-border-card)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="sticky top-0 bg-[var(--color-bg-card)] border-b border-[var(--color-border-card)] p-4 md:p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-[var(--color-text-primary)]">
              {showCreateMatchStep ? '매치 생성' : '시설 예약'}
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">{facility.name}</p>
          </div>
          <button
            onClick={() => (showCreateMatchStep ? setShowCreateMatchStep(false) : onClose())}
            className="p-2 hover:bg-[var(--color-bg-secondary)] rounded-lg transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-[var(--color-text-primary)]" />
          </button>
        </div>

        {showCreateMatchStep ? (
          <div className="p-4 md:p-6 space-y-5">
            <p className="text-[var(--color-text-primary)] font-medium">매치를 생성하시겠습니까?</p>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">종목 선택</label>
              <select
                value={createMatchSport}
                onChange={(e) => setCreateMatchSport(e.target.value)}
                className="w-full px-4 py-2.5 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
              >
                {SPORT_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">매치 타입 선택</label>
              <select
                value={createMatchType}
                onChange={(e) => setCreateMatchType(e.target.value as 'general' | 'rank' | 'event')}
                className="w-full px-4 py-2.5 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
              >
                {MATCH_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 pt-4 border-t border-[var(--color-border-card)]">
              <button
                type="button"
                onClick={() => setShowCreateMatchStep(false)}
                className="flex-1 px-4 py-3 bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] rounded-lg font-semibold hover:opacity-80 transition-opacity"
              >
                뒤로
              </button>
              <button
                type="button"
                onClick={handleGoToCreateMatch}
                className="flex-1 px-4 py-3 bg-[var(--color-blue-primary)] text-white rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                매치 생성하러 가기
                <ArrowRightIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-5">
          {/* 시설 정보 */}
          <div className="p-4 bg-[var(--color-bg-secondary)] rounded-xl">
            <h3 className="font-semibold text-[var(--color-text-primary)] mb-2">{facility.name}</h3>
            <p className="text-sm text-[var(--color-text-secondary)]">{facility.address}</p>
            {facility.operatingHours && (
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                운영시간: {facility.operatingHours}
              </p>
            )}
            {facility.price && (
              <p className="text-sm text-[var(--color-blue-primary)] font-medium mt-1">
                {facility.price}
              </p>
            )}
          </div>

          {/* 예약 날짜 */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
              <CalendarDaysIcon className="w-4 h-4 inline mr-1" />
              예약 날짜 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              min={todayStr}
              value={formData.reservationDate}
              onChange={(e) => setFormData({ ...formData, reservationDate: e.target.value })}
              className="w-full px-4 py-2.5 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
            />
          </div>

          {/* 예약 시간 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                <ClockIcon className="w-4 h-4 inline mr-1" />
                시작 시간 <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-4 py-2.5 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
              >
                {timeOptions.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                종료 시간 <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-4 py-2.5 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
              >
                {timeOptions.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 인원 수 */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
              <UsersIcon className="w-4 h-4 inline mr-1" />
              예약 인원
            </label>
            <input
              type="number"
              min={1}
              max={100}
              value={formData.numberOfPeople}
              onChange={(e) => setFormData({ ...formData, numberOfPeople: parseInt(e.target.value) || 1 })}
              className="w-full px-4 py-2.5 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
            />
          </div>

          {/* 연락처 */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
              <PhoneIcon className="w-4 h-4 inline mr-1" />
              연락처 <span className="text-xs text-[var(--color-text-secondary)] font-normal">(선택)</span>
            </label>
            <input
              type="tel"
              value={formData.contactPhone}
              onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
              placeholder="010-1234-5678"
              className="w-full px-4 py-2.5 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
            />
          </div>

          {/* 메모 */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
              <ChatBubbleLeftIcon className="w-4 h-4 inline mr-1" />
              요청사항 <span className="text-xs text-[var(--color-text-secondary)] font-normal">(선택)</span>
            </label>
            <textarea
              rows={3}
              value={formData.memo}
              onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
              placeholder="요청사항이 있으시면 입력해주세요"
              className="w-full px-4 py-2.5 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)] resize-none"
            />
          </div>

          {/* 버튼 */}
          <div className="flex gap-3 pt-4 border-t border-[var(--color-border-card)]">
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
              {isSubmitting ? '예약 중...' : '예약하기'}
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
};

export default ReservationModal;
