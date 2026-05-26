/**
 * Mock API server for the take-home assignment.
 *
 * Built on top of json-server for convenient defaults (CORS, logger,
 * body parser). Every route below is implemented by hand because:
 *   - login can't be auto-generated
 *   - cursor-based pagination can't be auto-generated
 *   - environment selection differs between endpoints (intentional)
 *
 * The server periodically modifies its in-memory data: every few seconds
 * it adds a new transaction or moves a `pending` transaction to
 * `succeeded` / `failed`. How clients keep their view in sync is up to
 * them.
 *
 * NOTE TO READERS: The API here is a starting point, not a finished
 * contract. Some choices are deliberately rough. Don't "fix" them
 * silently — change them in your fork and write up your reasoning in
 * your project README. If you want to add or change endpoints, do so
 * and explain why.
 */

const path = require('path');
const fs = require('fs');
const jsonServer = require('json-server');

const server = jsonServer.create();
const middlewares = jsonServer.defaults({ logger: true });

// ---------------------------------------------------------------------------
// In-memory state
// Loaded once from db.json at startup. All mutations stay in memory —
// restart the server to reset.
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
// Helpers
// ---------------------------------------------------------------------------

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

function requireAuth(req, res, next) {
  const header = req.get('Authorization') || '';
  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }
  if (!isValidToken(header.slice(7))) {
    return res.status(401).json({ error: 'Invalid token' });
  }
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

// ---------------------------------------------------------------------------
// Middleware: small artificial latency on REST calls so loading
// states are visible in the UI.
// ---------------------------------------------------------------------------

server.use(jsonServer.bodyParser);
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
    return res.json({
      token: makeToken(VALID_USER.id),
      user: { id: VALID_USER.id, name: VALID_USER.name, email: VALID_USER.email },
    });
  }
  return res.status(401).json({ error: 'Invalid email or password' });
});

// ---------------------------------------------------------------------------
// GET /api/transactions?env=&limit=&cursor=
//   environment via QUERY PARAM
//   list returns a SUBSET of fields per row
// ---------------------------------------------------------------------------

server.get('/api/transactions', requireAuth, (req, res) => {
  const env = envKey(req.query.env);
  if (!env) {
    return res.status(400).json({
      error: '`env` query parameter is required and must be "sandbox" or "production"',
    });
  }
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
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
//   environment via X-Environment HEADER (intentionally different from list)
// ---------------------------------------------------------------------------

server.get('/api/transactions/:id', requireAuth, (req, res) => {
  const env = envKey(req.get('X-Environment'));
  if (!env) {
    return res.status(400).json({
      error: '`X-Environment` header is required and must be "sandbox" or "production"',
    });
  }
  const tx = state[env].find((t) => t.id === req.params.id);
  if (!tx) return res.status(404).json({ error: 'Transaction not found in this environment' });
  return res.json(tx);
});

// ---------------------------------------------------------------------------
// Periodic data changes
//   Every ~6 seconds per env, do one of:
//     - create a new transaction (often pending, will resolve later)
//     - resolve a pending transaction to succeeded or failed
//   Clients are responsible for keeping their view in sync.
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

  // 70% start pending, 25% start succeeded, 5% start failed.
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
  tx.events.push({
    type: succeeded ? 'captured' : 'authorization_failed',
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
    state[env].unshift(tx); // newest first
  } else if (action < 0.9) {
    resolveOnePending(env);
  }
  // ~10% no-op: a quiet tick.
}

const TICK_INTERVAL_MS = parseInt(process.env.TICK_INTERVAL_MS, 10) || 6000;
let tickHandle = null;
if (TICK_INTERVAL_MS > 0) {
  // Offset envs slightly so events don't perfectly align.
  setTimeout(() => tick('sandbox'), 2000);
  setTimeout(() => tick('production'), 4000);
  tickHandle = setInterval(() => {
    tick('sandbox');
    setTimeout(() => tick('production'), TICK_INTERVAL_MS / 2);
  }, TICK_INTERVAL_MS);
}

// ---------------------------------------------------------------------------
// Catch-all
// ---------------------------------------------------------------------------

server.use((req, res) => {
  res.status(404).json({ error: `Not found: ${req.method} ${req.path}` });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log('');
  console.log(`  Mock API server running at http://localhost:${PORT}`);
  console.log('');
  console.log('  POST /api/auth/login');
  console.log('  GET  /api/transactions?env=sandbox|production&limit=&cursor=');
  console.log('  GET  /api/transactions/:id            (header X-Environment: sandbox|production)');
  console.log('');
  console.log(`  Test credentials: ${VALID_USER.email} / ${VALID_USER.password}`);
  console.log(`  Background data changes: every ${TICK_INTERVAL_MS} ms per env (set TICK_INTERVAL_MS=0 to freeze)`);
  console.log('');
});

process.on('SIGINT', () => {
  if (tickHandle) clearInterval(tickHandle);
  process.exit(0);
});
