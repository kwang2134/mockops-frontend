import api from '@/lib/api-client';
import type {
  DomainServer, DomainServerSimple,
  DomainServerCreateRequest,
  DomainServerUpdateRequest,
  ServerMembersResponse,
} from '@/types/server';

interface ServerListResponse {
  content: Array<
    DomainServerSimple
  >;
  totalPages: number;
  totalElements: number;
}

/**
 * 서버 목록 조회 (검색 API 사용)
 */
export const getServers = async (
  projectId: number,
  page: number = 0,
  size: number = 20,
  name?: string,
  status?: string
): Promise<ServerListResponse> => {
  // 빈 문자열을 undefined로 변환
  const searchName = name && name.trim() !== '' ? name.trim() : undefined;
  const searchStatus = status && status.trim() !== '' ? status.trim() : undefined;

  const response = await api.get<{ result: ServerListResponse }>(
    `/api/v1/projects/${projectId}/servers/search`,
    {
      params: {
        page,
        size,
        name: searchName,
        status: searchStatus,
      },
    }
  );
  return response.data.result;
};

/**
 * 서버 상세 조회
 */
export const getServer = async (serverId: number): Promise<DomainServer> => {
  const response = await api.get<{ result: DomainServer }>(`/api/v1/servers/${serverId}`);
  return response.data.result;
};

/**
 * 서버 생성
 */
export const createServer = async (
  projectId: number,
  data: DomainServerCreateRequest
): Promise<DomainServer> => {
  const response = await api.post<{ result: DomainServer }>(
    `/api/v1/projects/${projectId}/servers`,
    data
  );
  return response.data.result;
};

/**
 * 서버 수정
 */
export const updateServer = async (
  serverId: number,
  data: DomainServerUpdateRequest
): Promise<DomainServer> => {
  const response = await api.put<{ result: DomainServer }>(`/api/v1/servers/${serverId}`, data);
  return response.data.result;
};

/**
 * 서버 삭제
 */
export const deleteServer = async (serverId: number): Promise<void> => {
  await api.delete(`/api/v1/servers/${serverId}`);
};

/**
 * 서버 담당 멤버 목록 조회
 */
export const getServerMembers = async (
  serverId: number,
  size: number = 20,
  offset: number = 0
): Promise<ServerMembersResponse> => {
  const response = await api.get<{ result: ServerMembersResponse }>(
    `/api/v1/servers/${serverId}/members`,
    {
      params: { size, offset }
    }
  );
  return response.data.result;
};

/**
 * 서버 참여
 */
export const joinServer = async (serverId: number): Promise<void> => {
  await api.post(`/api/v1/servers/${serverId}/members/me`);
};

/**
 * 서버 나가기
 */
export const leaveServer = async (serverId: number): Promise<void> => {
  await api.delete(`/api/v1/servers/${serverId}/members/me`);
};
