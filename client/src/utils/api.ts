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

    // FormData인 경우 Content-Type을 설정하지 않음 (브라우저가 자동으로 boundary 설정)
    const isFormData = options.body instanceof FormData;
    const headers: HeadersInit = {
      ...(!isFormData && { 'Content-Type': 'application/json' }),
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
      let error: any;
      try {
        error = await response.json();
      } catch {
        error = { message: `HTTP ${response.status}: ${response.statusText}` };
      }
      const errorMessage = error.message || error.error || `요청에 실패했습니다. (${response.status})`;
      const apiError = new Error(errorMessage);
      (apiError as any).response = { data: error, status: response.status };
      throw apiError;
    }

    // DELETE 요청의 경우 응답 본문이 없을 수 있음
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      // 응답 본문이 있는 경우에만 JSON 파싱
      const text = await response.text();
      return text ? JSON.parse(text) : null;
    }
    
    // 응답 본문이 없는 경우 null 반환
    return null as any;
  },

  get: <T>(endpoint: string) => {
    return api.request<T>(endpoint, { method: 'GET' });
  },

  post: <T>(endpoint: string, data?: unknown, options?: RequestInit) => {
    // FormData인 경우 JSON.stringify 하지 않음
    const isFormData = data instanceof FormData;
    return api.request<T>(endpoint, {
      method: 'POST',
      body: isFormData ? data : (data ? JSON.stringify(data) : undefined),
      ...options,
    });
  },

  put: <T>(endpoint: string, data?: unknown, options?: RequestInit) => {
    // FormData인 경우 JSON.stringify 하지 않음
    const isFormData = data instanceof FormData;
    return api.request<T>(endpoint, {
      method: 'PUT',
      body: isFormData ? data : (data ? JSON.stringify(data) : undefined),
      ...options,
    });
  },

  delete: <T>(endpoint: string) => {
    return api.request<T>(endpoint, { method: 'DELETE' });
  },
};


