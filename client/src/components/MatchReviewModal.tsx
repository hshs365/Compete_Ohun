import React, { useState, useEffect } from 'react';
import { XMarkIcon, CheckCircleIcon, StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { api } from '../utils/api';
import { showError, showSuccess, showConfirm } from '../utils/swal';
import { useAuth } from '../contexts/AuthContext';

export type ReviewEligibility = {
  canReview: boolean;
  reason?: string;
  categories: { key: string; label: string }[];
  participants: { id: number; nickname: string; tag: string | null; profileImageUrl: string | null }[];
  alreadySubmitted: boolean;
  facilityId: number | null;
  facilityName: string | null;
  facilityReviewSubmitted: boolean;
};

type MatchReviewModalProps = {
  groupId: number;
  groupName: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
};

/** 5개 별, 클릭 위치에 따라 0.5 또는 1점 단위로 입력 (왼쪽 절반 = 0.5, 오른쪽 절반 = 1) */
const StarRating: React.FC<{
  value: number;
  onChange: (v: number) => void;
  label: string;
}> = ({ value, onChange, label }) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>, starIndex: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const isLeftHalf = x < rect.width / 2;
    const newValue = starIndex + (isLeftHalf ? 0.5 : 1);
    onChange(Math.min(5, Math.max(0.5, newValue)));
  };

  return (
    <div>
      <div className="text-sm font-medium text-[var(--color-text-primary)] mb-2">{label}</div>
      <div className="flex items-center gap-0.5">
        {[0, 1, 2, 3, 4].map((i) => {
          const starValue = i + 1;
          const filled = value >= starValue;
          const half = value >= i + 0.5 && value < starValue;
          return (
            <button
              key={i}
              type="button"
              onClick={(e) => handleClick(e, i)}
              className="p-0.5 rounded hover:bg-amber-400/20 transition-colors relative inline-flex"
              title={`${i + 0.5}~${starValue}점`}
            >
              {filled ? (
                <StarIconSolid className="w-8 h-8 text-amber-400" />
              ) : half ? (
                <span className="relative inline-block w-8 h-8 shrink-0">
                  <StarIcon className="w-8 h-8 text-[var(--color-text-secondary)] opacity-60" />
                  <span className="absolute left-0 top-0 h-full w-1/2 overflow-hidden">
                    <StarIconSolid className="w-8 h-8 text-amber-400" />
                  </span>
                </span>
              ) : (
                <StarIcon className="w-8 h-8 text-[var(--color-text-secondary)] opacity-60" />
              )}
            </button>
          );
        })}
      </div>
      <span className="text-xs text-[var(--color-text-secondary)] mt-1 block">
        {value || 0} / 5점 (0.5단위)
      </span>
    </div>
  );
};

/** 선수 리뷰에서 선택 가능한 참가자 (본인 제외) */
const getSelectableParticipants = (
  participants: ReviewEligibility['participants'],
  currentUserId: number | undefined
) => (currentUserId == null ? participants : participants.filter((p) => p.id !== currentUserId));

const MatchReviewModal: React.FC<MatchReviewModalProps> = ({
  groupId,
  groupName,
  isOpen,
  onClose,
  onSubmitted,
}) => {
  const { user } = useAuth();
  const [eligibility, setEligibility] = useState<ReviewEligibility | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittingFacility, setSubmittingFacility] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [facilityScores, setFacilityScores] = useState({ cleanliness: 0, suitableForGame: 0, overall: 0 });

  const selectableParticipants = eligibility?.participants
    ? getSelectableParticipants(eligibility.participants, user?.id)
    : [];

  useEffect(() => {
    if (!isOpen || !groupId) return;
    setLoading(true);
    setEligibility(null);
    setAnswers({});
    setFacilityScores({ cleanliness: 0, suitableForGame: 0, overall: 0 });
    api
      .get<ReviewEligibility>(`/api/groups/${groupId}/review-eligibility`)
      .then((data) => setEligibility(data))
      .catch((err) => {
        console.error('리뷰 작성 가능 여부 조회 실패:', err);
        setEligibility({
          canReview: false,
          reason: err?.message || '조회에 실패했습니다.',
          categories: [],
          participants: [],
          alreadySubmitted: false,
          facilityId: null,
          facilityName: null,
          facilityReviewSubmitted: false,
        });
      })
      .finally(() => setLoading(false));
  }, [isOpen, groupId]);

  const handleSkip = async () => {
    const confirmed = await showConfirm(
      '리뷰를 건너뛰면 포인트를 받을 수 없습니다. 그래도 건너뛰시겠습니까?',
      '리뷰 건너뛰기',
      '건너뛰기',
      '취소'
    );
    if (confirmed) onClose();
  };

  /** 신고 외 항목은 필수 */
  const requiredCategories = eligibility?.categories.filter((c) => c.key !== '신고') ?? [];
  const isPlayerReviewComplete =
    requiredCategories.length > 0 && requiredCategories.every((c) => answers[c.key] != null && answers[c.key] !== '');

  const handleSubmitPlayer = async () => {
    if (!eligibility?.canReview || !isPlayerReviewComplete) {
      const missing = requiredCategories.find((c) => answers[c.key] == null || answers[c.key] === '');
      await showError(missing ? `"${missing.label}" 항목을 선택해 주세요.` : '필수 항목을 모두 선택해 주세요.', '선택 필요');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post<{ success: boolean; message: string; pointsEarned: number }>(
        `/api/groups/${groupId}/reviews`,
        { answers },
      );
      await showSuccess(`선수 리뷰가 저장되었습니다. ${res?.pointsEarned ?? 500}P가 적립되었습니다.`, '리뷰 완료');
      onSubmitted?.();
      setEligibility((prev) => prev ? { ...prev, alreadySubmitted: true } : null);
    } catch (err) {
      await showError(err instanceof Error ? err.message : '제출에 실패했습니다.', '제출 실패');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitFacility = async () => {
    if (!eligibility?.facilityId) return;
    const { cleanliness, suitableForGame, overall } = facilityScores;
    if (cleanliness < 0.5 || suitableForGame < 0.5 || overall < 0.5) {
      await showError('시설 리뷰의 모든 항목에 별점을 선택해 주세요. (0.5~5점)', '선택 필요');
      return;
    }
    setSubmittingFacility(true);
    try {
      const res = await api.post<{ success: boolean; message: string; pointsEarned: number }>(
        `/api/groups/${groupId}/facility-review`,
        { facilityId: eligibility.facilityId, cleanliness, suitableForGame, overall },
      );
      await showSuccess(`시설 리뷰가 저장되었습니다. ${res?.pointsEarned ?? 500}P가 적립되었습니다.`, '리뷰 완료');
      onSubmitted?.();
      setEligibility((prev) => prev ? { ...prev, facilityReviewSubmitted: true } : null);
    } catch (err) {
      await showError(err instanceof Error ? err.message : '제출에 실패했습니다.', '제출 실패');
    } finally {
      setSubmittingFacility(false);
    }
  };

  const hasPlayerReview = eligibility?.canReview && eligibility.categories.length > 0;
  const hasFacilityReview =
    eligibility?.facilityId &&
    eligibility?.facilityName &&
    !eligibility.facilityReviewSubmitted;
  const allDone =
    eligibility &&
    eligibility.alreadySubmitted &&
    (!eligibility.facilityId || eligibility.facilityReviewSubmitted);

  /** 선수 리뷰 단계 중이면 시설 리뷰는 숨김(선수 리뷰 완료 후 다음 단계로 표시) */
  const showPlayerReviewStep = hasPlayerReview && !eligibility?.alreadySubmitted;
  const showFacilityReviewStep = hasFacilityReview && (eligibility?.alreadySubmitted || !hasPlayerReview);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/30"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="match-review-modal-title"
    >
      <div
        className="relative w-full max-w-lg max-h-[90vh] overflow-auto rounded-2xl bg-[var(--color-bg-card)] border border-[var(--color-border-card)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-card)] bg-[var(--color-bg-card)]">
          <h3 id="match-review-modal-title" className="text-lg font-semibold text-[var(--color-text-primary)]">
            매치 리뷰 · {groupName}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
            aria-label="닫기"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 sm:p-6">
          {loading && (
            <div className="py-8 text-center text-[var(--color-text-secondary)]">불러오는 중...</div>
          )}

          {!loading && eligibility && !eligibility.canReview && allDone && (
            <div className="py-6 text-center">
              <p className="text-[var(--color-text-primary)]">{eligibility.reason}</p>
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/10 text-green-600 dark:text-green-400">
                <CheckCircleIcon className="w-5 h-5" />
                <span>이미 리뷰를 작성하셨습니다. 참여해 주셔서 감사합니다!</span>
              </div>
            </div>
          )}

          {!loading && eligibility && !eligibility.canReview && !allDone && eligibility.reason && (
            <div className="py-6 text-center">
              <p className="text-[var(--color-text-primary)]">{eligibility.reason}</p>
            </div>
          )}

          {!loading && (hasPlayerReview || hasFacilityReview) && (
            <>
              <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                선수 리뷰 500P, 시설 리뷰 500P (총 1,000P)를 받을 수 있습니다.
              </p>

              {showPlayerReviewStep && (
                <div className="mb-6">
                  <h4 className="text-base font-semibold text-[var(--color-text-primary)] mb-3">
                    선수 리뷰 (500P)
                  </h4>
                  <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                    참가자 중에서 각 항목에 가장 어울리는 한 명을 선택해 주세요. (본인 제외)
                  </p>
                  <div className="space-y-5">
                    {eligibility!.categories.map((cat) => (
                      <div key={cat.key}>
                        <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                          {cat.label}
                          {cat.key === '신고' && (
                            <span className="text-xs text-[var(--color-text-secondary)] font-normal ml-1">(선택)</span>
                          )}
                        </label>
                        <select
                          value={answers[cat.key] ?? ''}
                          onChange={(e) =>
                            setAnswers((prev) => ({
                              ...prev,
                              [cat.key]: e.target.value ? Number(e.target.value) : undefined,
                            }))
                          }
                          className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border-card)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:ring-2 focus:ring-[var(--color-blue-primary)] focus:border-transparent"
                        >
                          <option value="">
                            {cat.key === '신고' ? '해당 없음' : '선택하세요'}
                          </option>
                          {selectableParticipants.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.nickname}
                              {p.tag ? ` ${p.tag}` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleSubmitPlayer}
                    disabled={submitting || !isPlayerReviewComplete}
                    className="mt-3 w-full px-4 py-2.5 rounded-xl font-semibold bg-[var(--color-blue-primary)] text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                  >
                    {submitting ? '저장 중...' : '선수 리뷰 제출 (500P)'}
                  </button>
                </div>
              )}

              {showFacilityReviewStep && (
                <>
                  {eligibility?.alreadySubmitted && hasPlayerReview && (
                    <div className="mb-4 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 text-sm">
                      <CheckCircleIcon className="w-4 h-4" /> 선수 리뷰 완료 — 시설 리뷰를 작성해 주세요.
                    </div>
                  )}
                  <div className="mb-6">
                    <h4 className="text-base font-semibold text-[var(--color-text-primary)] mb-3">
                      시설 리뷰 (500P) · {eligibility!.facilityName}
                    </h4>
                  <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                    각 항목별로 0.5~5점(0.5단위)로 별점을 선택해 주세요.
                  </p>
                  <div className="space-y-5">
                    <StarRating
                      label="청결도"
                      value={facilityScores.cleanliness}
                      onChange={(v) => setFacilityScores((prev) => ({ ...prev, cleanliness: v }))}
                    />
                    <StarRating
                      label="경기에 지장이 없는 구장인가요?"
                      value={facilityScores.suitableForGame}
                      onChange={(v) => setFacilityScores((prev) => ({ ...prev, suitableForGame: v }))}
                    />
                    <StarRating
                      label="전체 만족도"
                      value={facilityScores.overall}
                      onChange={(v) => setFacilityScores((prev) => ({ ...prev, overall: v }))}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSubmitFacility}
                    disabled={
                      submittingFacility ||
                      facilityScores.cleanliness < 0.5 ||
                      facilityScores.suitableForGame < 0.5 ||
                      facilityScores.overall < 0.5
                    }
                    className="mt-3 w-full px-4 py-2.5 rounded-xl font-semibold bg-amber-500 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                  >
                    {submittingFacility ? '저장 중...' : '시설 리뷰 제출 (500P)'}
                  </button>
                </div>
                </>
              )}

              <div className="mt-6 flex gap-2">
                <button
                  type="button"
                  onClick={handleSkip}
                  className="flex-1 px-4 py-3 rounded-xl font-semibold border border-[var(--color-border-card)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                >
                  건너뛰기
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-3 rounded-xl font-semibold bg-[var(--color-blue-primary)] text-white hover:opacity-90 transition-opacity"
                >
                  닫기
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchReviewModal;
