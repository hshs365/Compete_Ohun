import React, { useState, useEffect } from 'react';
import {
  UserCircleIcon,
  EnvelopeIcon,
  LockClosedIcon,
  PhoneIcon,
  CameraIcon,
  PencilIcon,
  TrashIcon,
  DocumentTextIcon,
  ChatBubbleLeftIcon,
  HeartIcon,
  CreditCardIcon,
  ArrowRightOnRectangleIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import ToggleSwitch from './ToggleSwitch';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';

interface UserProfileData {
  id: number;
  email: string | null;
  nickname: string | null;
  gender: string | null;
  ageRange: string | null;
  birthDate: string | null;
  residenceSido: string | null;
  residenceSigungu: string | null;
  interestedSports: string[];
  skillLevel: string | null;
  isProfileComplete: boolean;
  createdAt: string;
  marketingEmailConsent: boolean;
  marketingSmsConsent: boolean;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  socialAccounts: {
    kakao: boolean;
    naver: boolean;
    google: boolean;
  };
}

const MyInfoPage = () => {
  const { user: authUser, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [nickname, setNickname] = useState('');
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [phone, setPhone] = useState('');
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number; address: string } | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // 사용자 정보 로드
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        const data = await api.get<UserProfileData>('/api/auth/me');
        setProfileData(data);
        setNickname(data.nickname || '');
        setPhone(data.phone || '');
        
        // 저장된 위치 정보가 있으면 표시
        if (data.latitude && data.longitude) {
          // 주소는 역지오코딩으로 가져오거나 저장된 값 사용
          const savedLocation = localStorage.getItem('userLocation');
          if (savedLocation) {
            try {
              const location = JSON.parse(savedLocation);
              setUserLocation(location);
            } catch (e) {
              // 무시
            }
          }
        }
      } catch (error) {
        console.error('사용자 정보 로드 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (authUser) {
      fetchUserData();
    }
  }, [authUser]);

  // 활동 기록 샘플 데이터
  const activityStats = {
    posts: 12,
    comments: 45,
    likes: 128,
    orders: 5,
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // TODO: 프로필 사진 업로드 로직
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData({ ...profileData, profileImage: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNicknameSave = async () => {
    if (!profileData) return;
    try {
      // TODO: 닉네임 중복 검사 및 저장 로직
      // const updatedData = await api.put('/api/auth/me', { nickname });
      setProfileData({ ...profileData, nickname });
      setIsEditingNickname(false);
    } catch (error) {
      console.error('닉네임 저장 실패:', error);
    }
  };

  const handlePhoneSave = async () => {
    if (!profileData) return;
    try {
      // TODO: 전화번호 저장 로직
      // const updatedData = await api.put('/api/auth/me', { phone });
      setProfileData({ ...profileData, phone });
      setIsEditingPhone(false);
    } catch (error) {
      console.error('전화번호 저장 실패:', error);
    }
  };

  const handlePasswordChange = () => {
    // TODO: 비밀번호 변경 모달/페이지 이동
    console.log('비밀번호 변경');
  };

  const handleLogout = () => {
    if (window.confirm('로그아웃 하시겠습니까?')) {
      logout();
    }
  };

  const handleWithdraw = () => {
    // TODO: 회원 탈퇴 확인 모달 및 처리
    if (window.confirm('정말 회원 탈퇴를 하시겠습니까? 탈퇴 후 복구가 불가능합니다.')) {
      console.log('회원 탈퇴');
    }
  };

  const handleSocialDisconnect = async (provider: string) => {
    if (!profileData) return;
    if (window.confirm(`${provider} 계정 연결을 해제하시겠습니까?`)) {
      try {
        // TODO: 소셜 계정 연결 해제 API 호출
        // await api.delete(`/api/auth/social/${provider}`);
        setProfileData({
          ...profileData,
          socialAccounts: { ...profileData.socialAccounts, [provider]: false },
        });
      } catch (error) {
        console.error('소셜 계정 연결 해제 실패:', error);
      }
    }
  };

  const handleMarketingConsentChange = async (type: 'email' | 'sms', value: boolean) => {
    if (!profileData) return;
    try {
      // TODO: 마케팅 동의 업데이트 API 호출
      // await api.put('/api/auth/me', { [`marketing${type === 'email' ? 'Email' : 'Sms'}Consent`]: value });
      setProfileData({
        ...profileData,
        [`marketing${type === 'email' ? 'Email' : 'Sms'}Consent`]: value,
      });
    } catch (error) {
      console.error('마케팅 동의 업데이트 실패:', error);
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('이 브라우저는 위치 정보를 지원하지 않습니다.');
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // 카카오맵 역지오코딩 API로 주소 가져오기
          const KAKAO_REST_API_KEY = import.meta.env.VITE_KAKAO_REST_API_KEY;
          if (!KAKAO_REST_API_KEY) {
            throw new Error('카카오 REST API 키가 설정되지 않았습니다.');
          }

          const response = await fetch(
            `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${longitude}&y=${latitude}`,
            {
              headers: {
                Authorization: `KakaoAK ${KAKAO_REST_API_KEY}`,
              },
            }
          );

          const data = await response.json();
          const address = data.documents?.[0]?.address?.address_name || 
                         data.documents?.[0]?.road_address?.address_name || 
                         '주소를 가져올 수 없습니다';

          // 위치 정보 저장
          await api.put('/api/auth/me', {
            latitude,
            longitude,
          });

          setUserLocation({ latitude, longitude, address });
          setProfileData({
            ...profileData!,
            latitude,
            longitude,
          });

          // localStorage에 저장
          localStorage.setItem('userLocation', JSON.stringify({ latitude, longitude, address }));
          
          // 커스텀 이벤트 발생 (같은 탭에서 즉시 감지)
          window.dispatchEvent(new CustomEvent('userLocationUpdated', {
            detail: { latitude, longitude, address }
          }));

          alert('위치 정보가 저장되었습니다.');
        } catch (error) {
          console.error('위치 정보 저장 실패:', error);
          alert('위치 정보 저장에 실패했습니다.');
        } finally {
          setIsGettingLocation(false);
        }
      },
      (error) => {
        console.error('위치 정보 가져오기 실패:', error);
        alert('위치 정보를 가져올 수 없습니다. 위치 권한을 확인해주세요.');
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  if (isLoading || !profileData) {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto w-full flex items-center justify-center min-h-[400px]">
        <p className="text-[var(--color-text-secondary)]">로딩 중...</p>
      </div>
    );
  }

  // 멤버십은 아직 구현되지 않았으므로 기본값 사용
  const membership = '일반'; // TODO: 실제 멤버십 정보 가져오기
  const joinDate = profileData.createdAt ? new Date(profileData.createdAt).toISOString().split('T')[0] : '';

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto w-full space-y-6 pb-12">
      <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] mb-6 md:mb-8">내 정보</h1>

      {/* 프로필 요약 */}
      <section className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-card)] p-6">
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4">프로필 요약</h2>
        <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
          {/* 프로필 사진 */}
          <div className="relative">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-[var(--color-bg-secondary)] flex items-center justify-center overflow-hidden">
              {profileData.profileImage ? (
                <img src={profileData.profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <UserCircleIcon className="w-20 h-20 text-[var(--color-text-secondary)]" />
              )}
            </div>
            <label className="absolute bottom-0 right-0 bg-[var(--color-blue-primary)] text-white rounded-full p-2 cursor-pointer hover:opacity-90 transition-opacity">
              <CameraIcon className="w-4 h-4" />
              <input
                type="file"
                accept="image/*"
                onChange={handleProfileImageChange}
                className="hidden"
              />
            </label>
          </div>

          {/* 닉네임 및 정보 */}
          <div className="flex-1 w-full md:w-auto text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start space-x-3 mb-2">
              {isEditingNickname ? (
                <div className="flex items-center space-x-2 flex-1">
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="flex-1 px-3 py-1 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
                    autoFocus
                  />
                  <button
                    onClick={handleNicknameSave}
                    className="px-3 py-1 bg-[var(--color-blue-primary)] text-white rounded-lg hover:opacity-90"
                  >
                    저장
                  </button>
                  <button
                    onClick={() => {
                      setNickname(profileData.nickname || '');
                      setIsEditingNickname(false);
                    }}
                    className="px-3 py-1 bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] rounded-lg hover:opacity-80"
                  >
                    취소
                  </button>
                </div>
              ) : (
                <>
                  <h3 className="text-2xl font-bold text-[var(--color-text-primary)]">
                    {profileData.nickname || '닉네임 없음'}
                  </h3>
                  <button
                    onClick={() => setIsEditingNickname(true)}
                    className="p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-blue-primary)] transition-colors"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
            <div className="flex items-center space-x-4 text-sm">
              <span className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-semibold">
                {membership}
              </span>
              {joinDate && (
                <span className="text-[var(--color-text-secondary)]">
                  가입일: {new Date(joinDate).toLocaleDateString('ko-KR')}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 계정 정보 */}
      <section className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-card)] p-6">
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4">계정 정보</h2>
        <div className="space-y-4">
          {/* 이메일 (수정 불가) */}
          <div className="flex items-center justify-between py-3 border-b border-[var(--color-border-card)]">
            <div className="flex items-center space-x-3">
              <EnvelopeIcon className="w-5 h-5 text-[var(--color-text-secondary)]" />
              <div>
                <div className="text-sm text-[var(--color-text-secondary)]">이메일</div>
                <div className="text-[var(--color-text-primary)] font-medium">
                  {profileData.email || '이메일 없음'}
                </div>
              </div>
            </div>
            <span className="text-xs text-[var(--color-text-secondary)] bg-[var(--color-bg-secondary)] px-2 py-1 rounded">수정 불가</span>
          </div>

          {/* 비밀번호 변경 */}
          <div className="flex items-center justify-between py-3 border-b border-[var(--color-border-card)]">
            <div className="flex items-center space-x-3">
              <LockClosedIcon className="w-5 h-5 text-[var(--color-text-secondary)]" />
              <div>
                <div className="text-sm text-[var(--color-text-secondary)]">비밀번호</div>
                <div className="text-[var(--color-text-primary)]">••••••••</div>
              </div>
            </div>
            <button
              onClick={handlePasswordChange}
              className="px-4 py-2 bg-[var(--color-blue-primary)] text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
            >
              변경
            </button>
          </div>

          {/* 연결된 소셜 계정 */}
          <div className="pt-3">
            <div className="text-sm text-[var(--color-text-secondary)] mb-3">연결된 소셜 계정</div>
            {profileData.socialAccounts &&
            !profileData.socialAccounts.kakao &&
            !profileData.socialAccounts.naver &&
            !profileData.socialAccounts.google ? (
              <p className="text-sm text-[var(--color-text-secondary)]">연결된 소셜 계정이 없습니다.</p>
            ) : (
              <div className="space-y-2">
                {profileData.socialAccounts?.kakao && (
                <div className="flex items-center justify-between py-2 px-3 bg-[#FEE500] bg-opacity-10 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-[var(--color-text-primary)]">카카오톡</span>
                  </div>
                  <button
                    onClick={() => handleSocialDisconnect('kakao')}
                    className="text-xs text-red-500 hover:underline"
                  >
                    연결 해제
                  </button>
                </div>
              )}
              {profileData.socialAccounts?.naver && (
                <div className="flex items-center justify-between py-2 px-3 bg-[#03C75A] bg-opacity-10 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-[var(--color-text-primary)]">네이버</span>
                  </div>
                  <button
                    onClick={() => handleSocialDisconnect('naver')}
                    className="text-xs text-red-500 hover:underline"
                  >
                    연결 해제
                  </button>
                </div>
              )}
              {profileData.socialAccounts?.google && (
                <div className="flex items-center justify-between py-2 px-3 bg-gray-100 bg-opacity-10 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-[var(--color-text-primary)]">구글</span>
                  </div>
                  <button
                    onClick={() => handleSocialDisconnect('google')}
                    className="text-xs text-red-500 hover:underline"
                  >
                    연결 해제
                  </button>
                </div>
              )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 연락처 정보 */}
      <section className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-card)] p-6">
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4">연락처 정보</h2>
        <div className="space-y-4">
          {/* 휴대전화 번호 */}
          <div className="flex items-center justify-between py-3 border-b border-[var(--color-border-card)]">
            <div className="flex items-center space-x-3 flex-1">
              <PhoneIcon className="w-5 h-5 text-[var(--color-text-secondary)]" />
              {isEditingPhone ? (
                <div className="flex items-center space-x-2 flex-1">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="flex-1 px-3 py-2 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)]"
                    placeholder="010-1234-5678"
                  />
                  <button
                    onClick={handlePhoneSave}
                    className="px-3 py-2 bg-[var(--color-blue-primary)] text-white rounded-lg hover:opacity-90"
                  >
                    저장
                  </button>
                  <button
                    onClick={() => {
                      setPhone(profileData.phone || '');
                      setIsEditingPhone(false);
                    }}
                    className="px-3 py-2 bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] rounded-lg hover:opacity-80"
                  >
                    취소
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <div className="text-sm text-[var(--color-text-secondary)]">휴대전화 번호</div>
                    <div className="text-[var(--color-text-primary)] font-medium">
                      {profileData.phone || '등록된 전화번호 없음'}
                    </div>
                  </div>
                  <button
                    onClick={() => setIsEditingPhone(true)}
                    className="ml-auto p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-blue-primary)] transition-colors"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* 위치 정보 */}
          <div className="pt-3 border-t border-[var(--color-border-card)]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <MapPinIcon className="w-5 h-5 text-[var(--color-text-secondary)]" />
                <span className="text-[var(--color-text-primary)] font-medium">현재 위치</span>
              </div>
              <button
                onClick={handleGetCurrentLocation}
                disabled={isGettingLocation}
                className="px-4 py-2 bg-[var(--color-blue-primary)] text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGettingLocation ? '위치 가져오는 중...' : '현재 위치 저장'}
              </button>
            </div>
            {userLocation ? (
              <div className="mt-2 p-3 bg-[var(--color-bg-secondary)] rounded-lg">
                <div className="text-sm text-[var(--color-text-secondary)] mb-1">저장된 위치</div>
                <div className="text-[var(--color-text-primary)] font-medium">{userLocation.address}</div>
                <div className="text-xs text-[var(--color-text-secondary)] mt-1">
                  위도: {userLocation.latitude.toFixed(6)}, 경도: {userLocation.longitude.toFixed(6)}
                </div>
              </div>
            ) : profileData.latitude && profileData.longitude ? (
              <div className="mt-2 p-3 bg-[var(--color-bg-secondary)] rounded-lg">
                <div className="text-sm text-[var(--color-text-secondary)] mb-1">저장된 위치</div>
                <div className="text-xs text-[var(--color-text-secondary)]">
                  위도: {profileData.latitude.toFixed(6)}, 경도: {profileData.longitude.toFixed(6)}
                </div>
              </div>
            ) : (
              <div className="mt-2 text-sm text-[var(--color-text-secondary)]">
                저장된 위치 정보가 없습니다. '현재 위치 저장' 버튼을 클릭하여 위치를 저장하세요.
              </div>
            )}
          </div>

          {/* 수신 동의 */}
          <div className="pt-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <EnvelopeIcon className="w-5 h-5 text-[var(--color-text-secondary)]" />
                <span className="text-[var(--color-text-primary)]">이메일 마케팅 수신 동의</span>
              </div>
              <ToggleSwitch
                isOn={profileData.marketingEmailConsent}
                handleToggle={() => handleMarketingConsentChange('email', !profileData.marketingEmailConsent)}
                label=""
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <PhoneIcon className="w-5 h-5 text-[var(--color-text-secondary)]" />
                <span className="text-[var(--color-text-primary)]">SMS 마케팅 수신 동의</span>
              </div>
              <ToggleSwitch
                isOn={profileData.marketingSmsConsent}
                handleToggle={() => handleMarketingConsentChange('sms', !profileData.marketingSmsConsent)}
                label=""
              />
            </div>
          </div>
        </div>
      </section>

      {/* 활동 기록 */}
      <section className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border-card)] p-6">
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4">활동 기록</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="flex flex-col items-center p-4 bg-[var(--color-bg-primary)] rounded-lg hover:bg-[var(--color-bg-secondary)] transition-colors cursor-pointer">
            <DocumentTextIcon className="w-8 h-8 text-[var(--color-blue-primary)] mb-2" />
            <div className="text-2xl font-bold text-[var(--color-text-primary)]">{activityStats.posts}</div>
            <div className="text-sm text-[var(--color-text-secondary)]">게시글</div>
          </div>
          <div className="flex flex-col items-center p-4 bg-[var(--color-bg-primary)] rounded-lg hover:bg-[var(--color-bg-secondary)] transition-colors cursor-pointer">
            <ChatBubbleLeftIcon className="w-8 h-8 text-[var(--color-blue-primary)] mb-2" />
            <div className="text-2xl font-bold text-[var(--color-text-primary)]">{activityStats.comments}</div>
            <div className="text-sm text-[var(--color-text-secondary)]">댓글</div>
          </div>
          <div className="flex flex-col items-center p-4 bg-[var(--color-bg-primary)] rounded-lg hover:bg-[var(--color-bg-secondary)] transition-colors cursor-pointer">
            <HeartIcon className="w-8 h-8 text-[var(--color-blue-primary)] mb-2" />
            <div className="text-2xl font-bold text-[var(--color-text-primary)]">{activityStats.likes}</div>
            <div className="text-sm text-[var(--color-text-secondary)]">찜/좋아요</div>
          </div>
          <div className="flex flex-col items-center p-4 bg-[var(--color-bg-primary)] rounded-lg hover:bg-[var(--color-bg-secondary)] transition-colors cursor-pointer">
            <CreditCardIcon className="w-8 h-8 text-[var(--color-blue-primary)] mb-2" />
            <div className="text-2xl font-bold text-[var(--color-text-primary)]">{activityStats.orders}</div>
            <div className="text-sm text-[var(--color-text-secondary)]">주문/결제</div>
          </div>
        </div>
      </section>

      {/* 로그아웃 및 회원 탈퇴 */}
      <div className="flex justify-between items-center pt-4 border-t border-[var(--color-border-card)]">
        <button
          onClick={handleLogout}
          className="flex items-center space-x-2 px-4 py-2 bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] rounded-lg hover:bg-[var(--color-bg-primary)] transition-colors text-sm font-medium"
        >
          <ArrowRightOnRectangleIcon className="w-4 h-4" />
          <span>로그아웃</span>
        </button>
        <button
          onClick={handleWithdraw}
          className="flex items-center space-x-2 text-[var(--color-text-secondary)] hover:text-red-500 transition-colors text-sm"
        >
          <TrashIcon className="w-4 h-4" />
          <span>회원 탈퇴</span>
        </button>
      </div>
    </div>
  );
};

export default MyInfoPage;
