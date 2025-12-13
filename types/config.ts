// CORS 및 Webhook 관련 타입

// CORS 설정
export interface CorsConfig {
  id: number;
  originUrl: string;
  createdAt: string;
}

export interface CorsCreateRequest {
  origin: string;
}

export interface CorsListResponse {
  corsConfigs: CorsConfig[];
  nextCursorId: number | null;
  hasNext: boolean;
}

// Webhook 설정
export interface WebhookSecret {
  projectId: number;
  isActive: boolean;
  secretKey: string | null;
}

export interface WebhookSecretResponse extends WebhookSecret {}

export interface WebhookTokenResponse {
  jwtToken: string;
  expiresIn: number;
}