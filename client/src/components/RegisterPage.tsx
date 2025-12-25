import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { EnvelopeIcon, LockClosedIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import type { RegisterData } from '../contexts/AuthContext';
import { SPORTS_LIST } from '../constants/sports';

const RegisterPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<RegisterData>({
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

  const sidoList = [
    '서울특별시',
    '부산광역시',
    '대구광역시',
    '인천광역시',
    '광주광역시',
    '대전광역시',
    '울산광역시',
    '세종특별자치시',
    '경기도',
    '강원도',
    '충청북도',
    '충청남도',
    '전라북도',
    '전라남도',
    '경상북도',
    '경상남도',
    '제주특별자치도',
  ];

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

    if (!formData.nickname || formData.nickname.length < 2) {
      newErrors.nickname = '닉네임은 2자 이상이어야 합니다.';
    }

    if (!formData.residenceSido) {
      newErrors.residenceSido = '시/도를 선택해주세요.';
    }
    if (!formData.residenceSigungu) {
      newErrors.residenceSigungu = '시/군/구를 입력해주세요.';
    }

    if (!formData.termsServiceAgreed) {
      newErrors.termsServiceAgreed = '서비스 이용약관에 동의해주세요.';
    }
    if (!formData.termsPrivacyAgreed) {
      newErrors.termsPrivacyAgreed = '개인정보 처리방침에 동의해주세요.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await register(email, password, formData);
    } catch (error) {
      setErrors({ submit: error instanceof Error ? error.message : '회원가입에 실패했습니다.' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)] px-4 py-12 overflow-y-auto">
      <div className="w-full max-w-2xl my-8">
        <div className="bg-[var(--color-bg-card)] rounded-2xl shadow-lg border border-[var(--color-border-card)] p-8">
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-2 text-center">
            회원가입
          </h1>
          <p className="text-[var(--color-text-secondary)] text-center mb-8">
            운동 모임 플랫폼에 가입하세요
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
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                비밀번호 <span className="text-red-500">*</span>
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
                >
                  {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
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

            {/* 거주 지역 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  시/도 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.residenceSido}
                  onChange={(e) => {
                    setFormData({ ...formData, residenceSido: e.target.value, residenceSigungu: '' });
                    setErrors({ ...errors, residenceSido: '' });
                  }}
                  className={`w-full px-4 py-2 border rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] ${
                    errors.residenceSido ? 'border-red-500' : 'border-[var(--color-border-card)]'
                  }`}
                >
                  <option value="">선택해주세요</option>
                  {sidoList.map((sido) => (
                    <option key={sido} value={sido}>
                      {sido}
                    </option>
                  ))}
                </select>
                {errors.residenceSido && (
                  <p className="mt-1 text-sm text-red-500">{errors.residenceSido}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  시/군/구 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.residenceSigungu}
                  onChange={(e) => {
                    setFormData({ ...formData, residenceSigungu: e.target.value });
                    setErrors({ ...errors, residenceSigungu: '' });
                  }}
                  className={`w-full px-4 py-2 border rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] ${
                    errors.residenceSigungu ? 'border-red-500' : 'border-[var(--color-border-card)]'
                  }`}
                  placeholder="예: 강남구"
                  disabled={!formData.residenceSido}
                />
                {errors.residenceSigungu && (
                  <p className="mt-1 text-sm text-red-500">{errors.residenceSigungu}</p>
                )}
              </div>
            </div>

            {/* 약관 동의 */}
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.termsServiceAgreed}
                  onChange={(e) => {
                    setFormData({ ...formData, termsServiceAgreed: e.target.checked });
                    setErrors({ ...errors, termsServiceAgreed: '' });
                  }}
                  className="mr-2"
                />
                <span className="text-[var(--color-text-primary)]">
                  서비스 이용약관 동의 <span className="text-red-500">*</span>
                </span>
              </label>
              {errors.termsServiceAgreed && (
                <p className="text-sm text-red-500">{errors.termsServiceAgreed}</p>
              )}

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.termsPrivacyAgreed}
                  onChange={(e) => {
                    setFormData({ ...formData, termsPrivacyAgreed: e.target.checked });
                    setErrors({ ...errors, termsPrivacyAgreed: '' });
                  }}
                  className="mr-2"
                />
                <span className="text-[var(--color-text-primary)]">
                  개인정보 처리방침 동의 <span className="text-red-500">*</span>
                </span>
              </label>
              {errors.termsPrivacyAgreed && (
                <p className="text-sm text-red-500">{errors.termsPrivacyAgreed}</p>
              )}

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.marketingConsent}
                  onChange={(e) => setFormData({ ...formData, marketingConsent: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-[var(--color-text-secondary)]">마케팅 정보 수신 동의 (선택)</span>
              </label>
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


