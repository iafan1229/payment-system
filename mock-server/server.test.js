const assert = require('node:assert/strict');
const test = require('node:test');

const {
  getPendingResolutionEventType,
  parseLimitParam,
  parseTickIntervalMs,
  shutdownServer,
} = require('./server');

test('parseTickIntervalMs accepts 0 as a valid freeze value', () => {
  assert.equal(parseTickIntervalMs('0'), 0);
});

test('parseTickIntervalMs falls back to the default for invalid values', () => {
  assert.equal(parseTickIntervalMs(undefined), 6000);
  assert.equal(parseTickIntervalMs('-1'), 6000);
  assert.equal(parseTickIntervalMs('abc'), 6000);
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

test('pending failure transitions use capture_failed instead of authorization_failed', () => {
  assert.equal(getPendingResolutionEventType(true), 'captured');
  assert.equal(getPendingResolutionEventType(false), 'capture_failed');
});

test.after(() => {
  shutdownServer();
});
