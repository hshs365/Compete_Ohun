import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { EnvelopeIcon, LockClosedIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
  const [email, setEmail] = useState(() => {
    // localStorage에서 저장된 이메일 가져오기
    return localStorage.getItem('saved_email') || '';
  });
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    // localStorage에서 자동 로그인 설정 확인
    return localStorage.getItem('remember_me') === 'true';
  });
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // 자동 로그인 설정 저장
      localStorage.setItem('remember_me', rememberMe.toString());
      
      // 자동 로그인이 체크되어 있으면 이메일 저장
      if (rememberMe && email) {
        localStorage.setItem('saved_email', email);
      } else {
        // 자동 로그인이 해제되면 저장된 이메일도 제거하지 않고 유지 (사용자 편의성)
        // 단, 사용자가 명시적으로 이메일을 지우고 싶다면 직접 지울 수 있도록 함
      }
      
      await login(email, password, rememberMe);
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKakaoLogin = async () => {
    setError('');
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
      const response = await fetch(
        `${API_BASE_URL}/api/auth/social/auth-url?provider=kakao`,
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: '서버 응답 오류' }));
        throw new Error(errorData.message || `서버 오류: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.authUrl) {
        // state를 sessionStorage에 저장 (callback에서 검증 가능)
        sessionStorage.setItem('oauth_state', data.state);
        // OAuth 인증 페이지로 리다이렉트
        window.location.href = data.authUrl;
      } else {
        setError('카카오 로그인 URL을 가져오는데 실패했습니다. 백엔드 서버를 확인해주세요.');
      }
    } catch (error) {
      console.error('카카오 로그인 오류:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : '카카오 로그인을 시작하는데 실패했습니다.';
      
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('network')) {
        setError('백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.');
      } else {
        setError(errorMessage);
      }
    }
  };

  const handleNaverLogin = () => {
    // 네이버 로그인은 현재 지원하지 않음
    setError('네이버 로그인은 현재 준비 중입니다.');
  };

  const handleGoogleLogin = async () => {
    setError('');
    try {
      // API 베이스 URL 결정 (api.ts와 동일한 로직)
      const getApiBaseUrl = (): string => {
        if (import.meta.env.VITE_API_BASE_URL) {
          return import.meta.env.VITE_API_BASE_URL;
        }
        const hostname = window.location.hostname;
        const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.');
        return !isLocalhost ? '' : 'http://localhost:3000';
      };
      const API_BASE_URL = getApiBaseUrl();
      const response = await fetch(
        `${API_BASE_URL}/api/auth/social/auth-url?provider=google`,
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: '서버 응답 오류' }));
        throw new Error(errorData.message || `서버 오류: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.authUrl) {
        // state를 sessionStorage에 저장 (callback에서 검증 가능)
        sessionStorage.setItem('oauth_state', data.state);
        // OAuth 인증 페이지로 리다이렉트
        window.location.href = data.authUrl;
      } else {
        setError('구글 로그인 URL을 가져오는데 실패했습니다. 백엔드 서버를 확인해주세요.');
      }
    } catch (error) {
      console.error('구글 로그인 오류:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : '구글 로그인을 시작하는데 실패했습니다.';
      
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('network')) {
        setError('백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.');
      } else {
        setError(errorMessage);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)] px-4 py-12">
      <div className="w-full max-w-md">
        {/* 로고 영역 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-500 rounded-full mb-4">
            <span className="text-white text-2xl font-bold">O</span>
          </div>
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-2">Ohun</h1>
          <p className="text-[var(--color-text-secondary)]">운동 매치 플랫폼에 오신 것을 환영합니다</p>
        </div>

        {/* 로그인 폼 카드 */}
        <div className="bg-[var(--color-bg-card)] rounded-2xl shadow-lg border border-[var(--color-border-card)] p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 이메일 입력 */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                이메일
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <EnvelopeIcon className="h-5 w-5 text-[var(--color-text-secondary)]" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)] focus:border-transparent transition-all"
                  placeholder="example@email.com"
                />
              </div>
            </div>

            {/* 비밀번호 입력 */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                비밀번호
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-[var(--color-text-secondary)]" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="block w-full pl-10 pr-10 py-3 border border-[var(--color-border-card)] rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)] focus:border-transparent transition-all"
                  placeholder="비밀번호를 입력하세요"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* 아이디/비밀번호 찾기 및 자동 로그인 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-[var(--color-blue-primary)] border-gray-300 rounded focus:ring-[var(--color-blue-primary)]"
                />
                <label htmlFor="rememberMe" className="text-sm text-[var(--color-text-primary)] cursor-pointer">
                  자동 로그인
                </label>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Link
                  to="/find-account"
                  className="text-[var(--color-blue-primary)] hover:underline"
                >
                  아이디 찾기
                </Link>
                <span className="text-[var(--color-text-secondary)]">|</span>
                <Link
                  to="/find-password"
                  className="text-[var(--color-blue-primary)] hover:underline"
                >
                  비밀번호 찾기
                </Link>
              </div>
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            {/* 로그인 버튼 */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[var(--color-blue-primary)] text-white py-3 rounded-lg font-semibold hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-primary)] focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          {/* 구분선 */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--color-border-card)]"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-[var(--color-bg-card)] text-[var(--color-text-secondary)]">
                또는
              </span>
            </div>
          </div>

          {/* 소셜 로그인 버튼 */}
          <div className="space-y-3">
            {/* 카카오 로그인 */}
            <button
              type="button"
              onClick={handleKakaoLogin}
              className="w-full flex items-center justify-center gap-3 bg-[#FEE500] text-[#000000] py-3 rounded-lg font-semibold hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#FEE500] focus:ring-offset-2 transition-all duration-200"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3C6.48 3 2 6.91 2 11.75c0 2.78 1.75 5.26 4.5 6.75l-1.25 4.25 4.75-2.25c.5.08 1 .12 1.5.12 5.52 0 10-3.91 10-8.75S17.52 3 12 3z"/>
              </svg>
              카카오톡으로 로그인
            </button>

            {/* 네이버 로그인 */}
            <button
              type="button"
              onClick={handleNaverLogin}
              className="w-full flex items-center justify-center gap-3 bg-[#03C75A] text-white py-3 rounded-lg font-semibold hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#03C75A] focus:ring-offset-2 transition-all duration-200"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16.273 12.845L7.376 0H0v24h7.726V11.156L16.624 24H24V0h-7.727v12.845z"/>
              </svg>
              네이버로 로그인
            </button>

            {/* 구글 로그인 */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 bg-[var(--color-bg-card)] text-[var(--color-text-primary)] border border-[var(--color-border-card)] py-3 rounded-lg font-semibold hover:bg-[var(--color-bg-secondary)] focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-all duration-200"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google로 로그인
            </button>
          </div>

          {/* 회원가입 링크 */}
          <div className="mt-6 text-center">
            <span className="text-[var(--color-text-secondary)]">계정이 없으신가요? </span>
            <Link
              to="/register"
              className="text-[var(--color-blue-primary)] font-semibold hover:underline"
            >
              회원가입
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

