import api from '@/lib/api-client';

export type NotificationType =
  | 'HEALTH_CHECK_FAILURE'
  | 'SERVER_STATUS_CHANGED'
  | 'MEMBER_INVITATION_RECEIVED'
  | 'MEMBER_INVITATION_ACCEPTED'
  | 'MOCK_BULK_SUCCESS'
  | 'MOCK_BULK_FAILURE'
  | 'SYSTEM_ANNOUNCEMENT';

export interface Notification {
  notificationId: number;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  metadata: Record<string, any>;
  redirectUrl: string | null;
}

export interface NotificationListResponse {
  notifications: Notification[];
  totalUnreadCount: number;
  nextCursorId: number | null;
  hasNext: boolean;
}

export interface ServerNotificationSummary {
  serverName: string;
  totalUnreadCount: number;
  summaries: Array<{
    type: NotificationType;
    latestNotifications: Notification[];
    unreadCount: number;
  }>;
}

export interface HealthCheckFailureLog {
  notificationId: number;
  failedAt: string;
  failureReason: string;
  metadata: Record<string, any>;
}

export interface HealthCheckFailureListResponse {
  failures: HealthCheckFailureLog[];
  nextCursorId: number | null;
  hasNext: boolean;
}

/**
 * 사용자 알림 목록 조회
 */
export const getNotifications = async (
  cursorId?: number,
  pageSize: number = 20
): Promise<NotificationListResponse> => {
  const response = await api.get<{ result: NotificationListResponse }>(
    '/api/v1/notifications/user',
    {
      params: { cursorId, pageSize },
    }
  );
  return response.data.result;
};

/**
 * 알림 읽음 처리
 */
export const markNotificationAsRead = async (notificationId: number): Promise<void> => {
  await api.patch(`/api/v1/notifications/${notificationId}/read`);
};

/**
 * 알림 삭제
 */
export const deleteNotification = async (notificationId: number): Promise<void> => {
  await api.delete(`/api/v1/notifications/${notificationId}`);
};

/**
 * 서버 알림 요약 조회
 */
export const getServerNotificationSummary = async (
  serverId: number
): Promise<ServerNotificationSummary> => {
  const response = await api.get<{ result: ServerNotificationSummary }>(
    `/api/v1/notifications/server/${serverId}`
  );
  return response.data.result;
};

/**
 * 헬스 체크 실패 로그 조회
 */
export const getHealthCheckFailureLogs = async (
  serverId: number,
  cursorId?: number,
  pageSize: number = 20
): Promise<HealthCheckFailureListResponse> => {
  const response = await api.get<{ result: HealthCheckFailureListResponse }>(
    `/api/v1/notifications/server/${serverId}/health-check-failures`,
    {
      params: { cursorId, pageSize },
    }
  );
  return response.data.result;
};
