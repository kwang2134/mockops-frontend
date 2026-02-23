'use client';

import {useEffect, useState} from 'react';
import { useRouter } from 'next/navigation';
import { submitAgreements } from '@/lib/api/consent';
import { acceptEmailInvitation } from '@/lib/api/invitations';
import {refreshToken, setAccessToken} from "@/lib/auth";

export default function ConsentPage() {
  const router = useRouter();
  const [tosAgreed, setTosAgreed] = useState(false);
  const [ppAgreed, setPpAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

    const decodeJwtPayload = (token: string) => {
        if (!token) return null;
        try {
            const parts = token.split('.');
            if (parts.length !== 3) return null; // JWT 형식이 아님

            const base64Url = parts[1];

            // 1. Base64Url-safe 문자열을 표준 Base64로 변환 ('-' -> '+', '_' -> '/')
            let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

            // 2. Base64 패딩 '='을 추가하여 길이가 4의 배수가 되도록 만듭니다.
            while (base64.length % 4) {
                base64 += '=';
            }

            // 3. 디코딩 및 JSON 파싱
            const payloadJson = atob(base64);
            return JSON.parse(payloadJson);
        } catch (e) {
            console.warn("Invalid token structure or decoding error:", e);
            return null;
        }
    };

    const tryAcceptInvitation = async () => {
        const invitationToken = sessionStorage.getItem('invitationToken');
        if (!invitationToken) return false;

        try {
            const tokenResponse = await refreshToken();
            setAccessToken(tokenResponse.accessToken);
            await acceptEmailInvitation(invitationToken);
            console.log('Invitation accepted after consent.');
        } catch (error) {
            console.error('Failed to accept invitation after consent:', error);
        } finally {
            sessionStorage.removeItem('invitationToken');
            sessionStorage.removeItem('loginRedirect');
        }

        return true;
    };

    useEffect(() => {
        const handleAlreadyAgreed = async () => {
            const token = localStorage.getItem('accessToken');
            if (!token) return;

            const payload = decodeJwtPayload(token);

            if (
                payload &&
                payload.tos_agreed_version &&
                payload.pp_agreed_version
            ) {
                console.log('Already agreed. Redirecting to /projects');
                await tryAcceptInvitation();
                router.replace('/projects');
            }
        };

        handleAlreadyAgreed();
    }, [router]);


  const handleSubmit = async () => {
    if (!tosAgreed || !ppAgreed) {
      alert('모든 약관에 동의해주세요.');
      return;
    }

    try {
      setSubmitting(true);

      const firstTokenResponse = await refreshToken();
      setAccessToken(firstTokenResponse.accessToken);

      await submitAgreements({
        agreements: [
          {
            agreementType: 'TOS',
          },
          {
            agreementType: 'PP',
          },
        ],
      });

      alert('약관 동의가 완료되었습니다.');
      localStorage.removeItem('accessToken');

      const secondTokenResponse = await refreshToken();
      setAccessToken(secondTokenResponse.accessToken);
      await tryAcceptInvitation();
      router.replace('/projects');
    } catch (error) {
      console.error('Failed to submit agreements:', error);
      alert('약관 동의 처리에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  const allAgreed = tosAgreed && ppAgreed;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-5xl w-full bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-6 text-center">
          <h1 className="text-3xl font-black text-white mb-2">약관 동의</h1>
          <p className="text-blue-100">서비스 이용을 위해 약관에 동의해주세요</p>
        </div>

        <div className="p-8">
          {/* 이용약관 */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">이용약관</h2>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={tosAgreed}
                  onChange={(e) => setTosAgreed(e.target.checked)}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-semibold text-gray-700">
                  동의합니다 (필수)
                </span>
              </label>
            </div>
            <div className="border border-gray-300 rounded-lg overflow-hidden">
                <div className="p-4 bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition duration-200 h-16">
                    <p className="text-gray-700 font-medium">전체 이용약관 내용을 확인하려면:</p>
                    <a
                        href="https://angry-crustacean-d21.notion.site/MockOps-2c92c03f4c54804cb5f9fb49e0adbcd7?source=copy_link"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-blue-600 hover:text-blue-800 font-semibold transition duration-200 whitespace-nowrap"
                    >
                        전체 내용 보기 (새 창 열기)
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                    </a>
                </div>
            </div>
          </div>

          {/* 개인정보처리방침 */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">개인정보처리방침</h2>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={ppAgreed}
                  onChange={(e) => setPpAgreed(e.target.checked)}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-semibold text-gray-700">
                  동의합니다 (필수)
                </span>
              </label>
            </div>
            <div className="border border-gray-300 rounded-lg overflow-hidden">
                <div className="p-4 bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition duration-200 h-16">
                    <p className="text-gray-700 font-medium">전체 개인정보처리방침 내용을 확인하려면:</p>
                    <a
                        href="https://angry-crustacean-d21.notion.site/MockOps-2c92c03f4c54802895c4d83ab99500e4?source=copy_link"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-blue-600 hover:text-blue-800 font-semibold transition duration-200 whitespace-nowrap"
                    >
                        전체 내용 보기 (새 창 열기)
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                    </a>
                </div>
            </div>
          </div>

          {/* 전체 동의 체크박스 */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={allAgreed}
                onChange={(e) => {
                  setTosAgreed(e.target.checked);
                  setPpAgreed(e.target.checked);
                }}
                className="w-6 h-6 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-lg font-bold text-gray-900">
                모든 약관에 동의합니다
              </span>
            </label>
          </div>

          {/* 확인 버튼 */}
          <button
            onClick={handleSubmit}
            disabled={!allAgreed || submitting}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
              allAgreed && !submitting
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {submitting ? '처리 중...' : '확인'}
          </button>

          {/* 안내 메시지 */}
          {!allAgreed && (
            <p className="mt-4 text-center text-sm text-red-600">
              모든 약관에 동의해야 서비스를 이용할 수 있습니다.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
