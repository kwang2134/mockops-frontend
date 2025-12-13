// 인증 관련 타입

export interface TokenResponse {
  accessToken: string;
}

export interface User {
  id: number;
  email: string;
  nickname: string;
  role: 'USER' | 'ADMIN';
}

export interface UpdateNicknameRequest {
  nickname: string;
}

export interface UserResponse extends User {}