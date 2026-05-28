import { create } from 'zustand';
import type { AuthUser } from '@/features/auth/types/auth';

export type { AuthUser } from '@/features/auth/types/auth';

type AuthState = {
  user: AuthUser | null;
  isAuthResolved: boolean;
  setUser: (user: AuthUser) => void;
  clearUser: () => void;
};
//“인증 상태 저장”은 Zustand
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthResolved: false,
  setUser: (user) =>
    set({
      user,
      /*  인증 상태 그 자체가 아니라, 인증 상태 조회가 끝났다는 플래그
        이 값이 없으면 세션 쿠키가 살아 있어도 /api/auth/me 응답이 오기 전에 로그인 페이지로 튈 수 있다.
        false: 아직 인증 확인 전, 판단 보류 */
      isAuthResolved: true
    }),
  clearUser: () =>
    set({
      user: null,
      isAuthResolved: true
    })
}));
