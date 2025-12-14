import api from '@/lib/api-client';

export interface UserProfile {
  id: number;
  email: string;
  nickname: string;
  role: 'USER' | 'ADMIN';
}

export interface UpdateNicknameRequest {
  nickname: string;
}

// 닉네임 수정
export const updateNickname = async (nickname: string): Promise<UserProfile> => {
  const response = await api.patch<{ result: UserProfile }>(
    '/api/v1/users/me/nickname',
    { nickname }
  );
  return response.data.result;
};

// 회원 탈퇴
export const deleteUser = async (): Promise<void> => {
  await api.delete('/api/v1/users/me');
};