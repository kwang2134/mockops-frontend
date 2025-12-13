import api from '@/lib/api-client';
import type {
  ProjectMember,
  ProjectMemberListResponse,
  MemberRole,
} from '@/types/project';

/**
 * 프로젝트 멤버 목록 조회 (offset 기반 페이징)
 */
export const getMembers = async (
  projectId: number,
  size: number = 20,
  offset: number = 0
): Promise<ProjectMemberListResponse> => {
  const response = await api.get<{ result: ProjectMemberListResponse }>(
    `/api/v1/projects/${projectId}/members`,
    {
      params: { size, offset },
    }
  );
  return response.data.result;
};

/**
 * 멤버 역할 변경
 */
export const updateMemberRole = async (
  projectId: number,
  memberId: number,
  memberRole: MemberRole
): Promise<ProjectMember> => {
  const response = await api.patch<{ result: ProjectMember }>(
    `/api/v1/projects/${projectId}/members/${memberId}/role`,
    { memberRole }
  );
  return response.data.result;
};

/**
 * 멤버 제외
 */
export const removeMember = async (projectId: number, memberId: number): Promise<void> => {
  await api.delete(`/api/v1/projects/${projectId}/members/${memberId}`);
};

/**
 * 초대 수락 (알림을 통한)
 */
export const acceptInvitation = async (projectId: number, userId: number): Promise<void> => {
  await api.post(`/api/v1/projects/${projectId}/members`, { userId });
};
