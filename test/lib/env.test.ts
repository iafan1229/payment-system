import { describe, expect, it } from 'vitest';
import { buildEnvChangeUrl, buildUrlWithEnv, isTransactionDetailPath, normalizeEnv, resolveInitialEnv } from '@/lib/env';

describe('env helpers', () => {
  it('normalizes invalid values to sandbox', () => {
    expect(normalizeEnv('staging')).toBe('sandbox');
    expect(normalizeEnv(null)).toBe('sandbox');
    expect(normalizeEnv(undefined)).toBe('sandbox');
  });

  it('keeps production as production', () => {
    expect(normalizeEnv('production')).toBe('production');
  });

  it('prefers the URL value over localStorage', () => {
    expect(resolveInitialEnv('production', 'sandbox')).toBe('production');
  });

  it('falls back to localStorage when URL is missing', () => {
    expect(resolveInitialEnv(null, 'production')).toBe('production');
  });

  it('falls back to sandbox when both values are missing', () => {
    expect(resolveInitialEnv(null, null)).toBe('sandbox');
  });

  it('detects transaction detail paths', () => {
    expect(isTransactionDetailPath('/transactions/txn_123')).toBe(true);
    expect(isTransactionDetailPath('/transactions')).toBe(false);
  });

  it('builds a same-path URL when only env is being normalized', () => {
    expect(buildUrlWithEnv('/transactions/txn_123', new URLSearchParams('page=1'), 'production')).toBe(
      '/transactions/txn_123?page=1&env=production'
    );
  });

  it('routes env changes on detail pages back to the list', () => {
    expect(buildEnvChangeUrl('/transactions/txn_123', new URLSearchParams('cursor=abc'), 'production')).toBe(
      '/transactions?cursor=abc&env=production'
    );
  });
});
