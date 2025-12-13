import api from '@/lib/api-client';
import type {
  DomainServer, DomainServerSimple,
  DomainServerCreateRequest,
  DomainServerUpdateRequest,
} from '@/types/server';

interface ServerListResponse {
  content: Array<
    DomainServerSimple
  >;
  totalPages: number;
  totalElements: number;
}

/**
 * 서버 목록 조회
 */
export const getServers = async (
  projectId: number,
  page: number = 0,
  size: number = 20
): Promise<ServerListResponse> => {
  const response = await api.get<{ result: ServerListResponse }>(
    `/api/v1/projects/${projectId}/servers`,
    {
      params: { page, size },
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
