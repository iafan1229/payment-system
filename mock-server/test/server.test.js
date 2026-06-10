const assert = require('node:assert/strict');
const http = require('node:http');
const test = require('node:test');

const {
  getPendingResolutionEventType,
  parseEnvQueryParam,
  parseLimitParam,
  server,
} = require('../server');

function request(method, path, headers = {}, body) {
  return new Promise((resolve, reject) => {
    const app = server.listen(0, '127.0.0.1', () => {
      const { port } = app.address();
      const req = http.request({ hostname: '127.0.0.1', port, path, method, headers }, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          app.close(() => {
            resolve({ status: res.statusCode, headers: res.headers, body: data });
          });
        });
      });
      req.on('error', (error) => {
        app.close(() => reject(error));
      });
      if (body) {
        req.write(body);
      }
      req.end();
    });
  });
}

async function loginAsDemo() {
  return request(
    'POST',
    '/api/auth/login',
    { 'Content-Type': 'application/json' },
    JSON.stringify({ email: 'demo@test.com', password: 'password123' })
  );
}

test('GET /api/auth/me returns 401 when the auth cookie is missing', async () => {
  const response = await request('GET', '/api/auth/me');

  assert.equal(response.status, 401);
});

test('GET /api/auth/me returns the current user when the auth cookie is valid', async () => {
  const login = await loginAsDemo();
  const [cookie] = login.headers['set-cookie'] || [];
  const response = await request('GET', '/api/auth/me', { Cookie: cookie });

  assert.equal(login.status, 200);
  assert.ok(cookie);
  assert.equal(response.status, 200);
  assert.deepEqual(JSON.parse(response.body), {
    user: {
      id: 'usr_demo',
      name: 'Demo Merchant',
      email: 'demo@test.com',
    },
  });
});

test('POST /api/auth/logout clears the auth cookie', async () => {
  const login = await loginAsDemo();
  const [cookie] = login.headers['set-cookie'] || [];
  const response = await request('POST', '/api/auth/logout', { Cookie: cookie });

  assert.equal(login.status, 200);
  assert.ok(cookie);
  assert.equal(response.status, 200);
  assert.deepEqual(JSON.parse(response.body), { ok: true });
  assert.match(response.headers['set-cookie'][0], /Max-Age=0/);
});

test('GET /api/transactions accepts the auth cookie without a Bearer header', async () => {
  const login = await loginAsDemo();
  const [cookie] = login.headers['set-cookie'] || [];
  const response = await request('GET', '/api/transactions?env=sandbox&limit=1', { Cookie: cookie });

  assert.equal(login.status, 200);
  assert.ok(cookie);
  assert.equal(response.status, 200);

  const payload = JSON.parse(response.body);
  assert.equal(Array.isArray(payload.data), true);
  assert.equal(payload.data.length, 1);
  assert.equal(typeof payload.data[0].id, 'string');
});

test('GET /api/transactions/:id accepts the auth cookie without a Bearer header', async () => {
  const login = await loginAsDemo();
  const [cookie] = login.headers['set-cookie'] || [];
  const listResponse = await request('GET', '/api/transactions?env=sandbox&limit=1', { Cookie: cookie });
  const { data } = JSON.parse(listResponse.body);
  const response = await request('GET', `/api/transactions/${data[0].id}?env=sandbox`, { Cookie: cookie });

  assert.equal(login.status, 200);
  assert.ok(cookie);
  assert.equal(listResponse.status, 200);
  assert.equal(response.status, 200);
  assert.equal(JSON.parse(response.body).id, data[0].id);
});

test('OPTIONS preflight echoes Origin and allows credentials for cookie auth routes', async () => {
  const origin = 'http://localhost:3000';
  const response = await request('OPTIONS', '/api/auth/me', {
    Origin: origin,
    'Access-Control-Request-Method': 'GET',
    'Access-Control-Request-Headers': 'Content-Type',
  });

  assert.equal(response.status, 204);
  assert.equal(response.headers['access-control-allow-credentials'], 'true');
  assert.equal(response.headers['access-control-allow-origin'], origin);
  assert.match(response.headers['access-control-allow-methods'], /GET/);
});

test('protected routes echo Origin and allow credentials for cookie auth', async () => {
  const origin = 'http://localhost:3000';
  const response = await request('OPTIONS', '/api/transactions?env=sandbox', {
    Origin: origin,
    'Access-Control-Request-Method': 'GET',
    'Access-Control-Request-Headers': 'Content-Type',
  });

  assert.equal(response.status, 204);
  assert.equal(response.headers['access-control-allow-credentials'], 'true');
  assert.equal(response.headers['access-control-allow-origin'], origin);
});

test('GET /api/auth/me returns 401 for a malformed auth cookie value', async () => {
  const response = await request('GET', '/api/auth/me', { Cookie: 'mock_auth=%E0%A4%A' });

  assert.equal(response.status, 401);
});

test('parseEnvQueryParam accepts sandbox and production values', () => {
  assert.deepEqual(parseEnvQueryParam('sandbox'), { ok: true, value: 'sandbox' });
  assert.deepEqual(parseEnvQueryParam('production'), { ok: true, value: 'production' });
});

test('parseLimitParam rejects zero and caps large values', () => {
  assert.deepEqual(parseLimitParam('0'), {
    ok: false,
    error: '`limit` must be a positive integer',
  });
  assert.deepEqual(parseLimitParam('999'), { ok: true, value: 100 });
});

test('getPendingResolutionEventType maps outcomes to event names', () => {
  assert.equal(getPendingResolutionEventType(true), 'captured');
  assert.equal(getPendingResolutionEventType(false), 'capture_failed');
});
