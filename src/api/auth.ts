import { apiClient } from './client';

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
};

export function login(payload: LoginRequest) {
  return apiClient.post<LoginResponse>('/api/auth/login', payload).then(res => res.data);
}
