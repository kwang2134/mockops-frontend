'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { acceptEmailInvitation } from '@/lib/api/invitations';
import { refreshToken, setAccessToken } from '@/lib/auth';

export default function OAuth2CallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // OAuth2 인증 성공 시, 백엔드가 이미 Refresh Token을 HttpOnly 쿠키에 저장한 상태
        // Access Token을 먼저 획득
        const tokenResponse = await refreshToken();
        setAccessToken(tokenResponse.accessToken);

        // sessionStorage에서 초대 토큰 확인
        const invitationToken = sessionStorage.getItem('invitationToken');

        if (invitationToken) {
          // 초대 토큰이 있으면 자동으로 초대 수락 처리
          try {
            await acceptEmailInvitation(invitationToken);
            sessionStorage.removeItem('invitationToken');
            sessionStorage.removeItem('loginRedirect');
            console.log('Invitation accepted, redirecting to projects...');
            router.push('/projects');
            return;
          } catch (invitationError: any) {
            console.error('Failed to accept invitation:', invitationError);
            sessionStorage.removeItem('invitationToken');
            sessionStorage.removeItem('loginRedirect');
            setError('초대 수락에 실패했습니다. 초대 링크가 만료되었거나 이미 사용되었을 수 있습니다.');
            // 3초 후 프로젝트 목록으로 리다이렉트
            setTimeout(() => {
              router.push('/projects');
            }, 3000);
            return;
          }
        }

        // sessionStorage에서 로그인 전에 저장된 redirect URL 확인
        const redirectUrl = sessionStorage.getItem('loginRedirect');

        if (redirectUrl) {
          // redirect URL이 있으면 해당 URL로 이동
          sessionStorage.removeItem('loginRedirect');
          console.log('OAuth2 callback received, redirecting to:', redirectUrl);
          router.push(redirectUrl);
        } else {
          // redirect URL이 없으면 기본적으로 프로젝트 목록으로 이동
          console.log('OAuth2 callback received, redirecting to projects...');
          router.push('/projects');
        }
      } catch (error) {
        console.error('OAuth callback error:', error);
        setError('로그인 처리 중 오류가 발생했습니다.');
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        {error ? (
          <>
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <p className="text-red-600 text-lg font-semibold">{error}</p>
            <p className="text-gray-500 text-sm mt-2">잠시 후 리다이렉트됩니다...</p>
          </>
        ) : (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">로그인 처리중...</p>
          </>
        )}
      </div>
    </div>
  );
}
