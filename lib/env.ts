export type Env = 'sandbox' | 'production';

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
