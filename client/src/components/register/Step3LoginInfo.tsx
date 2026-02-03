import React, { useState, useEffect, useRef } from 'react';
import { EnvelopeIcon, LockClosedIcon, EyeIcon, EyeSlashIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { api } from '../../utils/api';

interface Step3LoginInfoProps {
  email: string;
  password: string;
  confirmPassword: string;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onConfirmPasswordChange: (confirmPassword: string) => void;
}

const Step3LoginInfo: React.FC<Step3LoginInfoProps> = ({
  email,
  password,
  confirmPassword,
  onEmailChange,
  onPasswordChange,
  onConfirmPasswordChange,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);

  // 비밀번호 강도 체크 (대/소문자 중 하나만 있어도 통과)
  const passwordStrength = {
    length: password.length >= 8,
    letter: /(?=.*[a-zA-Z])/.test(password), // 영문 대문자 또는 소문자 중 하나 이상
    number: /(?=.*\d)/.test(password),
  };

  const isPasswordValid = passwordStrength.length && passwordStrength.letter && passwordStrength.number;
  const passwordMatch = password === confirmPassword && confirmPassword.length > 0;

  // 이메일 중복 검사 (디바운스)
  useEffect(() => {
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setEmailAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingEmail(true);
      try {
        const result = await api.get<{ available: boolean }>(
          `/api/auth/check-email?email=${encodeURIComponent(email)}`
        );
        console.log('이메일 확인 결과:', result, '타입:', typeof result);
        // 응답이 객체이고 available 속성이 있는지 확인
        if (result && typeof result === 'object') {
          if ('available' in result) {
            const available = (result as { available: boolean }).available;
            console.log('이메일 사용 가능 여부:', available);
            setEmailAvailable(available);
          } else {
            console.error('응답에 available 속성이 없습니다:', result);
            setEmailAvailable(null);
          }
        } else {
          console.error('예상하지 못한 응답 형식:', result, typeof result);
          setEmailAvailable(null);
        }
      } catch (error: any) {
        console.error('이메일 확인 중 오류:', error);
        // 네트워크 오류인 경우 (서버가 실행되지 않았거나 연결할 수 없음)
        if (error?.message?.includes('Failed to fetch') || error?.message?.includes('ERR_CONNECTION_REFUSED')) {
          console.warn('서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.');
          // 서버 연결 오류는 null로 설정하여 에러 메시지를 표시하지 않음
          setEmailAvailable(null);
        } else {
          // 다른 오류인 경우 (예: 이메일 형식 오류 등)
          // 서버에서 반환한 오류 메시지가 있으면 사용
          const errorMessage = error?.response?.data?.message || error?.message || '이메일 확인 중 오류가 발생했습니다.';
          console.error('이메일 확인 오류:', errorMessage);
          setEmailAvailable(null);
        }
      } finally {
        setIsCheckingEmail(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [email]);

  return (
    <div className="space-y-6">
      {/* 이메일 입력 */}
      <div>
        <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
          이메일 주소
        </label>
        <div className="relative">
          <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-secondary)]" />
          <input
            type="email"
            value={email}
            onChange={(e) => {
              onEmailChange(e.target.value);
              setEmailAvailable(null);
            }}
            className={`w-full pl-10 pr-10 py-3 border rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)] ${
              emailAvailable === false
                ? 'border-red-500'
                : emailAvailable === true
                ? 'border-green-500'
                : 'border-[var(--color-border-card)]'
            }`}
            placeholder="이메일 주소를 입력해 주십시오."
          />
          {isCheckingEmail && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-5 h-5 border-2 border-[var(--color-blue-primary)] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {!isCheckingEmail && emailAvailable === true && (
            <CheckCircleIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
          )}
          {!isCheckingEmail && emailAvailable === false && email && /\S+@\S+\.\S+/.test(email) && (
            <XCircleIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
          )}
        </div>
        {email && !/\S+@\S+\.\S+/.test(email) && (
          <p className="mt-1 text-sm text-red-500">올바른 이메일 형식이 아닙니다.</p>
        )}
        {isCheckingEmail && (
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">확인 중...</p>
        )}
        {emailAvailable === true && (
          <p className="mt-1 text-sm text-green-500">사용 가능한 이메일입니다.</p>
        )}
        {emailAvailable === false && email && /\S+@\S+\.\S+/.test(email) && (
          <p className="mt-1 text-sm text-red-500">이미 사용 중인 이메일입니다.</p>
        )}
      </div>

      {/* 비밀번호 입력 */}
      <div>
        <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
          비밀번호
        </label>
        <div className="relative">
          <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-secondary)]" />
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            onKeyDown={(e) => {
              // Tab 키를 누르면 비밀번호 확인 필드로 포커스 이동
              if (e.key === 'Tab' && !e.shiftKey) {
                e.preventDefault();
                confirmPasswordRef.current?.focus();
              }
            }}
            className="w-full pl-10 pr-12 py-3 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
            placeholder="비밀번호를 입력해주세요"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          >
            {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
          </button>
        </div>
        
        {/* 비밀번호 강도 표시 */}
        {password && (
          <div className="mt-3 p-4 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-card)]">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-[var(--color-text-primary)]">비밀번호 강도:</span>
              <span className={`text-sm font-semibold ${
                isPasswordValid ? 'text-green-500' : 'text-yellow-500'
              }`}>
                {isPasswordValid ? '적정' : '부족'}
              </span>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className={`flex items-center gap-2 ${passwordStrength.length ? 'text-green-500' : 'text-[var(--color-text-secondary)]'}`}>
                <span>{passwordStrength.length ? '✓' : '○'}</span>
                <span>8자 이상</span>
              </div>
              <div className={`flex items-center gap-2 ${passwordStrength.letter ? 'text-green-500' : 'text-[var(--color-text-secondary)]'}`}>
                <span>{passwordStrength.letter ? '✓' : '○'}</span>
                <span>대/소문자 포함</span>
              </div>
              <div className={`flex items-center gap-2 ${passwordStrength.number ? 'text-green-500' : 'text-[var(--color-text-secondary)]'}`}>
                <span>{passwordStrength.number ? '✓' : '○'}</span>
                <span>숫자 포함</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 비밀번호 확인 */}
      <div>
        <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
          비밀번호 확인
        </label>
        <div className="relative">
          <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-secondary)]" />
          <input
            ref={confirmPasswordRef}
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => onConfirmPasswordChange(e.target.value)}
            className="w-full pl-10 pr-12 py-3 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
            placeholder="비밀번호를 다시 입력해주세요"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          >
            {showConfirmPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
          </button>
        </div>
        {confirmPassword && (
          <p className={`mt-1 text-sm ${passwordMatch ? 'text-green-500' : 'text-red-500'}`}>
            {passwordMatch ? '비밀번호가 일치합니다.' : '비밀번호가 일치하지 않습니다.'}
          </p>
        )}
      </div>
    </div>
  );
};

export default Step3LoginInfo;
