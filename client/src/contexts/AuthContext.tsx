import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

export interface User {
  id: number;
  email?: string;
  nickname?: string;
  tag?: string; // 닉네임 태그 (예: #KR1, #KR2)
  isProfileComplete: boolean;
}

// 닉네임과 태그를 조합하여 표시하는 헬퍼 함수
export const formatDisplayName = (nickname?: string, tag?: string): string => {
  if (!nickname) return '';
  return tag ? `${nickname}${tag}` : nickname;
};

interface RegisterData {
  realName: string; // 실명 (필수)
  nickname: string;
  gender: 'male' | 'female' | 'other';
  ageRange?: string;
  birthDate?: string;
  residenceSido: string;
  residenceSigungu: string;
  interestedSports?: string[];
  skillLevel?: 'beginner' | 'intermediate' | 'advanced';
  termsServiceAgreed: boolean;
  termsPrivacyAgreed: boolean;
  marketingConsent?: boolean;
  marketingEmailConsent?: boolean;
  marketingSmsConsent?: boolean;
  phone: string; // 전화번호 (필수)
  verificationCode: string; // 인증번호 (필수)
  memberType?: 'individual' | 'business'; // 회원 유형
  businessNumber?: string; // 사업자등록번호 (사업자 회원인 경우)
}

export type CompleteProfileData = RegisterData;

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (email: string, password: string, userData: RegisterData, skipNavigate?: boolean) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  completeProfile: (profileData: CompleteProfileData) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    // 자동 로그인이 활성화되어 있으면 localStorage에서, 아니면 sessionStorage에서 가져오기
    const rememberMe = localStorage.getItem('remember_me') === 'true';
    if (rememberMe) {
      return localStorage.getItem('access_token');
    }
    return sessionStorage.getItem('access_token') || localStorage.getItem('access_token');
  });
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // API 호출 헬퍼 함수
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
    // 자동 로그인 설정에 따라 토큰 가져오기
    const rememberMe = localStorage.getItem('remember_me') === 'true';
    const currentToken = token || (rememberMe 
      ? localStorage.getItem('access_token')
      : sessionStorage.getItem('access_token') || localStorage.getItem('access_token'));
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (currentToken) {
      headers['Authorization'] = `Bearer ${currentToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: '요청에 실패했습니다.' }));
      throw new Error(error.message || '요청에 실패했습니다.');
    }

    return response.json();
  };

  // 인증 상태 확인
  const checkAuth = async () => {
    const rememberMe = localStorage.getItem('remember_me') === 'true';
    const savedToken = rememberMe 
      ? localStorage.getItem('access_token')
      : sessionStorage.getItem('access_token') || localStorage.getItem('access_token');
    
    if (!savedToken) {
      setIsLoading(false);
      return;
    }

    try {
      setToken(savedToken);
      const data = await apiCall('/api/auth/me', {
        method: 'GET',
      });
      setUser(data);
      
      // 자동 로그인이 활성화되어 있으면 localStorage에 저장, 아니면 sessionStorage에 저장
      if (rememberMe) {
        localStorage.setItem('access_token', savedToken);
      } else {
        sessionStorage.setItem('access_token', savedToken);
        // 기존 호환성을 위해 localStorage에도 저장 (하지만 remember_me가 false면 세션 종료 시 제거)
      }
    } catch (error) {
      // 토큰이 유효하지 않으면 로그아웃
      localStorage.removeItem('access_token');
      sessionStorage.removeItem('access_token');
      localStorage.removeItem('remember_me');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  // 로그인
  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    const data = await apiCall('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    // 자동 로그인이 활성화되어 있으면 localStorage에 저장, 아니면 sessionStorage에 저장
    if (rememberMe) {
      localStorage.setItem('access_token', data.token);
      localStorage.setItem('remember_me', 'true');
    } else {
      sessionStorage.setItem('access_token', data.token);
      localStorage.setItem('access_token', data.token); // 기존 호환성을 위해 localStorage에도 저장
      localStorage.setItem('remember_me', 'false');
    }
    
    setToken(data.token);
    setUser(data.user);

    // 추가 정보 미입력 상태면 추가 정보 입력 페이지로 이동
    if (!data.user.isProfileComplete) {
      navigate('/auth/complete-profile');
    } else {
      navigate('/');
    }
  };

  // 회원가입
  const register = async (email: string, password: string, userData: RegisterData, skipNavigate?: boolean) => {
    try {
      console.log('register 함수 호출:', { email, userData });
      const data = await apiCall('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
          ...userData,
        }),
      });
      console.log('회원가입 성공:', data);

    const rememberMe = localStorage.getItem('remember_me') === 'true';
    if (rememberMe) {
      localStorage.setItem('access_token', data.token);
    } else {
      sessionStorage.setItem('access_token', data.token);
      localStorage.setItem('access_token', data.token); // 기존 호환성
    }
    
      setToken(data.token);
      setUser(data.user);
      setIsLoading(false); // 로딩 완료 처리

      // 신규 회원가입이므로 가이드 완료 플래그 삭제 (가이드를 다시 표시하기 위해)
      localStorage.removeItem('welcome_guide_completed');

      // 일반 회원가입은 모든 정보를 입력받으므로 바로 완료
      // skipNavigate가 true이면 navigate하지 않음 (RegisterPage에서 가이드 표시 후 처리)
      if (!skipNavigate) {
        // 상태 업데이트가 완료된 후 네비게이션 (React 상태 업데이트는 비동기)
        setTimeout(() => {
          navigate('/');
        }, 0);
      }
    } catch (error) {
      console.error('register 함수 에러:', error);
      setIsLoading(false);
      throw error; // 에러를 다시 throw하여 RegisterPage에서 처리할 수 있도록
    }
  };

  // 추가 정보 입력 완료
  const completeProfile = async (profileData: CompleteProfileData) => {
    const data = await apiCall('/api/auth/complete-profile', {
      method: 'POST',
      body: JSON.stringify(profileData),
    });

    const rememberMe = localStorage.getItem('remember_me') === 'true';
    if (rememberMe) {
      localStorage.setItem('access_token', data.token);
    } else {
      sessionStorage.setItem('access_token', data.token);
      localStorage.setItem('access_token', data.token); // 기존 호환성
    }
    
    setToken(data.token);
    setUser(data.user);

    navigate('/');
  };

  // 로그아웃
  const logout = () => {
    // 현재 사용자의 프로필 사진 삭제
    if (user?.id) {
      localStorage.removeItem(`profileImage_${user.id}`);
    }
    
    localStorage.removeItem('access_token');
    sessionStorage.removeItem('access_token');
    // 자동 로그인 해제 (이메일은 유지)
    localStorage.removeItem('remember_me');
    // 이메일은 저장된 상태로 유지하여 다음 로그인 시 편의성 제공
    setToken(null);
    setUser(null);
    navigate('/login');
  };

  // 초기 인증 상태 확인
  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        checkAuth,
        completeProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

