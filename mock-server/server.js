/**
 * 과제용 Mock API 서버.
 *
 * 편리한 기본값(CORS, logger, body parser)을 위해 json-server 위에
 * 구축했습니다. 아래 라우트들은 모두 수동으로 구현되어 있는데, 이유는:
 *   - login은 자동 생성할 수 없고
 *   - cursor 기반 페이지네이션도 자동 생성할 수 없고
 *   - env 검증, 커서 처리 같은 규칙을 명시적으로 제어하고 싶기 때문입니다.
 *
 * 서버는 메모리 내 데이터를 주기적으로 변경합니다. 몇 초마다 새
 * 트랜잭션을 추가하거나 `pending` 트랜잭션을 `succeeded` / `failed`
 * 상태로 전이시킵니다. 클라이언트가 이 변화를 어떻게 동기화할지는
 * 구현자 선택입니다.
 *
 * 읽는 분께: 이 API는 완성된 계약이 아니라 출발점입니다. 일부 선택은
 * 의도적으로 거칠게 남겨두었습니다. 이를 조용히 "고치지" 말고, 자신의
 * 포크에서 변경한 뒤 그 이유를 프로젝트 README에 적어주세요.
 * 엔드포인트를 추가하거나 변경하고 싶다면 그렇게 하고, 왜 그랬는지
 * 설명해 주세요.
 */

const path = require('path');
const fs = require('fs');
const jsonServer = require('json-server');

const server = jsonServer.create();
const middlewares = jsonServer.defaults({ logger: true });

// ---------------------------------------------------------------------------
// 메모리 내 상태
// 시작 시 db.json을 한 번만 읽어옵니다. 모든 변경은 메모리에만 반영되며,
// 서버를 재시작하면 초기 상태로 돌아갑니다.
// ---------------------------------------------------------------------------

const dbPath = path.join(__dirname, 'db.json');
const initial = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

const state = {
  sandbox: [...initial.transactions_sandbox],
  production: [...initial.transactions_production],
};

const counters = {
  sandbox: state.sandbox.length,
  production: state.production.length,
};

// ---------------------------------------------------------------------------
// 헬퍼 함수
// ---------------------------------------------------------------------------

const DEFAULT_TICK_INTERVAL_MS = 6000;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const AUTH_COOKIE_NAME = 'mock_auth';

const VALID_USER = {
  id: 'usr_demo',
  name: 'Demo Merchant',
  email: 'demo@hopae.com',
  password: 'password123',
};

function makeToken(userId) {
  return `mock.${userId}.${Date.now()}`;
}

function isValidToken(token) {
  return typeof token === 'string' && token.startsWith('mock.');
}

function buildAuthCookie(token) {
  return `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax`;
}

function buildExpiredAuthCookie() {
  return `${AUTH_COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`;
}

function parseCookies(req) {
  const header = req.get('Cookie') || '';

  return header.split(';').reduce((cookies, part) => {
    const trimmed = part.trim();
    if (!trimmed) return cookies;

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) return cookies;

    const name = trimmed.slice(0, separatorIndex);
    const value = trimmed.slice(separatorIndex + 1);
    try {
      cookies[name] = decodeURIComponent(value);
    } catch {
      cookies[name] = null;
    }
    return cookies;
  }, {});
}

function getAuthTokenFromCookie(req) {
  const cookies = parseCookies(req);
  return cookies[AUTH_COOKIE_NAME] || null;
}

function requireAuth(req, res, next) {
  const token = getAuthTokenFromCookie(req);
  if (!token) {
    return res.status(401).json({ error: 'Missing auth cookie' });
  }

  if (!isValidToken(token)) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  req.user = {
    id: VALID_USER.id,
    name: VALID_USER.name,
    email: VALID_USER.email,
  };

  return next();
}

function envKey(env) {
  return env === 'sandbox' || env === 'production' ? env : null;
}

function pad(n, w) {
  const s = String(n);
  return s.length >= w ? s : '0'.repeat(w - s.length) + s;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}


//헬퍼함수 추가2: limit 파싱 로직을 별도 함수로 분리 (음수 제거)
function parseLimitParam(rawValue) {
  if (rawValue == null) {
    return { ok: true, value: DEFAULT_LIMIT };
  }

  const parsedValue = parseInt(rawValue, 10);
  if (!Number.isInteger(parsedValue) || parsedValue < 1) {
    return { ok: false, error: '`limit` must be a positive integer' };
  }

  return { ok: true, value: Math.min(parsedValue, MAX_LIMIT) };
}

// 문제: 같은 env 개념을 목록은 query, 상세는 header로 받으면 프론트 구현 규칙이
//       불필요하게 둘로 나뉘어 실수 가능성이 커짐.
// 해결: 목록/상세 모두 `env` query parameter로 통일해 같은 방식으로 해석함.
function parseEnvQueryParam(rawValue) {
  const env = envKey(rawValue);
  if (!env) {
    return {
      ok: false,
      error: '`env` query parameter is required and must be "sandbox" or "production"',
    };
  }

  return { ok: true, value: env };
}

function getPendingResolutionEventType(succeeded) {
  return succeeded ? 'captured' : 'capture_failed';
}


// ---------------------------------------------------------------------------
// 미들웨어: REST 호출에 작은 인위적 지연을 넣어서 UI에서 로딩 상태가
// 보이도록 합니다.
// ---------------------------------------------------------------------------

server.use(jsonServer.bodyParser);
server.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', 'true');
  const origin = req.get('Origin');
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Vary', 'Origin');
  }
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    return res.sendStatus(204);
  }
  return next();
});
server.use((req, res, next) => {
  const ms = 120 + Math.floor(Math.random() * 220);
  setTimeout(next, ms);
});
server.use(middlewares);

// ---------------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------------

server.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (email === VALID_USER.email && password === VALID_USER.password) {
    res.setHeader('Set-Cookie', buildAuthCookie(makeToken(VALID_USER.id)));
    return res.json({
      user: { id: VALID_USER.id, name: VALID_USER.name, email: VALID_USER.email },
    });
  }
  return res.status(401).json({ error: 'Invalid email or password' });
});

server.get('/api/auth/me', requireAuth, (req, res) => {
  return res.json({ user: req.user });
});

server.post('/api/auth/logout', (req, res) => {
  res.setHeader('Set-Cookie', buildExpiredAuthCookie());
  return res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// GET /api/transactions?env=&limit=&cursor=
//   환경은 QUERY PARAM으로 받음
//   목록 응답은 각 행에 필요한 필드 일부만 반환
// ---------------------------------------------------------------------------

server.get('/api/transactions', requireAuth, (req, res) => {
  const envResult = parseEnvQueryParam(req.query.env);
  if (!envResult.ok) {
    return res.status(400).json({
      error: envResult.error,
    });
  }
  const env = envResult.value;

  // 문제: 음수나 0 같은 잘못된 limit 값이 들어오면 응답 모양이 깨질 수 있음.
  // 해결: 서버에서 limit를 직접 검증하고, 잘못된 값은 400으로 거절함.
  const limitResult = parseLimitParam(req.query.limit);
  if (!limitResult.ok) {
    return res.status(400).json({ error: limitResult.error });
  }
  const limit = limitResult.value;
  const cursor = req.query.cursor || null;

  const all = state[env];

  let startIdx = 0;
  if (cursor) {
    const idx = all.findIndex((t) => t.id === cursor);
    if (idx === -1) return res.status(400).json({ error: 'Invalid cursor' });
    startIdx = idx + 1;
  }

  const page = all.slice(startIdx, startIdx + limit);
  const hasMore = startIdx + limit < all.length;
  const nextCursor = hasMore && page.length > 0 ? page[page.length - 1].id : null;

  const data = page.map((t) => ({
    id: t.id,
    amount: t.amount,
    currency: t.currency,
    status: t.status,
    customer: { name: t.customer.name, email: t.customer.email },
    created_at: t.created_at,
  }));

  return res.json({ data, has_more: hasMore, next_cursor: nextCursor });
});

// ---------------------------------------------------------------------------
// GET /api/transactions/:id
//   환경도 목록과 동일하게 `env` QUERY PARAM으로 받음
// ---------------------------------------------------------------------------

server.get('/api/transactions/:id', requireAuth, (req, res) => {
  // 문제: 상세만 X-Environment header를 쓰면 env 전달 방식이 API마다 달라져
  //       프론트에서 같은 상태를 서로 다른 위치에 반복해서 실어 보내야 함.
  // 해결: 상세도 `?env=`를 사용하게 바꿔 목록 API와 규칙을 맞춤.
  const envResult = parseEnvQueryParam(req.query.env);
  if (!envResult.ok) {
    return res.status(400).json({
      error: envResult.error,
    });
  }
  const env = envResult.value;
  const tx = state[env].find((t) => t.id === req.params.id);
  if (!tx) return res.status(404).json({ error: 'Transaction not found in this environment' });
  return res.json(tx);
});

// ---------------------------------------------------------------------------
// 주기적인 데이터 변경
//   환경별로 약 6초마다 아래 중 하나를 수행:
//     - 새 트랜잭션 생성 (대개 pending으로 시작하고 나중에 확정됨)
//     - pending 트랜잭션 하나를 succeeded 또는 failed로 전이
//   클라이언트는 이 변화를 직접 동기화해야 함.
// ---------------------------------------------------------------------------

const NEW_CUSTOMERS = {
  sandbox: [
    { id: 'cus_test_201', name: 'New Sandbox User', email: 'newuser@example.com' },
    { id: 'cus_test_202', name: 'Recent Test', email: 'recent.test@example.com' },
    { id: 'cus_test_203', name: 'New QA', email: 'new.qa@example.test' },
  ],
  production: [
    { id: 'cus_live_201', name: 'Aisha Patel', email: 'aisha.p@shop.in' },
    { id: 'cus_live_202', name: 'Tomás García', email: 'tomas.g@tienda.mx' },
    { id: 'cus_live_203', name: 'Yuki Sato', email: 'yuki.s@boutique.jp' },
    { id: 'cus_live_204', name: 'Marcus Andersson', email: 'marcus.a@nordic.se' },
    { id: 'cus_live_205', name: 'Fatima Khalil', email: 'f.khalil@studio.ae' },
  ],
};

const BRANDS = ['visa', 'mastercard', 'amex'];
const LAST4 = {
  sandbox: ['4242', '0005', '0341', '9995'],
  production: ['4519', '2204', '8810', '0078', '6611', '3344'],
};
const CURRENCIES = {
  sandbox: ['usd'],
  production: ['usd', 'eur', 'krw', 'jpy', 'gbp'],
};

function makeNewTransaction(env) {
  counters[env] += 1;
  const idx = counters[env];
  const id = `${env === 'sandbox' ? 'txn_test' : 'txn_live'}_${pad(idx, 6)}`;
  const now = new Date().toISOString();

  // 70%는 pending으로 시작, 25%는 succeeded, 5%는 failed로 시작.
  const r = Math.random();
  const status = r < 0.7 ? 'pending' : r < 0.95 ? 'succeeded' : 'failed';

  const amount =
    env === 'sandbox'
      ? pick([1000, 1500, 2000, 5000, 10000])
      : Math.round((500 + Math.random() * 50000) / 50) * 50;

  const customer = pick(NEW_CUSTOMERS[env]);
  const tx = {
    id,
    amount,
    currency: pick(CURRENCIES[env]),
    status,
    customer,
    payment_method: {
      type: 'card',
      brand: pick(BRANDS),
      last4: pick(LAST4[env]),
      exp_month: 1 + Math.floor(Math.random() * 12),
      exp_year: 2027 + Math.floor(Math.random() * 3),
    },
    events: [{ type: 'created', at: now }],
    metadata: { order_id: `ord_${pad(idx + 100, 5)}` },
    created_at: now,
  };
  if (status === 'succeeded') {
    tx.events.push({ type: 'authorized', at: now });
    tx.events.push({ type: 'captured', at: now });
  } else if (status === 'pending') {
    tx.events.push({ type: 'authorized', at: now });
  } else if (status === 'failed') {
    tx.events.push({ type: 'authorization_failed', at: now });
    tx.metadata.failure_reason = pick([
      'card_declined',
      'insufficient_funds',
      'expired_card',
      'authentication_required',
    ]);
  }
  return tx;
}

function resolveOnePending(env) {
  const pendings = state[env].filter((t) => t.status === 'pending');
  if (pendings.length === 0) return null;
  const tx = pick(pendings);
  const succeeded = Math.random() < 0.85;
  tx.status = succeeded ? 'succeeded' : 'failed';
  const now = new Date().toISOString();

  // 문제: pending은 이미 authorized 상태인데 authorization_failed를 붙이면
  //       created -> authorized -> authorization_failed 흐름이 되어 의미가 어색함.
  // 해결: 승인 이후 확정 단계 실패를 뜻하는 capture_failed 이벤트로 구분함.
  tx.events.push({
    type: getPendingResolutionEventType(succeeded),
    at: now,
  });
  if (!succeeded) {
    tx.metadata.failure_reason = pick([
      'card_declined',
      'insufficient_funds',
      'authentication_required',
    ]);
  }
  return tx;
}

function tick(env) {
  const action = Math.random();
  if (action < 0.55) {
    const tx = makeNewTransaction(env);
    state[env].unshift(tx); // 최신 항목이 앞에 오도록 유지
  } else if (action < 0.9) {
    resolveOnePending(env);
  }
  // 약 10%는 아무 일도 하지 않음.
}


const TICK_INTERVAL_MS = parseInt(process.env.TICK_INTERVAL_MS, 10) || 6000;
let tickHandle = null;
if (TICK_INTERVAL_MS > 0) {
  // 두 환경의 변화 시점이 완전히 겹치지 않도록 약간 어긋나게 함.
  const sandboxStartTimeout = setTimeout(() => tick('sandbox'), 2000);
  const productionStartTimeout = setTimeout(() => tick('production'), 4000);
  tickHandle = setInterval(() => {
    tick('sandbox');
    const productionOffsetTimeout = setTimeout(() => tick('production'), TICK_INTERVAL_MS / 2);
    productionOffsetTimeout.unref();
  }, TICK_INTERVAL_MS);
  sandboxStartTimeout.unref();
  productionStartTimeout.unref();
  tickHandle.unref();
}

// ---------------------------------------------------------------------------
// 나머지 모든 경로 처리
// ---------------------------------------------------------------------------

server.use((req, res) => {
  res.status(404).json({ error: `Not found: ${req.method} ${req.path}` });
});

const PORT = process.env.PORT || 4000;

function shutdownServer() {
  if (tickHandle) clearInterval(tickHandle);
}

function startServer() {
  server.listen(PORT, () => {
    console.log('');
    console.log(`  Mock API server running at http://localhost:${PORT}`);
    console.log('');
    console.log('  POST /api/auth/login');
    console.log('  GET  /api/transactions?env=sandbox|production&limit=&cursor=');
    console.log('  GET  /api/transactions/:id?env=sandbox|production');
    console.log('');
    console.log(`  Test credentials: ${VALID_USER.email} / ${VALID_USER.password}`);
    console.log(`  Background data changes: every ${TICK_INTERVAL_MS} ms per env (default: ${DEFAULT_TICK_INTERVAL_MS}, set TICK_INTERVAL_MS=0 to freeze)`);
    console.log('');
  });

  process.on('SIGINT', () => {
    shutdownServer();
    process.exit(0);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = {
  DEFAULT_TICK_INTERVAL_MS,
  getPendingResolutionEventType,
  parseEnvQueryParam,
  parseLimitParam,
  server,
  shutdownServer,
  startServer,
};
