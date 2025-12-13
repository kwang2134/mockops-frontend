import api from '@/lib/api-client';

interface WebhookSecretResponse {
  projectId: number;
  isActive: boolean;
  secretKey: string | null;
}

interface WebhookTokenResponse {
  jwtToken: string;
  expiresIn: number;
}

/**
 * Webhook Secret 조회
 */
export const getWebhookSecret = async (projectId: number): Promise<WebhookSecretResponse> => {
  const response = await api.get<{ result: WebhookSecretResponse }>(
    `/api/v1/projects/${projectId}/webhook/secret`
  );
  return response.data.result;
};

/**
 * Webhook Secret 재발급
 */
export const reissueWebhookSecret = async (projectId: number): Promise<WebhookSecretResponse> => {
  const response = await api.post<{ result: WebhookSecretResponse }>(
    `/api/v1/projects/${projectId}/webhook/reissue`
  );
  return response.data.result;
};

/**
 * Webhook Secret 비활성화
 */
export const deactivateWebhookSecret = async (projectId: number): Promise<void> => {
  await api.patch(`/api/v1/projects/${projectId}/webhook/deactivate`);
};

/**
 * Webhook JWT 토큰 발급
 */
export const generateWebhookToken = async (
  projectId: number,
  secretKey: string
): Promise<WebhookTokenResponse> => {
  const response = await api.post<{ result: WebhookTokenResponse }>(
    `/api/v1/projects/${projectId}/webhook/token`,
    { secretKey }
  );
  return response.data.result;
};
