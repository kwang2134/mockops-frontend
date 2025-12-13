'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';

export default function LandingPage() {
  const router = useRouter();
  const { isLoggedIn, loading: authLoading } = useAuth({ skipInitialAuth: true });
  const [currentHeroImage, setCurrentHeroImage] = useState(0);

  // 로그인 상태 확인 및 리다이렉트
  useEffect(() => {
    if (!authLoading && isLoggedIn) {
      router.push('/projects');
    }
  }, [isLoggedIn, authLoading, router]);

  // Hero 이미지 자동 전환
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHeroImage((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = () => {
    router.push('/login');
  };

  // 로딩 중이면 빈 화면 표시 (깜빡임 방지)
  if (authLoading) {
    return null;
  }

  return (
    <div className="scroll-container">
      {/* 고정 헤더 */}
      <Header skipInitialAuth={true} />

      {/* 스크롤 스냅 컨테이너 */}
      <main className="snap-container">
        {/* 섹션 1: Hero Section */}
        <section className="snap-section relative overflow-hidden bg-black">
          {/* 배경 이미지 전환 효과 */}
          <div className="absolute inset-0">
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-opacity duration-1000 ${
                  currentHeroImage === index ? 'opacity-30' : 'opacity-0'
                }`}
              >
                {/* IMAGE PLACEHOLDER: Hero Background ${index + 1} */}
                {/* Recommended size: 1920x1080px (16:9) or 2560x1080px (21:9) */}
                {/* High quality abstract/tech background images */}
                <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                  <span className="text-gray-600 text-sm">
                    Hero Background {index + 1}<br />
                    1920x1080px (16:9)
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* 컨텐츠 */}
          <div className="relative z-10 flex flex-col items-center justify-center h-full text-white px-6">
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-center mb-6 leading-tight max-w-5xl">
              당신의 프로젝트를 위한
              <br />
              <span className="bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                완벽한 Mocking 매니저
              </span>
            </h1>
            <p className="text-lg md:text-xl text-gray-300 text-center max-w-2xl mb-12 font-light tracking-wide">
              Mock API 서버 관리 플랫폼
            </p>

            {/* Scroll Down 인디케이터 */}
            <div className="absolute bottom-12 animate-bounce">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </div>
        </section>

        {/* 섹션 2: 프로젝트 관리 - 텍스트 좌 / 이미지 우 */}
        <section className="snap-section bg-white">
          <div className="max-w-7xl mx-auto h-full flex items-center px-6">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 w-full items-center">
              {/* 좌측: 텍스트 (40%) */}
              <div className="lg:col-span-2 space-y-8">
                <div>
                  <div className="inline-block px-4 py-1.5 bg-gray-100 rounded-full text-sm font-semibold text-gray-700 mb-4">
                    Project Management
                  </div>
                  <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-tight text-gray-900 mb-6">
                    팀 협업을 위한<br />
                    프로젝트 관리
                  </h2>
                  <p className="text-gray-600 text-lg leading-relaxed mb-8">
                    직관적인 프로젝트 생성부터 팀원 초대까지, 간단한 클릭만으로 협업 환경을 구축하세요.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">프로젝트 중앙 관리</h3>
                      <p className="text-gray-600 text-sm">모든 Mock API를 한 곳에서 관리</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">실시간 팀 협업</h3>
                      <p className="text-gray-600 text-sm">초대 메일로 팀원 추가</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">권한 세밀 제어</h3>
                      <p className="text-gray-600 text-sm">OWNER / MANAGER / DEVELOPER / MEMBER 역할 관리</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 우측: 이미지 (60%) */}
              <div className="lg:col-span-3">
                {/* IMAGE PLACEHOLDER 1: Project Dashboard */}
                {/* Recommended size: 1200x800px (3:2) */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 aspect-[3/2] flex items-center justify-center rounded-2xl shadow-lg hover:shadow-xl transition-all">
                  <div className="text-center text-gray-400">
                    <div className="text-base font-semibold mb-2">프로젝트 대시보드 화면</div>
                    <div className="text-sm font-mono">1200x800px (3:2)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 섹션 3: Mock API - 이미지 좌 / 텍스트 우 */}
        <section className="snap-section bg-gray-50">
          <div className="max-w-7xl mx-auto h-full flex items-center px-6">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 w-full items-center">
              {/* 좌측: 이미지 (60%) */}
              <div className="lg:col-span-3 order-2 lg:order-1">
                {/* IMAGE PLACEHOLDER 2: Mock API Editor */}
                {/* Recommended size: 1200x800px (3:2) */}
                <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 aspect-[3/2] flex items-center justify-center rounded-2xl shadow-lg hover:shadow-xl transition-all">
                  <div className="text-center text-gray-400">
                    <div className="text-base font-semibold mb-2">Mock API 설정 & JSON 에디터</div>
                    <div className="text-sm font-mono">1200x800px (3:2)</div>
                  </div>
                </div>
              </div>

              {/* 우측: 텍스트 (40%) */}
              <div className="lg:col-span-2 space-y-8 order-1 lg:order-2">
                <div>
                  <div className="inline-block px-4 py-1.5 bg-white rounded-full text-sm font-semibold text-gray-700 mb-4 border border-gray-200">
                    Mock API
                  </div>
                  <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-tight text-gray-900 mb-6">
                    백엔드 없이도<br />
                    빠른 프론트엔드 개발
                  </h2>
                  <p className="text-gray-600 text-lg leading-relaxed mb-8">
                    실제 API가 준비되지 않아도 프론트엔드 개발을 멈추지 마세요. 실시간으로 응답을 설정하고 테스트하세요.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">유연한 URL 패턴</h3>
                      <p className="text-gray-600 text-sm">REST API 엔드포인트 자유롭게 정의</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">실시간 JSON 편집</h3>
                      <p className="text-gray-600 text-sm">응답 데이터를 즉시 수정하고 테스트</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">OpenAPI 가져오기</h3>
                      <p className="text-gray-600 text-sm">Swagger 파일로 일괄 생성</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 섹션 4: 헬스 체크 - 텍스트 좌 / 이미지 우 */}
        <section className="snap-section bg-white">
          <div className="max-w-7xl mx-auto h-full flex items-center px-6">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 w-full items-center">
              {/* 좌측: 텍스트 (40%) */}
              <div className="lg:col-span-2 space-y-8">
                <div>
                  <div className="inline-block px-4 py-1.5 bg-gray-100 rounded-full text-sm font-semibold text-gray-700 mb-4">
                    Health Check
                  </div>
                  <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-tight text-gray-900 mb-6">
                    서비스 상태<br />
                    실시간 모니터링
                  </h2>
                  <p className="text-gray-600 text-lg leading-relaxed mb-8">
                    도메인 서버의 상태를 자동으로 체크하고, 문제가 발생하면 즉시 알림을 받으세요.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">직관적 상태 표시</h3>
                      <p className="text-gray-600 text-sm">Green / Yellow / Red 색상 구분</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">상세 로그 추적</h3>
                      <p className="text-gray-600 text-sm">실패 시각, 응답 코드 모두 기록</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">커서 기반 페이징</h3>
                      <p className="text-gray-600 text-sm">대량 로그도 빠르게 조회</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 우측: 이미지 (60%) */}
              <div className="lg:col-span-3">
                {/* IMAGE PLACEHOLDER 3: Health Check Dashboard */}
                {/* Recommended size: 1200x800px (3:2) */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 aspect-[3/2] flex items-center justify-center rounded-2xl shadow-lg hover:shadow-xl transition-all">
                  <div className="text-center text-gray-400">
                    <div className="text-base font-semibold mb-2">헬스 체크 대시보드</div>
                    <div className="text-sm font-mono">1200x800px (3:2)</div>
                    <div className="text-xs mt-1">(서버 상태 카드 + 로그)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 섹션 5: 웹훅 & 슬랙 알림 - 이미지 좌 / 텍스트 우 */}
        <section className="snap-section bg-gray-50">
          <div className="max-w-7xl mx-auto h-full flex items-center px-6">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 w-full items-center">
              {/* 좌측: 이미지 (60%) */}
              <div className="lg:col-span-3 order-2 lg:order-1">
                {/* IMAGE PLACEHOLDER 4: Webhook & Slack Integration */}
                {/* Recommended size: 1200x800px (3:2) */}
                <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 aspect-[3/2] flex items-center justify-center rounded-2xl shadow-lg hover:shadow-xl transition-all">
                  <div className="text-center text-gray-400">
                    <div className="text-base font-semibold mb-2">웹훅 설정 & 슬랙 알림</div>
                    <div className="text-sm font-mono">1200x800px (3:2)</div>
                  </div>
                </div>
              </div>

              {/* 우측: 텍스트 (40%) */}
              <div className="lg:col-span-2 space-y-8 order-1 lg:order-2">
                <div>
                  <div className="inline-block px-4 py-1.5 bg-white rounded-full text-sm font-semibold text-gray-700 mb-4 border border-gray-200">
                    Webhook & Notification
                  </div>
                  <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-tight text-gray-900 mb-6">
                    배포 알림을<br />
                    팀 전체에 공유
                  </h2>
                  <p className="text-gray-600 text-lg leading-relaxed mb-8">
                    서버 상태 변화와 배포 알림을 슬랙으로 받아보세요. 팀원 모두가 실시간으로 상황을 파악할 수 있습니다.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">웹훅 자동화</h3>
                      <p className="text-gray-600 text-sm">배포 트리거 시 자동 알림 전송</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">슬랙 연동</h3>
                      <p className="text-gray-600 text-sm">중요 이벤트를 채널에 즉시 전송</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0 mt-1">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">보안 Secret Key</h3>
                      <p className="text-gray-600 text-sm">안전한 웹훅 인증 체계</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 섹션 6: 최종 CTA + 푸터 */}
        <section className="snap-section bg-black text-white">
          <div className="h-full flex flex-col">
            {/* 메인 CTA 영역 */}
            <div className="flex-1 flex items-center justify-center px-6">
              <div className="text-center max-w-4xl">
                <h2 className="text-5xl md:text-6xl font-black tracking-tighter mb-6 leading-tight">
                  지금 바로 시작하여<br />
                  효율적으로 프로젝트를<br />
                  관리해 보세요
                </h2>
                <p className="text-lg md:text-xl text-gray-400 mb-10 font-light tracking-wide">
                  MockOps와 함께라면 Mock API 관리가 쉬워집니다
                </p>
                <button
                  onClick={handleLogin}
                  className="px-12 py-5 bg-white text-black text-lg font-bold rounded-xl hover:bg-gray-100 transition-all duration-200 hover:shadow-2xl hover:scale-105"
                >
                  시작하기
                </button>
              </div>
            </div>

            {/* 푸터 */}
            <footer className="border-t border-gray-800 py-8">
              <div className="max-w-7xl mx-auto px-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
                  <div>
                    © 2024 MockOps. All rights reserved.
                  </div>
                  <div className="flex gap-6">
                    <a href="#" className="hover:text-white transition-colors">이용약관</a>
                    <a href="#" className="hover:text-white transition-colors">개인정보처리방침</a>
                    <a href="#" className="hover:text-white transition-colors">문의하기</a>
                  </div>
                </div>
              </div>
            </footer>
          </div>
        </section>
      </main>

      <style jsx>{`
        .scroll-container {
          height: 100vh;
          overflow-y: scroll;
          scroll-behavior: smooth;
        }

        .snap-container {
          scroll-snap-type: y mandatory;
          height: 100vh;
          overflow-y: scroll;
        }

        .snap-section {
          scroll-snap-align: start;
          scroll-snap-stop: always;
          height: 100vh;
          min-height: 100vh;
        }
      `}</style>
    </div>
  );
}
