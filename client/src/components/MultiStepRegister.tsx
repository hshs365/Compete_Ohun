import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import type { RegisterData } from '../contexts/AuthContext';
import { api } from '../utils/api';
import { showError, showSuccess, showWarning } from '../utils/swal';

// Step 컴포넌트들
import Step1MemberType from './register/Step1MemberType';
import Step2TermsAgreement from './register/Step2TermsAgreement';
import Step3LoginInfo from './register/Step3LoginInfo';
import Step4PhoneVerification from './register/Step4PhoneVerification';
import Step5BusinessVerification from './register/Step5BusinessVerification';
import Step6AdditionalInfo from './register/Step5AdditionalInfo';

interface MultiStepRegisterProps {}

const MultiStepRegister: React.FC<MultiStepRegisterProps> = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 전체 폼 데이터
  const [formData, setFormData] = useState<{
    memberType: 'individual' | 'business';
    termsServiceAgreed: boolean;
    termsPrivacyAgreed: boolean;
    marketingConsent: boolean;
    email: string;
    password: string;
    confirmPassword: string;
    phone: string;
    verificationCode: string;
    isPhoneVerified: boolean;
    realName: string;
    businessNumber: string;
    isBusinessNumberVerified: boolean;
    nickname: string;
    gender: 'male' | 'female';
    residenceSido: string;
    residenceSigungu: string;
    selectedAddress: string;
  }>({
    memberType: 'individual',
    termsServiceAgreed: false,
    termsPrivacyAgreed: false,
    marketingConsent: false,
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    verificationCode: '',
    isPhoneVerified: false,
    realName: '',
    businessNumber: '',
    isBusinessNumberVerified: false,
    nickname: '',
    gender: 'male',
    residenceSido: '',
    residenceSigungu: '',
    selectedAddress: '',
  });

  // 사업자 회원인 경우 사업자등록번호 검증 단계 추가
  const totalSteps = formData.memberType === 'business' ? 6 : 5;

  useEffect(() => {
    // 회원가입 페이지도 다크 테마 적용
    document.documentElement.classList.add('dark');
    return () => {
      // 페이지를 떠날 때는 원래 테마로 복원하지 않음
    };
  }, []);

  // 다음 단계로 이동
  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  // 이전 단계로 이동
  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  /** 현재 단계에서 입력/검증이 끝났는지 여부. 다음 버튼 활성화에 사용 */
  const isCurrentStepComplete = (): boolean => {
    switch (currentStep) {
      case 1:
        return true;
      case 2:
        return formData.termsServiceAgreed && formData.termsPrivacyAgreed;
      case 3: {
        const emailOk = formData.email?.trim() && /\S+@\S+\.\S+/.test(formData.email);
        const passwordOk =
          formData.password &&
          formData.password.length >= 8 &&
          /(?=.*[a-zA-Z])(?=.*\d)/.test(formData.password);
        const confirmOk = formData.password === formData.confirmPassword;
        return !!(emailOk && passwordOk && confirmOk);
      }
      case 4: {
        const isSmsEnabled = import.meta.env.VITE_SMS_VERIFICATION_ENABLED === 'true';
        if (formData.phone?.trim()) {
          const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;
          if (!phoneRegex.test(formData.phone)) return false;
          if (isSmsEnabled && !formData.isPhoneVerified) return false;
        } else if (isSmsEnabled) {
          return false;
        }
        return !!(formData.realName && formData.realName.length >= 2);
      }
      case 5:
        if (formData.memberType === 'business') {
          return formData.isBusinessNumberVerified;
        }
        return !!(
          formData.nickname?.length >= 2 &&
          formData.residenceSido &&
          formData.selectedAddress
        );
      case 6:
        return !!(
          formData.nickname?.length >= 2 &&
          formData.residenceSido &&
          formData.selectedAddress
        );
      default:
        return true;
    }
  };

  // 각 단계별 유효성 검사
  const validateStep = async (step: number): Promise<boolean> => {
    switch (step) {
      case 1:
        // 회원 유형 선택은 항상 유효 (기본값이 있음)
        return true;
      case 2:
        if (!formData.termsServiceAgreed || !formData.termsPrivacyAgreed) {
          showError('필수 약관에 동의해주세요.', '약관 동의 필요');
          return false;
        }
        return true;
      case 3:
        if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
          showError('올바른 이메일 형식을 입력해주세요.', '이메일 오류');
          return false;
        }
        // 이메일 중복 검사
        try {
          const emailCheck = await api.get<{ available: boolean }>(
            `/api/auth/check-email?email=${encodeURIComponent(formData.email)}`
          );
          if (!emailCheck.available) {
            showError('이미 사용 중인 이메일입니다. 다른 이메일을 입력해주세요.', '이메일 중복');
            return false;
          }
        } catch (error) {
          // API 호출 실패 시에도 진행 (네트워크 오류 등)
          console.error('이메일 중복 검사 실패:', error);
        }
        if (!formData.password || formData.password.length < 8) {
          showError('비밀번호는 8자 이상이어야 합니다.', '비밀번호 오류');
          return false;
        }
        if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(formData.password)) {
          showError('비밀번호는 영문(대/소문자 중 하나)과 숫자를 포함해야 합니다.', '비밀번호 오류');
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          showError('비밀번호가 일치하지 않습니다.', '비밀번호 확인 오류');
          return false;
        }
        return true;
      case 4:
        // SMS 인증 활성화 여부 확인
        const isSmsVerificationEnabledStep4 = import.meta.env.VITE_SMS_VERIFICATION_ENABLED === 'true';
        // 전화번호: SMS 비활성화 시 선택 입력, 활성화 시 필수
        if (formData.phone && formData.phone.trim() !== '') {
          const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;
          if (!phoneRegex.test(formData.phone)) {
            showError('올바른 전화번호 형식이 아닙니다. (예: 010-1234-5678)', '전화번호 형식 오류');
            return false;
          }
          if (isSmsVerificationEnabledStep4 && !formData.isPhoneVerified) {
            showError('본인인증을 완료해주세요.', '본인인증 필요');
            return false;
          }
        } else if (isSmsVerificationEnabledStep4) {
          showError('전화번호를 입력해주세요.', '전화번호 입력 필요');
          return false;
        }
        if (!formData.realName || formData.realName.length < 2) {
          showError('실명을 입력해주세요. (2자 이상)', '실명 입력 필요');
          return false;
        }
        return true;
      case 5:
        // 사업자 회원인 경우 사업자등록번호 검증 필요
        if (formData.memberType === 'business') {
          if (!formData.isBusinessNumberVerified) {
            showError('사업자등록번호 검증을 완료해주세요.', '사업자등록번호 검증 필요');
            return false;
          }
          return true;
        }
        // 개인 회원인 경우 Step 5는 추가 정보 입력
        if (!formData.nickname || formData.nickname.length < 2) {
          showError('닉네임은 2자 이상이어야 합니다.', '닉네임 오류');
          return false;
        }
        if (!formData.residenceSido || !formData.selectedAddress) {
          showError('거주 지역을 입력해주세요.', '거주 지역 입력 필요');
          return false;
        }
        return true;
      case 6:
        // 사업자 회원의 추가 정보 입력 (Step 6)
        if (!formData.nickname || formData.nickname.length < 2) {
          showError('닉네임은 2자 이상이어야 합니다.', '닉네임 오류');
          return false;
        }
        if (!formData.residenceSido || !formData.selectedAddress) {
          showError('거주 지역을 입력해주세요.', '거주 지역 입력 필요');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  // 다음 버튼 클릭 핸들러
  const handleNextClick = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid) {
      if (currentStep === totalSteps) {
        handleSubmit();
      } else {
        handleNext();
      }
    }
  };

  // 최종 제출
  const handleSubmit = async () => {
    const finalStep = formData.memberType === 'business' ? 6 : 5;
    const isValid = await validateStep(finalStep);
    if (!isValid) {
      return;
    }

    // 전화번호: SMS 비활성화 시 선택 입력, 활성화 시 필수
    const isSmsVerificationEnabled = import.meta.env.VITE_SMS_VERIFICATION_ENABLED === 'true';
    const hasPhone = formData.phone != null && formData.phone.trim() !== '';
    if (hasPhone) {
      const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;
      if (!phoneRegex.test(formData.phone)) {
        await showError('올바른 전화번호 형식이 아닙니다. (예: 010-1234-5678)', '전화번호 형식 오류');
        return;
      }
      if (isSmsVerificationEnabled && !formData.isPhoneVerified) {
        await showError('본인인증을 완료해주세요.', '본인인증 필요');
        return;
      }
    } else if (isSmsVerificationEnabled) {
      await showError('전화번호를 입력해주세요.', '전화번호 입력 필요');
      return;
    }

    setIsSubmitting(true);
    try {
      const registerData: RegisterData = {
        realName: formData.realName,
        nickname: formData.nickname,
        gender: formData.gender,
        residenceSido: formData.residenceSido,
        residenceSigungu: (formData.residenceSigungu && formData.residenceSigungu.trim()) ? formData.residenceSigungu : formData.residenceSido,
        termsServiceAgreed: formData.termsServiceAgreed,
        termsPrivacyAgreed: formData.termsPrivacyAgreed,
        marketingConsent: formData.marketingConsent,
        phone: formData.phone || '', // SMS 비활성화 시 빈 값 허용 (서버에서 optional 처리)
        verificationCode: isSmsVerificationEnabled ? formData.verificationCode : '000000',
        memberType: formData.memberType,
        businessNumber: formData.memberType === 'business' ? formData.businessNumber : undefined,
      };

      await register(formData.email, formData.password, registerData);
      // register 함수에서 자동으로 navigate('/') 호출
    } catch (error) {
      console.error('회원가입 에러:', error);
      const errorMessage = error instanceof Error ? error.message : '회원가입에 실패했습니다.';
      await showError(errorMessage, '회원가입 실패');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 단계별 컴포넌트 렌더링
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1MemberType
            memberType={formData.memberType}
            onMemberTypeChange={(type) => setFormData({ ...formData, memberType: type })}
          />
        );
      case 2:
        return (
          <Step2TermsAgreement
            termsServiceAgreed={formData.termsServiceAgreed}
            termsPrivacyAgreed={formData.termsPrivacyAgreed}
            marketingConsent={formData.marketingConsent}
            onTermsChange={(terms) => setFormData({ ...formData, ...terms })}
          />
        );
      case 3:
        return (
          <Step3LoginInfo
            email={formData.email}
            password={formData.password}
            confirmPassword={formData.confirmPassword}
            onEmailChange={(email) => setFormData({ ...formData, email })}
            onPasswordChange={(password) => setFormData({ ...formData, password })}
            onConfirmPasswordChange={(confirmPassword) => setFormData({ ...formData, confirmPassword })}
          />
        );
      case 4:
        return (
          <Step4PhoneVerification
            phone={formData.phone}
            verificationCode={formData.verificationCode}
            isPhoneVerified={formData.isPhoneVerified}
            realName={formData.realName}
            onPhoneChange={(phone) => {
              // 전화번호가 실제로 변경된 경우에만 인증 상태 초기화
              const phoneChanged = formData.phone !== phone;
              if (phoneChanged) {
                setFormData({ ...formData, phone, isPhoneVerified: false, verificationCode: '' });
              } else {
                // 값이 동일해도 업데이트 (포맷팅 등으로 인한 동일 값일 수 있음)
                setFormData({ ...formData, phone });
              }
            }}
            onVerificationCodeChange={(code) => setFormData({ ...formData, verificationCode: code })}
            onPhoneVerified={(verified) => setFormData({ ...formData, isPhoneVerified: verified })}
            onRealNameChange={(realName) => setFormData({ ...formData, realName })}
          />
        );
      case 5:
        // 사업자 회원인 경우 사업자등록번호 검증, 개인 회원인 경우 추가 정보 입력
        if (formData.memberType === 'business') {
          return (
            <Step5BusinessVerification
              realName={formData.realName}
              isBusinessNumberVerified={formData.isBusinessNumberVerified}
              onBusinessNumberVerified={(verified) => setFormData((prev) => ({ ...prev, isBusinessNumberVerified: verified }))}
              onBusinessNumberFromDocument={(businessNumber) => setFormData((prev) => ({ ...prev, businessNumber }))}
            />
          );
        } else {
          return (
            <Step6AdditionalInfo
              nickname={formData.nickname}
              gender={formData.gender}
              residenceSido={formData.residenceSido}
              residenceSigungu={formData.residenceSigungu}
              selectedAddress={formData.selectedAddress}
              onNicknameChange={(nickname) => setFormData((prev) => ({ ...prev, nickname }))}
              onGenderChange={(gender) => setFormData((prev) => ({ ...prev, gender }))}
              onResidenceChange={(residence) => setFormData((prev) => ({ ...prev, ...residence }))}
            />
          );
        }
      case 6:
        // 사업자 회원의 추가 정보 입력
        return (
          <Step6AdditionalInfo
            nickname={formData.nickname}
            gender={formData.gender}
            residenceSido={formData.residenceSido}
            residenceSigungu={formData.residenceSigungu}
            selectedAddress={formData.selectedAddress}
            onNicknameChange={(nickname) => setFormData((prev) => ({ ...prev, nickname }))}
            onGenderChange={(gender) => setFormData((prev) => ({ ...prev, gender }))}
            onResidenceChange={(residence) => setFormData((prev) => ({ ...prev, ...residence }))}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)] px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* 로고 영역 */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 bg-[var(--color-blue-primary)] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">오</span>
            </div>
            <div className="text-2xl font-bold text-[var(--color-text-primary)]">오운</div>
          </div>
        </div>

        {/* 메인 카드 */}
        <div className="bg-[var(--color-bg-card)] rounded-2xl shadow-lg border border-[var(--color-border-card)]">
          {/* 헤더 - 단계 표시 */}
          <div className="flex items-center justify-between p-6 border-b border-[var(--color-border-card)]">
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
              {currentStep === 1 && '회원 가입 유형을 선택하세요.'}
              {currentStep === 2 && '약관 및 개인정보 수집, 이용 안내에 동의해주세요.'}
              {currentStep === 3 && '로그인 정보를 입력해주세요.'}
              {currentStep === 4 && '본인인증을 진행해주세요.'}
              {currentStep === 5 && formData.memberType === 'business' && '사업자 정보'}
              {currentStep === 5 && formData.memberType === 'individual' && '추가 정보를 입력해주세요.'}
              {currentStep === 6 && '추가 정보를 입력해주세요.'}
            </h1>
            <div className="text-sm font-medium text-[var(--color-text-secondary)] bg-[var(--color-bg-secondary)] px-3 py-1 rounded-full">
              {currentStep} / {totalSteps}
            </div>
          </div>

          {/* 내용 영역 */}
          <div className="p-8">
            {renderStep()}
          </div>

          {/* 하단 버튼 영역 */}
          <div className="flex items-center justify-between p-6 border-t border-[var(--color-border-card)] bg-[var(--color-bg-secondary)]">
            <button
              onClick={handlePrev}
              disabled={currentStep === 1}
              className="flex items-center gap-2 px-6 py-3 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              <ChevronLeftIcon className="w-5 h-5" />
              이전
            </button>

            <div className="flex gap-2">
              {Array.from({ length: totalSteps }).map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all ${
                    index + 1 === currentStep
                      ? 'bg-[var(--color-blue-primary)] w-8'
                      : index + 1 < currentStep
                      ? 'bg-green-500 w-2'
                      : 'bg-[var(--color-border-card)] w-2'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={handleNextClick}
              disabled={isSubmitting || !isCurrentStepComplete()}
              className="flex items-center gap-2 px-8 py-3 bg-[var(--color-blue-primary)] text-white rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                '처리 중...'
              ) : currentStep === totalSteps ? (
                '가입 완료'
              ) : (
                <>
                  다음
                  <ChevronRightIcon className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* 로그인 링크 */}
        <div className="mt-6 text-center">
          <p className="text-[var(--color-text-secondary)]">
            이미 계정이 있으신가요?{' '}
            <Link to="/login" className="text-[var(--color-blue-primary)] hover:underline font-medium">
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default MultiStepRegister;
