import React, { useState, useEffect } from 'react';
import { XMarkIcon, ExclamationTriangleIcon, WrenchScrewdriverIcon, HandThumbUpIcon } from '@heroicons/react/24/outline';
import { api } from '../utils/api';
import { showError, showSuccess } from '../utils/swal';

export type MercenaryReviewEligibility = {
  canReview: boolean;
  reason?: string;
  alreadySubmitted: boolean;
  noShowList: { id: number; nickname: string; tag: string | null; profileImageUrl: string | null }[];
  mercenaryList: { id: number; nickname: string; tag: string | null; profileImageUrl: string | null }[];
};

type MercenaryReviewModalProps = {
  groupId: number;
  groupName: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
};

const MercenaryReviewModal: React.FC<MercenaryReviewModalProps> = ({
  groupId,
  groupName,
  isOpen,
  onClose,
  onSubmitted,
}) => {
  const [eligibility, setEligibility] = useState<MercenaryReviewEligibility | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [noShowIds, setNoShowIds] = useState<Set<number>>(new Set());
  const [noEquipmentIds, setNoEquipmentIds] = useState<Set<number>>(new Set());
  const [goodMannerIds, setGoodMannerIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!isOpen || !groupId) return;
    setLoading(true);
    setEligibility(null);
    setNoShowIds(new Set());
    setNoEquipmentIds(new Set());
    setGoodMannerIds(new Set());
    api
      .get<MercenaryReviewEligibility>(`/api/groups/${groupId}/mercenary-review-eligibility`)
      .then(setEligibility)
      .catch((err) => {
        setEligibility({
          canReview: false,
          reason: err?.message || '조회에 실패했습니다.',
          alreadySubmitted: false,
          noShowList: [],
          mercenaryList: [],
        });
      })
      .finally(() => setLoading(false));
  }, [isOpen, groupId]);

  const toggleNoShow = (id: number) => setNoShowIds((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
  const toggleNoEquipment = (id: number) => setNoEquipmentIds((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
  const toggleGoodManner = (id: number) => setGoodMannerIds((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });

  const handleSubmit = async () => {
    if (!eligibility?.canReview || eligibility.alreadySubmitted) return;
    setSubmitting(true);
    try {
      await api.post(`/api/groups/${groupId}/mercenary-review`, {
        noShowIds: Array.from(noShowIds),
        noEquipmentIds: Array.from(noEquipmentIds),
        goodMannerIds: Array.from(goodMannerIds),
      });
      await showSuccess('플레이어 리뷰가 저장되었습니다.', '리뷰 완료');
      onSubmitted?.();
      onClose();
    } catch (err) {
      await showError(err instanceof Error ? err.message : '저장에 실패했습니다.', '오류');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1001] flex items-center justify-center bg-black/50 p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-[var(--color-bg-card)] rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col border border-[var(--color-border-card)]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border-card)]">
          <h2 className="text-lg font-bold text-[var(--color-text-primary)]">플레이어 리뷰</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--color-bg-secondary)]">
            <XMarkIcon className="w-5 h-5 text-[var(--color-text-primary)]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-10 h-10 border-2 border-[var(--color-blue-primary)] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !eligibility?.canReview ? (
            <p className="text-[var(--color-text-secondary)] text-center py-8">{eligibility?.reason ?? '리뷰를 작성할 수 없습니다.'}</p>
          ) : eligibility.alreadySubmitted ? (
            <p className="text-[var(--color-text-secondary)] text-center py-8">이미 플레이어 리뷰를 작성하셨습니다.</p>
          ) : (
            <>
              <p className="text-sm text-[var(--color-text-secondary)]">
                매치가 끝난 후 플레이어들에 대한 간편 리뷰를 남겨주세요. 노쇼·장비 미지참은 매너 점수에 반영됩니다.
              </p>

              {eligibility.noShowList.length > 0 && (
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                    <ExclamationTriangleIcon className="w-5 h-5 text-amber-500" />
                    노쇼한 플레이어이 있나요? (해당 매치 QR을 못 찍은 플레이어)
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {eligibility.noShowList.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => toggleNoShow(m.id)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          noShowIds.has(m.id) ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border-2 border-amber-500' : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] border border-[var(--color-border-card)]'
                        }`}
                      >
                        {m.nickname}{m.tag ? ` ${m.tag}` : ''}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {eligibility.mercenaryList.length > 0 && (
                <>
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                      <WrenchScrewdriverIcon className="w-5 h-5 text-red-500" />
                      장비를 안 가져 온 플레이어이 있나요?
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {eligibility.mercenaryList.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => toggleNoEquipment(m.id)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            noEquipmentIds.has(m.id) ? 'bg-red-500/20 text-red-700 dark:text-red-400 border-2 border-red-500' : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] border border-[var(--color-border-card)]'
                          }`}
                        >
                          {m.nickname}{m.tag ? ` ${m.tag}` : ''}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                      <HandThumbUpIcon className="w-5 h-5 text-green-500" />
                      매너가 좋은 플레이어이 있나요?
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {eligibility.mercenaryList.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => toggleGoodManner(m.id)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            goodMannerIds.has(m.id) ? 'bg-green-500/20 text-green-700 dark:text-green-400 border-2 border-green-500' : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] border border-[var(--color-border-card)]'
                          }`}
                        >
                          {m.nickname}{m.tag ? ` ${m.tag}` : ''}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {eligibility.mercenaryList.length === 0 && eligibility.noShowList.length === 0 && (
                <p className="text-sm text-[var(--color-text-secondary)]">리뷰할 플레이어이 없습니다.</p>
              )}
            </>
          )}
        </div>

        {eligibility?.canReview && !eligibility.alreadySubmitted && eligibility.mercenaryList.length > 0 && (
          <div className="p-4 border-t border-[var(--color-border-card)]">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-3 rounded-xl font-semibold text-white bg-[var(--color-blue-primary)] hover:opacity-90 disabled:opacity-70 disabled:cursor-not-allowed transition-opacity"
            >
              {submitting ? '저장 중...' : '리뷰 제출'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MercenaryReviewModal;
