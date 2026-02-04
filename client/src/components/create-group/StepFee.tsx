import React from 'react';

const FOOTBALL_FEE_NORMAL = 10000; // 축구 1회 참가 기본 포인트
const FOOTBALL_FEE_EARLY = 8000;   // 축구 매치 전일 이전 예약 2,000P 할인

interface StepFeeProps {
  category?: string;
  hasFee: boolean;
  onHasFeeChange: (hasFee: boolean) => void;
  feeAmount: string;
  onFeeAmountChange: (value: string) => void;
}

const StepFee: React.FC<StepFeeProps> = ({ category, hasFee, onHasFeeChange, feeAmount, onFeeAmountChange }) => {
  const isFootball = category === '축구';

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-[var(--color-text-primary)]">
          참가비 설정 (포인트)
        </h3>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          포인트는 리뷰 작성, 시설 리뷰 등 다양한 활동으로 적립하거나 현금 충전으로 보유할 수 있습니다.
        </p>
      </div>
      <label className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border-card)] cursor-pointer hover:bg-[var(--color-bg-secondary)] transition-colors">
        <input
          type="checkbox"
          checked={hasFee}
          onChange={(e) => {
            const checked = e.target.checked;
            onHasFeeChange(checked);
            if (!checked) onFeeAmountChange('');
            else if (isFootball) onFeeAmountChange(String(FOOTBALL_FEE_NORMAL));
          }}
          className="w-4 h-4 text-[var(--color-blue-primary)] rounded focus:ring-[var(--color-blue-primary)]"
        />
        <span className="text-sm text-[var(--color-text-primary)]">참가비가 있습니다</span>
      </label>
      {hasFee && isFootball && (
        <div className="p-4 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-card)] space-y-2">
          <p className="text-sm font-medium text-[var(--color-text-primary)]">
            축구 매치 참가비: {FOOTBALL_FEE_NORMAL.toLocaleString()}P (고정)
          </p>
          <p className="text-xs text-[var(--color-text-secondary)]">
            매치 당일이 아닌 전일 이전 참가 시 {FOOTBALL_FEE_EARLY.toLocaleString()}P (2,000P 할인)
          </p>
          <p className="text-xs text-[var(--color-text-secondary)]">
            취소 시 취소 수수료가 적용되어 이탈률을 줄입니다.
          </p>
        </div>
      )}
      {hasFee && !isFootball && (
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
            참가비 금액 (P)
          </label>
          <input
            type="text"
            value={feeAmount}
            onChange={(e) => {
              const numericValue = e.target.value.replace(/,/g, '');
              if (numericValue === '' || /^\d+$/.test(numericValue)) {
                onFeeAmountChange(numericValue);
              }
            }}
            className="w-full px-4 py-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
            placeholder="참가비 포인트를 입력하세요"
          />
          {feeAmount && feeAmount !== '' && (
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">
              입력 금액: {parseInt(feeAmount.replace(/,/g, ''), 10).toLocaleString()}P
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default StepFee;
export { FOOTBALL_FEE_NORMAL, FOOTBALL_FEE_EARLY };
