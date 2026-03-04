import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { CompleteProfileData } from '../contexts/AuthContext';
import { api } from '../utils/api';
import { formatPhoneNumber, PHONE_PLACEHOLDER } from '../utils/phoneFormat';
import AppLogo from './AppLogo';

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

  const [formData, setFormData] = useState<CompleteProfileData>(() => {
    // 소셜 로그인 후 추가정보 입력: oauth_social_profile에서 닉네임·성별·연령대 자동 채움
    let init: CompleteProfileData = {
      nickname: '',
      gender: 'male',
      ageRange: '',
      birthDate: '',
      residenceSido: '',
      residenceSigungu: '',
      residenceAddress: '',
      realName: '',
      phone: '',
      interestedSports: [],
      sportPositions: [],
      skillLevel: 'beginner',
      termsServiceAgreed: false,
      termsPrivacyAgreed: false,
      marketingConsent: false,
      marketingEmailConsent: false,
      marketingSmsConsent: false,
    };
    try {
      const stored = sessionStorage.getItem('oauth_social_profile');
      if (stored) {
        const profile = JSON.parse(stored) as { nickname?: string; gender?: string; ageRange?: string };
        sessionStorage.removeItem('oauth_social_profile'); // 1회만 사용
        if (profile.nickname) init = { ...init, nickname: profile.nickname };
        if (profile.gender && ['male', 'female', 'other'].includes(profile.gender)) {
          init = { ...init, gender: profile.gender as 'male' | 'female' | 'other' };
        }
        if (profile.ageRange) init = { ...init, ageRange: profile.ageRange };
      }
    } catch {
      /* ignore */
    }
    return init;
  });

  const [nicknameAvailable, setNicknameAvailable] = useState<boolean | null>(null);
  const [assignedTag, setAssignedTag] = useState<string | null>(null);
  const [nicknameChecking, setNicknameChecking] = useState(false);
  const [nicknameCheckError, setNicknameCheckError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [naverFetched, setNaverFetched] = useState<{ email?: string; realName?: string; phone?: string } | null>(null);
  const [selectedAddress, setSelectedAddress] = useState(''); // 주소 검색으로 선택한 주소 (회원가입과 동일)
  const [addressDetail, setAddressDetail] = useState(''); // 상세주소 (동, 호수 등)

  // 소셜에서 가져온 정보 조회 (추가정보 페이지 진입 시) - 전화번호 있으면 formData에 반영
  useEffect(() => {
    if (!user?.id) return;
    api
      .get<{ email?: string; realName?: string; phone?: string }>('/api/auth/me')
      .then((data) => {
        const hasAny = !!(data?.email || data?.realName || data?.phone);
        if (hasAny) {
          setNaverFetched({ email: data.email ?? undefined, realName: data.realName ?? undefined, phone: data.phone ?? undefined });
          if (data.phone?.trim()) {
            setFormData((prev) => ({ ...prev, phone: data.phone! }));
          }
        }
      })
      .catch(() => {});
  }, [user?.id]);

  const checkNickname = useCallback(async (nickToCheck: string) => {
    if (nickToCheck.length < 2) return;
    setNicknameChecking(true);
    setNicknameCheckError(null);
    setAssignedTag(null);
    try {
      const result = await api.get<{ available: boolean; tag?: string }>(
        `/api/auth/check-nickname?nickname=${encodeURIComponent(nickToCheck)}`,
      );
      setNicknameAvailable(result.available);
      setAssignedTag(result.tag ?? null);
    } catch (error) {
      setNicknameAvailable(null);
      const isNetworkError =
        error instanceof TypeError ||
        (error instanceof Error && (error.message === 'Failed to fetch' || error.message.includes('NetworkError')));
      setNicknameCheckError(
        isNetworkError
          ? '서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.'
          : '확인할 수 없습니다. 잠시 후 다시 시도해주세요.'
      );
    } finally {
      setNicknameChecking(false);
    }
  }, []);

  // 닉네임 중복 검사 (디바운스)
  useEffect(() => {
    if (formData.nickname.length < 2) {
      setNicknameAvailable(null);
      setAssignedTag(null);
      setNicknameCheckError(null);
      return;
    }

    const timer = setTimeout(() => {
      checkNickname(formData.nickname);
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.nickname, checkNickname]);

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
    if (!formData.residenceSido || !selectedAddress) {
      newErrors.residenceSido = '주소 찾기로 주소를 입력해주세요.';
    }
    const phoneVal = formData.phone?.trim() || naverFetched?.phone?.trim();
    if (!phoneVal) {
      newErrors.phone = '휴대전화 번호는 필수입니다.';
    } else if (!/^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/.test(phoneVal.replace(/\s/g, ''))) {
      newErrors.phone = '올바른 전화번호 형식이 아닙니다. (예: 010-1234-5678)';
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
      const fullAddress = [selectedAddress, addressDetail].filter(Boolean).map((s) => s.trim()).join(' ').trim();
      const phoneToSend = (formData.phone?.trim() || naverFetched?.phone?.trim() || '').replace(/-/g, '').trim();
      const payload = {
        ...formData,
        phone: phoneToSend,
        residenceAddress: fullAddress || undefined,
      };
      await completeProfile(payload);
    } catch (error) {
      setErrors({ submit: error instanceof Error ? error.message : '오류가 발생했습니다.' });
    }
  };

  // 주소 찾기 (Daum Postcode) - 회원가입 Step5와 동일
  const handleSearchAddress = () => {
    const script = document.createElement('script');
    script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
    const openPostcode = () => {
      if (typeof window !== 'undefined' && (window as any).daum) {
        new (window as any).daum.Postcode({
          oncomplete: (data: { sido?: string; sigungu?: string; addressType?: string; roadAddress?: string; jibunAddress?: string; address?: string; bname?: string; buildingName?: string; apartment?: string }) => {
            let addr = data.addressType === 'R'
              ? (data.roadAddress || data.address || '')
              : (data.jibunAddress || data.address || '');
            let extraAddr = '';
            if (data.addressType === 'R') {
              if (data.bname && /[동|로|가]$/g.test(data.bname)) extraAddr += data.bname;
              if (data.buildingName && data.apartment === 'Y') {
                extraAddr += extraAddr ? ', ' + data.buildingName : data.buildingName;
              }
              if (extraAddr) extraAddr = ' (' + extraAddr + ')';
            }
            const fullAddr = (addr + extraAddr).trim();
            if (!fullAddr) return;
            setSelectedAddress(fullAddr);
            setFormData((prev) => ({
              ...prev,
              residenceSido: data.sido || '',
              residenceSigungu: (data.sigungu?.trim() || data.sido || '').split(' ')[0] || '',
            }));
            setErrors((e) => ({ ...e, residenceSido: '', residenceSigungu: '' }));
          },
          width: '100%',
          height: '100%',
        }).open();
      }
    };
    if ((window as any).daum) openPostcode();
    else { script.onload = openPostcode; document.head.appendChild(script); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)] px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="bg-[var(--color-bg-card)] rounded-2xl shadow-lg border border-[var(--color-border-card)] p-8">
          <div className="text-center mb-4">
            <AppLogo className="h-24 w-auto max-w-[200px] mx-auto object-contain" />
            <p className="mt-2 text-[var(--color-text-secondary)] text-base font-medium">운동 매치, 여기서 시작하다</p>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mt-3 mb-1">추가 정보 입력</h1>
            <p className="text-[var(--color-text-secondary)] text-sm">서비스 이용을 위해 추가 정보를 입력해주세요</p>
          </div>

          {/* 소셜에서 가져온 정보 (있을 경우) */}
          {naverFetched && (naverFetched.email || naverFetched.realName || naverFetched.phone) && (
            <div className="mb-6 p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-card)]">
              <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-3">
                {(() => {
                  const p = new URLSearchParams(location.search).get('provider');
                  return p === 'kakao' ? '카카오에서 가져온 정보' : p === 'google' ? 'Google에서 가져온 정보' : '네이버에서 가져온 정보';
                })()}
              </h3>
              <div className="space-y-2 text-sm">
                {naverFetched.email && (
                  <div><span className="text-[var(--color-text-secondary)]">이메일:</span> <span className="text-[var(--color-text-primary)]">{naverFetched.email}</span></div>
                )}
                {naverFetched.realName && (
                  <div><span className="text-[var(--color-text-secondary)]">실명:</span> <span className="text-[var(--color-text-primary)]">{naverFetched.realName}</span></div>
                )}
                {naverFetched.phone && (
                  <div><span className="text-[var(--color-text-secondary)]">휴대전화:</span> <span className="text-[var(--color-text-primary)]">{naverFetched.phone}</span></div>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 닉네임 */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                닉네임 <span className="text-[var(--color-text-secondary)]">(필수)</span>
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
              {nicknameAvailable === true && assignedTag && (
                <p className="mt-1 text-sm text-green-500">부여될 태그: <span className="font-medium">{assignedTag}</span></p>
              )}
              {nicknameCheckError && formData.nickname.length >= 2 && !nicknameChecking && (
                <div className="mt-1 flex items-center gap-2">
                  <p className="text-sm text-amber-500">{nicknameCheckError}</p>
                  <button
                    type="button"
                    onClick={() => checkNickname(formData.nickname)}
                    className="text-sm font-medium text-[var(--color-blue-primary)] hover:underline"
                  >
                    다시 확인
                  </button>
                </div>
              )}
              {errors.nickname && <p className="mt-1 text-sm text-red-500">{errors.nickname}</p>}
            </div>

            {/* 성별 */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                성별 <span className="text-[var(--color-text-secondary)]">(필수)</span>
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

            {/* 실명 (네이버 미제공 시에만 입력란 표시) */}
            {(!naverFetched?.realName || !naverFetched.realName.trim()) && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">실명 <span className="text-[var(--color-text-secondary)]">(선택)</span></label>
                <input
                  type="text"
                  value={formData.realName || ''}
                  onChange={(e) => setFormData({ ...formData, realName: e.target.value })}
                  className="w-full px-4 py-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]"
                  placeholder="실명을 입력하세요"
                />
              </div>
            )}

            {/* 휴대전화 (필수) - 소셜에서 가져온 번호가 있으면 미리 채움 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                휴대전화 번호 <span className="text-[var(--color-text-secondary)]">(필수)</span>
              </label>
              <input
                type="tel"
                inputMode="numeric"
                value={formData.phone || ''}
                onChange={(e) => {
                  const numbers = e.target.value.replace(/[^\d]/g, '');
                  setFormData({ ...formData, phone: formatPhoneNumber(numbers) });
                  setErrors((prev) => ({ ...prev, phone: '' }));
                }}
                className={`w-full px-4 py-2 border rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] ${
                  errors.phone ? 'border-red-500' : 'border-[var(--color-border-card)]'
                }`}
                placeholder={PHONE_PLACEHOLDER}
                maxLength={13}
              />
              {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
            </div>

            {/* 거주 지역 - 회원가입과 동일 UI */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">주소 <span className="text-[var(--color-text-secondary)]">(필수)</span></label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={selectedAddress}
                  readOnly
                  onClick={handleSearchAddress}
                  className={`flex-1 px-4 py-3 border rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)] ${
                    errors.residenceSido ? 'border-red-500' : 'border-[var(--color-border-card)]'
                  }`}
                  placeholder="주소를 검색해주세요"
                />
                <button
                  type="button"
                  onClick={handleSearchAddress}
                  className="px-6 py-3 bg-[var(--color-blue-primary)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
                >
                  주소 검색
                </button>
              </div>
              {selectedAddress && (
                <p className="mt-2 text-sm text-[var(--color-text-secondary)]">선택된 주소: {selectedAddress}</p>
              )}
              {selectedAddress && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">상세주소 <span className="text-[var(--color-text-secondary)]">(선택)</span></label>
                  <input
                    type="text"
                    value={addressDetail}
                    onChange={(e) => setAddressDetail(e.target.value)}
                    className="w-full px-4 py-3 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
                    placeholder="동, 호수, 상세주소를 입력하세요 (선택)"
                  />
                </div>
              )}
              {errors.residenceSido && (
                <p className="mt-1 text-sm text-red-500">주소를 검색해서 입력해주세요.</p>
              )}
            </div>

            {/* 약관 동의 */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 py-2 border-b border-[var(--color-border-card)]">
                <input
                  type="checkbox"
                  checked={
                    formData.termsServiceAgreed && formData.termsPrivacyAgreed && formData.marketingConsent
                  }
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setFormData({
                      ...formData,
                      termsServiceAgreed: checked,
                      termsPrivacyAgreed: checked,
                      marketingConsent: checked,
                    });
                    if (checked) setErrors({ ...errors, termsServiceAgreed: '', termsPrivacyAgreed: '' });
                  }}
                  className="shrink-0"
                />
                <span className="font-medium text-[var(--color-text-primary)]">전체 동의</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.termsServiceAgreed}
                  onChange={(e) => {
                    setFormData({ ...formData, termsServiceAgreed: e.target.checked });
                    setErrors({ ...errors, termsServiceAgreed: '' });
                  }}
                  className="shrink-0"
                />
                <span className="text-[var(--color-text-primary)]">
                  서비스 이용약관 동의 <span className="text-[var(--color-text-secondary)]">(필수)</span>
                </span>
              </label>
              {errors.termsServiceAgreed && (
                <p className="text-sm text-red-500">{errors.termsServiceAgreed}</p>
              )}

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.termsPrivacyAgreed}
                  onChange={(e) => {
                    setFormData({ ...formData, termsPrivacyAgreed: e.target.checked });
                    setErrors({ ...errors, termsPrivacyAgreed: '' });
                  }}
                  className="shrink-0"
                />
                <span className="text-[var(--color-text-primary)]">
                  개인정보 처리방침 동의 <span className="text-[var(--color-text-secondary)]">(필수)</span>
                </span>
              </label>
              {errors.termsPrivacyAgreed && (
                <p className="text-sm text-red-500">{errors.termsPrivacyAgreed}</p>
              )}

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.marketingConsent}
                  onChange={(e) => setFormData({ ...formData, marketingConsent: e.target.checked })}
                  className="shrink-0"
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

