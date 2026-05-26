import { useAuthStore, type AuthUser } from '@/stores/auth-store';

describe('useAuthStore', () => {
  const mockUser: AuthUser = {
    id: 'user_123',
    name: '홍길동',
    email: 'hong@example.com'
  };

  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      isAuthResolved: false
    });
  });

  it('stores the current user and marks auth as resolved', () => {
    useAuthStore.getState().setUser(mockUser);

    expect(useAuthStore.getState().user).toEqual(mockUser);
    expect(useAuthStore.getState().isAuthResolved).toBe(true);
  });

  it('clears the current user and marks auth as resolved', () => {
    useAuthStore.getState().setUser(mockUser);

    useAuthStore.getState().clearUser();

    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isAuthResolved).toBe(true);
  });
});
