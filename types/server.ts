// 도메인 서버 관련 타입

export type ServerStatus = 'MOCKING' | 'PENDING' | 'DEPLOYED' | 'ERROR';

export interface DomainServer {
  id: number;
  name: string;
  slug: string;
  status: ServerStatus;
  healthCheckUrl: string | null;
  healthCheckInterval: string | null;
  isHealthCheckActive: boolean;
  lastCheckedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DomainServerSimple {
    id: number;
    name: string;
    slug: string;
    status: ServerStatus;
    unreadNotificationCount: number;
    updatedAt: string;
}

export interface DomainServerCreateRequest {
  name: string;
  slug: string;
  healthCheckUrl?: string;
  healthCheckInterval?: string;
  isHealthCheckActive?: boolean;
}

export interface DomainServerUpdateRequest {
  name?: string;
  healthCheckUrl?: string;
  healthCheckInterval?: string;
  status?: ServerStatus;
  isHealthCheckActive?: boolean;
}

export interface DomainServerListResponse {
  servers: DomainServer[];
  nextCursorId: number | null;
  hasNext: boolean;
}

// Mock API 관련 타입
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface MockApi {
  id: number;
  name: string;
  httpMethod: HttpMethod;
  endpointPath: string;
  fullEndpoint: string;
  statusCode: number;
  isActive: boolean;
  responseBody: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MockApiCore {
  id: number;
  name: string;
  httpMethod: HttpMethod;
  endpointPath: string;
  fullEndpoint: string;
  statusCode: number;
  isActive: boolean;
}

export interface MockApiCreateRequest {
  name: string;
  httpMethod: HttpMethod;
  endpointPath: string;
  statusCode: number;
  responseBody?: string;
  isActive?: boolean;
}

export interface MockApiUpdateRequest {
  name?: string;
  httpMethod?: HttpMethod;
  endpointPath?: string;
  statusCode?: number;
  responseBody?: string;
}

export interface MockApiGroup {
  groupName: string;
  mocks: MockApiCore[];
}

export interface MockApiListResponse {
  mocks: MockApiGroup[];
  nextIdCursor: number | null;
  nextNameCursor: string | null;
  hasNext: boolean;
}

// Job 관련 타입 (OpenAPI 파일 업로드)
export type JobStatus = 'PROCESSING' | 'SUCCESS' | 'FAILURE';

export interface Job {
  jobId: number;
  status: string;
  submittedAt: string;
  completedAt: string | null;
  totalParsed: number;
  successCount: number;
  duplicateCount: number;
  message: string;
  detailedError: string | null;
}

export interface JobStatusResponse extends Job {}