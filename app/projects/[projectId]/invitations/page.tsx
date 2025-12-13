'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import { acceptInvitation } from '@/lib/api/members';

export default function AcceptInvitationPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = parseInt(params.projectId as string);
  const { user, loading: authLoading, isLoggedIn } = useAuth();

  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(3);
  const hasAcceptedRef = useRef(false); // 중복 요청 방지

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push('/login');
    }
  }, [authLoading, isLoggedIn, router]);

  useEffect(() => {
    if (isLoggedIn && user && projectId && !hasAcceptedRef.current) {
      hasAcceptedRef.current = true; // 요청 전에 즉시 true로 설정
      handleAcceptInvitation();
    }
  }, [isLoggedIn, user, projectId]);

  const handleAcceptInvitation = async () => {
    if (!user) return;

    try {
      setStatus('processing');
      await acceptInvitation(projectId, user.id);
      setStatus('success');
    } catch (error: any) {
      console.error('Failed to accept invitation:', error);
      const errorMsg =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        error.message ||
        '초대 수락에 실패했습니다.';
      setErrorMessage(errorMsg);
      setStatus('error');
      hasAcceptedRef.current = false; // 실패 시 다시 시도 가능하도록 리셋
    }
  };

  // 성공 시 카운트다운
  useEffect(() => {
    if (status === 'success') {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [status]);

  // 카운트다운이 0이 되면 리다이렉트
  useEffect(() => {
    if (status === 'success' && countdown === 0) {
      router.push(`/projects/${projectId}`);
    }
  }, [status, countdown, projectId, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="pt-24 flex items-center justify-center">
          <div className="text-lg text-gray-600">로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="pt-24 pb-16">
        <div className="max-w-2xl mx-auto px-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
            {status === 'processing' && (
              <>
                <div className="w-16 h-16 mx-auto mb-6">
                  <svg
                    className="animate-spin text-gray-900"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">초대를 수락하는 중...</h1>
                <p className="text-gray-600">잠시만 기다려 주세요.</p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="w-16 h-16 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-10 h-10 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">초대를 수락했습니다!</h1>
                <p className="text-gray-600 mb-6">
                  프로젝트에 성공적으로 참여했습니다.
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
                  <svg
                    className="w-5 h-5 text-gray-600 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span className="text-sm text-gray-600">
                    {countdown}초 후 프로젝트 페이지로 이동합니다...
                  </span>
                </div>
                <button
                  onClick={() => router.push(`/projects/${projectId}`)}
                  className="mt-6 px-6 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-all"
                >
                  지금 이동하기
                </button>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-10 h-10 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">초대 수락 실패</h1>
                <p className="text-red-600 mb-6">{errorMessage}</p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => {
                      hasAcceptedRef.current = true;
                      handleAcceptInvitation();
                    }}
                    className="px-6 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-all"
                  >
                    다시 시도
                  </button>
                  <button
                    onClick={() => router.push('/projects')}
                    className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
                  >
                    프로젝트 목록으로
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}