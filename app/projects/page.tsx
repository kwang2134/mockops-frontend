'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import { getProjects, createProject } from '@/lib/api/projects';
import type { Project } from '@/types/project';
import { formatDateKST } from '@/lib/utils/date';

export default function ProjectsPage() {
  const router = useRouter();
  const { user, loading: authLoading, isLoggedIn } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    slackWebhookUrl: '',
  });
  const [creating, setCreating] = useState(false);
  const [showWebhookSecretModal, setShowWebhookSecretModal] = useState(false);
  const [webhookSecret, setWebhookSecret] = useState<string>('');

  // 로그인 체크
  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push('/login');
    }
  }, [authLoading, isLoggedIn, router]);

  // 프로젝트 목록 로드
  useEffect(() => {
    if (isLoggedIn) {
      loadProjects();
    }
  }, [isLoggedIn]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getProjects(0, 20);
      setProjects(response.data);
    } catch (err: any) {
      console.error('Failed to load projects:', err);
      setError(err.response?.data?.message || '프로젝트 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim()) return;

    try {
      setCreating(true);
      const newProject = await createProject({
        name: createForm.name.trim(),
        description: createForm.description.trim() || undefined,
        slackWebhookUrl: createForm.slackWebhookUrl.trim() || undefined,
      });

      // 프로젝트 목록 새로고침
      await loadProjects();

      // 생성 모달 닫기 및 폼 초기화
      setShowCreateModal(false);
      setCreateForm({ name: '', description: '', slackWebhookUrl: '' });

      // Webhook Secret 표시
      setWebhookSecret(newProject.webhookSecret);
      setShowWebhookSecretModal(true);
    } catch (err: any) {
      console.error('Failed to create project:', err);
      alert(err.response?.data?.message || '프로젝트 생성에 실패했습니다.');
    } finally {
      setCreating(false);
    }
  };

  if (authLoading || loading) {
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
        <div className="max-w-7xl mx-auto px-6">
          {/* 페이지 헤더 */}
          <div className="mb-8">
            <h1 className="text-4xl font-black tracking-tight text-gray-900 mb-2">
              내 프로젝트
            </h1>
            <p className="text-gray-600 text-lg">
              프로젝트를 생성하고 Mock API를 관리하세요
            </p>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* 프로젝트 생성 버튼 */}
          <div className="mb-8">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
            >
              + 새 프로젝트 만들기
            </button>
          </div>

          {/* 프로젝트 목록 */}
          {projects.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
                <svg
                  className="w-10 h-10 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                아직 프로젝트가 없습니다
              </h3>
              <p className="text-gray-600 mb-6">
                첫 프로젝트를 생성하여 Mock API 관리를 시작하세요
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-8 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-all duration-200 hover:shadow-lg"
              >
                프로젝트 만들기
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => router.push(`/projects/${project.id}`)}
                  className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-gray-300 transition-all duration-200 cursor-pointer group relative"
                >
                  {/* 안 읽은 알림 배지 */}
                  {project.unreadNotificationCount > 0 && (
                    <div className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full w-7 h-7 flex items-center justify-center shadow-lg z-10">
                      {project.unreadNotificationCount > 99 ? '99+' : project.unreadNotificationCount}
                    </div>
                  )}

                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-gray-700 transition-colors">
                        {project.name}
                      </h3>
                      {project.description && (
                        <p className="text-gray-600 text-sm line-clamp-2">
                          {project.description}
                        </p>
                      )}
                    </div>
                    <div className="ml-4">
                      <svg
                        className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>{project.ownerNickname}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>{formatDateKST(project.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* 프로젝트 생성 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">새 프로젝트 만들기</h2>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                  프로젝트 이름 <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="예: 쇼핑몰 프로젝트"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  설명
                </label>
                <textarea
                  id="description"
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="프로젝트에 대한 간단한 설명"
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label
                  htmlFor="slackWebhookUrl"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Slack Webhook URL
                </label>
                <input
                  id="slackWebhookUrl"
                  type="url"
                  value={createForm.slackWebhookUrl}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, slackWebhookUrl: e.target.value })
                  }
                  placeholder="https://hooks.slack.com/services/..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateForm({ name: '', description: '', slackWebhookUrl: '' });
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={creating}
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={creating || !createForm.name.trim()}
                >
                  {creating ? '생성 중...' : '생성하기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Webhook Secret 표시 모달 */}
      {showWebhookSecretModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-8 shadow-2xl">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Webhook Secret 생성됨</h2>
              <p className="text-red-600 font-semibold mb-4">
                ⚠️ 이 값은 지금만 확인 가능합니다. 반드시 안전한 곳에 저장하세요!
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Webhook Secret
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={webhookSecret}
                  readOnly
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(webhookSecret);
                    alert('클립보드에 복사되었습니다!');
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-gray-900 text-white text-xs font-semibold rounded hover:bg-gray-800 transition-colors"
                >
                  복사
                </button>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">안내사항</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• 이 Secret은 Webhook 인증에 사용됩니다</li>
                <li>• 페이지를 닫으면 다시 확인할 수 없습니다</li>
                <li>• 분실 시 프로젝트 설정에서 재발급 가능합니다</li>
              </ul>
            </div>

            <button
              onClick={() => setShowWebhookSecretModal(false)}
              className="w-full px-6 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
            >
              확인했습니다
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
