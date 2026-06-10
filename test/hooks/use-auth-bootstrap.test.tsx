import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getMe } from '@/features/auth/api/authApi';
import { useAuthBootstrap } from '@/features/auth/hooks/useAuthBootstrap';
import { HttpError } from '@/shared/api/http';
import { useAuthStore } from '@/features/auth/store/authStore';
import type { AuthUser } from '@/features/auth/types/auth';

vi.mock('@/features/auth/api/authApi', () => ({
  getMe: vi.fn()
}));

describe('useAuthBootstrap', () => {
  const mockUser: AuthUser = {
    id: 'usr_demo',
    name: 'Demo Merchant',
    email: 'demo@test.com'
  };

  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      isAuthResolved: false
    });
    vi.mocked(getMe).mockReset();
  });

  it('stores the user when session restore succeeds', async () => {
    vi.mocked(getMe).mockResolvedValue({ user: mockUser });

    renderHook(() => useAuthBootstrap());

    await waitFor(() => {
      expect(useAuthStore.getState().user).toEqual(mockUser);
    });

    expect(useAuthStore.getState().isAuthResolved).toBe(true);
  });

  it('clears the user when session restore returns 401', async () => {
    useAuthStore.getState().setUser(mockUser);
    vi.mocked(getMe).mockRejectedValue(new HttpError('Unauthorized', 401));

    renderHook(() => useAuthBootstrap());

    await waitFor(() => {
      expect(useAuthStore.getState().user).toBeNull();
    });

    expect(useAuthStore.getState().isAuthResolved).toBe(true);
  });

  it('does not resolve auth on non-401 failures', async () => {
    vi.mocked(getMe).mockRejectedValue(new HttpError('Server Error', 500));

    renderHook(() => useAuthBootstrap());

    await waitFor(() => {
      expect(getMe).toHaveBeenCalledTimes(1);
    });

    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isAuthResolved).toBe(false);
  });
});
