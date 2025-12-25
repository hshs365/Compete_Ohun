const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export const api = {
  async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    // 자동 로그인 설정에 따라 토큰 가져오기
    const rememberMe = localStorage.getItem('remember_me') === 'true';
    const token = rememberMe 
      ? localStorage.getItem('access_token')
      : sessionStorage.getItem('access_token') || localStorage.getItem('access_token');

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: '요청에 실패했습니다.',
      }));
      throw new Error(error.message || '요청에 실패했습니다.');
    }

    return response.json();
  },

  get: <T>(endpoint: string) => {
    return api.request<T>(endpoint, { method: 'GET' });
  },

  post: <T>(endpoint: string, data?: unknown) => {
    return api.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  put: <T>(endpoint: string, data?: unknown) => {
    return api.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  delete: <T>(endpoint: string) => {
    return api.request<T>(endpoint, { method: 'DELETE' });
  },
};


