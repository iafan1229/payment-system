const assert = require('node:assert/strict');
const test = require('node:test');

const {
  AUTH_COOKIE_NAME,
  DEFAULT_TICK_INTERVAL_MS,
  buildAuthCookie,
  extractAuthTokenFromCookieHeader,
  getPendingResolutionEventType,
  parseEnvQueryParam,
  parseLimitParam,
  parseTickIntervalMs,
  shutdownServer,
} = require('../server');

test('parseTickIntervalMs accepts 0 as a valid freeze value', () => {
  assert.equal(parseTickIntervalMs('0'), 0);
});

test('parseTickIntervalMs falls back to the default for invalid values', () => {
  assert.equal(parseTickIntervalMs(undefined), DEFAULT_TICK_INTERVAL_MS);
  assert.equal(parseTickIntervalMs('-1'), DEFAULT_TICK_INTERVAL_MS);
  assert.equal(parseTickIntervalMs('abc'), DEFAULT_TICK_INTERVAL_MS);
});

test('parseLimitParam uses the default when the query is missing', () => {
  assert.deepEqual(parseLimitParam(undefined), { ok: true, value: 20 });
});

test('parseLimitParam rejects non-positive values', () => {
  assert.deepEqual(parseLimitParam('0'), {
    ok: false,
    error: '`limit` must be a positive integer',
  });
  assert.deepEqual(parseLimitParam('-5'), {
    ok: false,
    error: '`limit` must be a positive integer',
  });
});

test('parseLimitParam caps large values at the maximum', () => {
  assert.deepEqual(parseLimitParam('999'), { ok: true, value: 100 });
});

test('parseEnvQueryParam accepts sandbox and production', () => {
  assert.deepEqual(parseEnvQueryParam('sandbox'), { ok: true, value: 'sandbox' });
  assert.deepEqual(parseEnvQueryParam('production'), { ok: true, value: 'production' });
});

test('parseEnvQueryParam rejects missing or invalid env values', () => {
  assert.deepEqual(parseEnvQueryParam(undefined), {
    ok: false,
    error: '`env` query parameter is required and must be "sandbox" or "production"',
  });
  assert.deepEqual(parseEnvQueryParam('staging'), {
    ok: false,
    error: '`env` query parameter is required and must be "sandbox" or "production"',
  });
});

test('buildAuthCookie creates an httpOnly auth cookie', () => {
  const cookie = buildAuthCookie('mock.usr_demo.123');

  assert.match(cookie, new RegExp(`^${AUTH_COOKIE_NAME}=mock\\.usr_demo\\.123`));
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /Path=\//);
  assert.match(cookie, /SameSite=Lax/);
  assert.match(cookie, /Max-Age=86400/);
});

test('extractAuthTokenFromCookieHeader reads the auth cookie value', () => {
  const cookieHeader = `theme=dark; ${AUTH_COOKIE_NAME}=mock.usr_demo.123; mode=compact`;

  assert.equal(extractAuthTokenFromCookieHeader(cookieHeader), 'mock.usr_demo.123');
  assert.equal(extractAuthTokenFromCookieHeader('theme=dark'), null);
  assert.equal(extractAuthTokenFromCookieHeader(''), null);
});

test('pending failure transitions use capture_failed instead of authorization_failed', () => {
  assert.equal(getPendingResolutionEventType(true), 'captured');
  assert.equal(getPendingResolutionEventType(false), 'capture_failed');
});

test.after(() => {
  shutdownServer();
});
