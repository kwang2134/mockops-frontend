export type NotificationType =
  | 'HEALTH_CHECK_FAILURE'
  | 'SERVER_STATUS_CHANGED'
  | 'MEMBER_INVITATION_RECEIVED'
  | 'MEMBER_INVITATION_ACCEPTED'
  | 'MOCK_BULK_SUCCESS'
  | 'MOCK_BULK_FAILURE'
  | 'SYSTEM_ANNOUNCEMENT';

export const getNotificationTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    HEALTH_CHECK_FAILURE: '헬스 체크 실패',
    SERVER_STATUS_CHANGED: '서버 상태 변경',
    MEMBER_INVITATION_RECEIVED: '멤버 초대 수신',
    MEMBER_INVITATION_ACCEPTED: '초대 수락/거절',
    MOCK_BULK_SUCCESS: 'Mock API 일괄 생성 성공',
    MOCK_BULK_FAILURE: 'Mock API 일괄 생성 실패',
    SYSTEM_ANNOUNCEMENT: '서비스 전체 공지',
  };

  return labels[type] || type;
};
