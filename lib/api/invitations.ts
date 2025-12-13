import api from '@/lib/api-client';
import type { Invitation, InvitationStatus, MemberRole } from '@/types/project';

interface InvitationListResponse {
  invitations: Invitation[];
  totalPages: number;
  totalElements: number;
  currentPage: number;
}

interface InvitationCreateRequest {
  email: string;
  memberRole: MemberRole;
}

interface InvitationAcceptResponse {
  projectId: number;
  projectName: string;
  memberRole: MemberRole;
}

/**
 * 초대 목록 조회
 */
export const getInvitations = async (
  projectId: number,
  status?: InvitationStatus,
  page: number = 0,
  size: number = 20
): Promise<InvitationListResponse> => {
  const response = await api.get<{ result: InvitationListResponse }>(
    `/api/v1/projects/${projectId}/invitations`,
    {
      params: { status, page, size },
    }
  );
  return response.data.result;
};

/**
 * 초대 생성 및 발송
 */
export const createInvitation = async (
  projectId: number,
  data: InvitationCreateRequest
): Promise<Invitation> => {
  const response = await api.post<{ result: Invitation }>(
    `/api/v1/projects/${projectId}/invitations`,
    data
  );
  return response.data.result;
};

/**
 * 초대 취소
 */
export const cancelInvitation = async (projectId: number, invitationId: number): Promise<void> => {
  await api.delete(`/api/v1/projects/${projectId}/invitations/${invitationId}`);
};

/**
 * 이메일 초대 수락
 */
export const acceptEmailInvitation = async (token: string): Promise<InvitationAcceptResponse> => {
  const response = await api.get<{ result: InvitationAcceptResponse }>(
    `/api/v1/invitations/accept`,
    {
      params: { token },
    }
  );
  return response.data.result;
};
