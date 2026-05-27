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
