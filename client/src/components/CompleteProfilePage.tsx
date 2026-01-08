import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { CompleteProfileData } from '../contexts/AuthContext';
import { api } from '../utils/api';
import { SPORTS_LIST } from '../constants/sports';

const CompleteProfilePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { completeProfile, user, isLoading } = useAuth();

  // 일반 회원가입 사용자는 이 페이지에 접근할 수 없음
  useEffect(() => {
    if (!isLoading && user) {
      // 일반 회원가입 사용자 (이메일이 있고 프로필이 완료된 경우)는 메인으로 리다이렉트
      if (user.email && user.isProfileComplete) {
        navigate('/', { replace: true });
      }
      // 프로필이 완료되지 않은 경우에만 이 페이지에 머물 수 있음
    } else if (!isLoading && !user) {
      // 로그인하지 않은 사용자는 로그인 페이지로
      navigate('/login', { replace: true });
    }
  }, [user, isLoading, navigate]);

  const [formData, setFormData] = useState<CompleteProfileData>({
    nickname: '',
    gender: 'male',
    ageRange: '',
    birthDate: '',
    residenceSido: '',
    residenceSigungu: '',
    interestedSports: [],
    skillLevel: 'beginner',
    termsServiceAgreed: false,
    termsPrivacyAgreed: false,
    marketingConsent: false,
    marketingEmailConsent: false,
    marketingSmsConsent: false,
  });

  const [nicknameAvailable, setNicknameAvailable] = useState<boolean | null>(null);
  const [nicknameChecking, setNicknameChecking] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 닉네임 중복 검사 (디바운스)
  useEffect(() => {
    if (formData.nickname.length < 2) {
      setNicknameAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      setNicknameChecking(true);
      try {
        const result = await api.get<{ available: boolean }>(
          `/api/auth/check-nickname?nickname=${encodeURIComponent(formData.nickname)}`,
        );
        setNicknameAvailable(result.available);
      } catch (error) {
        setNicknameAvailable(false);
      } finally {
        setNicknameChecking(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.nickname]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 필수 항목 검증
    const newErrors: Record<string, string> = {};
    if (!formData.nickname || formData.nickname.length < 2) {
      newErrors.nickname = '닉네임은 2자 이상이어야 합니다.';
    }
    if (nicknameAvailable === false) {
      newErrors.nickname = '이미 사용 중인 닉네임입니다.';
    }
    if (!formData.residenceSido) {
      newErrors.residenceSido = '시/도를 선택해주세요.';
    }
    if (!formData.residenceSigungu) {
      newErrors.residenceSigungu = '시/군/구를 선택해주세요.';
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
      await completeProfile(formData);
    } catch (error) {
      setErrors({ submit: error instanceof Error ? error.message : '오류가 발생했습니다.' });
    }
  };

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)] px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="bg-[var(--color-bg-card)] rounded-2xl shadow-lg border border-[var(--color-border-card)] p-8">
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-2 text-center">
            추가 정보 입력
          </h1>
          <p className="text-[var(--color-text-secondary)] text-center mb-8">
            서비스 이용을 위해 추가 정보를 입력해주세요
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
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
                  errors.nickname
                    ? 'border-red-500'
                    : nicknameAvailable === true
                    ? 'border-green-500'
                    : 'border-[var(--color-border-card)]'
                }`}
                placeholder="닉네임을 입력하세요"
              />
              {nicknameChecking && (
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">확인 중...</p>
              )}
              {nicknameAvailable === true && (
                <p className="mt-1 text-sm text-green-500">사용 가능한 닉네임입니다.</p>
              )}
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
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male' | 'female' | 'other' })}
                      className="mr-2"
                    />
                    <span className="text-[var(--color-text-primary)]">
                      {gender === 'male' ? '남성' : gender === 'female' ? '여성' : '기타'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* 연령대 */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                연령대
              </label>
              <select
                value={formData.ageRange}
                onChange={(e) => setFormData({ ...formData, ageRange: e.target.value })}
                className="w-full px-4 py-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]"
              >
                <option value="">선택해주세요</option>
                <option value="10-19">10대</option>
                <option value="20-24">20-24세</option>
                <option value="25-29">25-29세</option>
                <option value="30-34">30-34세</option>
                <option value="35-39">35-39세</option>
                <option value="40-49">40대</option>
                <option value="50+">50세 이상</option>
              </select>
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
                  placeholder="시/군/구를 입력해주세요"
                  disabled={!formData.residenceSido}
                />
                {errors.residenceSigungu && (
                  <p className="mt-1 text-sm text-red-500">{errors.residenceSigungu}</p>
                )}
              </div>
            </div>

            {/* 관심 운동 종목 */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                관심 운동 종목 (복수 선택 가능)
              </label>
              <div className="flex flex-wrap gap-2">
                {sportsList.map((sport) => (
                  <label key={sport} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.interestedSports?.includes(sport)}
                      onChange={(e) => {
                        const current = formData.interestedSports || [];
                        if (e.target.checked) {
                          setFormData({ ...formData, interestedSports: [...current, sport] });
                        } else {
                          setFormData({
                            ...formData,
                            interestedSports: current.filter((s) => s !== sport),
                          });
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-[var(--color-text-primary)]">{sport}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 운동 수준 */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                운동 수준
              </label>
              <select
                value={formData.skillLevel}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    skillLevel: e.target.value as 'beginner' | 'intermediate' | 'advanced',
                  })
                }
                className="w-full px-4 py-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]"
              >
                <option value="beginner">초급</option>
                <option value="intermediate">중급</option>
                <option value="advanced">상급</option>
              </select>
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
              완료
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CompleteProfilePage;

