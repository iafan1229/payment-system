import { http } from '@/shared/api/http';
import type { AuthUser } from '@/features/auth/types/auth';

type LoginInput = {
  email: string;
  password: string;
};

type UserResponse = {
  user: AuthUser;
};

export function login(input: LoginInput) {
  return http<UserResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

export function getMe() {
  return http<UserResponse>('/api/auth/me');
}

export function logout() {
  return http<{ ok: true }>('/api/auth/logout', {
    method: 'POST'
  });
}
