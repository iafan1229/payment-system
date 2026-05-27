import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useEnv } from '@/hooks/use-env';

const pushMock = vi.fn();
const replaceMock = vi.fn();

let pathname = '/transactions';
let searchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    replace: replaceMock
  }),
  usePathname: () => pathname,
  useSearchParams: () => searchParams
}));

describe('useEnv', () => {
  beforeEach(() => {
    pathname = '/transactions';
    searchParams = new URLSearchParams();
    pushMock.mockReset();
    replaceMock.mockReset();
    window.localStorage.clear();
  });

  it('persists the URL env value to localStorage', async () => {
    searchParams = new URLSearchParams('env=production');

    const { result } = renderHook(() => useEnv());

    await waitFor(() => {
      expect(window.localStorage.getItem('hopae:last-env')).toBe('production');
    });

    expect(result.current.env).toBe('production');
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it('replaces the URL with the stored env when the URL value is missing', async () => {
    searchParams = new URLSearchParams('page=1');
    window.localStorage.setItem('hopae:last-env', 'production');

    renderHook(() => useEnv());

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/transactions?page=1&env=production');
    });
  });

  it('updates the URL and localStorage when setEnv is called', () => {
    searchParams = new URLSearchParams('env=sandbox');

    const { result } = renderHook(() => useEnv());

    act(() => {
      result.current.setEnv('production');
    });

    expect(pushMock).toHaveBeenCalledWith('/transactions?env=production');
    expect(window.localStorage.getItem('hopae:last-env')).toBe('production');
  });

  it('routes detail page env changes back to the list URL', () => {
    pathname = '/transactions/txn_123';
    searchParams = new URLSearchParams('env=sandbox');

    const { result } = renderHook(() => useEnv());

    act(() => {
      result.current.setEnv('production');
    });

    expect(pushMock).toHaveBeenCalledWith('/transactions?env=production');
  });
});
