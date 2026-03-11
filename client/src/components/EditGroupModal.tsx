import React, { useState, useEffect } from 'react';
import { XMarkIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { api } from '../utils/api';
import { showError, showSuccess, showWarning } from '../utils/swal';
import { getEquipmentBySport } from '../constants/equipment';

interface EditGroupModalProps {
  groupId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface GroupEditData {
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  category: string;
  description: string | null;
  meetingTime: string | null;
  meetingDateTime: string | null;
  contact: string | null;
  equipment: string[];
}

const EditGroupModal: React.FC<EditGroupModalProps> = ({ groupId, isOpen, onClose, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [form, setForm] = useState<GroupEditData>({
    name: '',
    location: '',
    latitude: 0,
    longitude: 0,
    category: '축구',
    description: '',
    meetingTime: '',
    meetingDateTime: '',
    contact: '',
    equipment: [],
  });

  useEffect(() => {
    if (isOpen && groupId) {
      fetchGroup();
    }
  }, [isOpen, groupId]);

  const fetchGroup = async () => {
    setIsFetching(true);
    try {
      const data = await api.get<GroupEditData & { creatorId: number }>(`/api/groups/${groupId}`);
      const meetingDt = data.meetingDateTime
        ? (typeof data.meetingDateTime === 'string'
            ? data.meetingDateTime
            : (data.meetingDateTime as Date).toISOString()
          ).slice(0, 16)
        : '';
      setForm({
        name: data.name ?? '',
        location: data.location ?? '',
        latitude: Number(data.latitude) ?? 0,
        longitude: Number(data.longitude) ?? 0,
        category: data.category ?? '축구',
        description: data.description ?? '',
        meetingTime: data.meetingTime ?? '',
        meetingDateTime: meetingDt,
        contact: data.contact ?? '',
        equipment: Array.isArray(data.equipment) ? data.equipment : [],
      });
    } catch (err) {
      console.error('매치 정보 조회 실패:', err);
      await showError('매치 정보를 불러올 수 없습니다.', '조회 실패');
      onClose();
    } finally {
      setIsFetching(false);
    }
  };

  const handleSearchAddress = () => {
    const loadDaum = () => {
      if (typeof window !== 'undefined' && (window as any).daum) {
        new (window as any).daum.Postcode({
          oncomplete: async (data: { address: string; addressType: string; roadAddress?: string; jibunAddress?: string; bname?: string; buildingName?: string }) => {
            let fullAddress =
              data.addressType === 'R'
                ? data.roadAddress || data.address || ''
                : data.jibunAddress || data.address || '';
            if (data.addressType === 'R' && (data.bname || data.buildingName)) {
              const extra = [data.bname, data.buildingName].filter(Boolean).join(', ');
              if (extra) fullAddress += ` (${extra})`;
            }
            setForm((prev) => ({ ...prev, location: fullAddress.trim() }));
            await handleAddressToCoordinates(fullAddress.trim());
          },
        }).open();
        return;
      }
      const script = document.createElement('script');
      script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
      script.async = true;
      script.onload = () => {
        if ((window as any).daum) {
          new (window as any).daum.Postcode({
            oncomplete: async (data: { address: string; addressType: string; roadAddress?: string; jibunAddress?: string; bname?: string; buildingName?: string }) => {
              let fullAddress =
                data.addressType === 'R'
                  ? data.roadAddress || data.address || ''
                  : data.jibunAddress || data.address || '';
              if (data.addressType === 'R' && (data.bname || data.buildingName)) {
                const extra = [data.bname, data.buildingName].filter(Boolean).join(', ');
                if (extra) fullAddress += ` (${extra})`;
              }
              setForm((prev) => ({ ...prev, location: fullAddress.trim() }));
              await handleAddressToCoordinates(fullAddress.trim());
            },
          }).open();
        }
      };
      document.head.appendChild(script);
    };
    loadDaum();
  };

  const handleAddressToCoordinates = async (address: string) => {
    if (!address?.trim()) return;
    const key = import.meta.env.VITE_NAVER_MAP_CLIENT_ID;
    if (!key) return;
    try {
      const res = await fetch(
        `https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(address)}`,
        { headers: { 'X-NCP-APIGW-API-KEY-ID': key, 'X-NCP-APIGW-API-KEY': import.meta.env.VITE_NAVER_MAP_CLIENT_SECRET || '' } }
      );
      const data = await res.json();
      if (data.addresses?.[0]) {
        const { x, y } = data.addresses[0];
        setForm((prev) => ({
          ...prev,
          latitude: parseFloat(y),
          longitude: parseFloat(x),
          location: address,
        }));
      }
    } catch {
      // 좌표 변환 실패해도 주소는 저장됨
    }
  };

  const toggleEquipment = (item: string) => {
    setForm((prev) => {
      const list = prev.equipment.includes(item) ? prev.equipment.filter((e) => e !== item) : [...prev.equipment, item];
      return { ...prev, equipment: list };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = form.name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      await showWarning('매치명은 2자 이상 입력해주세요.', '입력 오류');
      return;
    }
    if (!form.location.trim()) {
      await showWarning('위치(주소)를 입력해주세요.', '입력 오류');
      return;
    }
    setIsLoading(true);
    try {
      const payload: Record<string, unknown> = {
        name: trimmedName,
        location: form.location.trim(),
        description: form.description.trim() || undefined,
        contact: form.contact.trim() || undefined,
        equipment: form.equipment,
      };
      if (form.latitude && form.longitude) {
        payload.latitude = form.latitude;
        payload.longitude = form.longitude;
      }
      if (form.meetingDateTime) {
        const dt = form.meetingDateTime.includes('T') ? form.meetingDateTime : `${form.meetingDateTime}T12:00:00`;
        payload.meetingDateTime = dt.length === 16 ? `${dt}:00` : dt; // YYYY-MM-DDTHH:mm → YYYY-MM-DDTHH:mm:00
        payload.meetingTime = form.meetingDateTime.replace('T', ' ');
      }
      await api.patch(`/api/groups/${groupId}`, payload);
      await showSuccess('매치 정보가 수정되었습니다.', '수정 완료');
      onSuccess?.();
      onClose();
    } catch (err: any) {
      await showError(err?.message || '매치 수정에 실패했습니다.', '수정 실패');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const equipmentList = getEquipmentBySport(form.category);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-card)] w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="sticky top-0 flex items-center justify-between p-4 border-b border-[var(--color-border-card)] bg-[var(--color-bg-card)] z-10">
          <h2 className="text-lg font-bold text-[var(--color-text-primary)]">매치 수정</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {isFetching ? (
            <div className="py-12 text-center text-[var(--color-text-secondary)]">불러오는 중...</div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">매치명</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
                  placeholder="예: 토요일 오후 풋살"
                  minLength={2}
                  maxLength={100}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                  <MapPinIcon className="w-4 h-4 inline mr-1" />
                  위치
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
                    placeholder="주소 찾기로 입력"
                    required
                  />
                  <button
                    type="button"
                    onClick={handleSearchAddress}
                    className="px-3 py-2 rounded-lg bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] font-medium text-sm hover:bg-[var(--color-border-card)]"
                  >
                    주소 찾기
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                  날짜·시간
                </label>
                <input
                  type="datetime-local"
                  value={form.meetingDateTime}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      meetingDateTime: e.target.value,
                      meetingTime: e.target.value ? e.target.value.replace('T', ' ') : '',
                    }))
                  }
                  className="w-full px-3 py-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">연락처</label>
                <input
                  type="text"
                  value={form.contact}
                  onChange={(e) => setForm((prev) => ({ ...prev, contact: e.target.value }))}
                  className="w-full px-3 py-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
                  placeholder="예: 010-1234-5678"
                  maxLength={50}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">모임 설명</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)] resize-none"
                  placeholder="매치에 대한 설명을 입력하세요"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">준비물</label>
                <div className="flex flex-wrap gap-2">
                  {equipmentList.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleEquipment(item)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                        form.equipment.includes(item)
                          ? 'bg-[var(--color-blue-primary)] text-white'
                          : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-card)]'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                  {form.equipment.filter((e) => !equipmentList.includes(e)).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleEquipment(item)}
                      className="px-3 py-1.5 rounded-full text-sm font-medium bg-[var(--color-blue-primary)] text-white"
                    >
                      {item} ✓
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-[var(--color-border-card)] text-[var(--color-text-primary)] font-medium hover:bg-[var(--color-bg-secondary)]"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isLoading || isFetching}
              className="flex-1 py-2.5 rounded-lg bg-[var(--color-blue-primary)] text-white font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditGroupModal;
