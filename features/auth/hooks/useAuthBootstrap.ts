// getMe()를 호출해서 쿠키 세션이 살아 있으면 authStore.ts (line 13) 에 user를 넣고, 401이면 비로그인 상태로 확정합니다.
'use client';

import { useEffect } from 'react';
import { getMe } from '@/features/auth/api/authApi';
import { HttpError } from '@/shared/api/http';
import { useAuthStore } from '@/features/auth/store/authStore';

export function useAuthBootstrap() {
  const setUser = useAuthStore((state) => state.setUser);
  const clearUser = useAuthStore((state) => state.clearUser);

  useEffect(() => {
    getMe()
      .then(({ user }) => {
        setUser(user);
      })
      .catch((error) => {
        if (error instanceof HttpError && error.status === 401) {
          clearUser();
        }
      });
  }, [clearUser, setUser]);
}
