import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const OAuthCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

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
          throw new Error(error.message || '소셜 로그인에 실패했습니다.');
        }

        const data = await response.json();

        // 토큰 저장
        localStorage.setItem('access_token', data.token);

        // 추가 정보 미입력 상태면 추가 정보 입력 페이지로 이동
        if (data.isNewUser || !data.isProfileComplete) {
          navigate('/auth/complete-profile', {
            state: { provider, providerEmail: data.providerEmail },
          });
        } else {
          // 정상 로그인 처리 - 페이지 새로고침으로 인증 상태 업데이트
          window.location.href = '/';
        }
      } catch (error) {
        setStatus('error');
        setErrorMessage(
          error instanceof Error ? error.message : '소셜 로그인에 실패했습니다.',
        );
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)]">
      <div className="text-center">
        {status === 'loading' ? (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-blue-primary)] mx-auto mb-4"></div>
            <p className="text-[var(--color-text-primary)]">로그인 처리 중...</p>
          </>
        ) : (
          <>
            <div className="text-red-500 text-xl mb-4">⚠️</div>
            <p className="text-[var(--color-text-primary)] mb-2">로그인에 실패했습니다.</p>
            <p className="text-[var(--color-text-secondary)] text-sm">{errorMessage}</p>
            <p className="text-[var(--color-text-secondary)] text-xs mt-4">
              잠시 후 로그인 페이지로 이동합니다...
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default OAuthCallbackPage;

