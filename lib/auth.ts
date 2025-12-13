import api from './api-client';
import { TokenResponse, User } from '@/types';

/**
 * OAuth2 로그인 시작
 */
export const initiateOAuth2Login = (provider: 'google' | 'github') => {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
  window.location.href = `${baseUrl}/api/v1/auth/oauth2/authorization/${provider}`;
};

/**
 * Access Token 저장
 */
export const setAccessToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('accessToken', token);
  }
};

/**
 * Access Token 가져오기
 */
export const getAccessToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('accessToken');
  }
  return null;
};

/**
 * Access Token 삭제
 */
export const removeAccessToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
  }
};

/**
 * 로그인 여부 확인
 */
export const isAuthenticated = (): boolean => {
  return getAccessToken() !== null;
};

/**
 * 현재 사용자 정보 조회
 */
export const getCurrentUser = async (): Promise<User> => {
  const response = await api.get<{ success: true; result: User }>('/api/v1/users/me');
  return response.data.result;
};

/**
 * 로그아웃
 */
export const logout = async () => {
  try {
    await api.post('/api/v1/auth/logout');
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    removeAccessToken();
    window.location.href = '/';
  }
};

/**
 * 토큰 갱신
 */
export const refreshToken = async (): Promise<TokenResponse> => {
  const response = await api.get<{ success: true; result: TokenResponse }>(
    '/api/v1/auth/token/refresh'
  );
  return response.data.result;
};
