// API 베이스 URL 결정: 환경변수 > 런타임 체크 > 기본값 (다른 모듈에서 재사용 가능하도록 export)
// ⚠️ 배포 시: 이미지(/uploads)는 백엔드에서만 서빙되므로, 프론트와 백이 다른 호스트면
//    반드시 VITE_API_BASE_URL을 백엔드 주소로 빌드에 설정해야 이미지가 로드됩니다.
export const getApiBaseUrl = (): string => {
  // 1. 환경변수가 명시적으로 설정되어 있으면 사용 (배포 시 필수 권장)
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  // 2. 런타임에 현재 호스트명 체크
  const hostname = window.location.hostname;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.');

  // 3. localhost가 아니면 프로덕션으로 간주 (상대 경로 사용 → same-origin)
  //    이때 프론트 호스트에서 /uploads를 백엔드로 프록시하지 않으면 이미지 404 발생
  if (!isLocalhost) {
    return '';
  }

  // 4. localhost면 개발 서버 사용
  return 'http://localhost:3000';
};

const API_BASE_URL = getApiBaseUrl();

/** 카카오톡·인스타·네이버 등 인앱 브라우저 여부 (나갔다 들어와도 localStorage 사용해 로그인 유지) */
export function isInAppBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return (
    /KAKAOTALK/i.test(ua) ||
    /Instagram/i.test(ua) ||
    /NAVER/i.test(ua) ||
    /Line\//i.test(ua) ||
    /FBAN|FBAV/i.test(ua) // Facebook
  );
}

/**
 * 업로드 이미지 URL: 프로필·시설 등 이미지 로드 시 사용
 * - /uploads/... 경로는 API(백엔드)에서 서빙하므로, base가 있으면 반드시 붙임
 * - production에서 base가 ''이면 same-origin → Nginx 등에서 /uploads를 백엔드로 프록시해야 함
 */
export function getImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
  const base = getApiBaseUrl();
  const path = url.startsWith('/') ? url : `/${url}`;
  if (base) return `${base.replace(/\/$/, '')}${path}`;
  // same-origin: /uploads/... 요청은 Nginx에서 백엔드(포트 3000)로 프록시 필요
  return path;
}

/** Socket.io 연결용 URL (API와 동일 오리진) */
export function getSocketUrl(): string {
  if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL;
  const hostname = window.location.hostname;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.');
  if (!isLocalhost) return window.location.origin;
  return 'http://localhost:3000';
}

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

  patch: <T>(endpoint: string, data?: unknown, options?: RequestInit) => {
    const isFormData = data instanceof FormData;
    return api.request<T>(endpoint, {
      method: 'PATCH',
      body: isFormData ? data : (data ? JSON.stringify(data) : undefined),
      ...options,
    });
  },

  delete: <T>(endpoint: string) => {
    return api.request<T>(endpoint, { method: 'DELETE' });
  },
};


