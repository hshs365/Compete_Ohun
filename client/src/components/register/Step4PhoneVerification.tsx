import React, { useState, useEffect } from 'react';
import { PhoneIcon, CheckCircleIcon, UserIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { api } from '../../utils/api';
import { showSuccess, showError, showWarning } from '../../utils/swal';

interface Step4PhoneVerificationProps {
  phone: string;
  verificationCode: string;
  isPhoneVerified: boolean;
  realName: string;
  onPhoneChange: (phone: string) => void;
  onVerificationCodeChange: (code: string) => void;
  onPhoneVerified: (verified: boolean) => void;
  onRealNameChange: (realName: string) => void;
}

const Step4PhoneVerification: React.FC<Step4PhoneVerificationProps> = ({
  phone,
  verificationCode,
  isPhoneVerified,
  realName,
  onPhoneChange,
  onVerificationCodeChange,
  onPhoneVerified,
  onRealNameChange,
}) => {
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isComposing, setIsComposing] = useState(false);

  // 카운트다운 타이머
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // 전화번호 형식 자동 변환
  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  // 인증번호 발송
  const handleRequestVerification = async () => {
    if (!phone || phone.trim() === '') {
      await showWarning('전화번호를 입력해주세요.', '입력 필요');
      return;
    }

    const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;
    if (!phoneRegex.test(phone)) {
      await showWarning('올바른 전화번호 형식이 아닙니다. (예: 010-1234-5678)', '형식 오류');
      return;
    }

    setIsSendingCode(true);
    try {
      await api.post('/api/auth/phone/request-verification', { phone });
      setCountdown(180); // 3분 카운트다운
      await showSuccess('인증번호가 발송되었습니다.', '인증번호 발송');
    } catch (error) {
      await showError(
        error instanceof Error ? error.message : '인증번호 발송에 실패했습니다.',
        '발송 실패'
      );
    } finally {
      setIsSendingCode(false);
    }
  };

  // 인증번호 검증
  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      await showWarning('인증번호 6자리를 입력해주세요.', '입력 필요');
      return;
    }

    setIsVerifyingCode(true);
    try {
      await api.post('/api/auth/phone/verify', { phone, code: verificationCode });
      onPhoneVerified(true);
      setCountdown(0);
      await showSuccess('인증이 완료되었습니다.', '인증 완료');
    } catch (error) {
      await showError(
        error instanceof Error ? error.message : '인증번호가 일치하지 않습니다.',
        '인증 실패'
      );
    } finally {
      setIsVerifyingCode(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 안내 문구 */}
      <div className="mb-6">
        <p className="text-sm text-[var(--color-text-secondary)]">
          본인인증을 위해 전화번호 인증을 진행해주세요.
        </p>
      </div>

      {/* 전화번호 입력 */}
      <div>
        <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
          휴대전화 번호
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-secondary)]" />
            <input
              type="tel"
              inputMode="numeric"
              pattern="[0-9-]*"
              value={phone || ''}
              onChange={(e) => {
                const inputValue = e.target.value;
                const numbers = inputValue.replace(/[^\d]/g, '');
                const formatted = formatPhoneNumber(numbers);
                // 항상 포맷된 값을 전달 (MultiStepRegister에서 변경 여부 체크)
                onPhoneChange(formatted);
              }}
              className="w-full pl-10 pr-4 py-3 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)] disabled:opacity-50"
              placeholder="010-1234-5678"
              maxLength={13}
              disabled={isPhoneVerified}
              autoComplete="tel"
            />
          </div>
          <button
            type="button"
            onClick={handleRequestVerification}
            disabled={isSendingCode || countdown > 0 || isPhoneVerified}
            className="px-6 py-3 bg-[var(--color-blue-primary)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {isSendingCode
              ? '발송 중...'
              : countdown > 0
              ? `${Math.floor(countdown / 60)}:${String(countdown % 60).padStart(2, '0')}`
              : '인증번호 발송'}
          </button>
        </div>
      </div>

      {/* 인증번호 입력 */}
      {!isPhoneVerified && (
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
            인증번호
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={verificationCode}
              onChange={(e) => {
                const value = e.target.value.replace(/[^\d]/g, '').slice(0, 6);
                onVerificationCodeChange(value);
              }}
              className="flex-1 px-4 py-3 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
              placeholder="인증번호 6자리"
              maxLength={6}
              autoComplete="one-time-code"
            />
            <button
              type="button"
              onClick={handleVerifyCode}
              disabled={isVerifyingCode || verificationCode.length !== 6}
              className="px-6 py-3 bg-green-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {isVerifyingCode ? '확인 중...' : '인증 확인'}
            </button>
          </div>
          {/* 재전송 버튼 */}
          <div className="mt-2 flex items-center justify-end">
            <button
              type="button"
              onClick={handleRequestVerification}
              disabled={isSendingCode || countdown > 0 || isPhoneVerified}
              className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-blue-primary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowPathIcon className={`w-3.5 h-3.5 ${isSendingCode ? 'animate-spin' : ''}`} />
              {isSendingCode
                ? '재전송 중...'
                : countdown > 0
                ? `재전송 (${Math.floor(countdown / 60)}:${String(countdown % 60).padStart(2, '0')})`
                : '인증번호 재전송'}
            </button>
          </div>
        </div>
      )}

      {/* 인증 완료 표시 */}
      {isPhoneVerified && (
        <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
          <span className="text-sm font-medium text-green-700 dark:text-green-400">
            본인인증이 완료되었습니다.
          </span>
        </div>
      )}

      {/* 실명 입력 (인증 완료 후) */}
      {isPhoneVerified && (
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-primary)] mb-2">
            <UserIcon className="w-4 h-4" />
            실명
          </label>
          <input
            type="text"
            value={realName}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={(e) => {
              setIsComposing(false);
              const value = e.currentTarget.value.replace(/[^가-힣a-zA-Z\s]/g, '');
              onRealNameChange(value);
            }}
            onChange={(e) => {
              if (!isComposing) {
                const value = e.target.value.replace(/[^가-힣a-zA-Z\s]/g, '');
                onRealNameChange(value);
              } else {
                onRealNameChange(e.target.value);
              }
            }}
            className="w-full px-4 py-3 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
            placeholder="이름을 입력해주세요 (한글 또는 영문만 가능)"
            maxLength={50}
          />
          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
            본인인증 완료 후 실명을 입력해주세요. 한글 또는 영문만 입력 가능합니다.
          </p>
        </div>
      )}
    </div>
  );
};

export default Step4PhoneVerification;
