'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getNotifications } from '@/lib/api/notifications';

interface HeaderProps {
  showAuthButton?: boolean;
  skipInitialAuth?: boolean;
}

export default function Header({ showAuthButton = true, skipInitialAuth = false }: HeaderProps) {
  const router = useRouter();
  const { user, isLoggedIn, loading, logout } = useAuth({ skipInitialAuth });
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // 로그인된 경우 읽지 않은 알림 개수 조회
  useEffect(() => {
    if (isLoggedIn && !skipInitialAuth) {
      loadUnreadCount();
    }
  }, [isLoggedIn, skipInitialAuth]);

  const loadUnreadCount = async () => {
    try {
      const response = await getNotifications(undefined, 1);
      setUnreadCount(response.totalUnreadCount);
    } catch (error) {
      console.error('Failed to load unread notification count:', error);
    }
  };

  const handleLogin = () => {
    router.push('/login');
  };

  const handleDashboard = () => {
    router.push('/projects');
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => router.push('/')}
        >
          <div className="w-10 h-10 flex items-center justify-center overflow-hidden">
            <Image
              src="/images/logo-remove.png"
              alt="MockOps Logo"
              width={48}
              height={48}
              className="rounded"
              priority
            />
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-900">MockOps</span>
        </div>

        {showAuthButton && !loading && (
          <div className="flex items-center gap-4">
            {isLoggedIn && user ? (
              <>
                <button
                  onClick={handleDashboard}
                  className="px-4 py-2 text-gray-700 text-sm font-medium hover:text-gray-900 transition-colors"
                >
                  내 프로젝트
                </button>
                <button
                  onClick={() => router.push('/notifications')}
                  className="relative p-2 text-gray-700 hover:text-gray-900 transition-colors"
                  title="알림"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => router.push('/my')}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100/50 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                      {user.nickname.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-gray-900">{user.nickname}</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-gray-600 text-sm font-medium hover:text-gray-900 transition-colors"
                  >
                    로그아웃
                  </button>
                </div>
              </>
            ) : (
              <button
                onClick={handleLogin}
                className="px-6 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
              >
                시작하기
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}