import { useEffect, useRef } from 'react';
import { getJobStatus } from '@/lib/api/mock-apis';
import { useToast } from '@/contexts/ToastContext';
import type { JobStatus } from '@/types/server';

interface UseJobPollingOptions {
  jobId: string;
  onSuccess?: () => void;
  onFailure?: (error: string) => void;
  interval?: number; // 폴링 간격 (ms), 기본값 2000
}

export function useJobPolling({ jobId, onSuccess, onFailure, interval = 2000 }: UseJobPollingOptions) {
  const { showToast } = useToast();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef(false);

  useEffect(() => {
    if (!jobId || isPollingRef.current) return;

    isPollingRef.current = true;

    const pollJob = async () => {
      try {
        const job = await getJobStatus(jobId);

        if (job.status === 'SUCCESS') {
          // 성공 처리
          showToast(
            `OpenAPI 파일 업로드 완료! 전체 ${job.totalParsed}개 중 ${job.successCount}개 성공, ${job.duplicateCount}개 중복`,
            'success'
          );
          if (onSuccess) onSuccess();
          stopPolling();
        } else if (job.status === 'FAILURE') {
          // 실패 처리
          showToast(
            `업로드 실패: ${job.detailedError || job.message}`,
            'error'
          );
          if (onFailure) onFailure(job.detailedError || job.message);
          stopPolling();
        }
        // PROCESSING 상태면 계속 폴링
      } catch (error) {
        console.error('Failed to poll job status:', error);
        showToast('작업 상태 확인 중 오류가 발생했습니다.', 'error');
        stopPolling();
      }
    };

    const stopPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      isPollingRef.current = false;
    };

    // 초기 폴링 시작
    pollJob();
    intervalRef.current = setInterval(pollJob, interval);

    // Cleanup
    return () => {
      stopPolling();
    };
  }, [jobId, interval, onSuccess, onFailure, showToast]);
}
