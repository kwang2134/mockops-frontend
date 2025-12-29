import api from '@/lib/api-client';
import type {
  Project,
  ProjectListResponse,
  ProjectCreateRequest,
  ProjectDetailResponse,
  ProjectCreateResponse,
  ProjectUpdateRequest,
} from '@/types/project';

/**
 * 프로젝트 목록 조회
 */
export const getProjects = async (page: number = 0, size: number = 20): Promise<ProjectListResponse> => {
  const response = await api.get<{ result: ProjectListResponse }>('/api/v1/projects', {
    params: { page, size },
  });
  return response.data.result;
};

/**
 * 프로젝트 생성
 */
export const createProject = async (data: ProjectCreateRequest): Promise<ProjectCreateResponse> => {
  const response = await api.post<{ result: ProjectCreateResponse }>('/api/v1/projects', data);
  return response.data.result;
};

/**
 * 프로젝트 상세 조회
 */
export const getProject = async (projectId: number): Promise<ProjectDetailResponse> => {
  const response = await api.get<{ result: ProjectDetailResponse }>(`/api/v1/projects/${projectId}`);
  return response.data.result;
};

/**
 * 프로젝트 수정
 */
export const updateProject = async (
  projectId: number,
  data: ProjectUpdateRequest
): Promise<ProjectDetailResponse> => {
  const response = await api.patch<{ result: ProjectDetailResponse }>(
    `/api/v1/projects/${projectId}`,
    data
  );
  return response.data.result;
};

/**
 * 프로젝트 삭제
 */
export const deleteProject = async (projectId: number): Promise<void> => {
  await api.delete(`/api/v1/projects/${projectId}`);
};
/**
 * 프로젝트 검색 (목록 조회용으로 사용)
 */
/**
 * 프로젝트 검색 (목록 조회용으로 사용)
 */
export const searchProjects = async (
  page: number = 0,
  size: number = 20,
  name?: string,
  ownerNickname?: string
): Promise<ProjectListResponse> => {
  const params: any = { page, size };

  // 빈 문자열이 아닌 경우에만 name 파라미터 추가
  if (name && name.trim() !== '') {
    params.name = name.trim();
  }

  // ownerNickname이 있는 경우에만 추가
  if (ownerNickname && ownerNickname.trim() !== '') {
    params.ownerNickname = ownerNickname.trim();
  }

  const response = await api.get<{ result: ProjectListResponse }>('/api/v1/projects/search', {
    params,
  });
  return response.data.result;
};
