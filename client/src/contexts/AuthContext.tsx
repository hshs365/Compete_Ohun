import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

export interface User {
  id: number;
  email?: string;
  nickname?: string;
  isProfileComplete: boolean;
}

interface RegisterData {
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
}

export type CompleteProfileData = RegisterData;

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (email: string, password: string, userData: RegisterData) => Promise<void>;
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
  const register = async (email: string, password: string, userData: RegisterData) => {
    const data = await apiCall('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        ...userData,
      }),
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

    // 일반 회원가입은 모든 정보를 입력받으므로 바로 완료
    navigate('/');
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

