import api from '@/lib/api-client';

export type AgreementType = 'TOS' | 'PP';

export interface AgreementItem {
  agreementType: AgreementType;
}

export interface UserAgreementRequest {
  agreements: AgreementItem[];
}

export interface UserAgreementResponse {
  id: number;
  agreementType: AgreementType;
  agreementVersion: string;
  agreedAt: string;
}

// 약관 동의 제출
export const submitAgreements = async (
  request: UserAgreementRequest
): Promise<UserAgreementResponse[]> => {
  const response = await api.post<{ result: UserAgreementResponse[] }>(
    '/api/v1/users/me/agreements',
    request
  );
  return response.data.result;
};
