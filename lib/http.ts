const API_BASE_URL = 'http://localhost:4000';

export class HttpError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    Object.setPrototypeOf(this, HttpError.prototype);
  }
}

export async function http<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${input}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const message =
      errorBody && typeof errorBody === 'object' && 'error' in errorBody && typeof errorBody.error === 'string'
        ? errorBody.error
        : 'Request failed';

    throw new HttpError(message, response.status);
  }

  return (await response.json()) as T;
}
