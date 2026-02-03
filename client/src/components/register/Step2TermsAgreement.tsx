import React, { useState } from 'react';
import { CheckCircleIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

interface Step2TermsAgreementProps {
  termsServiceAgreed: boolean;
  termsPrivacyAgreed: boolean;
  marketingConsent: boolean;
  onTermsChange: (terms: {
    termsServiceAgreed: boolean;
    termsPrivacyAgreed: boolean;
    marketingConsent: boolean;
  }) => void;
}

const Step2TermsAgreement: React.FC<Step2TermsAgreementProps> = ({
  termsServiceAgreed,
  termsPrivacyAgreed,
  marketingConsent,
  onTermsChange,
}) => {
  const [showServiceTerms, setShowServiceTerms] = useState(false);
  const [showPrivacyTerms, setShowPrivacyTerms] = useState(false);

  // 전체 동의
  const allRequiredAgreed = termsServiceAgreed && termsPrivacyAgreed;
  const handleAllAgree = () => {
    const newValue = !allRequiredAgreed;
    onTermsChange({
      termsServiceAgreed: newValue,
      termsPrivacyAgreed: newValue,
      marketingConsent: newValue,
    });
  };

  return (
    <div className="space-y-6">
      {/* 전체 동의 버튼 */}
      <button
        type="button"
        onClick={handleAllAgree}
        className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between ${
          allRequiredAgreed
            ? 'border-[var(--color-blue-primary)] bg-blue-50 dark:bg-blue-900/20'
            : 'border-[var(--color-border-card)] bg-[var(--color-bg-secondary)] hover:border-[var(--color-blue-primary)]/50'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-6 h-6 rounded flex items-center justify-center ${
            allRequiredAgreed
              ? 'bg-[var(--color-blue-primary)]'
              : 'bg-[var(--color-bg-primary)] border-2 border-[var(--color-border-card)]'
          }`}>
            {allRequiredAgreed && <CheckCircleIcon className="w-5 h-5 text-white" />}
          </div>
          <span className={`font-semibold text-lg ${
            allRequiredAgreed
              ? 'text-[var(--color-blue-primary)]'
              : 'text-[var(--color-text-primary)]'
          }`}>
            전체 동의
          </span>
        </div>
        <span className="text-sm text-[var(--color-text-secondary)]">
          {allRequiredAgreed ? '해제' : '동의'}
        </span>
      </button>

      {/* 개별 약관 동의 */}
      <div className="space-y-3 border-t border-[var(--color-border-card)] pt-4">
        {/* 서비스 이용 약관 */}
        <div className="flex items-center justify-between p-4 bg-[var(--color-bg-secondary)] rounded-lg">
          <div className="flex items-center gap-3 flex-1">
            <button
              type="button"
              onClick={() => onTermsChange({
                termsServiceAgreed: !termsServiceAgreed,
                termsPrivacyAgreed,
                marketingConsent,
              })}
              className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${
                termsServiceAgreed
                  ? 'bg-[var(--color-blue-primary)]'
                  : 'bg-[var(--color-bg-primary)] border-2 border-[var(--color-border-card)]'
              }`}
            >
              {termsServiceAgreed && <CheckCircleIcon className="w-4 h-4 text-white" />}
            </button>
            <div className="flex-1">
              <span className="text-[var(--color-text-primary)] font-medium">
                [필수] 서비스 이용 약관
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowServiceTerms(!showServiceTerms)}
            className="text-sm text-[var(--color-blue-primary)] hover:underline flex items-center gap-1"
          >
            <DocumentTextIcon className="w-4 h-4" />
            전문 보기
          </button>
        </div>

        {/* 개인정보 수집 및 이용 안내 */}
        <div className="flex items-center justify-between p-4 bg-[var(--color-bg-secondary)] rounded-lg">
          <div className="flex items-center gap-3 flex-1">
            <button
              type="button"
              onClick={() => onTermsChange({
                termsServiceAgreed,
                termsPrivacyAgreed: !termsPrivacyAgreed,
                marketingConsent,
              })}
              className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${
                termsPrivacyAgreed
                  ? 'bg-[var(--color-blue-primary)]'
                  : 'bg-[var(--color-bg-primary)] border-2 border-[var(--color-border-card)]'
              }`}
            >
              {termsPrivacyAgreed && <CheckCircleIcon className="w-4 h-4 text-white" />}
            </button>
            <div className="flex-1">
              <span className="text-[var(--color-text-primary)] font-medium">
                [필수] 개인정보 수집 및 이용 안내
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowPrivacyTerms(!showPrivacyTerms)}
            className="text-sm text-[var(--color-blue-primary)] hover:underline flex items-center gap-1"
          >
            <DocumentTextIcon className="w-4 h-4" />
            전문 보기
          </button>
        </div>

        {/* 마케팅 정보 수신 동의 */}
        <div className="flex items-center justify-between p-4 bg-[var(--color-bg-secondary)] rounded-lg">
          <div className="flex items-center gap-3 flex-1">
            <button
              type="button"
              onClick={() => onTermsChange({
                termsServiceAgreed,
                termsPrivacyAgreed,
                marketingConsent: !marketingConsent,
              })}
              className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${
                marketingConsent
                  ? 'bg-[var(--color-blue-primary)]'
                  : 'bg-[var(--color-bg-primary)] border-2 border-[var(--color-border-card)]'
              }`}
            >
              {marketingConsent && <CheckCircleIcon className="w-4 h-4 text-white" />}
            </button>
            <div className="flex-1">
              <span className="text-[var(--color-text-secondary)]">
                [선택] 광고성 정보 수신
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 약관 전문 모달 (간단한 예시) */}
      {showServiceTerms && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--color-bg-card)] rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">서비스 이용 약관</h3>
            <div className="text-sm text-[var(--color-text-secondary)] space-y-4">
              <p>서비스 이용 약관 전문 내용이 여기에 표시됩니다.</p>
              <p>실제 약관 내용을 여기에 추가하시면 됩니다.</p>
            </div>
            <button
              onClick={() => setShowServiceTerms(false)}
              className="mt-6 w-full py-2 bg-[var(--color-blue-primary)] text-white rounded-lg"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {showPrivacyTerms && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--color-bg-card)] rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">개인정보 수집 및 이용 안내</h3>
            <div className="text-sm text-[var(--color-text-secondary)] space-y-4">
              <p>개인정보 수집 및 이용 안내 전문 내용이 여기에 표시됩니다.</p>
              <p>실제 약관 내용을 여기에 추가하시면 됩니다.</p>
            </div>
            <button
              onClick={() => setShowPrivacyTerms(false)}
              className="mt-6 w-full py-2 bg-[var(--color-blue-primary)] text-white rounded-lg"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Step2TermsAgreement;
