import React, { useState, useEffect } from 'react';
import { XMarkIcon, CalendarDaysIcon, ClockIcon } from '@heroicons/react/24/outline';
import { api } from '../utils/api';

interface ReservationItem {
  id: number;
  reservationDate: string;
  startTime: string;
  endTime: string;
  status: string;
}

interface FacilityReservationStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  facilityId: number;
  facilityName: string;
}

const WEEKDAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

const FacilityReservationStatusModal: React.FC<FacilityReservationStatusModalProps> = ({
  isOpen,
  onClose,
  facilityId,
  facilityName,
}) => {
  const [reservations, setReservations] = useState<ReservationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const today = new Date();
  const startDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + 6);
  const endDateStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;

  useEffect(() => {
    if (!isOpen || !facilityId) return;
    setLoading(true);
    setError(false);
    api
      .get<ReservationItem[]>(
        `/api/reservations/facility/${facilityId}/calendar?startDate=${startDate}&endDate=${endDateStr}`
      )
      .then((data) => setReservations(Array.isArray(data) ? data : []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [isOpen, facilityId, startDate, endDateStr]);

  const byDate = React.useMemo(() => {
    const map: Record<string, ReservationItem[]> = {};
    reservations.forEach((r) => {
      if (!map[r.reservationDate]) map[r.reservationDate] = [];
      map[r.reservationDate].push(r);
    });
    return map;
  }, [reservations]);

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} aria-hidden />
      <div
        className="relative w-full max-w-lg rounded-2xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)] shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reservation-status-title"
      >
        <div className="flex items-center justify-between border-b border-[var(--color-border-card)] p-4">
          <div className="flex items-center gap-2">
            <CalendarDaysIcon className="w-6 h-6 text-[var(--color-text-secondary)]" />
            <h2 id="reservation-status-title" className="text-lg font-semibold text-[var(--color-text-primary)]">
              예약 현황
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
            aria-label="닫기"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4">
          <p className="text-sm text-[var(--color-text-secondary)] mb-4">{facilityName} · 1주일</p>
          {loading && (
            <div className="py-8 text-center text-[var(--color-text-secondary)]">불러오는 중...</div>
          )}
          {error && (
            <div className="py-8 text-center text-red-500">예약 현황을 불러오지 못했습니다.</div>
          )}
          {!loading && !error && (
            <div className="space-y-4">
              {weekDays.map(({ date, label, dayName }) => (
                <div
                  key={date}
                  className="rounded-xl border border-[var(--color-border-card)] bg-[var(--color-bg-primary)] p-3"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-[var(--color-text-primary)]">
                      {label} ({dayName})
                    </span>
                  </div>
                  {byDate[date]?.length ? (
                    <ul className="space-y-1.5">
                      {byDate[date]
                        .sort(
                          (a, b) =>
                            (a.startTime || '').localeCompare(b.startTime || '')
                        )
                        .map((r) => (
                          <li
                            key={r.id}
                            className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]"
                          >
                            <ClockIcon className="w-4 h-4 flex-shrink-0" />
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
          )}
        </div>
      </div>
    </div>
  );
};

export default FacilityReservationStatusModal;
