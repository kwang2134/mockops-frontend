import api from '@/lib/api-client';
import type {
  MockApi,
  MockApiCore,
  MockApiCreateRequest,
  MockApiUpdateRequest,
  MockApiListResponse,
  Job,
} from '@/types/server';

/**
 * Mock API 목록 조회 (복합 커서 페이징)
 */
export const getMockApis = async (
  serverId: number,
  size: number = 20,
  lastIdCursor?: number,
  lastNameCursor?: string
): Promise<MockApiListResponse> => {
  const params: any = { size };
  if (lastIdCursor !== undefined) params.lastIdCursor = lastIdCursor;
  if (lastNameCursor !== undefined) params.lastNameCursor = lastNameCursor;

  const response = await api.get<{ result: MockApiListResponse }>(
    `/api/v1/servers/${serverId}/mock-apis`,
    { params }
  );
  return response.data.result;
};

/**
 * Mock API 상세 조회
 */
export const getMockApi = async (mockApiId: number): Promise<MockApi> => {
  const response = await api.get<{ result: MockApi }>(`/api/v1/mock-apis/${mockApiId}`);
  return response.data.result;
};

/**
 * Mock API 생성
 */
export const createMockApi = async (
  serverId: number,
  data: MockApiCreateRequest
): Promise<MockApi> => {
  const response = await api.post<{ result: MockApi }>(
    `/api/v1/servers/${serverId}/mock-apis`,
    data
  );
  return response.data.result;
};

/**
 * Mock API 수정
 */
export const updateMockApi = async (
  mockApiId: number,
  data: MockApiUpdateRequest
): Promise<MockApi> => {
  const response = await api.put<{ result: MockApi }>(`/api/v1/mock-apis/${mockApiId}`, data);
  return response.data.result;
};

/**
 * Mock API 삭제
 */
export const deleteMockApi = async (mockApiId: number): Promise<void> => {
  await api.delete(`/api/v1/mock-apis/${mockApiId}`);
};

/**
 * Mock API 활성화/비활성화 토글
 */
export const toggleMockApi = async (mockApiId: number): Promise<MockApi> => {
  const response = await api.patch<{ result: MockApi }>(
    `/api/v1/mock-apis/${mockApiId}/toggle`
  );
  return response.data.result;
};

/**
 * OpenAPI 파일 업로드 (일괄 생성)
 */
export const uploadOpenApiFile = async (serverId: number, file: File): Promise<Job> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post<{ result: Job }>(
    `/api/v1/servers/${serverId}/mock-apis/upload`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data.result;
};

/**
 * Job 상태 조회
 */
export const getJobStatus = async (jobId: number | string): Promise<Job> => {
  const response = await api.get<{ result: Job }>(`/api/v1/jobs/${jobId}`);
  return response.data.result;
};

/**
 * 서버의 현재 진행 중인 Job 확인
 */
export const getActiveJobForServer = async (serverId: number): Promise<Job | null> => {
  try {
    const response = await api.get<{ result: Job | null }>(
      `/api/v1/servers/${serverId}/mock-apis/active-job`
    );
    return response.data.result;
  } catch (error: any) {
    // 404는 진행 중인 job이 없다는 의미
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
};
