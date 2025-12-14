import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// API 클라이언트 설정
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080',
  withCredentials: true, // 쿠키 자동 포함 (Refresh Token)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Refresh 중복 방지를 위한 변수
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Request Interceptor: Access Token 추가
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 클라이언트 사이드에서만 localStorage 접근
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 로그아웃 처리 헬퍼 함수 (circular dependency 방지)
const handleTokenExpiration = async () => {
  if (typeof window === 'undefined') return;

  try {
    // 백엔드에 로그아웃 요청하여 쿠키의 Refresh Token 만료 처리
    await axios.post(
      `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'}/api/v1/auth/logout`,
      {},
      { withCredentials: true }
    );
  } catch (error) {
    console.error('Logout API call failed:', error);
  } finally {
    // Access Token 제거
    localStorage.removeItem('accessToken');

    // 로그인 페이지로 리다이렉트 (로그인/OAuth 관련 페이지가 아닌 경우)
    if (!window.location.pathname.startsWith('/login') &&
        !window.location.pathname.startsWith('/oauth2/callback') &&
        window.location.pathname !== '/') {
      window.location.href = '/login';
    }
  }
};

// Response Interceptor: 토큰 갱신 및 에러 처리
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // refresh 엔드포인트 자체의 에러는 처리하지 않음
    if (originalRequest.url?.includes('/auth/token/refresh')) {
      isRefreshing = false;
      processQueue(error, null);

      // Refresh Token도 만료된 경우 로그아웃 처리
      await handleTokenExpiration();
      return Promise.reject(error);
    }

    // 403 CONSENT_REQUIRED 에러 처리
    if (error.response?.status === 403) {
      const errorData = error.response.data as any;
      if (errorData?.error?.errorCode === 'CONSENT_REQUIRED' || errorData?.errorCode === 'CONSENT_REQUIRED' || errorData?.code === 'CONSENT_REQUIRED') {
        // 현재 페이지가 /consent가 아니면 강제 이동
        if (typeof window !== 'undefined' && window.location.pathname !== '/consent') {
            sessionStorage.setItem('isRedirectingToConsent', 'true');
          window.location.href = '/consent';
        }
        return Promise.reject(error);
      }
    }

    // 401 에러이고 재시도하지 않은 경우
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // 이미 refresh 중이면 queue에 추가
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api.request(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.log('[Token Refresh] Access token expired, attempting refresh...');
        // Refresh Token으로 Access Token 갱신
        const res = await api.get('/api/v1/auth/token/refresh');
        const { accessToken } = res.data.result;

        // 새 Access Token 저장
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', accessToken);
        }

        console.log('[Token Refresh] Successfully refreshed access token');

        // 대기 중인 요청들 처리
        processQueue(null, accessToken);
        isRefreshing = false;

        // 원래 요청에 새 토큰 추가하여 재시도
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }

        return api.request(originalRequest);
      } catch (refreshError) {
        // Refresh Token도 만료된 경우
        console.log('[Token Refresh] Refresh token expired, logging out...');
        processQueue(refreshError, null);
        isRefreshing = false;

        // 로그아웃 처리 (백엔드 쿠키 만료)
        await handleTokenExpiration();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// 응답 타입 정의
export interface ApiResponse<T> {
  success: boolean;
  result: T;
  timestamp: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
  };
  timestamp: string;
}