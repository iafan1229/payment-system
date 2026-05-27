export type Env = 'sandbox' | 'production';
export const ENV_STORAGE_KEY = 'hopae:last-env';

export function normalizeEnv(value: string | null | undefined): Env {
  return value === 'production' ? 'production' : 'sandbox';
}

export function resolveInitialEnv(searchParamValue: string | null, storedValue: string | null): Env {
  if (searchParamValue) {
    return normalizeEnv(searchParamValue);
  }

  if (storedValue) {
    return normalizeEnv(storedValue);
  }

  return 'sandbox';
}

function buildUrl(pathname: string, searchParams: URLSearchParams) {
  const query = searchParams.toString();

  return query ? `${pathname}?${query}` : pathname;
}

export function isTransactionDetailPath(pathname: string) {
  return /^\/transactions\/[^/]+$/.test(pathname);
}

export function buildUrlWithEnv(pathname: string, searchParams: URLSearchParams, nextEnv: Env) {
  const next = new URLSearchParams(searchParams.toString());
  next.set('env', nextEnv);

  return buildUrl(pathname, next);
}

export function buildEnvChangeUrl(pathname: string, searchParams: URLSearchParams, nextEnv: Env) {
  const targetPath = isTransactionDetailPath(pathname) ? '/transactions' : pathname;

  return buildUrlWithEnv(targetPath, searchParams, nextEnv);
}
