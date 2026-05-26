import { describe, expect, it } from 'vitest';
import { normalizeEnv, resolveInitialEnv } from '@/lib/env';

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
});
