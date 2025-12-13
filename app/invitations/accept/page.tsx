'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { acceptEmailInvitation } from '@/lib/api/invitations';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';

function AcceptInvitationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { isLoggedIn, loading: authLoading } = useAuth({ skipInitialAuth: true });

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const isProcessing = useRef(false);

  useEffect(() => {
    if (isProcessing.current) {
      // 이미 처리 중이면 중복 실행 방지
      return;
    }

    if (authLoading) {
      // 인증 상태 로딩 중
      return;
    }

    if (!token) {
      setStatus('error');
      setErrorMessage('유효하지 않은 초대 링크입니다.');
      return;
    }

    if (!isLoggedIn) {
      // 비로그인 상태: 토큰을 저장하고 로그인 페이지로 리다이렉트
      // OAuth 콜백에서 자동으로 초대를 수락하므로 redirect URL은 설정하지 않음
      isProcessing.current = true;
      sessionStorage.setItem('invitationToken', token);
      router.push('/login');
      return;
    }

    // 로그인 상태: 초대 수락 처리
    isProcessing.current = true;
    acceptInvitation();
  }, [token, isLoggedIn, authLoading]);

  const acceptInvitation = async () => {
    if (!token) return;

    try {
      setStatus('loading');
      await acceptEmailInvitation(token);
      setStatus('success');

      // sessionStorage에서 토큰 제거
      sessionStorage.removeItem('invitationToken');

      // 2초 후 프로젝트 목록 페이지로 이동
      setTimeout(() => {
        router.push('/projects');
      }, 2000);
    } catch (error: any) {
      console.error('Failed to accept invitation:', error);
      setStatus('error');

      setErrorMessage(
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        '초대 수락에 실패했습니다. 초대 링크가 만료되었거나 이미 사용되었을 수 있습니다.'
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="pt-24 pb-16">
        <div className="max-w-2xl mx-auto px-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-12 shadow-lg">
            {status === 'loading' && (
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                </div>
                <h1 className="text-3xl font-black text-gray-900 mb-4">초대 처리 중</h1>
                <p className="text-gray-600 text-lg">
                  프로젝트 초대를 확인하고 있습니다...
                </p>
              </div>
            )}

            {status === 'success' && (
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
                  <svg
                    className="w-10 h-10 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h1 className="text-3xl font-black text-gray-900 mb-4">초대 수락 완료!</h1>
                <p className="text-gray-600 text-lg mb-6">
                  프로젝트에 성공적으로 참여하셨습니다.
                </p>
                <p className="text-sm text-gray-500">
                  잠시 후 프로젝트 목록 페이지로 이동합니다...
                </p>
                <button
                  onClick={() => router.push('/projects')}
                  className="mt-8 px-6 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
                >
                  프로젝트 목록으로 이동
                </button>
              </div>
            )}

            {status === 'error' && (
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
                  <svg
                    className="w-10 h-10 text-red-600"
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
                <h1 className="text-3xl font-black text-gray-900 mb-4">초대 수락 실패</h1>
                <p className="text-red-600 text-lg mb-8">
                  {errorMessage}
                </p>
                <div className="space-y-3">
                  <button
                    onClick={() => router.push('/projects')}
                    className="w-full px-6 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    프로젝트 목록으로 이동
                  </button>
                  <button
                    onClick={() => router.push('/login')}
                    className="w-full px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    로그인 페이지로 이동
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 추가 안내 */}
          <div className="mt-8 text-center">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-2">도움말</h3>
              <ul className="text-sm text-blue-800 space-y-1 text-left max-w-md mx-auto">
                <li>• 초대 링크는 일정 시간이 지나면 만료됩니다</li>
                <li>• 이미 수락한 초대는 다시 사용할 수 없습니다</li>
                <li>• 문제가 지속되면 프로젝트 관리자에게 문의하세요</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50">
          <Header />
          <main className="pt-24 pb-16">
            <div className="max-w-2xl mx-auto px-6">
              <div className="bg-white rounded-2xl border border-gray-200 p-12 shadow-lg">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                  </div>
                  <h1 className="text-3xl font-black text-gray-900 mb-4">로딩 중...</h1>
                </div>
              </div>
            </div>
          </main>
        </div>
      }
    >
      <AcceptInvitationContent />
    </Suspense>
  );
}
