import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  PlusCircleIcon,
  DocumentDuplicateIcon,
  ChevronLeftIcon,
} from '@heroicons/react/24/outline';
import { api } from '../utils/api';
import { FLOOR_MATERIALS } from '../constants/floorMaterials';
import { showError, showSuccess } from '../utils/swal';

export interface FacilityCourtDto {
  id?: number;
  courtName: string;
  floorLevel?: string | null;
  courtNumber?: string | null;
  floorMaterial: string;
  ceilingHeight?: number | null;
  officialSpec?: boolean | null;
  isExclusiveUse: boolean;
  images?: string[] | null;
  directionsGuide?: string | null;
  indoorOutdoor: 'indoor' | 'outdoor';
}

const getApiBaseUrl = (): string => {
  if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL;
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')) return 'http://localhost:3000';
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

interface FacilityCourtFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  facilityId: number;
  existingCourts: FacilityCourtDto[];
  editCourt?: FacilityCourtDto | null;
}

const emptyForm: Partial<FacilityCourtDto> = {
  courtName: '',
  floorLevel: '',
  courtNumber: '',
  floorMaterial: '우레탄',
  ceilingHeight: undefined,
  officialSpec: undefined,
  isExclusiveUse: false,
  images: [],
  directionsGuide: '',
  indoorOutdoor: 'indoor',
};

const FacilityCourtFormModal: React.FC<FacilityCourtFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  facilityId,
  existingCourts,
  editCourt,
}) => {
  const [step, setStep] = useState<'choose' | 'form'>('choose');
  const [copyFromId, setCopyFromId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<FacilityCourtDto>>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  const showCopyOption = existingCourts.length > 0 && !editCourt;

  useEffect(() => {
    if (!isOpen) return;
    setCopyFromId(null);
    setFormData(editCourt ? { ...editCourt } : { ...emptyForm });
    setStep(editCourt ? 'form' : showCopyOption ? 'choose' : 'form');
  }, [isOpen, editCourt, showCopyOption]);

  const handleStartBlank = () => {
    setFormData({ ...emptyForm });
    setStep('form');
  };

  const handleCopyFrom = () => {
    if (!copyFromId) return;
    const src = existingCourts.find((c) => c.id === copyFromId);
    if (!src) return;
    setFormData({
      ...src,
      id: undefined,
      courtName: src.courtName,
      floorLevel: src.floorLevel ?? '',
      courtNumber: src.courtNumber ?? '',
      floorMaterial: src.floorMaterial,
      ceilingHeight: src.ceilingHeight ?? undefined,
      officialSpec: src.officialSpec ?? undefined,
      isExclusiveUse: src.isExclusiveUse ?? false,
      images: src.images ? [...src.images] : [],
      directionsGuide: src.directionsGuide ?? '',
      indoorOutdoor: src.indoorOutdoor,
    });
    setStep('form');
  };

  const handleBack = () => {
    setStep('choose');
    setCopyFromId(null);
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
      setFormData((prev) => ({
        ...prev,
        images: [...(prev.images || []), ...urls],
      }));
    } catch (err: unknown) {
      await showError(err instanceof Error ? err.message : '이미지 업로드 실패', '업로드 실패');
    } finally {
      setImageUploading(false);
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images?.filter((_, i) => i !== index) ?? [],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.courtName?.trim() || !formData.floorMaterial || !formData.indoorOutdoor) {
      await showError('구장명, 바닥 재질, 실내/실외는 필수입니다.', '입력 오류');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        courtName: formData.courtName.trim(),
        floorLevel: formData.floorLevel?.trim() || undefined,
        courtNumber: formData.courtNumber?.trim() || undefined,
        floorMaterial: formData.floorMaterial,
        ceilingHeight: formData.ceilingHeight ?? undefined,
        officialSpec: formData.officialSpec ?? undefined,
        isExclusiveUse: formData.isExclusiveUse ?? false,
        images: formData.images?.length ? formData.images : undefined,
        directionsGuide: formData.directionsGuide?.trim() || undefined,
        indoorOutdoor: formData.indoorOutdoor,
      };

      if (editCourt?.id) {
        await api.patch(`/api/facilities/${facilityId}/courts/${editCourt.id}`, payload);
        await showSuccess('구장이 수정되었습니다.', '구장 수정');
      } else {
        await api.post(`/api/facilities/${facilityId}/courts`, payload);
        await showSuccess('구장이 추가되었습니다.', '구장 추가');
      }
      onSuccess();
      onClose();
    } catch (err) {
      await showError(
        err instanceof Error ? err.message : editCourt?.id ? '구장 수정에 실패했습니다.' : '구장 추가에 실패했습니다.',
        '오류',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-[1100] flex items-center justify-center p-4">
      <div
        className="bg-[var(--color-bg-card)] rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col border border-[var(--color-border-card)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-shrink-0 p-4 border-b border-[var(--color-border-card)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            {step === 'form' && showCopyOption && !editCourt && (
              <button
                type="button"
                onClick={handleBack}
                className="p-1.5 rounded-lg hover:bg-[var(--color-bg-secondary)]"
              >
                <ChevronLeftIcon className="w-5 h-5 text-[var(--color-text-primary)]" />
              </button>
            )}
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
              {editCourt ? '구장 수정' : step === 'choose' ? '구장 추가' : '구장 정보 입력'}
            </h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[var(--color-bg-secondary)] rounded-lg">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {step === 'choose' && showCopyOption && !editCourt ? (
            <div className="space-y-4">
              <p className="text-sm text-[var(--color-text-secondary)]">새 구장을 어떻게 추가하시겠습니까?</p>
              <button
                type="button"
                onClick={handleStartBlank}
                className="w-full py-3 px-4 rounded-xl border-2 border-[var(--color-border-card)] hover:border-[var(--color-blue-primary)] hover:bg-[var(--color-blue-primary)]/5 text-left flex items-center gap-3 transition-colors"
              >
                <PlusCircleIcon className="w-6 h-6 text-[var(--color-text-secondary)]" />
                <span className="font-medium text-[var(--color-text-primary)]">빈 상태로 시작</span>
              </button>
              <div className="space-y-3 p-4 rounded-xl border-2 border-[var(--color-border-card)]">
                <div className="flex items-center gap-3">
                  <DocumentDuplicateIcon className="w-6 h-6 text-[var(--color-text-secondary)] shrink-0" />
                  <span className="font-medium text-[var(--color-text-primary)]">기존 구장 정보 복사</span>
                </div>
                <select
                  value={copyFromId ?? ''}
                  onChange={(e) => setCopyFromId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] text-sm"
                >
                  <option value="">복사할 구장 선택</option>
                  {existingCourts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.courtName} ({c.floorMaterial}, {c.indoorOutdoor === 'indoor' ? '실내' : '실외'})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  층수/구역명, 바닥재질, 층고 등이 복사됩니다. 복사 후 명칭·사진·찾아가는 길은 수정해 주세요.
                </p>
                <button
                  type="button"
                  onClick={handleCopyFrom}
                  disabled={!copyFromId}
                  className="w-full py-2 rounded-lg bg-[var(--color-blue-primary)] text-white font-medium hover:opacity-90 disabled:opacity-50"
                >
                  복사 후 수정
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">층수/구역 명칭 *</label>
                <input
                  type="text"
                  required
                  value={formData.courtName ?? ''}
                  onChange={(e) => setFormData((p) => ({ ...p, courtName: e.target.value }))}
                  className="w-full px-4 py-2 border border-[var(--color-border-card)] rounded-xl bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]"
                  placeholder="예: 4층 B코트, 실외 2구장"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">층</label>
                  <input
                    type="text"
                    value={formData.floorLevel ?? ''}
                    onChange={(e) => setFormData((p) => ({ ...p, floorLevel: e.target.value }))}
                    className="w-full px-4 py-2 border border-[var(--color-border-card)] rounded-xl bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]"
                    placeholder="4층, 지하1층"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">구장 번호</label>
                  <input
                    type="text"
                    value={formData.courtNumber ?? ''}
                    onChange={(e) => setFormData((p) => ({ ...p, courtNumber: e.target.value }))}
                    className="w-full px-4 py-2 border border-[var(--color-border-card)] rounded-xl bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]"
                    placeholder="B코트, 2구장"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">바닥 재질 *</label>
                <select
                  required
                  value={formData.floorMaterial ?? '우레탄'}
                  onChange={(e) => setFormData((p) => ({ ...p, floorMaterial: e.target.value }))}
                  className="w-full px-4 py-2 border border-[var(--color-border-card)] rounded-xl bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]"
                >
                  {FLOOR_MATERIALS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">실내/실외 *</label>
                <select
                  required
                  value={formData.indoorOutdoor ?? 'indoor'}
                  onChange={(e) => setFormData((p) => ({ ...p, indoorOutdoor: e.target.value as 'indoor' | 'outdoor' }))}
                  className="w-full px-4 py-2 border border-[var(--color-border-card)] rounded-xl bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]"
                >
                  <option value="indoor">실내</option>
                  <option value="outdoor">실외</option>
                </select>
              </div>
              {formData.indoorOutdoor === 'indoor' && (
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">층고 (m)</label>
                  <input
                    type="number"
                    min={1}
                    step={0.5}
                    value={formData.ceilingHeight ?? ''}
                    onChange={(e) => setFormData((p) => ({ ...p, ceilingHeight: e.target.value ? Number(e.target.value) : undefined }))}
                    className="w-full px-4 py-2 border border-[var(--color-border-card)] rounded-xl bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]"
                    placeholder="예: 4"
                  />
                </div>
              )}
              {formData.indoorOutdoor === 'outdoor' && (
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.officialSpec ?? false}
                      onChange={(e) => setFormData((p) => ({ ...p, officialSpec: e.target.checked }))}
                      className="rounded border-[var(--color-border-card)]"
                    />
                    <span className="text-sm text-[var(--color-text-primary)]">정식 규격</span>
                  </label>
                </div>
              )}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isExclusiveUse ?? false}
                    onChange={(e) => setFormData((p) => ({ ...p, isExclusiveUse: e.target.checked }))}
                    className="rounded border-[var(--color-border-card)]"
                  />
                  <span className="text-sm text-[var(--color-text-primary)]">단독 사용 (옆 코트와 분리됨)</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">구장 현장 사진</label>
                <div className="flex flex-wrap gap-2">
                  {(formData.images ?? []).map((url, i) => (
                    <div key={i} className="relative group">
                      <img
                        src={url.startsWith('http') ? url : getApiBaseUrl() + url}
                        alt={`구장 ${i + 1}`}
                        className="w-20 h-20 object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute -top-1 -right-1 p-1 rounded-full bg-red-500 text-white text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <label className="w-20 h-20 flex items-center justify-center border-2 border-dashed rounded-lg cursor-pointer hover:bg-[var(--color-bg-secondary)]">
                    <PlusCircleIcon className="w-8 h-8 text-[var(--color-text-secondary)]" />
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageAdd} disabled={imageUploading} />
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">찾아가는 길</label>
                <textarea
                  rows={3}
                  value={formData.directionsGuide ?? ''}
                  onChange={(e) => setFormData((p) => ({ ...p, directionsGuide: e.target.value }))}
                  className="w-full px-4 py-2 border border-[var(--color-border-card)] rounded-xl bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] resize-none"
                  placeholder="엘리베이터 2호기 → 3층 하차, 왼쪽 복도 끝"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-[var(--color-border-card)]">
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-[var(--color-blue-primary)] text-white font-medium disabled:opacity-50"
                >
                  {isSubmitting ? '저장 중...' : editCourt ? '수정' : '추가'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default FacilityCourtFormModal;
