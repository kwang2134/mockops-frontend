import api from '@/lib/api-client';
import type { CorsConfig } from '@/types/config';

/**
 * CORS Origin 목록 조회
 */
export const getCorsOrigins = async (projectId: number): Promise<CorsConfig[]> => {
  const response = await api.get<{ result: CorsConfig[] }>(
    `/api/v1/projects/${projectId}/cors`
  );
  return response.data.result;
};

/**
 * CORS Origin 추가
 */
export const addCorsOrigin = async (
  projectId: number,
  originUrl: string
): Promise<CorsConfig> => {
  const response = await api.post<{ result: CorsConfig }>(
    `/api/v1/projects/${projectId}/cors`,
    { originUrl }
  );
  return response.data.result;
};

/**
 * CORS Origin 삭제
 */
export const deleteCorsOrigin = async (projectId: number, corsId: number): Promise<void> => {
  await api.delete(`/api/v1/projects/${projectId}/cors/${corsId}`);
};
