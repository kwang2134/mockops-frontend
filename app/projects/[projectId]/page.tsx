'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import { getProject, updateProject, deleteProject } from '@/lib/api/projects';
import { getServers, createServer } from '@/lib/api/servers';
import { getMembers, updateMemberRole, removeMember } from '@/lib/api/members';
import { getInvitations, createInvitation, cancelInvitation } from '@/lib/api/invitations';
import { getCorsOrigins, addCorsOrigin, deleteCorsOrigin } from '@/lib/api/cors';
import { getWebhookSecret, reissueWebhookSecret, deactivateWebhookSecret, generateWebhookToken } from '@/lib/api/webhooks';
import type { ProjectDetailResponse, ProjectMember, Invitation, MemberRole } from '@/types/project';
import type { CorsConfig } from '@/types/config';
import { formatDateKST } from '@/lib/utils/date';

type Tab = 'servers' | 'members' | 'invitations' | 'cors' | 'webhook';

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = parseInt(params.projectId as string);
  const { user, loading: authLoading, isLoggedIn } = useAuth();

  const [project, setProject] = useState<ProjectDetailResponse | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('servers');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push('/login');
    }
  }, [authLoading, isLoggedIn, router]);

  useEffect(() => {
    if (isLoggedIn && projectId) {
      loadProject();
    }
  }, [isLoggedIn, projectId]);

  const loadProject = async () => {
    try {
      setLoading(true);
      const data = await getProject(projectId);
      setProject(data);
    } catch (error: any) {
      console.error('Failed to load project:', error);
      if (error.response?.status === 403 || error.response?.status === 404) {
        alert('프로젝트를 찾을 수 없거나 권한이 없습니다.');
        router.push('/projects');
      }
    } finally {
      setLoading(false);
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

  if (!project) {
    return null;
  }

  const userRole = project.currentUserMemberRole;

  // 권한에 따라 탭 필터링
  const allTabs: Array<{ id: Tab; label: string }> = [
    { id: 'servers', label: '서버' },
    { id: 'members', label: '팀원' },
    { id: 'invitations', label: '초대' },
    { id: 'cors', label: 'CORS' },
    { id: 'webhook', label: 'Webhook' },
  ];

  const tabs = allTabs.filter((tab) => {
    // 초대 탭: MANAGER 이상만 표시
    if (tab.id === 'invitations') {
      return userRole === 'MANAGER' || userRole === 'OWNER';
    }
    // Webhook 탭: DEVELOPER 이상 표시
    if (tab.id === 'webhook') {
      return userRole === 'DEVELOPER' || userRole === 'MANAGER' || userRole === 'OWNER';
    }
    // 나머지 탭은 모든 권한에서 표시
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-6">
          {/* 프로젝트 헤더 */}
          <div className="mb-8">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <button onClick={() => router.push('/projects')} className="hover:text-gray-900">
                프로젝트
              </button>
              <span>/</span>
              <span className="text-gray-900">{project.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-black tracking-tight text-gray-900 mb-2">
                  {project.name}
                </h1>
                {project.description && (
                  <p className="text-gray-600 text-lg">{project.description}</p>
                )}
              </div>
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
            {activeTab === 'servers' && <ServersTab projectId={projectId} userRole={project.currentUserMemberRole} />}
            {activeTab === 'members' && <MembersTab projectId={projectId} userRole={project.currentUserMemberRole} />}
            {activeTab === 'invitations' && <InvitationsTab projectId={projectId} userRole={project.currentUserMemberRole} />}
            {activeTab === 'cors' && <CorsTab projectId={projectId} userRole={project.currentUserMemberRole} />}
            {activeTab === 'webhook' && <WebhookTab projectId={projectId} userRole={project.currentUserMemberRole} />}
          </div>
        </div>
      </main>
    </div>
  );
}

// 서버 탭
function ServersTab({ projectId, userRole }: { projectId: number; userRole: MemberRole }) {
  const router = useRouter();
  const [servers, setServers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    slug: '',
    healthCheckUrl: '',
    healthCheckInterval: '10m',
  });
  const [protocol, setProtocol] = useState('https://');
  const [urlPath, setUrlPath] = useState('');
  const [creating, setCreating] = useState(false);

  // DEVELOPER 이상 권한 체크
  const canManageServers = userRole === 'DEVELOPER' || userRole === 'MANAGER' || userRole === 'OWNER';

  useEffect(() => {
    loadServers();
  }, [projectId]);

  const loadServers = async () => {
    try {
      setLoading(true);
      const response = await getServers(projectId);
      setServers(response.content);
    } catch (error) {
      console.error('Failed to load servers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateServer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim() || !createForm.slug.trim()) return;

    // protocol과 urlPath를 합쳐서 최종 URL 생성
    const fullUrl = urlPath.trim() ? `${protocol}${urlPath.trim()}` : '';

    try {
      setCreating(true);
      await createServer(projectId, {
        name: createForm.name.trim(),
        slug: createForm.slug.trim(),
        healthCheckUrl: fullUrl || undefined,
        healthCheckInterval: createForm.healthCheckInterval || undefined,
      });
      await loadServers();
      setShowCreateModal(false);
      setCreateForm({ name: '', slug: '', healthCheckUrl: '', healthCheckInterval: '10m' });
      setProtocol('https://');
      setUrlPath('');
    } catch (error: any) {
      alert(error.response?.data?.error?.message || '서버 생성에 실패했습니다.');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <div className="text-gray-600">서버 목록 로딩 중...</div>;
  }

  return (
    <div>
      {canManageServers && (
        <div className="mb-6">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-all"
          >
            + 서버 추가
          </button>
        </div>
      )}

      {servers.length === 0 ? (
        <div className="text-center py-12 text-gray-600">
          아직 서버가 없습니다. 서버를 추가해주세요.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {servers.map((server) => (
            <div
              key={server.id}
              onClick={() => router.push(`/projects/${projectId}/servers/${server.id}`)}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-gray-300 transition-all cursor-pointer group relative"
            >
              {/* 안 읽은 알림 배지 */}
              {server.unreadNotificationCount > 0 && (
                <div className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full w-7 h-7 flex items-center justify-center shadow-lg z-10">
                  {server.unreadNotificationCount > 99 ? '99+' : server.unreadNotificationCount}
                </div>
              )}

              <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-gray-700">
                {server.name}
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                  server.status === 'DEPLOYED'
                    ? 'bg-green-100 text-green-800'
                    : server.status === 'MOCKING'
                    ? 'bg-blue-100 text-blue-800'
                    : server.status === 'PENDING'
                    ? 'bg-yellow-100 text-yellow-800'
                    : server.status === 'ERROR'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {server.status}
                </span>
                <span className="text-xs font-mono">{server.slug}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 서버 생성 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">새 서버 추가</h2>
            <form onSubmit={handleCreateServer} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  서버 이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Slug <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={createForm.slug}
                  onChange={(e) => setCreateForm({ ...createForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                  placeholder="prod-server"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 font-mono"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">영문 소문자, 숫자, 하이픈만 사용</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">헬스 체크 URL</label>
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
                    placeholder="api.example.com/health"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">프로토콜을 선택하고 나머지 URL을 입력하세요</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">헬스 체크 간격</label>
                <select
                  value={createForm.healthCheckInterval}
                  onChange={(e) => setCreateForm({ ...createForm, healthCheckInterval: e.target.value as any })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                >
                  <option value="5m">5분</option>
                  <option value="10m">10분</option>
                  <option value="30m">30분</option>
                  <option value="1h">1시간</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50"
                  disabled={creating}
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 disabled:opacity-50"
                  disabled={creating || !createForm.name.trim() || !createForm.slug.trim()}
                >
                  {creating ? '생성 중...' : '생성하기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// 팀원 탭
function MembersTab({ projectId, userRole }: { projectId: number; userRole: MemberRole }) {
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<number | null>(null);
  const [editingRole, setEditingRole] = useState<MemberRole>('VIEWER');

  // MANAGER 이상 권한 체크
  const canManageMembers = userRole === 'MANAGER' || userRole === 'OWNER';

  useEffect(() => {
    loadMembers(0);
  }, [projectId]);

  const loadMembers = async (currentOffset: number = 0) => {
    try {
      setLoading(true);
      const response = await getMembers(projectId, 20, currentOffset);

      if (currentOffset > 0) {
        // 더 보기: 기존 데이터에 추가
        setMembers((prev) => [...prev, ...response.members]);
      } else {
        // 초기 로드: 새로 설정
        setMembers(response.members);
      }

      setOffset(currentOffset + response.members.length);
      setHasNext(response.hasNext);
    } catch (error) {
      console.error('Failed to load members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (member: ProjectMember) => {
    setEditingMemberId(member.id);
    setEditingRole(member.memberRole);
  };

  const handleCancelEdit = () => {
    setEditingMemberId(null);
    setEditingRole('VIEWER');
  };

  const handleSaveRole = async (memberId: number) => {
    try {
      await updateMemberRole(projectId, memberId, editingRole);
      await loadMembers(0); // 처음부터 다시 로드
      setEditingMemberId(null);
    } catch (error: any) {
      alert(error.response?.data?.error?.message || '역할 변경에 실패했습니다.');
    }
  };

  const handleRemove = async (memberId: number) => {
    if (!confirm('정말로 이 멤버를 제외하시겠습니까?')) return;
    try {
      await removeMember(projectId, memberId);
      await loadMembers(0); // 처음부터 다시 로드
    } catch (error: any) {
      alert(error.response?.data?.error?.message || '멤버 제외에 실패했습니다.');
    }
  };

  if (loading && members.length === 0) {
    return <div className="text-gray-600">팀원 목록 로딩 중...</div>;
  }

  return (
    <div>
      {members.length === 0 ? (
        <div className="text-center py-12 text-gray-600">
          팀원이 없습니다.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">닉네임</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">역할</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{member.nickname}</td>
                  <td className="px-6 py-4">
                    {editingMemberId === member.id ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={editingRole}
                          onChange={(e) => setEditingRole(e.target.value as MemberRole)}
                          className="px-3 py-1 border border-gray-300 rounded text-sm"
                        >
                          <option value="VIEWER">VIEWER</option>
                          <option value="DEVELOPER">DEVELOPER</option>
                          <option value="MANAGER">MANAGER</option>
                        </select>
                        <button
                          onClick={() => handleSaveRole(member.id)}
                          className="px-3 py-1 bg-gray-900 text-white text-xs font-semibold rounded hover:bg-gray-800"
                        >
                          저장
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-3 py-1 border border-gray-300 text-gray-700 text-xs font-semibold rounded hover:bg-gray-50"
                        >
                          취소
                        </button>
                      </div>
                    ) : (
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        member.memberRole === 'OWNER' ? 'bg-purple-100 text-purple-800' :
                        member.memberRole === 'MANAGER' ? 'bg-blue-100 text-blue-800' :
                        member.memberRole === 'DEVELOPER' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {member.memberRole}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      {canManageMembers && member.memberRole !== 'OWNER' && editingMemberId !== member.id && (
                        <>
                          <button
                            onClick={() => handleEditClick(member)}
                            className="text-gray-600 hover:text-gray-900 text-sm font-medium"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => handleRemove(member.id)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            제외
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 더 보기 버튼 */}
      {hasNext && (
        <div className="mt-6 text-center">
          <button
            onClick={() => loadMembers(offset)}
            disabled={loading}
            className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all disabled:bg-gray-300"
          >
            {loading ? '로딩 중...' : '더 보기'}
          </button>
        </div>
      )}
    </div>
  );
}

// 초대 탭
function InvitationsTab({ projectId, userRole }: { projectId: number; userRole: MemberRole }) {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    email: '',
    memberRole: 'DEVELOPER' as MemberRole,
  });
  const [creating, setCreating] = useState(false);

  // MANAGER 이상 권한 체크
  const canManageInvitations = userRole === 'MANAGER' || userRole === 'OWNER';

  useEffect(() => {
    loadInvitations();
  }, [projectId]);

  const loadInvitations = async () => {
    try {
      setLoading(true);
      const response = await getInvitations(projectId, 'PENDING');
      setInvitations(response.invitations);
    } catch (error) {
      console.error('Failed to load invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      await createInvitation(projectId, createForm);
      await loadInvitations();
      setShowCreateModal(false);
      setCreateForm({ email: '', memberRole: 'DEVELOPER' });
    } catch (error: any) {
      // 백엔드 에러 메시지 추출 (여러 가능한 경로 시도)
      const errorMessage =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        error.message ||
        '초대 발송에 실패했습니다.';
      alert(errorMessage);
      console.error('Invitation creation error:', error.response?.data || error);
    } finally {
      setCreating(false);
    }
  };

  const handleCancel = async (invitationId: number) => {
    if (!confirm('정말로 이 초대를 취소하시겠습니까?')) return;
    try {
      await cancelInvitation(projectId, invitationId);
      await loadInvitations();
    } catch (error: any) {
      alert(error.response?.data?.error?.message || '초대 취소에 실패했습니다.');
    }
  };

  if (loading) {
    return <div className="text-gray-600">초대 목록 로딩 중...</div>;
  }

  return (
    <div>
      {canManageInvitations && (
        <div className="mb-6">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-all"
          >
            + 팀원 초대
          </button>
        </div>
      )}

      {invitations.length === 0 ? (
        <div className="text-center py-12 text-gray-600">
          보낸 초대가 없습니다.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">이메일</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">역할</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">상태</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">만료일</th>
                {canManageInvitations && (
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">작업</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {invitations.map((invitation) => (
                <tr key={invitation.invitationId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{invitation.invitedEmail}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">
                      {invitation.memberRole}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-semibold">
                      PENDING
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {formatDateKST(invitation.expiresAt)}
                  </td>
                  {canManageInvitations && (
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleCancel(invitation.invitationId)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        취소
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 초대 생성 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">팀원 초대</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  이메일 <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">역할</label>
                <select
                  value={createForm.memberRole}
                  onChange={(e) => setCreateForm({ ...createForm, memberRole: e.target.value as MemberRole })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                >
                  <option value="VIEWER">VIEWER</option>
                  <option value="DEVELOPER">DEVELOPER</option>
                  <option value="MANAGER">MANAGER</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50"
                  disabled={creating}
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 disabled:opacity-50"
                  disabled={creating}
                >
                  {creating ? '발송 중...' : '초대 발송'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// CORS 탭
function CorsTab({ projectId, userRole }: { projectId: number; userRole: MemberRole }) {
  const [corsOrigins, setCorsOrigins] = useState<CorsConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [newOrigin, setNewOrigin] = useState('');
  const [adding, setAdding] = useState(false);

  // DEVELOPER 이상 권한 체크
  const canManageCors = userRole === 'DEVELOPER' || userRole === 'MANAGER' || userRole === 'OWNER';

  useEffect(() => {
    loadCorsOrigins();
  }, [projectId]);

  const loadCorsOrigins = async () => {
    try {
      setLoading(true);
      const data = await getCorsOrigins(projectId);
      setCorsOrigins(data);
    } catch (error) {
      console.error('Failed to load CORS origins:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrigin.trim()) return;
    try {
      setAdding(true);
      await addCorsOrigin(projectId, newOrigin.trim());
      await loadCorsOrigins();
      setNewOrigin('');
    } catch (error: any) {
      alert(error.response?.data?.error?.message || 'Origin 추가에 실패했습니다.');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (corsId: number) => {
    if (!confirm('정말로 이 Origin을 삭제하시겠습니까?')) return;
    try {
      await deleteCorsOrigin(projectId, corsId);
      await loadCorsOrigins();
    } catch (error: any) {
      alert(error.response?.data?.error?.message || 'Origin 삭제에 실패했습니다.');
    }
  };

  if (loading) {
    return <div className="text-gray-600">CORS 설정 로딩 중...</div>;
  }

  return (
    <div>
      {canManageCors && (
        <div className="mb-6">
          <form onSubmit={handleAdd} className="flex gap-3">
            <input
              type="url"
              value={newOrigin}
              onChange={(e) => setNewOrigin(e.target.value)}
              placeholder="https://example.com"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            <button
              type="submit"
              disabled={adding || !newOrigin.trim()}
              className="px-6 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 disabled:opacity-50"
            >
              + Origin 추가
            </button>
          </form>
        </div>
      )}

      {corsOrigins.length === 0 ? (
        <div className="text-center py-12 text-gray-600">
          등록된 Origin이 없습니다.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Origin URL</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">등록일</th>
                {canManageCors && (
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">작업</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {corsOrigins.map((cors) => (
                <tr key={cors.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-mono text-gray-900">{cors.originUrl}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{formatDateKST(cors.createdAt)}</td>
                  {canManageCors && (
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(cors.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        삭제
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Webhook 탭
function WebhookTab({ projectId, userRole }: { projectId: number; userRole: MemberRole }) {
  const [secret, setSecret] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showSecret, setShowSecret] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [secretInput, setSecretInput] = useState('');
  const [showUsageGuide, setShowUsageGuide] = useState(false);

  // OWNER만 Secret 관리 가능, DEVELOPER 이상 JWT 토큰 생성 가능
  const canManageSecret = userRole === 'OWNER';
  const canGenerateToken = userRole === 'DEVELOPER' || userRole === 'MANAGER' || userRole === 'OWNER';

  useEffect(() => {
    // OWNER만 Secret 정보 조회
    if (canManageSecret) {
      loadSecret();
    } else {
      // DEVELOPER, MANAGER는 Secret 조회 불필요하므로 로딩 완료 처리
      setLoading(false);
    }
  }, [projectId, canManageSecret]);

  const loadSecret = async () => {
    try {
      setLoading(true);
      const data = await getWebhookSecret(projectId);
      setSecret(data);
    } catch (error) {
      console.error('Failed to load webhook secret:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReissue = async () => {
    if (!confirm('정말로 Secret을 재발급하시겠습니까? 기존 Secret은 즉시 폐기됩니다.')) return;
    try {
      const data = await reissueWebhookSecret(projectId);
      setSecret(data);
      setShowSecret(true);
      alert('Secret이 재발급되었습니다. 새로운 Secret을 안전한 곳에 보관하세요.');
    } catch (error: any) {
      alert(error.response?.data?.error?.message || 'Secret 재발급에 실패했습니다.');
    }
  };

  const handleDeactivate = async () => {
    if (!confirm('정말로 Webhook을 비활성화하시겠습니까?')) return;
    try {
      await deactivateWebhookSecret(projectId);
      await loadSecret();
    } catch (error: any) {
      alert(error.response?.data?.error?.message || 'Webhook 비활성화에 실패했습니다.');
    }
  };

  const handleGenerateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secretInput.trim()) return;
    try {
      const data = await generateWebhookToken(projectId, secretInput.trim());
      setGeneratedToken(data.jwtToken);
      setSecretInput('');
    } catch (error: any) {
      alert(error.response?.data?.error?.message || 'JWT 토큰 생성에 실패했습니다.');
    }
  };

  if (loading) {
    return <div className="text-gray-600">Webhook 설정 로딩 중...</div>;
  }

  return (
    <div className="space-y-6">
      {/* 웹훅 사용 가이드 버튼 */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-blue-900">Webhook 사용 방법이 궁금하신가요?</h3>
            <p className="text-xs text-blue-700 mt-1">배포 시 서버 상태를 자동으로 업데이트하는 방법을 확인하세요.</p>
          </div>
          <button
            onClick={() => setShowUsageGuide(true)}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-all"
          >
            사용 방법 보기
          </button>
        </div>
      </div>

      {/* Secret 정보 - OWNER만 표시 */}
      {canManageSecret && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Webhook Secret</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">상태:</span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${secret?.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {secret?.isActive ? '활성' : '비활성'}
              </span>
            </div>
            {secret?.secretKey && showSecret && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-2">Secret Key (안전한 곳에 보관하세요)</p>
                <p className="font-mono text-sm text-gray-900 break-all">{secret.secretKey}</p>
              </div>
            )}
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleReissue}
              className="px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800"
            >
              Secret 재발급
            </button>
            {secret?.isActive && (
              <button
                onClick={handleDeactivate}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50"
              >
                비활성화
              </button>
            )}
          </div>
        </div>
      )}

      {/* JWT 토큰 생성 - DEVELOPER 이상 표시 */}
      {canGenerateToken && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Webhook JWT 토큰 생성</h3>
          <p className="text-sm text-gray-600 mb-4">
            OWNER로부터 공유받은 Secret Key를 사용하여 JWT 토큰을 생성할 수 있습니다.
          </p>
          <form onSubmit={handleGenerateToken} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Secret Key</label>
              <input
                type="password"
                value={secretInput}
                onChange={(e) => setSecretInput(e.target.value)}
                placeholder="Secret Key를 입력하세요"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800"
            >
              JWT 토큰 생성
            </button>
          </form>
          {generatedToken && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg">
              <p className="text-xs text-green-600 mb-2">생성된 JWT 토큰 (30일 유효)</p>
              <p className="font-mono text-xs text-gray-900 break-all">{generatedToken}</p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generatedToken);
                  alert('토큰이 클립보드에 복사되었습니다.');
                }}
                className="mt-2 text-sm text-green-600 hover:text-green-800 font-medium"
              >
                복사
              </button>
            </div>
          )}
        </div>
      )}

      {/* 웹훅 사용 가이드 모달 */}
      {showUsageGuide && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowUsageGuide(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Webhook 사용 방법</h2>
              <button
                onClick={() => setShowUsageGuide(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* 프로젝트 ID */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">현재 프로젝트 ID</label>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <code className="text-sm font-mono text-gray-900">{projectId}</code>
                </div>
              </div>

              {/* 엔드포인트 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Webhook 엔드포인트</label>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <code className="text-sm font-mono text-gray-900">
                    POST https://api.mockops.cloud/api/webhook/deploy/{projectId}
                  </code>
                </div>
              </div>

              {/* 인증 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">인증 헤더</label>
                <p className="text-sm text-gray-600 mb-2">
                  생성한 JWT 토큰을 Authorization 헤더에 포함시켜야 합니다.
                </p>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <code className="text-sm font-mono text-gray-900">
                    Authorization: Bearer {'<JWT_TOKEN>'}
                  </code>
                </div>
              </div>

              {/* 요청 바디 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">요청 바디 (JSON)</label>
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-semibold text-red-600">필수 필드</span>: projectName, domainServerName, status<br/>
                  <span className="font-semibold text-blue-600">선택 필드</span>: healthCheckUrl, healthCheckInterval
                </p>
                <div className="p-4 bg-gray-900 rounded-lg overflow-x-auto">
                  <pre className="text-sm font-mono text-green-400">
{`{
  "projectName": "내 프로젝트 이름",
  "domainServerName": "서버 이름 (slug 아님!)",
  "status": "DEPLOYED",
  "healthCheckUrl": "https://api.example.com/health",
  "healthCheckInterval": "10m"
}`}
                  </pre>
                </div>
              </div>

              {/* 필드 설명 */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900">필드 설명</h3>
                <div className="space-y-2 text-sm">
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="font-semibold text-red-900 mb-1">projectName <span className="text-red-600">(필수)</span></p>
                    <p className="text-gray-700">웹훅을 보낼 프로젝트의 이름</p>
                  </div>
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="font-semibold text-red-900 mb-1">domainServerName <span className="text-red-600">(필수)</span></p>
                    <p className="text-gray-700">상태를 변경할 도메인 서버의 이름 (slug가 아닌 실제 이름)</p>
                  </div>
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="font-semibold text-red-900 mb-1">status <span className="text-red-600">(필수)</span></p>
                    <p className="text-gray-700 mb-2">변경할 서버 상태. 다음 중 하나를 선택:</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">DEPLOYED</span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">MOCKING</span>
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-semibold">PENDING</span>
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-semibold">ERROR</span>
                    </div>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="font-semibold text-blue-900 mb-1">healthCheckUrl <span className="text-blue-600">(선택)</span></p>
                    <p className="text-gray-700">헬스 체크를 수행할 URL (예: https://api.example.com/health)</p>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="font-semibold text-blue-900 mb-1">healthCheckInterval <span className="text-blue-600">(선택)</span></p>
                    <p className="text-gray-700">헬스 체크 간격 (예: 5m, 10m, 30m, 1h)</p>
                  </div>
                </div>
              </div>

              {/* 사용 예시 */}
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="text-sm font-semibold text-yellow-900 mb-2">💡 사용 예시</h4>
                <p className="text-sm text-gray-700">
                  배포 파이프라인(GitHub Actions, Jenkins 등)에서 배포 완료 후 이 Webhook을 호출하여
                  서버 상태를 자동으로 DEPLOYED로 변경할 수 있습니다.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowUsageGuide(false)}
                className="px-6 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
