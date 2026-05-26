/**
 * sandbox와 production 환경용 시드 데이터를 담은 db.json을 생성합니다.
 *
 * 결정론적 방식으로 동작하므로, 매 실행마다 같은 결과가 나옵니다.
 * 실행 방법: `node seed.js`
 *
 * Sandbox 데이터는 의도적으로 "테스트처럼 보이게" 만들었습니다
 * (예: 카드 마지막 4자리 = 4242, 티가 나는 테스트용 고객 이름).
 * Production 데이터는 좀 더 실제 데이터처럼 보이게 구성했습니다.
 * 이를 통해 후보자가 환경별 시각적 구분을 넣을 여지를 남깁니다.
 */


/*

현재 seed.js로 생성한 db.json
sandbox: 2026-04-22 ~ 2026-05-22
production: 2026-04-22 ~ 2026-05-22

*/

const fs = require('fs');
const path = require('path');

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pad(n, w) {
  const s = String(n);
  return s.length >= w ? s : '0'.repeat(w - s.length) + s;
}

function makeId(prefix, n) {
  return `${prefix}_${pad(n, 6)}`;
}

const SANDBOX_CUSTOMERS = [
  { name: 'Test Customer', email: 'test@example.com' },
  { name: 'Demo User', email: 'demo+1@example.com' },
  { name: 'QA Account', email: 'qa@example.test' },
  { name: 'Alice Tester', email: 'alice.tester@example.com' },
  { name: 'Bob Sandbox', email: 'bob+sandbox@example.com' },
  { name: 'Charlie Dev', email: 'charlie.dev@example.com' },
  { name: 'Internal QA', email: 'internal.qa@example.test' },
];

const PRODUCTION_CUSTOMERS = [
  { name: 'Hannah Lee', email: 'hannah.lee@gmail.com' },
  { name: 'Michael Chen', email: 'mchen@acme.co' },
  { name: 'Sofia Rossi', email: 'sofia.rossi@studio.it' },
  { name: 'David Park', email: 'david.park@kakao.com' },
  { name: 'Emma Müller', email: 'emma.m@firma.de' },
  { name: 'Olivia Smith', email: 'olivia@designhouse.co' },
  { name: 'Noah Williams', email: 'noah.w@studio.io' },
  { name: 'Jiwoo Han', email: 'jiwoo.han@naver.com' },
  { name: 'Lucas Bernard', email: 'lucas.b@maison.fr' },
  { name: 'Aiko Tanaka', email: 'aiko.tanaka@shop.jp' },
  { name: 'Carlos Ramirez', email: 'cramirez@tienda.es' },
  { name: 'Priya Sharma', email: 'priya.sharma@studio.in' },
];

const CARD_BRANDS = ['visa', 'mastercard', 'amex'];
const SANDBOX_LAST4 = ['4242', '0005', '0341', '9995'];
const PRODUCTION_LAST4 = ['4519', '2204', '8810', '0078', '6611', '3344', '9012'];
// 문제3: 사용되지 않는 상수
// 해결: 사용되지 않던 통화 상수 대신 실제로 사용하는 가중치 정의를 한곳에 모음
const DAYS_OF_HISTORY = 30;
const FIXED_NOW_MS = Date.parse('2026-05-22T12:00:00.000Z');
const PRODUCTION_CURRENCY_WEIGHTS = [
  { value: 'usd', weight: 5 },
  { value: 'eur', weight: 3 },
  { value: 'krw', weight: 3 },
  { value: 'jpy', weight: 1 },
  { value: 'gbp', weight: 1 },
];
// 어떤 값은 더 자주 나오게 만드는 코드
function pickWeighted(rng, items) {
  // items 형태: [{ value, weight }]
  const total = items.reduce((s, it) => s + it.weight, 0);
  let r = rng() * total;
  for (const it of items) {
    if (r < it.weight) return it.value;
    r -= it.weight;
  }
  return items[items.length - 1].value;
}

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

function randomAmount(rng, env) {
  if (env === 'sandbox') {
    // 둥글고 티 나는 테스트용 금액.
    return pick(rng, [1000, 1500, 2000, 5000, 10000, 25000, 50000]);
  }
  // Production: minor unit 기준의 비교적 현실적인 금액.
  const base = Math.floor(500 + rng() * 50000);
  // 실제 가격처럼 보이도록 50 단위에 맞춰 반올림.
  return Math.round(base / 50) * 50;
}

function buildEvents(status, createdAt) {
  const t0 = new Date(createdAt).getTime();
  const evt = (type, offsetSec) => ({
    type,
    at: new Date(t0 + offsetSec * 1000).toISOString(),
  });

  const events = [evt('created', 0)];
  if (status === 'succeeded') {
    events.push(evt('authorized', 2));
    events.push(evt('captured', 4));
  } else if (status === 'pending') {
    events.push(evt('authorized', 2));
    // 아직 capture 되지 않음.
  } else if (status === 'failed') {
    events.push(evt('authorization_failed', 3));
  } else if (status === 'refunded') {
    events.push(evt('authorized', 2));
    events.push(evt('captured', 4));
    events.push(evt('refunded', 60 * 60 * 24)); // 하루 뒤
  }
  return events;
}

function buildTransaction(rng, env, index, count) {
  const customers = env === 'sandbox' ? SANDBOX_CUSTOMERS : PRODUCTION_CUSTOMERS;
  const last4Pool = env === 'sandbox' ? SANDBOX_LAST4 : PRODUCTION_LAST4;

  const status = pickWeighted(rng, [
    { value: 'succeeded', weight: env === 'sandbox' ? 5 : 8 },
    { value: 'pending', weight: 2 },
    { value: 'failed', weight: env === 'sandbox' ? 3 : 1 },
    { value: 'refunded', weight: 1 },
  ]);

  const customer = pick(rng, customers);
  const brand = pick(rng, CARD_BRANDS);
  const last4 = pick(rng, last4Pool);
  const amount = randomAmount(rng, env);
  const currency = env === 'sandbox' ? 'usd' : pickWeighted(rng, PRODUCTION_CURRENCY_WEIGHTS);

  // 문제2: Spread transactions over the last 30 days, newest first.
  // 문제2 설명: 최근 30일로 보이지만, index가 30보다 커지면 실제로는 30일을 넘길 수 있음.
  // 해결: 거래 수가 30건을 넘어도 전체 생성 시각이 최근 30일 안에만 퍼지도록 계산(5월 22일 ~ 6월 22일)
  const bucketSizeMinutes = (DAYS_OF_HISTORY * 24 * 60) / Math.max(count, 1);
  const minutesAgo = Math.floor(index * bucketSizeMinutes + rng() * bucketSizeMinutes);
  // 문제1: 주석과 불일치 - 실제 생성 시각이 매 실행마다 바뀜(Date.now())
  // 해결: 고정 기준 시각을 사용해 seed.js 결과가 매 실행마다 동일하게 유지되도록 함
  const createdAt = new Date(FIXED_NOW_MS - minutesAgo * 60 * 1000).toISOString();

  const idPrefix = env === 'sandbox' ? 'txn_test' : 'txn_live';
  const id = makeId(idPrefix, index + 1);

  const tx = {
    id,
    amount,
    currency,
    status,
    customer: {
      id: `cus_${env === 'sandbox' ? 'test' : 'live'}_${pad(customers.indexOf(customer) + 1, 4)}`,
      name: customer.name,
      email: customer.email,
    },
    payment_method: {
      type: 'card',
      brand,
      last4,
      exp_month: 1 + Math.floor(rng() * 12),
      exp_year: 2027 + Math.floor(rng() * 3),
    },
    events: buildEvents(status, createdAt),
    metadata:
      status === 'failed'
        ? {
          order_id: `ord_${pad(index + 100, 5)}`, failure_reason: pick(rng, [
            'card_declined',
            'insufficient_funds',
            'expired_card',
            'authentication_required',
          ])
        }
        : { order_id: `ord_${pad(index + 100, 5)}` },
    created_at: createdAt,
  };

  return tx;
}

function buildList(env, count, seed) {
  const rng = mulberry32(seed);
  const items = [];
  for (let i = 0; i < count; i++) {
    items.push(buildTransaction(rng, env, i, count));
  }
  // 최신 항목이 앞에 오도록 정렬.
  items.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  return items;
}

const db = {
  transactions_sandbox: buildList('sandbox', 23, 1),
  transactions_production: buildList('production', 47, 2),
};

const outPath = path.join(__dirname, 'db.json');
fs.writeFileSync(outPath, JSON.stringify(db, null, 2) + '\n', 'utf8');

console.log(`Wrote ${outPath}`);
console.log(`  sandbox    : ${db.transactions_sandbox.length} transactions`);
console.log(`  production : ${db.transactions_production.length} transactions`);
