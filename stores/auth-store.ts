import { create } from 'zustand';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
};

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
