import { create } from 'zustand';
import type { AuthUser } from '@/features/auth/types/auth';

export type { AuthUser } from '@/features/auth/types/auth';

type AuthState = {
  user: AuthUser | null;
  isAuthResolved: boolean;
  setUser: (user: AuthUser) => void;
  clearUser: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthResolved: false,
  setUser: (user) =>
    set({
      user,
      isAuthResolved: true
    }),
  clearUser: () =>
    set({
      user: null,
      isAuthResolved: true
    })
}));
