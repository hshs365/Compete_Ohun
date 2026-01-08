import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { EnvelopeIcon, LockClosedIcon, EyeIcon, EyeSlashIcon, PhoneIcon, CheckCircleIcon, UserIcon, ArrowPathIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import type { RegisterData } from '../contexts/AuthContext';
import { SPORTS_LIST } from '../constants/sports';
import { api } from '../utils/api';
import Tooltip from './Tooltip';
import { showError, showSuccess, showWarning } from '../utils/swal';

// Daum Postcode API 타입 선언
declare global {
  interface Window {
    daum: {
      Postcode: new (options: {
        oncomplete: (data: {
          address: string;
          addressType: string;
          bname: string;
          buildingName: string;
          zonecode: string;
          sido: string;
          sigungu: string;
        }) => void;
        width?: string;
        height?: string;
      }) => {
        open: () => void;
      };
    };
  }
}

const RegisterPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isComposing, setIsComposing] = useState(false); // 한글 입력 조합 중 여부
  const [selectedAddress, setSelectedAddress] = useState(''); // 선택한 주소
  const [formData, setFormData] = useState<RegisterData>({
    realName: '', // 실명
    nickname: '',
    gender: 'male',
    ageRange: '',
    residenceSido: '',
    residenceSigungu: '',
    interestedSports: [],
    skillLevel: 'beginner',
    termsServiceAgreed: false,
    termsPrivacyAgreed: false,
    marketingConsent: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const { register } = useAuth();

  useEffect(() => {
    // 회원가입 페이지도 다크 테마 적용
    document.documentElement.classList.add('dark');
    return () => {
      // 페이지를 떠날 때는 원래 테마로 복원하지 않음 (App.tsx에서 관리)
    };
  }, []);

  // 카운트다운 타이머
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // 전화번호 형식 자동 변환 (하이픈 추가)
  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  // 인증번호 발송
  const handleRequestVerification = async () => {
    if (!phone) {
      setErrors({ ...errors, phone: '전화번호를 입력해주세요.' });
      return;
    }

    const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;
    if (!phoneRegex.test(phone)) {
      setErrors({ ...errors, phone: '올바른 전화번호 형식이 아닙니다. (예: 010-1234-5678)' });
      return;
    }

    setIsSendingCode(true);
    setErrors({ ...errors, phone: '', verification: '' });
    try {
      await api.post('/api/auth/phone/request-verification', { phone });
      setCountdown(180); // 3분 카운트다운
      await showSuccess('인증번호가 발송되었습니다.', '인증번호 발송');
    } catch (error) {
      setErrors({
        ...errors,
        verification: error instanceof Error ? error.message : '인증번호 발송에 실패했습니다.',
      });
    } finally {
      setIsSendingCode(false);
    }
  };

  // 인증번호 검증
  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setErrors({ ...errors, verificationCode: '인증번호 6자리를 입력해주세요.' });
      return;
    }

    setIsVerifyingCode(true);
    setErrors({ ...errors, verificationCode: '' });
    try {
      await api.post('/api/auth/phone/verify', { phone, code: verificationCode });
      setIsPhoneVerified(true);
      setCountdown(0);
      await showSuccess('인증이 완료되었습니다.', '인증 완료');
    } catch (error) {
      setErrors({
        ...errors,
        verificationCode: error instanceof Error ? error.message : '인증번호가 일치하지 않습니다.',
      });
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const sportsList = SPORTS_LIST;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};

    if (!email) {
      newErrors.email = '이메일을 입력해주세요.';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다.';
    }

    if (!password || password.length < 8) {
      newErrors.password = '비밀번호는 8자 이상이어야 합니다.';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      newErrors.password = '비밀번호는 대문자, 소문자, 숫자를 포함해야 합니다.';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.';
    }

    if (!formData.realName || formData.realName.length < 2) {
      newErrors.realName = '이름을 입력해주세요. (2자 이상)';
    } else if (!/^[가-힣a-zA-Z\s]+$/.test(formData.realName)) {
      newErrors.realName = '이름은 한글 또는 영문만 입력 가능합니다.';
    }

    if (!formData.nickname || formData.nickname.length < 2) {
      newErrors.nickname = '닉네임은 2자 이상이어야 합니다.';
    }

    if (!selectedAddress || !formData.residenceSido || !formData.residenceSigungu) {
      newErrors.address = '주소를 검색해주세요.';
    }

    if (!formData.termsServiceAgreed) {
      newErrors.termsServiceAgreed = '서비스 이용약관에 동의해주세요.';
    }
    if (!formData.termsPrivacyAgreed) {
      newErrors.termsPrivacyAgreed = '개인정보 처리방침에 동의해주세요.';
    }

    if (!phone) {
      newErrors.phone = '전화번호를 입력해주세요.';
    } else if (!/^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/.test(phone)) {
      newErrors.phone = '올바른 전화번호 형식이 아닙니다.';
    }

    if (!isPhoneVerified) {
      newErrors.verification = '본인인증을 완료해주세요.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      console.log('회원가입 시도:', { email, phone, verificationCode, formData });
      // 회원가입 처리 후 홈으로 이동 (가이드는 홈에서 표시)
      await register(email, password, { ...formData, phone, verificationCode });
      // register 함수에서 자동으로 navigate('/') 호출
    } catch (error) {
      console.error('회원가입 에러:', error);
      const errorMessage = error instanceof Error ? error.message : '회원가입에 실패했습니다.';
      setErrors({ submit: errorMessage });
      await showError(errorMessage, '회원가입 실패');
    }
  };

  // 주소 검색 열기
  const handleAddressSearch = async () => {
    if (!window.daum || !window.daum.Postcode) {
      await showWarning('주소 검색 서비스를 불러올 수 없습니다. 페이지를 새로고침해주세요.', '서비스 오류');
      return;
    }

    new window.daum.Postcode({
      oncomplete: (data) => {
        // 주소 정보 추출
        let addr = ''; // 주소 변수
        let extraAddr = ''; // 참고항목 변수

        // 사용자가 선택한 주소 타입에 따라 해당 주소 값을 가져온다.
        if (data.addressType === 'R') {
          // 사용자가 도로명 주소를 선택했을 경우
          addr = data.roadAddress || data.address;
        } else {
          // 사용자가 지번 주소를 선택했을 경우(J)
          addr = data.jibunAddress || data.address;
        }

        // 사용자가 선택한 주소가 도로명 타입일때 참고항목을 조합한다.
        if (data.addressType === 'R') {
          // 법정동명이 있을 경우 추가한다. (법정리는 제외)
          // 법정동의 경우 마지막 문자가 "동/로/가"로 끝난다.
          if (data.bname !== '' && /[동|로|가]$/g.test(data.bname)) {
            extraAddr += data.bname;
          }
          // 건물명이 있고, 공동주택일 경우 추가한다.
          if (data.buildingName !== '' && data.apartment === 'Y') {
            extraAddr += extraAddr !== '' ? ', ' + data.buildingName : data.buildingName;
          }
          // 표시할 참고항목이 있을 경우, 괄호까지 추가한 최종 문자열을 만든다.
          if (extraAddr !== '') {
            extraAddr = ' (' + extraAddr + ')';
          }
        }

        // 주소 정보 설정
        setSelectedAddress(addr + extraAddr);
        setFormData({
          ...formData,
          residenceSido: data.sido,
          residenceSigungu: data.sigungu,
        });
        setErrors({ ...errors, address: '' });
      },
      width: '100%',
      height: '100%',
    }).open();
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)] px-4 py-12 overflow-y-auto">
      <div className="w-full max-w-2xl my-8">
        <div className="bg-[var(--color-bg-card)] rounded-2xl shadow-lg border border-[var(--color-border-card)] p-8">
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-2 text-center">
            회원가입
          </h1>
          <p className="text-[var(--color-text-secondary)] text-center mb-8">
            운동 매치 플랫폼에 가입하세요
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 이메일 */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                이메일 <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors({ ...errors, email: '' });
                }}
                className={`w-full px-4 py-2 border rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] ${
                  errors.email ? 'border-red-500' : 'border-[var(--color-border-card)]'
                }`}
                placeholder="이메일을 입력하세요"
              />
              {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
            </div>

            {/* 비밀번호 */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-primary)] mb-2">
                비밀번호 <span className="text-red-500">*</span>
                <Tooltip
                  content={
                    <div className="space-y-1">
                      <p className="font-medium mb-1.5 text-xs">비밀번호 요구사항:</p>
                      <div className="text-xs space-y-0.5">
                        <div>• 8자 이상</div>
                        <div>• 소문자 포함</div>
                        <div>• 대문자 포함</div>
                        <div>• 숫자 포함</div>
                      </div>
                    </div>
                  }
                />
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrors({ ...errors, password: '' });
                  }}
                  className={`w-full px-4 py-2 border rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] ${
                    errors.password ? 'border-red-500' : 'border-[var(--color-border-card)]'
                  }`}
                  placeholder="비밀번호를 입력하세요"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]"
                  tabIndex={-1}
                  aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                >
                  {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
              {/* 비밀번호 입력 중이고 조건에 맞지 않을 때만 표시 */}
              {password && password.length > 0 && !errors.password && (
                <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">비밀번호 요구사항:</p>
                      <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                        <li className={`flex items-center gap-1 ${password.length >= 8 ? 'text-green-600 dark:text-green-400' : ''}`}>
                          <span>{password.length >= 8 ? '✓' : '○'}</span>
                          <span>8자 이상</span>
                        </li>
                        <li className={`flex items-center gap-1 ${/(?=.*[a-z])/.test(password) ? 'text-green-600 dark:text-green-400' : ''}`}>
                          <span>{/(?=.*[a-z])/.test(password) ? '✓' : '○'}</span>
                          <span>소문자 포함</span>
                        </li>
                        <li className={`flex items-center gap-1 ${/(?=.*[A-Z])/.test(password) ? 'text-green-600 dark:text-green-400' : ''}`}>
                          <span>{/(?=.*[A-Z])/.test(password) ? '✓' : '○'}</span>
                          <span>대문자 포함</span>
                        </li>
                        <li className={`flex items-center gap-1 ${/(?=.*\d)/.test(password) ? 'text-green-600 dark:text-green-400' : ''}`}>
                          <span>{/(?=.*\d)/.test(password) ? '✓' : '○'}</span>
                          <span>숫자 포함</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
              {errors.password && (
                <div className="mt-2">
                  <p className="text-sm text-red-500 mb-2">{errors.password}</p>
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-xs font-medium text-red-700 dark:text-red-300 mb-1">비밀번호 요구사항:</p>
                    <ul className="text-xs text-red-600 dark:text-red-400 space-y-1">
                      <li className={`flex items-center gap-1 ${password.length >= 8 ? 'text-green-600 dark:text-green-400' : ''}`}>
                        <span>{password.length >= 8 ? '✓' : '○'}</span>
                        <span>8자 이상</span>
                      </li>
                      <li className={`flex items-center gap-1 ${/(?=.*[a-z])/.test(password) ? 'text-green-600 dark:text-green-400' : ''}`}>
                        <span>{/(?=.*[a-z])/.test(password) ? '✓' : '○'}</span>
                        <span>소문자 포함</span>
                      </li>
                      <li className={`flex items-center gap-1 ${/(?=.*[A-Z])/.test(password) ? 'text-green-600 dark:text-green-400' : ''}`}>
                        <span>{/(?=.*[A-Z])/.test(password) ? '✓' : '○'}</span>
                        <span>대문자 포함</span>
                      </li>
                      <li className={`flex items-center gap-1 ${/(?=.*\d)/.test(password) ? 'text-green-600 dark:text-green-400' : ''}`}>
                        <span>{/(?=.*\d)/.test(password) ? '✓' : '○'}</span>
                        <span>숫자 포함</span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* 비밀번호 확인 */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                비밀번호 확인 <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setErrors({ ...errors, confirmPassword: '' });
                }}
                className={`w-full px-4 py-2 border rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] ${
                  errors.confirmPassword ? 'border-red-500' : 'border-[var(--color-border-card)]'
                }`}
                placeholder="비밀번호를 다시 입력하세요"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>
              )}
            </div>

            {/* 연락처 및 본인인증 */}
            <div className="space-y-3">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  연락처 <span className="text-red-500">*</span>
                  <Tooltip content="전화번호는 자동으로 하이픈(-)이 추가됩니다. 숫자만 입력해주세요." />
                </label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      const formatted = formatPhoneNumber(e.target.value);
                      setPhone(formatted);
                      setErrors({ ...errors, phone: '' });
                      setIsPhoneVerified(false);
                      setVerificationCode('');
                    }}
                    className={`flex-1 px-4 py-2 border rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] ${
                      errors.phone ? 'border-red-500' : 'border-[var(--color-border-card)]'
                    }`}
                    placeholder="010-1234-5678"
                    maxLength={13}
                    disabled={isPhoneVerified}
                  />
                  <button
                    type="button"
                    onClick={handleRequestVerification}
                    disabled={isSendingCode || countdown > 0 || isPhoneVerified}
                    className="px-4 py-2 bg-[var(--color-blue-primary)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {isSendingCode
                      ? '발송 중...'
                      : countdown > 0
                        ? `${Math.floor(countdown / 60)}:${String(countdown % 60).padStart(2, '0')}`
                        : '인증번호 발송'}
                  </button>
                </div>
                {errors.phone && (
                  <div className="mt-2">
                    <p className="text-sm text-red-500 mb-2">{errors.phone}</p>
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        전화번호는 자동으로 하이픈(-)이 추가됩니다. 숫자만 입력해주세요.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {!isPhoneVerified && (
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-primary)] mb-2">
                    인증번호 <span className="text-red-500">*</span>
                    <Tooltip content="인증번호는 6자리 숫자입니다. SMS로 발송된 인증번호를 입력해주세요." />
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^\d]/g, '').slice(0, 6);
                        setVerificationCode(value);
                        setErrors({ ...errors, verificationCode: '' });
                      }}
                      className={`flex-1 px-4 py-2 border rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] ${
                        errors.verificationCode ? 'border-red-500' : 'border-[var(--color-border-card)]'
                      }`}
                      placeholder="인증번호를 입력해주세요"
                      maxLength={6}
                    />
                    <button
                      type="button"
                      onClick={handleVerifyCode}
                      disabled={isVerifyingCode || verificationCode.length !== 6}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
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
                  {(errors.verificationCode || errors.verification) && (
                    <div className="mt-2">
                      {errors.verificationCode && (
                        <p className="text-sm text-red-500 mb-2">{errors.verificationCode}</p>
                      )}
                      {errors.verification && (
                        <p className="text-sm text-red-500 mb-2">{errors.verification}</p>
                      )}
                      <div className="p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                          인증번호는 6자리 숫자입니다. SMS로 발송된 인증번호를 입력해주세요.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {isPhoneVerified && (
                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-400">
                    본인인증이 완료되었습니다.
                  </span>
                </div>
              )}
            </div>

            {/* 실명 (본인인증 완료 후 표시) */}
            {isPhoneVerified && (
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  <UserIcon className="w-4 h-4" />
                  실명 <span className="text-red-500">*</span>
                  <Tooltip content="본인인증 완료 후 실명을 입력해주세요. 한글 또는 영문만 입력 가능합니다." />
                </label>
                <input
                  type="text"
                  value={formData.realName}
                  onCompositionStart={() => setIsComposing(true)}
                  onCompositionEnd={(e) => {
                    setIsComposing(false);
                    // 조합 완료 후 필터링
                    const value = e.currentTarget.value.replace(/[^가-힣a-zA-Z\s]/g, '');
                    setFormData({ ...formData, realName: value });
                    setErrors({ ...errors, realName: '' });
                  }}
                  onChange={(e) => {
                    // 한글 조합 중이 아닐 때만 필터링
                    if (!isComposing) {
                      const value = e.target.value.replace(/[^가-힣a-zA-Z\s]/g, '');
                      setFormData({ ...formData, realName: value });
                      setErrors({ ...errors, realName: '' });
                    } else {
                      // 조합 중일 때는 그대로 저장 (조합 완료 후 onCompositionEnd에서 필터링)
                      setFormData({ ...formData, realName: e.target.value });
                      setErrors({ ...errors, realName: '' });
                    }
                  }}
                  className={`w-full px-4 py-2 border rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] ${
                    errors.realName ? 'border-red-500' : 'border-[var(--color-border-card)]'
                  }`}
                  placeholder="이름을 입력해주세요"
                  maxLength={50}
                />
                {errors.realName && <p className="mt-1 text-sm text-red-500">{errors.realName}</p>}
              </div>
            )}

            {/* 닉네임 */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                닉네임 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.nickname}
                onChange={(e) => {
                  setFormData({ ...formData, nickname: e.target.value });
                  setErrors({ ...errors, nickname: '' });
                }}
                className={`w-full px-4 py-2 border rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] ${
                  errors.nickname ? 'border-red-500' : 'border-[var(--color-border-card)]'
                }`}
                placeholder="닉네임을 입력하세요"
              />
              {errors.nickname && <p className="mt-1 text-sm text-red-500">{errors.nickname}</p>}
            </div>

            {/* 성별 */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                성별 <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4">
                {(['male', 'female', 'other'] as const).map((gender) => (
                  <label key={gender} className="flex items-center">
                    <input
                      type="radio"
                      value={gender}
                      checked={formData.gender === gender}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          gender: e.target.value as 'male' | 'female' | 'other',
                        })
                      }
                      className="mr-2"
                    />
                    <span className="text-[var(--color-text-primary)]">
                      {gender === 'male' ? '남성' : gender === 'female' ? '여성' : '기타'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* 거주 지역 (주소 검색) */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-primary)] mb-2">
                <MapPinIcon className="w-4 h-4" />
                거주 지역 <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={selectedAddress}
                  readOnly
                  onClick={handleAddressSearch}
                  className={`flex-1 px-4 py-2 border rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] cursor-pointer ${
                    errors.address ? 'border-red-500' : 'border-[var(--color-border-card)]'
                  }`}
                  placeholder="주소를 검색해주세요"
                />
                <button
                  type="button"
                  onClick={handleAddressSearch}
                  className="px-4 py-2 bg-[var(--color-blue-primary)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
                >
                  주소 검색
                </button>
              </div>
              {errors.address && <p className="mt-1 text-sm text-red-500">{errors.address}</p>}
              {selectedAddress && (
                <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                  선택된 주소: {selectedAddress}
                </p>
              )}
            </div>

            {/* 약관 동의 */}
            <div className="space-y-3 px-4 pt-3 pb-4 bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-card)]">
              {/* 필수 항목 모두 동의 버튼 */}
              <button
                type="button"
                onClick={() => {
                  const allRequiredAgreed = formData.termsServiceAgreed && formData.termsPrivacyAgreed;
                  setFormData({
                    ...formData,
                    termsServiceAgreed: !allRequiredAgreed,
                    termsPrivacyAgreed: !allRequiredAgreed,
                  });
                  setErrors({ ...errors, termsServiceAgreed: '', termsPrivacyAgreed: '' });
                }}
                className="w-full flex items-center justify-between py-3 mb-3 border-b border-[var(--color-border-card)]"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.termsServiceAgreed && formData.termsPrivacyAgreed}
                    readOnly
                    className="pointer-events-none w-4 h-4 shrink-0"
                  />
                  <span className="font-semibold text-[var(--color-text-primary)]">
                    필수 항목 모두 동의
                  </span>
                </div>
                <span className="text-xs text-[var(--color-text-secondary)]">
                  {formData.termsServiceAgreed && formData.termsPrivacyAgreed ? '해제' : '동의'}
                </span>
              </button>

              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.termsServiceAgreed}
                    onChange={(e) => {
                      setFormData({ ...formData, termsServiceAgreed: e.target.checked });
                      setErrors({ ...errors, termsServiceAgreed: '' });
                    }}
                    className="w-4 h-4 shrink-0"
                  />
                  <span className="text-[var(--color-text-primary)]">
                    서비스 이용약관 동의 <span className="text-red-500">*</span>
                  </span>
                </label>
                {errors.termsServiceAgreed && (
                  <p className="text-sm text-red-500 pl-7">{errors.termsServiceAgreed}</p>
                )}

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.termsPrivacyAgreed}
                    onChange={(e) => {
                      setFormData({ ...formData, termsPrivacyAgreed: e.target.checked });
                      setErrors({ ...errors, termsPrivacyAgreed: '' });
                    }}
                    className="w-4 h-4 shrink-0"
                  />
                  <span className="text-[var(--color-text-primary)]">
                    개인정보 처리방침 동의 <span className="text-red-500">*</span>
                  </span>
                </label>
                {errors.termsPrivacyAgreed && (
                  <p className="text-sm text-red-500 pl-7">{errors.termsPrivacyAgreed}</p>
                )}

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.marketingConsent}
                    onChange={(e) => setFormData({ ...formData, marketingConsent: e.target.checked })}
                    className="w-4 h-4 shrink-0"
                  />
                  <span className="text-[var(--color-text-secondary)]">마케팅 정보 수신 동의 (선택)</span>
                </label>
              </div>
            </div>

            {errors.submit && (
              <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {errors.submit}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-[var(--color-blue-primary)] text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              회원가입
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-[var(--color-text-secondary)]">
              이미 계정이 있으신가요?{' '}
              <Link to="/login" className="text-[var(--color-blue-primary)] hover:underline">
                로그인
              </Link>
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default RegisterPage;


