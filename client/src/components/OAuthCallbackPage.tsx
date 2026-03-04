import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import AppLogo from './AppLogo';

const PROVIDER_NAMES: Record<string, string> = {
  kakao: '카카오',
  naver: '네이버',
  google: '구글',
};

const OAuthCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'error' | 'existing_provider'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [existingProvider, setExistingProvider] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const provider = searchParams.get('provider');

      if (!code || !provider) {
        setStatus('error');
        setErrorMessage('인증 코드가 없습니다.');
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      try {
        // 백엔드로 code 전송하여 토큰 교환 및 사용자 조회
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
        const response = await fetch(
          `${API_BASE_URL}/api/auth/social/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state || '')}&provider=${provider}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          },
        );

        if (!response.ok) {
          const error = await response.json().catch(() => ({ message: '소셜 로그인에 실패했습니다.' }));
          const msgObj = error.message && typeof error.message === 'object' ? error.message : null;
          const errMsg = msgObj?.message ?? (typeof error.message === 'string' ? error.message : null) ?? error.error_description ?? `서버 오류 (${response.status})`;
          const existingProv = error.existingProvider ?? msgObj?.existingProvider;
          if (existingProv) {
            setStatus('existing_provider');
            setExistingProvider(existingProv);
            setErrorMessage(errMsg);
          } else {
            setStatus('error');
            setErrorMessage(errMsg);
            console.error('[OAuth 콜백] API 실패:', response.status, error);
          }
          return;
        }

        const data = await response.json();

        if (!data.token) {
          throw new Error('로그인 응답에 토큰이 없습니다.');
        }

        // 토큰 저장 (login/register 흐름과 동일하게)
        sessionStorage.setItem('access_token', data.token);
        localStorage.setItem('access_token', data.token);
        localStorage.setItem('remember_me', 'false');

        // 소셜 프로필(닉네임·성별·연령대) → 추가정보 입력 폼 자동 채움용
        if (data.socialProfile) {
          sessionStorage.setItem('oauth_social_profile', JSON.stringify(data.socialProfile));
        }

        // 전체 새로고침으로 AuthContext가 localStorage에서 토큰을 읽고 checkAuth 수행
        if (data.isNewUser || !data.isProfileComplete) {
          window.location.href = `/auth/complete-profile?provider=${provider}`;
        } else {
          window.location.href = '/';
        }
      } catch (error) {
        setStatus('error');
        const msg = error instanceof Error ? error.message : '소셜 로그인에 실패했습니다.';
        setErrorMessage(msg);
        console.error('[OAuth 콜백] 실패:', error);
        setTimeout(() => navigate('/login'), 5000);
      }
    };

    handleCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRedirectToProvider = async () => {
    if (!existingProvider) return;
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
      const response = await fetch(`${API_BASE_URL}/api/auth/social/auth-url?provider=${existingProvider}`);
      const data = await response.json();
      if (data.authUrl) {
        sessionStorage.setItem('oauth_state', data.state);
        window.location.href = data.authUrl;
      } else {
        navigate('/login');
      }
    } catch {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)]">
      <div className="text-center px-6 max-w-md">
        <AppLogo className="h-14 w-auto mx-auto mb-6 object-contain" />
        {status === 'loading' ? (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-blue-primary)] mx-auto mb-4"></div>
            <p className="text-[var(--color-text-primary)]">로그인 처리 중...</p>
          </>
        ) : status === 'existing_provider' ? (
          <>
            <div className="text-amber-500 text-4xl mb-4">ℹ️</div>
            <p className="text-[var(--color-text-primary)] font-medium mb-3">이미 가입된 계정이 있습니다</p>
            <p className="text-[var(--color-text-secondary)] text-sm mb-6">{errorMessage}</p>
            <button
              type="button"
              onClick={handleRedirectToProvider}
              className="px-6 py-3 bg-[var(--color-blue-primary)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity mb-4"
            >
              {PROVIDER_NAMES[existingProvider] ?? existingProvider}로 로그인하기
            </button>
            <p className="text-[var(--color-text-secondary)] text-xs">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="underline hover:text-[var(--color-blue-primary)]"
              >
                로그인 페이지로 돌아가기
              </button>
            </p>
          </>
        ) : (
          <>
            <div className="text-red-500 text-xl mb-4">⚠️</div>
            <p className="text-[var(--color-text-primary)] mb-2">로그인에 실패했습니다.</p>
            <p className="text-[var(--color-text-secondary)] text-sm">{errorMessage}</p>
            <p className="text-[var(--color-text-secondary)] text-xs mt-4">
              잠시 후 로그인 페이지로 이동합니다...
            </p>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="mt-4 px-4 py-2 text-sm text-[var(--color-blue-primary)] underline hover:opacity-80"
            >
              지금 로그인 페이지로 이동
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default OAuthCallbackPage;

