// 모든 타입 export

export * from './auth';
export * from './project';
export * from './server';
export * from './config';

// 공통 타입
export interface PaginationParams {
  page?: number;
  size?: number;
  sort?: string;
}

export interface CursorPaginationParams {
  size?: number;
  cursorId?: number;
}

export interface ErrorResponse {
  code: string;
  message: string;
}