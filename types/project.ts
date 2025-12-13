// 프로젝트 관련 타입

export interface Project {
  id: number;
  name: string;
  description: string;
  ownerNickname: string;
  unreadNotificationCount: number;
  updatedAt: string;
}

export interface ProjectDetail {
  id: number;
  name: string;
  description: string;
  ownerId: number;
  ownerNickname: string;
  slackWebhookUrl: string | null;
  createdAt: string;
  updatedAt: string;
  currentUserMemberRole: MemberRole;
}

export interface ProjectCreateRequest {
  name: string;
  description?: string;
  slackWebhookUrl?: string;
}

export interface ProjectUpdateRequest {
  description?: string;
  slackWebhookUrl?: string;
}

export interface ProjectResponse extends Project {}

export interface ProjectDetailResponse extends ProjectDetail {}

export interface ProjectCreateResponse extends ProjectDetail {
  webhookSecret: string;
}

export interface ProjectListResponse {
  data: Project[];
  totalPages: number;
  totalElements: number;
  currentPage: number;
}

// 프로젝트 멤버 관련 타입
export type MemberRole = 'OWNER' | 'MANAGER' | 'DEVELOPER' | 'VIEWER';

export interface ProjectMember {
  id: number;
  userId: number;
  nickname: string;
  memberRole: MemberRole;
}

export interface ProjectMemberAddRequest {
  email: string;
}

export interface ProjectMemberUpdateRoleRequest {
  role: MemberRole;
}

export interface ProjectMemberListResponse {
  members: ProjectMember[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  hasNext: boolean;
}

// 프로젝트 초대 관련 타입
export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

export interface Invitation {
  invitationId: number;
  invitedEmail: string;
  expiresAt: string;
  memberRole: MemberRole;
}

export interface InvitationCreateRequest {
  email: string;
  memberRole: MemberRole;
}

export interface InvitationListResponse {
  invitations: Invitation[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
}