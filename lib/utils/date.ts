/**
 * UTC 시간을 한국 시간(KST)으로 변환하여 포맷팅하는 유틸리티 함수들
 */

const KST_TIMEZONE = 'Asia/Seoul';

/**
 * UTC 시간을 KST로 변환하여 날짜와 시간을 표시
 * @param dateString - ISO 8601 형식의 날짜 문자열
 * @returns 포맷된 날짜 및 시간 문자열 (예: "2024. 1. 15. 오후 3:30:45")
 */
export const formatDateTimeKST = (dateString: string | null | undefined): string => {
  if (!dateString) return '-';

  try {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      timeZone: KST_TIMEZONE,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch (error) {
    console.error('Date formatting error:', error);
    return '-';
  }
};

/**
 * UTC 시간을 KST로 변환하여 날짜만 표시
 * @param dateString - ISO 8601 형식의 날짜 문자열
 * @returns 포맷된 날짜 문자열 (예: "2024. 1. 15.")
 */
export const formatDateKST = (dateString: string | null | undefined): string => {
  if (!dateString) return '-';

  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      timeZone: KST_TIMEZONE,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    });
  } catch (error) {
    console.error('Date formatting error:', error);
    return '-';
  }
};

/**
 * UTC 시간을 KST로 변환하여 시간만 표시
 * @param dateString - ISO 8601 형식의 날짜 문자열
 * @returns 포맷된 시간 문자열 (예: "오후 3:30:45")
 */
export const formatTimeKST = (dateString: string | null | undefined): string => {
  if (!dateString) return '-';

  try {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ko-KR', {
      timeZone: KST_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch (error) {
    console.error('Date formatting error:', error);
    return '-';
  }
};

/**
 * UTC 시간을 KST로 변환하여 상대 시간 표시 (예: "3분 전", "2시간 전")
 * @param dateString - ISO 8601 형식의 날짜 문자열
 * @returns 상대 시간 문자열
 */
export const formatRelativeTimeKST = (dateString: string | null | undefined): string => {
  if (!dateString) return '-';

  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return '방금 전';
    if (diffMin < 60) return `${diffMin}분 전`;
    if (diffHour < 24) return `${diffHour}시간 전`;
    if (diffDay < 7) return `${diffDay}일 전`;

    return formatDateKST(dateString);
  } catch (error) {
    console.error('Date formatting error:', error);
    return '-';
  }
};
