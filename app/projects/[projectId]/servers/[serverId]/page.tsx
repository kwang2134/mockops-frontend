'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import { useJobPolling } from '@/hooks/useJobPolling';
import { getProject } from '@/lib/api/projects';
import { getServer, updateServer, deleteServer } from '@/lib/api/servers';
import {
  getMockApis,
  getMockApi,
  createMockApi,
  updateMockApi,
  deleteMockApi,
  toggleMockApi,
  uploadOpenApiFile,
  getJobStatus,
  getActiveJobForServer,
} from '@/lib/api/mock-apis';
import {
  getHealthCheckFailureLogs,
  getServerNotificationSummary,
  markNotificationAsRead,
  deleteNotification,
  type ServerNotificationSummary
} from '@/lib/api/notifications';
import type { ProjectDetailResponse, MemberRole } from '@/types/project';
import type {
  DomainServer,
  DomainServerUpdateRequest,
  MockApiCore,
  MockApi,
  MockApiCreateRequest,
  MockApiUpdateRequest,
  HttpMethod,
  Job,
  JobStatus,
} from '@/types/server';
import type { HealthCheckFailureLog } from '@/lib/api/notifications';
import { formatDateTimeKST } from '@/lib/utils/date';
import { getNotificationTypeLabel } from '@/lib/utils/notification';

type Tab = 'mock-apis' | 'health-check';

export default function ServerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = parseInt(params.projectId as string);
  const serverId = parseInt(params.serverId as string);
  const { user, loading: authLoading, isLoggedIn } = useAuth();

  const [server, setServer] = useState<DomainServer | null>(null);
  const [project, setProject] = useState<ProjectDetailResponse | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('mock-apis');
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationSummary, setNotificationSummary] = useState<ServerNotificationSummary | null>(null);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [expandedTypeIndex, setExpandedTypeIndex] = useState<number | null>(null);
  const [expandedNotificationId, setExpandedNotificationId] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push('/login');
    }
  }, [authLoading, isLoggedIn, router]);

  useEffect(() => {
    if (isLoggedIn && serverId && projectId) {
      loadData();
    }
  }, [isLoggedIn, serverId, projectId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [serverData, projectData] = await Promise.all([
        getServer(serverId),
        getProject(projectId),
      ]);
      setServer(serverData);
      setProject(projectData);
      // 서버 알림 요약도 함께 로드
      await loadNotificationSummary();
    } catch (error: any) {
      console.error('Failed to load data:', error);
      if (error.response?.status === 403 || error.response?.status === 404) {
        alert('서버를 찾을 수 없거나 권한이 없습니다.');
        router.push(`/projects/${projectId}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadNotificationSummary = async () => {
    try {
      const summary = await getServerNotificationSummary(serverId);
      setNotificationSummary(summary);
    } catch (error) {
      console.error('Failed to load notification summary:', error);
    }
  };

  const handleOpenNotifications = async () => {
    setShowNotificationModal(true);
    setLoadingNotifications(true);
    try {
      const summary = await getServerNotificationSummary(serverId);
      setNotificationSummary(summary);
    } catch (error) {
      console.error('Failed to load notification summary:', error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await markNotificationAsRead(notificationId);
      // 상태 업데이트: 해당 알림을 읽음 처리
      if (notificationSummary) {
        const updatedSummary = {
          ...notificationSummary,
          summaries: notificationSummary.summaries.map(summary => ({
            ...summary,
            latestNotifications: summary.latestNotifications.map(notification =>
              notification.notificationId === notificationId
                ? { ...notification, isRead: true }
                : notification
            ),
            unreadCount: summary.latestNotifications.some(n => n.notificationId === notificationId && !n.isRead)
              ? summary.unreadCount - 1
              : summary.unreadCount
          })),
          totalUnreadCount: notificationSummary.totalUnreadCount - 1
        };
        setNotificationSummary(updatedSummary);
      }
      // 서버 데이터도 다시 로드하여 배지 업데이트
      await loadNotificationSummary();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      alert('알림 읽음 처리에 실패했습니다.');
    }
  };

  const handleDeleteNotification = async (notificationId: number) => {
    if (!confirm('이 알림을 삭제하시겠습니까?')) return;

    try {
      await deleteNotification(notificationId);
      // 상태 업데이트: 해당 알림 제거
      if (notificationSummary) {
        const updatedSummary = {
          ...notificationSummary,
          summaries: notificationSummary.summaries.map(summary => {
            const notification = summary.latestNotifications.find(n => n.notificationId === notificationId);
            const wasUnread = notification && !notification.isRead;
            return {
              ...summary,
              latestNotifications: summary.latestNotifications.filter(n => n.notificationId !== notificationId),
              unreadCount: wasUnread ? summary.unreadCount - 1 : summary.unreadCount
            };
          }).filter(summary => summary.latestNotifications.length > 0), // 알림이 없는 타입은 제거
          totalUnreadCount: notificationSummary.summaries
            .flatMap(s => s.latestNotifications)
            .find(n => n.notificationId === notificationId && !n.isRead)
              ? notificationSummary.totalUnreadCount - 1
              : notificationSummary.totalUnreadCount
        };
        setNotificationSummary(updatedSummary);
      }
      // 서버 데이터도 다시 로드하여 배지 업데이트
      await loadNotificationSummary();
    } catch (error) {
      console.error('Failed to delete notification:', error);
      alert('알림 삭제에 실패했습니다.');
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

  if (!server || !project) {
    return null;
  }

  const userRole = project.currentUserMemberRole;
  const canManageServers = userRole === 'DEVELOPER' || userRole === 'MANAGER' || userRole === 'OWNER';

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: 'mock-apis', label: 'Mock API' },
    { id: 'health-check', label: '헬스 체크' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-6">
          {/* 서버 헤더 */}
          <div className="mb-8">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
              <button onClick={() => router.push('/projects')} className="hover:text-gray-900">
                프로젝트
              </button>
              <span>/</span>
              <button
                onClick={() => router.push(`/projects/${projectId}`)}
                className="hover:text-gray-900"
              >
                {project.name}
              </button>
              <span>/</span>
              <span className="text-gray-900">{server.name}</span>
            </div>

            {/* 뒤로가기 버튼 */}
            <button
              onClick={() => router.push(`/projects/${projectId}`)}
              className="mb-4 inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <span className="font-medium">프로젝트로 돌아가기</span>
            </button>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-4xl font-black tracking-tight text-gray-900">
                      {server.name}
                    </h1>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        server.status === 'DEPLOYED'
                          ? 'bg-green-100 text-green-800'
                          : server.status === 'MOCKING'
                          ? 'bg-blue-100 text-blue-800'
                          : server.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-800'
                          : server.status === 'ERROR'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {server.status}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    <span className="font-mono">/mock/{projectId}/{server.slug}</span>
                  </div>
                </div>
                {/* 서버 알림 아이콘 */}
                <button
                  onClick={handleOpenNotifications}
                  className="relative p-2 text-gray-700 hover:text-gray-900 transition-colors"
                  title="서버 알림"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                  {(notificationSummary?.totalUnreadCount ?? 0) > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {(notificationSummary?.totalUnreadCount ?? 0) > 99 ? '99+' : (notificationSummary?.totalUnreadCount ?? 0)}
                    </span>
                  )}
                </button>
              </div>
              {canManageServers && (
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
                  >
                    서버 수정
                  </button>
                  <button
                    onClick={async () => {
                      if (confirm('정말로 이 서버를 삭제하시겠습니까? 모든 Mock API가 함께 삭제됩니다.')) {
                        try {
                          await deleteServer(serverId);
                          alert('서버가 삭제되었습니다.');
                          router.push(`/projects/${projectId}`);
                        } catch (error) {
                          console.error('Failed to delete server:', error);
                          alert('서버 삭제에 실패했습니다.');
                        }
                      }
                    }}
                    className="px-6 py-3 border border-red-300 text-red-700 font-semibold rounded-lg hover:bg-red-50 transition-all"
                  >
                    서버 삭제
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 탭 네비게이션 */}
          <div className="border-b border-gray-200 mb-8">
            <div className="flex gap-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-4 px-1 border-b-2 font-semibold transition-colors ${
                    activeTab === tab.id
                      ? 'border-gray-900 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* 탭 컨텐츠 */}
          <div>
            {activeTab === 'mock-apis' && <MockApisTab serverId={serverId} projectId={projectId} userRole={userRole} />}
            {activeTab === 'health-check' && <HealthCheckTab serverId={serverId} />}
          </div>
        </div>
      </main>

      {/* 서버 수정 모달 */}
      {showEditModal && (
        <EditServerModal
          server={server}
          onClose={() => setShowEditModal(false)}
          onSuccess={(updatedServer) => {
            setServer(updatedServer);
            setShowEditModal(false);
          }}
        />
      )}

      {/* 서버 알림 요약 모달 */}
      {showNotificationModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowNotificationModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-3xl w-full max-h-[80vh] overflow-y-auto p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {server.name} 알림 요약
              </h2>
              <button
                onClick={() => setShowNotificationModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {loadingNotifications ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-gray-600">알림을 불러오는 중...</div>
              </div>
            ) : notificationSummary ? (
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">전체 안 읽은 알림</p>
                    <p className="text-3xl font-bold text-gray-900">{notificationSummary.totalUnreadCount}개</p>
                  </div>
                </div>

                {notificationSummary.summaries.length === 0 ? (
                  <div className="text-center py-8 text-gray-600">
                    알림이 없습니다.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {notificationSummary.summaries.map((summary, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                        {/* 타입 헤더 - 클릭 가능 */}
                        <div
                          onClick={() => {
                            setExpandedTypeIndex(expandedTypeIndex === index ? null : index);
                            setExpandedNotificationId(null); // 타입 변경 시 알림 상세 닫기
                          }}
                          className="p-5 hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  summary.type === 'HEALTH_CHECK_FAILURE' ? 'bg-red-100 text-red-800' :
                                  summary.type === 'SERVER_STATUS_CHANGED' ? 'bg-blue-100 text-blue-800' :
                                  summary.type === 'MOCK_BULK_SUCCESS' ? 'bg-green-100 text-green-800' :
                                  summary.type === 'MOCK_BULK_FAILURE' ? 'bg-orange-100 text-orange-800' :
                                  summary.type === 'MEMBER_INVITATION_RECEIVED' ? 'bg-green-100 text-green-800' :
                                  summary.type === 'MEMBER_INVITATION_ACCEPTED' ? 'bg-purple-100 text-purple-800' :
                                  summary.type === 'SYSTEM_ANNOUNCEMENT' ? 'bg-indigo-100 text-indigo-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {getNotificationTypeLabel(summary.type)}
                                </span>
                                <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-bold">
                                  {summary.unreadCount}건
                                </span>
                              </div>
                            </div>
                            {/* 펼침/접힘 아이콘 */}
                            <div className="ml-4">
                              <svg
                                className={`w-5 h-5 text-gray-400 transition-transform ${
                                  expandedTypeIndex === index ? 'rotate-180' : ''
                                }`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>
                        </div>

                        {/* 알림 목록 - 타입이 펼쳐졌을 때만 표시 */}
                        {expandedTypeIndex === index && (
                          <div className="border-t border-gray-200 bg-gray-50">
                            {summary.latestNotifications.length === 0 ? (
                              <div className="p-5 text-center text-sm text-gray-600">
                                알림이 없습니다.
                              </div>
                            ) : (
                              <div className="divide-y divide-gray-200">
                                {summary.latestNotifications.map((notification) => (
                                  <div key={notification.notificationId}>
                                    {/* 알림 항목 */}
                                    <div className="p-4 hover:bg-gray-100 transition-colors group">
                                      <div className="flex items-start gap-3">
                                        {/* 알림 내용 - 클릭 가능 */}
                                        <div
                                          onClick={() => setExpandedNotificationId(
                                            expandedNotificationId === notification.notificationId
                                              ? null
                                              : notification.notificationId
                                          )}
                                          className="flex-1 min-w-0 cursor-pointer"
                                        >
                                          <div className="flex items-center gap-2 mb-1">
                                            <h5 className="text-sm font-semibold text-gray-900 truncate">
                                              {notification.title}
                                            </h5>
                                            {!notification.isRead && (
                                              <span className="flex-shrink-0 w-2 h-2 bg-red-600 rounded-full"></span>
                                            )}
                                          </div>
                                          <p className="text-sm text-gray-600 line-clamp-2">
                                            {notification.message}
                                          </p>
                                          <p className="text-xs text-gray-500 mt-1">
                                            {formatDateTimeKST(notification.createdAt)}
                                          </p>
                                        </div>

                                        {/* 액션 버튼 영역 */}
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                          {/* 읽음 처리 버튼 - 읽지 않은 알림만 표시 */}
                                          {!notification.isRead && (
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleMarkAsRead(notification.notificationId);
                                              }}
                                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                              title="읽음으로 표시"
                                            >
                                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                              </svg>
                                            </button>
                                          )}

                                          {/* 삭제 버튼 */}
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleDeleteNotification(notification.notificationId);
                                            }}
                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                            title="삭제"
                                          >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                          </button>

                                          {/* 펼침/접힘 아이콘 */}
                                          <button
                                            onClick={() => setExpandedNotificationId(
                                              expandedNotificationId === notification.notificationId
                                                ? null
                                                : notification.notificationId
                                            )}
                                            className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                                          >
                                            <svg
                                              className={`w-4 h-4 transition-transform ${
                                                expandedNotificationId === notification.notificationId ? 'rotate-180' : ''
                                              }`}
                                              fill="none"
                                              stroke="currentColor"
                                              viewBox="0 0 24 24"
                                            >
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                          </button>
                                        </div>
                                      </div>
                                    </div>

                                    {/* 알림 상세 (메타데이터) - 알림이 펼쳐졌을 때만 표시 */}
                                    {expandedNotificationId === notification.notificationId && (
                                      <div className="border-t border-gray-300 bg-white p-4">
                                        <div className="space-y-3">
                                          {/* 전체 메시지 */}
                                          <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">메시지</label>
                                            <p className="text-sm text-gray-900">{notification.message}</p>
                                          </div>

                                          {/* 읽음 상태 */}
                                          <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">읽음 상태</label>
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${
                                              notification.isRead
                                                ? 'bg-gray-100 text-gray-800'
                                                : 'bg-red-100 text-red-800'
                                            }`}>
                                              {notification.isRead ? '읽음' : '읽지 않음'}
                                            </span>
                                          </div>

                                          {/* 메타데이터 */}
                                          {notification.metadata && Object.keys(notification.metadata).length > 0 && (
                                            <div>
                                              <label className="block text-xs font-medium text-gray-600 mb-1">메타데이터</label>
                                              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg max-h-[200px] overflow-y-auto">
                                                <pre className="text-xs text-gray-900 font-mono whitespace-pre-wrap break-words">
                                                  {JSON.stringify(notification.metadata, null, 2)}
                                                </pre>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-600">
                알림을 불러올 수 없습니다.
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowNotificationModal(false)}
                className="px-6 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 서버 수정 모달
function EditServerModal({
  server,
  onClose,
  onSuccess,
}: {
  server: DomainServer;
  onClose: () => void;
  onSuccess: (server: DomainServer) => void;
}) {
  // URL을 protocol과 path로 분리
  const parseUrl = (url: string) => {
    if (!url) return { protocol: 'https://', path: '' };
    if (url.startsWith('https://')) {
      return { protocol: 'https://', path: url.substring(8) };
    } else if (url.startsWith('http://')) {
      return { protocol: 'http://', path: url.substring(7) };
    }
    return { protocol: 'https://', path: url };
  };

  const initialUrl = parseUrl(server.healthCheckUrl || '');
  const [protocol, setProtocol] = useState(initialUrl.protocol);
  const [urlPath, setUrlPath] = useState(initialUrl.path);

  const [formData, setFormData] = useState<DomainServerUpdateRequest>({
    name: server.name,
    healthCheckUrl: server.healthCheckUrl || '',
    healthCheckInterval: server.healthCheckInterval || '',
    status: server.status,
    isHealthCheckActive: server.isHealthCheckActive,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // protocol과 urlPath를 합쳐서 최종 URL 생성
    const fullUrl = urlPath.trim() ? `${protocol}${urlPath.trim()}` : '';

    try {
      setSubmitting(true);
      const updatedServer = await updateServer(server.id, {
        ...formData,
        healthCheckUrl: fullUrl,
      });
      alert('서버가 수정되었습니다.');
      onSuccess(updatedServer);
    } catch (error) {
      console.error('Failed to update server:', error);
      alert('서버 수정에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">서버 수정</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">서버 이름</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              placeholder="서버 이름"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              헬스 체크 URL
            </label>
            <div className="flex gap-2">
              <select
                value={protocol}
                onChange={(e) => setProtocol(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
              >
                <option value="https://">https://</option>
                <option value="http://">http://</option>
              </select>
              <input
                type="text"
                value={urlPath}
                onChange={(e) => setUrlPath(e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="example.com/health (선택)"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              프로토콜을 선택하고 나머지 URL을 입력하세요
            </p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              헬스 체크 간격
            </label>
            <select
              value={formData.healthCheckInterval}
              onChange={(e) => setFormData({ ...formData, healthCheckInterval: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
            >
              <option value="">선택 안 함</option>
              <option value="5m">5분</option>
              <option value="10m">10분</option>
              <option value="30m">30분</option>
              <option value="1h">1시간</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">서버 상태</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
            >
              <option value="MOCKING">MOCKING</option>
              <option value="PENDING">PENDING</option>
              <option value="DEPLOYED">DEPLOYED</option>
              <option value="ERROR">ERROR</option>
            </select>
            <p className="mt-2 text-xs text-gray-500">
              MOCKING: Mock 서버 작동 중 | PENDING: 배포 대기 중 | DEPLOYED: 배포 완료 | ERROR: 오류 발생
            </p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isHealthCheckActive"
              checked={formData.isHealthCheckActive}
              onChange={(e) =>
                setFormData({ ...formData, isHealthCheckActive: e.target.checked })
              }
              className="w-5 h-5 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
            />
            <label htmlFor="isHealthCheckActive" className="text-sm font-medium text-gray-900">
              헬스 체크 활성화
            </label>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-all disabled:bg-gray-400"
            >
              {submitting ? '수정 중...' : '수정'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
            >
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Mock API 탭
function MockApisTab({ serverId, projectId, userRole }: { serverId: number; projectId: number; userRole: MemberRole }) {
  const [mockApiGroups, setMockApiGroups] = useState<{ groupName: string; mocks: MockApiCore[] }[]>([]);
  const [loading, setLoading] = useState(false);
  const [idCursor, setIdCursor] = useState<number | null>(null);
  const [nameCursor, setNameCursor] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMockApi, setSelectedMockApi] = useState<MockApi | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [checkingJob, setCheckingJob] = useState(true);
  const [showSlashInfoModal, setShowSlashInfoModal] = useState(false);

  // DEVELOPER 이상 권한 체크
  const canManageMockApis = userRole === 'DEVELOPER' || userRole === 'MANAGER' || userRole === 'OWNER';

  // 백그라운드 job 폴링
  useJobPolling({
    jobId: activeJob?.jobId?.toString() || '',
    onSuccess: () => {
      loadMockApis();
      setActiveJob(null);
    },
    onFailure: () => {
      setActiveJob(null);
    },
  });

  useEffect(() => {
    loadMockApis();
    checkActiveJob();
  }, [serverId]);

  const checkActiveJob = async () => {
    try {
      setCheckingJob(true);
      const job = await getActiveJobForServer(serverId);
      setActiveJob(job);
    } catch (error) {
      console.error('Failed to check active job:', error);
    } finally {
      setCheckingJob(false);
    }
  };

  const loadMockApis = async (lastId?: number, lastName?: string) => {
    try {
      setLoading(true);
      const response = await getMockApis(serverId, 20, lastId, lastName);

      if (lastId !== undefined || lastName !== undefined) {
        // 더 보기: 기존 데이터에 추가
        setMockApiGroups((prev) => [...prev, ...response.mocks]);
      } else {
        // 초기 로드: 새로 설정
        setMockApiGroups(response.mocks);
      }

      setIdCursor(response.nextIdCursor);
      setNameCursor(response.nextNameCursor);
      setHasNext(response.hasNext);
    } catch (error) {
      console.error('Failed to load mock APIs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = async (apiId: number) => {
    try {
      const api = await getMockApi(apiId);
      setSelectedMockApi(api);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Failed to load mock API:', error);
      alert('Mock API 정보를 불러오는데 실패했습니다.');
    }
  };

  const handleToggle = async (apiId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await toggleMockApi(apiId);
      await loadMockApis();
    } catch (error) {
      console.error('Failed to toggle mock API:', error);
      alert('Mock API 상태 변경에 실패했습니다.');
    }
  };

  const handleDelete = async (apiId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('정말로 이 Mock API를 삭제하시겠습니까?')) return;
    try {
      await deleteMockApi(apiId);
      await loadMockApis();
      alert('Mock API가 삭제되었습니다.');
    } catch (error) {
      console.error('Failed to delete mock API:', error);
      alert('Mock API 삭제에 실패했습니다.');
    }
  };

  if (loading) {
    return <div className="text-gray-600">Mock API 목록 로딩 중...</div>;
  }

  return (
    <div>
      {canManageMockApis && (
        <div className="mb-6">
          <div className="flex gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-all"
            >
              + Mock API 추가
            </button>
            <button
              onClick={() => setShowUploadModal(true)}
              disabled={checkingJob || !!activeJob}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              OpenAPI 파일 업로드
            </button>
          </div>
          {activeJob && (
            <div className="mt-3 flex items-center gap-2 text-sm text-blue-600">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>이미 OpenAPI 파일 업로드 처리 중입니다...</span>
            </div>
          )}
        </div>
      )}

      {/* API 사용 가이드 */}
      <div className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          API 사용 방법
        </h3>

        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-2">Base URL</p>
            <div className="bg-white rounded-lg p-4 font-mono text-sm border border-gray-200">
              https://api.mockops.cloud/mock/{projectId}/도메인명/
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-yellow-900 mb-2 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              주의사항
            </p>
            <ul className="text-sm text-yellow-800 space-y-1 ml-7">
              <li>• <code className="bg-yellow-100 px-1 rounded">mockops.cloud</code>가 아닌 <code className="bg-yellow-100 px-1 rounded font-semibold">api.mockops.cloud</code>로 요청하세요</li>
              <li>• 엔드포인트 경로의 마지막 슬래시(/)를 일관되게 사용하세요</li>
            </ul>
          </div>

        </div>
      </div>

      {mockApiGroups.length === 0 ? (
        <div className="text-center py-12 text-gray-600">
          아직 Mock API가 없습니다. Mock API를 추가해주세요.
        </div>
      ) : (
        <div className="space-y-6">
          {mockApiGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* 그룹 헤더 */}
              <div className="bg-gray-900 px-6 py-3">
                <h3 className="text-white font-bold text-lg">{group.groupName || '기타'}</h3>
              </div>

              {/* API 목록 테이블 */}
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">이름</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">메서드</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">엔드포인트</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">상태 코드</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">상태</th>
                    {canManageMockApis && (
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">작업</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {group.mocks.map((api) => (
                    <tr
                      key={api.id}
                      onClick={() => handleRowClick(api.id)}
                      className="hover:bg-gray-50 cursor-pointer"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{api.name}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            api.httpMethod === 'GET'
                              ? 'bg-blue-100 text-blue-800'
                              : api.httpMethod === 'POST'
                              ? 'bg-green-100 text-green-800'
                              : api.httpMethod === 'PUT'
                              ? 'bg-yellow-100 text-yellow-800'
                              : api.httpMethod === 'DELETE'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {api.httpMethod}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-mono text-gray-600">
                        {api.endpointPath}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{api.statusCode}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            api.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {api.isActive ? '활성' : '비활성'}
                        </span>
                      </td>
                      {canManageMockApis && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={(e) => handleToggle(api.id, e)}
                              className="px-3 py-1 text-xs font-semibold rounded border transition-all"
                              style={{
                                borderColor: api.isActive ? '#16a34a' : '#9ca3af',
                                color: api.isActive ? '#16a34a' : '#9ca3af',
                              }}
                              title={api.isActive ? '비활성화' : '활성화'}
                            >
                              {api.isActive ? '활성' : '비활성'}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDelete(api.id, e)}
                              className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-all"
                              title="삭제"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

          {/* 더 보기 버튼 */}
          {hasNext && (
            <div className="text-center mt-6">
              <button
                type="button"
                onClick={() => loadMockApis(idCursor || undefined, nameCursor || undefined)}
                disabled={loading}
                className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all disabled:bg-gray-300"
              >
                {loading ? '로딩 중...' : '더 보기'}
              </button>
            </div>
          )}
        </div>
      )}

      {showCreateModal && (
        <CreateMockApiModal
          serverId={serverId}
          projectId={projectId}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            loadMockApis();
            setShowCreateModal(false);
          }}
        />
      )}

      {showDetailModal && selectedMockApi && (
        <MockApiDetailModal
          mockApi={selectedMockApi}
          projectId={projectId}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedMockApi(null);
          }}
          onEdit={() => {
            setShowDetailModal(false);
            setShowEditModal(true);
          }}
        />
      )}

      {showEditModal && selectedMockApi && (
        <EditMockApiModal
          mockApi={selectedMockApi}
          onClose={() => {
            setShowEditModal(false);
            setSelectedMockApi(null);
          }}
          onSuccess={() => {
            loadMockApis();
            setShowEditModal(false);
            setSelectedMockApi(null);
          }}
        />
      )}

      {showUploadModal && (
        <OpenApiUploadModal
          serverId={serverId}
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            loadMockApis();
            checkActiveJob();
            setShowUploadModal(false);
          }}
          onJobCreated={(jobId) => {
            // job이 생성되면 activeJob으로 설정하고 모달 닫기
            setActiveJob({
              jobId: parseInt(jobId),
              status: 'PROCESSING',
              message: '업로드 처리 중...',
              totalParsed: 0,
              successCount: 0,
              duplicateCount: 0,
              submittedAt: new Date().toISOString(),
              completedAt: null,
              detailedError: null
            });
            setShowUploadModal(false);
          }}
        />
      )}
    </div>
  );
}

// Mock API 생성 모달
function CreateMockApiModal({
  serverId,
  projectId,
  onClose,
  onSuccess,
}: {
  serverId: number;
  projectId: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState<MockApiCreateRequest>({
    name: '',
    httpMethod: 'GET',
    endpointPath: '',
    statusCode: 200,
    responseBody: '{}',
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [showSlashInfoModal, setShowSlashInfoModal] = useState(false);

  const handleJsonKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;

      // Get the current line
      const beforeCursor = value.substring(0, start);
      const currentLineStart = beforeCursor.lastIndexOf('\n') + 1;
      const currentLine = beforeCursor.substring(currentLineStart);

      // Calculate indent
      const indent = currentLine.match(/^\s*/)?.[0] || '';
      const lastChar = beforeCursor.trim().slice(-1);

      // Add extra indent after opening braces
      const extraIndent = (lastChar === '{' || lastChar === '[') ? '  ' : '';

      // Insert newline with indent
      const newText = value.substring(0, start) + '\n' + indent + extraIndent + value.substring(end);

      textarea.value = newText;
      textarea.selectionStart = textarea.selectionEnd = start + 1 + indent.length + extraIndent.length;

      // Trigger onChange
      const event = new Event('input', { bubbles: true });
      textarea.dispatchEvent(event);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;

      // Insert 2 spaces
      const newText = value.substring(0, start) + '  ' + value.substring(end);
      textarea.value = newText;
      textarea.selectionStart = textarea.selectionEnd = start + 2;

      // Trigger onChange
      const event = new Event('input', { bubbles: true });
      textarea.dispatchEvent(event);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.endpointPath) {
      alert('이름과 엔드포인트는 필수입니다.');
      return;
    }

    if (!formData.endpointPath.startsWith('/')) {
      alert('엔드포인트는 /로 시작해야 합니다.');
      return;
    }

    try {
      JSON.parse(formData.responseBody || '{}');
    } catch {
      alert('응답 본문은 유효한 JSON이어야 합니다.');
      return;
    }

    try {
      setSubmitting(true);
      await createMockApi(serverId, formData);
      alert('Mock API가 생성되었습니다.');
      onSuccess();
    } catch (error) {
      console.error('Failed to create mock API:', error);
      alert('Mock API 생성에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Mock API 생성</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">이름 *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              placeholder="사용자 정보 조회"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                HTTP 메서드 *
              </label>
              <select
                value={formData.httpMethod}
                onChange={(e) =>
                  setFormData({ ...formData, httpMethod: e.target.value as HttpMethod })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                상태 코드 *
              </label>
              <input
                type="number"
                value={formData.statusCode}
                onChange={(e) =>
                  setFormData({ ...formData, statusCode: parseInt(e.target.value) })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                min={100}
                max={599}
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              엔드포인트 *
              <button
                type="button"
                onClick={() => setShowSlashInfoModal(true)}
                className="text-blue-600 hover:text-blue-800"
                title="슬래시 사용 팁"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </label>
            <input
              type="text"
              value={formData.endpointPath}
              onChange={(e) => setFormData({ ...formData, endpointPath: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 font-mono text-sm"
              placeholder="/api/users/:id"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              전체 경로: /mock/{projectId}/[서버 slug]
              {formData.endpointPath}
            </p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              응답 본문 (JSON)
            </label>
            <textarea
              value={formData.responseBody}
              onChange={(e) => setFormData({ ...formData, responseBody: e.target.value })}
              onKeyDown={handleJsonKeyDown}
              rows={10}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 font-mono text-sm"
              placeholder='{"message": "success"}'
            />
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-5 h-5 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-900">
              활성화
            </label>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-all disabled:bg-gray-400"
            >
              {submitting ? '생성 중...' : '생성'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
            >
              취소
            </button>
          </div>
        </form>

        {showSlashInfoModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowSlashInfoModal(false)}>
            <div className="bg-white rounded-xl p-6 max-w-md" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-bold mb-4">엔드포인트 슬래시 사용 팁</h3>
              <div className="space-y-3 text-sm text-gray-700">
                <p>• <strong>시작 슬래시</strong>: 항상 <code className="bg-gray-100 px-1 rounded">/</code>로 시작하세요</p>
                <p>• <strong>마지막 슬래시</strong>: 포함 여부를 선택할 수 있지만, 프로젝트 전체에서 일관되게 사용하세요</p>
                <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-3">
                  <p className="font-semibold mb-2">예시:</p>
                  <p className="font-mono text-xs mb-1">✅ /product/</p>
                  <p className="font-mono text-xs mb-1">✅ /product</p>
                  <p className="font-mono text-xs mb-1">❌ product (시작 슬래시 없음)</p>
                </div>
                <p className="text-xs text-gray-500 mt-3">💡 마지막 슬래시를 포함하면 모든 API 요청에도 슬래시를 포함해야 합니다</p>
              </div>
              <button
                onClick={() => setShowSlashInfoModal(false)}
                className="mt-4 w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
              >
                닫기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Mock API 수정 모달
function EditMockApiModal({
  mockApi,
  onClose,
  onSuccess,
}: {
  mockApi: MockApi;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState<MockApiUpdateRequest>({
    name: mockApi.name,
    httpMethod: mockApi.httpMethod,
    endpointPath: mockApi.endpointPath,
    statusCode: mockApi.statusCode,
    responseBody: mockApi.responseBody || '{}',
  });
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string>('');
  const [showSlashInfoModal, setShowSlashInfoModal] = useState(false);

  const handleJsonKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;

      // Get the current line
      const beforeCursor = value.substring(0, start);
      const currentLineStart = beforeCursor.lastIndexOf('\n') + 1;
      const currentLine = beforeCursor.substring(currentLineStart);

      // Calculate indent
      const indent = currentLine.match(/^\s*/)?.[0] || '';
      const lastChar = beforeCursor.trim().slice(-1);

      // Add extra indent after opening braces
      const extraIndent = (lastChar === '{' || lastChar === '[') ? '  ' : '';

      // Insert newline with indent
      const newText = value.substring(0, start) + '\n' + indent + extraIndent + value.substring(end);

      textarea.value = newText;
      textarea.selectionStart = textarea.selectionEnd = start + 1 + indent.length + extraIndent.length;

      // Trigger onChange
      const event = new Event('input', { bubbles: true });
      textarea.dispatchEvent(event);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;

      // Insert 2 spaces
      const newText = value.substring(0, start) + '  ' + value.substring(end);
      textarea.value = newText;
      textarea.selectionStart = textarea.selectionEnd = start + 2;

      // Trigger onChange
      const event = new Event('input', { bubbles: true });
      textarea.dispatchEvent(event);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    // Endpoint path validation
    if (formData.endpointPath && !formData.endpointPath.startsWith('/')) {
      setValidationError('엔드포인트 경로는 "/"로 시작해야 합니다.');
      return;
    }

    // JSON validation
    try {
      JSON.parse(formData.responseBody || '{}');
    } catch {
      setValidationError('응답 본문은 유효한 JSON이어야 합니다.');
      return;
    }

    try {
      setSubmitting(true);
      await updateMockApi(mockApi.id, formData);
      alert('Mock API가 수정되었습니다.');
      onSuccess();
    } catch (error) {
      console.error('Failed to update mock API:', error);
      alert('Mock API 수정에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Mock API 수정</h2>
        {validationError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800 font-medium">{validationError}</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">이름 *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                HTTP 메서드 *
              </label>
              <select
                value={formData.httpMethod}
                onChange={(e) =>
                  setFormData({ ...formData, httpMethod: e.target.value as HttpMethod })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                required
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">상태 코드 *</label>
            <input
              type="number"
              value={formData.statusCode}
              onChange={(e) =>
                setFormData({ ...formData, statusCode: parseInt(e.target.value) })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              min={100}
              max={599}
              required
            />
          </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              엔드포인트 *
              <button
                type="button"
                onClick={() => setShowSlashInfoModal(true)}
                className="text-blue-600 hover:text-blue-800"
                title="슬래시 사용 팁"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </label>
            <input
              type="text"
              value={formData.endpointPath}
              onChange={(e) => setFormData({ ...formData, endpointPath: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 font-mono text-sm"
              placeholder="/api/users/:id"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              엔드포인트 경로는 "/"로 시작해야 합니다.
            </p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              응답 본문 (JSON)
            </label>
            <textarea
              value={formData.responseBody}
              onChange={(e) => setFormData({ ...formData, responseBody: e.target.value })}
              onKeyDown={handleJsonKeyDown}
              rows={10}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 font-mono text-sm"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-all disabled:bg-gray-400"
            >
              {submitting ? '수정 중...' : '수정'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
            >
              취소
            </button>
          </div>
        </form>

        {showSlashInfoModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowSlashInfoModal(false)}>
            <div className="bg-white rounded-xl p-6 max-w-md" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-bold mb-4">엔드포인트 슬래시 사용 팁</h3>
              <div className="space-y-3 text-sm text-gray-700">
                <p>• <strong>시작 슬래시</strong>: 항상 <code className="bg-gray-100 px-1 rounded">/</code>로 시작하세요</p>
                <p>• <strong>마지막 슬래시</strong>: 포함 여부를 선택할 수 있지만, 프로젝트 전체에서 일관되게 사용하세요</p>
                <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-3">
                  <p className="font-semibold mb-2">예시:</p>
                  <p className="font-mono text-xs mb-1">✅ /product/</p>
                  <p className="font-mono text-xs mb-1">✅ /product</p>
                  <p className="font-mono text-xs mb-1">❌ product (시작 슬래시 없음)</p>
                </div>
                <p className="text-xs text-gray-500 mt-3">💡 마지막 슬래시를 포함하면 모든 API 요청에도 슬래시를 포함해야 합니다</p>
              </div>
              <button
                onClick={() => setShowSlashInfoModal(false)}
                className="mt-4 w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
              >
                닫기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Mock API 상세 모달
function MockApiDetailModal({
  mockApi,
  projectId,
  onClose,
  onEdit,
}: {
  mockApi: MockApi;
  projectId: number;
  onClose: () => void;
  onEdit: () => void;
}) {
  const formatJson = (jsonString: string | null) => {
    if (!jsonString) return '{}';
    try {
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return jsonString;
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Mock API 상세</h2>

        <div className="space-y-6">
          {/* 기본 정보 */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">이름</label>
              <p className="text-gray-900 font-medium">{mockApi.name}</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">상태</label>
              <span
                className={`inline-block px-3 py-1 rounded text-sm font-semibold ${
                  mockApi.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {mockApi.isActive ? '활성' : '비활성'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">HTTP 메서드</label>
              <span
                className={`inline-block px-3 py-1 rounded text-sm font-semibold ${
                  mockApi.httpMethod === 'GET'
                    ? 'bg-blue-100 text-blue-800'
                    : mockApi.httpMethod === 'POST'
                    ? 'bg-green-100 text-green-800'
                    : mockApi.httpMethod === 'PUT'
                    ? 'bg-yellow-100 text-yellow-800'
                    : mockApi.httpMethod === 'DELETE'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {mockApi.httpMethod}
              </span>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">상태 코드</label>
              <p className="text-gray-900 font-medium">{mockApi.statusCode}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">엔드포인트 경로</label>
            <p className="text-gray-900 font-mono text-sm bg-gray-50 px-4 py-3 rounded-lg border border-gray-200">
              {mockApi.endpointPath}
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">전체 엔드포인트</label>
            <p className="text-gray-900 font-mono text-sm bg-gray-50 px-4 py-3 rounded-lg border border-gray-200">
              {mockApi.fullEndpoint}
            </p>
          </div>

          {/* 실제 호출 URL */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-blue-900 mb-2">실제 호출 URL</p>
            <div className="bg-white rounded p-3 font-mono text-sm break-all border border-blue-300">
              {mockApi.httpMethod} https://api.mockops.cloud/mock/{projectId}/도메인명{mockApi.endpointPath}
            </div>
            <p className="text-xs text-blue-700 mt-2">이 URL로 실제 API 요청을 보내시면 됩니다</p>
          </div>

          {/* 응답 본문 (JSON 포맷팅) */}
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">응답 본문</label>
            <pre className="bg-gray-900 text-green-400 px-4 py-3 rounded-lg overflow-x-auto text-sm font-mono border border-gray-700">
              {formatJson(mockApi.responseBody)}
            </pre>
          </div>

          {/* 타임스탬프 */}
          <div className="grid grid-cols-2 gap-6 text-sm">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">생성일</label>
              <p className="text-gray-900">{new Date(mockApi.createdAt).toLocaleString('ko-KR')}</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">수정일</label>
              <p className="text-gray-900">{new Date(mockApi.updatedAt).toLocaleString('ko-KR')}</p>
            </div>
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={onEdit}
            className="flex-1 px-6 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-all"
          >
            수정
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

// OpenAPI 파일 업로드 모달
function OpenApiUploadModal({
  serverId,
  onClose,
  onSuccess,
  onJobCreated,
}: {
  serverId: number;
  onClose: () => void;
  onSuccess: () => void;
  onJobCreated: (jobId: string) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert('파일을 선택해주세요.');
      return;
    }

    try {
      // 1. 진행 중인 job이 있는지 먼저 확인
      const activeJob = await getActiveJobForServer(serverId);
      if (activeJob) {
        alert('이미 OpenAPI 파일 업로드를 통한 Mock 생성이 진행 중입니다. 완료 후 다시 시도해주세요.');
        return;
      }

      // 2. 파일 업로드
      setUploading(true);
      const uploadedJob = await uploadOpenApiFile(serverId, file);

      // 3. 업로드 성공 - 모달 즉시 닫기 및 백그라운드 폴링 시작
      onJobCreated(uploadedJob.jobId.toString());
    } catch (error: any) {
      console.error('Failed to upload file:', error);
      alert(error.response?.data?.error?.message || '파일 업로드에 실패했습니다.');
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 max-w-2xl w-full mx-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">OpenAPI 파일 업로드</h2>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              OpenAPI 파일 선택
            </label>
            <input
              type="file"
              accept=".json,.yaml,.yml"
              onChange={handleFileChange}
              disabled={uploading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            <p className="mt-2 text-sm text-gray-600">
              지원 형식: JSON, YAML (.json, .yaml, .yml)
            </p>
            <p className="mt-2 text-sm text-blue-600">
              파일 업로드 후 백그라운드에서 처리되며, 완료 시 알림으로 결과를 확인할 수 있습니다.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="flex-1 px-6 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {uploading ? '업로드 중...' : '업로드'}
            </button>
            <button
              onClick={onClose}
              disabled={uploading}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              취소
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 헬스 체크 탭
function HealthCheckTab({ serverId }: { serverId: number }) {
  const [logs, setLogs] = useState<HealthCheckFailureLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState<number | undefined>(undefined);
  const [hasNext, setHasNext] = useState(false);
  const [selectedLog, setSelectedLog] = useState<HealthCheckFailureLog | null>(null);

  useEffect(() => {
    loadLogs();
  }, [serverId]);

  const loadLogs = async (cursorId?: number) => {
    try {
      setLoading(true);
      const response = await getHealthCheckFailureLogs(serverId, cursorId);
      if (cursorId) {
        setLogs((prev) => [...prev, ...response.failures]);
      } else {
        setLogs(response.failures);
      }
      setCursor(response.nextCursorId || undefined);
      setHasNext(response.hasNext);
    } catch (error) {
      console.error('Failed to load health check logs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && logs.length === 0) {
    return <div className="text-gray-600">헬스 체크 로그 로딩 중...</div>;
  }

  return (
    <div>
      {logs.length === 0 ? (
        <div className="text-center py-12 text-gray-600">
          헬스 체크 실패 로그가 없습니다.
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    메시지
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    실패 횟수
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    헬스 체크 URL
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    발생 시간
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr
                    key={log.notificationId}
                    onClick={() => setSelectedLog(log)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-gray-900">{log.failureReason}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-semibold">
                        {log.metadata?.failureCount || 0}회
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-600">
                      {log.metadata?.healthCheckUrl || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDateTimeKST(log.failedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {hasNext && (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => loadLogs(cursor)}
                disabled={loading}
                className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all disabled:bg-gray-300"
              >
                {loading ? '로딩 중...' : '더 보기'}
              </button>
            </div>
          )}
        </>
      )}

      {/* 헬스 체크 실패 로그 상세 모달 */}
      {selectedLog && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">헬스 체크 실패 상세</h2>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* 실패 이유 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">실패 이유</label>
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-gray-900">{selectedLog.failureReason}</p>
                </div>
              </div>

              {/* 발생 시간 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">발생 시간</label>
                <p className="text-sm text-gray-900">{formatDateTimeKST(selectedLog.failedAt)}</p>
              </div>

              {/* Metadata - JSON 포맷팅 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">상세 정보 (Metadata)</label>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg max-h-[300px] overflow-y-auto">
                  {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 ? (
                    <pre className="text-xs text-gray-900 font-mono whitespace-pre-wrap break-words">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  ) : (
                    <p className="text-gray-500 text-sm">메타데이터가 없습니다.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-6 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
