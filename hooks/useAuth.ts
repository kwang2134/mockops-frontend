'use client';

import { useState, useEffect } from 'react';
import { User } from '@/types';
import { getCurrentUser, isAuthenticated, logout, refreshToken, setAccessToken } from '@/lib/auth';

interface UseAuthOptions {
  skipInitialAuth?: boolean;
}

export function useAuth(options: UseAuthOptions = {}) {
  const { skipInitialAuth = false } = options;
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      // skipInitialAuth가 true면 API 호출 없이 localStorage만 확인
      if (skipInitialAuth) {
        const hasToken = isAuthenticated();
        setIsLoggedIn(hasToken);
        setLoading(false);
        return;
      }

      try {
        // localStorage에 Access Token이 없으면 먼저 토큰 갱신 시도
        if (!isAuthenticated()) {
          try {
            const tokenResponse = await refreshToken();
            setAccessToken(tokenResponse.accessToken);
          } catch (error) {
            // Refresh Token이 없거나 만료된 경우
            console.log('No valid refresh token');
            setUser(null);
            setIsLoggedIn(false);
            setLoading(false);
            return;
          }
        }

        // Access Token이 있으면 사용자 정보 조회
        const userData = await getCurrentUser();
        setUser(userData);
        setIsLoggedIn(true);
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        setUser(null);
        setIsLoggedIn(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [skipInitialAuth]);

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setIsLoggedIn(false);
  };

  const handleRefreshUser = async () => {
    try {
      const userData = await getCurrentUser();
      setUser(userData);
      setIsLoggedIn(true);
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  return {
    user,
    loading,
    isLoggedIn,
    logout: handleLogout,
    refreshUser: handleRefreshUser,
  };
}