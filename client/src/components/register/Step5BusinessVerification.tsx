import React, { useState } from 'react';
import { BuildingOfficeIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { api } from '../../utils/api';
import { showError, showSuccess, showWarning } from '../../utils/swal';
import Tooltip from '../Tooltip';

interface Step5BusinessVerificationProps {
  businessNumber: string;
  onBusinessNumberChange: (businessNumber: string) => void;
  isBusinessNumberVerified: boolean;
  onBusinessNumberVerified: (verified: boolean) => void;
}

const Step5BusinessVerification: React.FC<Step5BusinessVerificationProps> = ({
  businessNumber,
  onBusinessNumberChange,
  isBusinessNumberVerified,
  onBusinessNumberVerified,
}) => {
  const [isVerifying, setIsVerifying] = useState(false);

  // 사업자번호 형식 자동 변환 (하이픈 추가)
  const formatBusinessNumber = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 5) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 5)}-${numbers.slice(5, 10)}`;
  };

  // 사업자번호 검증 (형식 검증만 수행, 실제 검증은 회원가입 시 백엔드에서 수행)
  const handleVerify = async () => {
    if (!businessNumber) {
      await showWarning('사업자등록번호를 입력해주세요.', '입력 필요');
      return;
    }

    const businessNumberRegex = /^\d{3}-\d{2}-\d{5}$/;
    if (!businessNumberRegex.test(businessNumber)) {
      await showWarning('사업자등록번호는 XXX-XX-XXXXX 형식으로 입력해주세요.', '형식 오류');
      return;
    }

    setIsVerifying(true);
    try {
      // TODO: 실제 사업자등록번호 조회 API 연동
      // 현재는 형식만 검증하고 검증 완료로 처리
      // 실제 운영 시에는 백엔드 API를 통해 검증해야 합니다.
      // 회원가입 시 백엔드에서 실제 검증이 수행됩니다.
      
      // 형식 검증만 통과하면 검증 완료로 처리 (실제 API 연동 전까지)
      // 회원가입 시 백엔드에서 실제 사업자등록번호 조회 API를 통해 검증합니다.
      onBusinessNumberVerified(true);
      await showSuccess('사업자등록번호 형식이 확인되었습니다. 회원가입 시 최종 검증이 진행됩니다.', '형식 확인 완료');
    } catch (error) {
      console.error('사업자등록번호 검증 실패:', error);
      await showError('사업자등록번호 검증에 실패했습니다. 올바른 사업자등록번호를 입력해주세요.', '검증 실패');
      onBusinessNumberVerified(false);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg">
          <BuildingOfficeIcon className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-[var(--color-text-primary)] mb-2">
          사업자등록번호 검증
        </h2>
        <p className="text-base text-[var(--color-text-secondary)]">
          사업자 회원 가입을 위해 사업자등록번호를 입력하고 검증해주세요
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-4">
        {/* 안내 문구 */}
        <div className="p-5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
          <div className="flex items-start gap-3">
            <BuildingOfficeIcon className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-1">
                사업자등록번호 검증 안내
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed">
                사업자등록번호는 자동으로 하이픈(-)이 추가됩니다. 숫자만 입력해주세요.<br />
                검증 완료 후 회원가입이 진행됩니다.
              </p>
            </div>
          </div>
        </div>

        {/* 사업자등록번호 입력 */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-primary)] mb-2">
            사업자등록번호 <span className="text-red-500">*</span>
            <Tooltip content="사업자등록번호는 XXX-XX-XXXXX 형식입니다. 숫자만 입력하면 자동으로 하이픈이 추가됩니다." />
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={businessNumber}
              onChange={(e) => {
                const formatted = formatBusinessNumber(e.target.value);
                onBusinessNumberChange(formatted);
                onBusinessNumberVerified(false);
              }}
              placeholder="123-45-67890"
              maxLength={12}
              disabled={isBusinessNumberVerified}
              className={`flex-1 px-4 py-3 border rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)] ${
                isBusinessNumberVerified
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : 'border-[var(--color-border-card)]'
              }`}
            />
            {!isBusinessNumberVerified && (
              <button
                type="button"
                onClick={handleVerify}
                disabled={isVerifying || !businessNumber || businessNumber.length < 12}
                className="px-6 py-3 bg-[var(--color-blue-primary)] text-white rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {isVerifying ? '검증 중...' : '검증하기'}
              </button>
            )}
          </div>
          {isBusinessNumberVerified && (
            <div className="mt-3 flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <CheckCircleIcon className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium text-green-700 dark:text-green-400">
                사업자등록번호 검증이 완료되었습니다.
              </span>
            </div>
          )}
        </div>

        {/* 검증 완료 안내 */}
        {isBusinessNumberVerified && (
          <div className="p-5 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-800 rounded-xl">
            <p className="text-sm text-[var(--color-text-primary)] font-medium">
              ✅ 검증이 완료되었습니다. 다음 단계로 진행하실 수 있습니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Step5BusinessVerification;
