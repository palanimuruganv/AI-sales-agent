import { apiClient } from './apiClient';
import type { ApiResponse, AuthTokens, User } from '@/types';

export async function register(input: {
  name: string;
  email: string;
  password: string;
}): Promise<{ user: User; tokens: AuthTokens }> {
  const { data } = await apiClient.post<
    ApiResponse<{ user: User; tokens: AuthTokens }>
  >('/auth/register', input);
  return data.data;
}

export async function login(
  email: string,
  password: string,
): Promise<{ user: User; tokens: AuthTokens }> {
  const { data } = await apiClient.post<
    ApiResponse<{ user: User; tokens: AuthTokens }>
  >('/auth/login', { email, password });
  return data.data;
}

export async function fetchMe(): Promise<User> {
  const { data } = await apiClient.get<ApiResponse<User>>('/auth/me');
  return data.data;
}

export async function logout(refreshToken: string): Promise<void> {
  await apiClient.post('/auth/logout', { refreshToken });
}
