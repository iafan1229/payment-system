import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { http, HttpError } from '@/lib/auth/http';

describe('http', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetAllMocks();
  });

  it('always sends credentials include on requests', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      })
    );

    await http<{ ok: true }>('/api/auth/me');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:4000/api/auth/me',
      expect.objectContaining({
        credentials: 'include'
      })
    );
  });

  it('throws an HttpError with the response status when the request fails', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json'
        }
      })
    );

    const error = await http('/api/auth/me').catch((caughtError) => caughtError);

    expect(error).toEqual(expect.any(HttpError));
    expect(error).toMatchObject({
      message: 'Unauthorized',
      status: 401
    });
  });
});
