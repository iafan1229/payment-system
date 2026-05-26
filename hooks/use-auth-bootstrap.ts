'use client';

import { useEffect } from 'react';
import { getMe } from '@/lib/auth-api';
import { HttpError } from '@/lib/http';
import { useAuthStore } from '@/stores/auth-store';

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
