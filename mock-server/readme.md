# Mock API Server

Mock backend for the take-home assignment. Runs on `http://localhost:4000`.
Built on [json-server](https://github.com/typicode/json-server) with hand-written routes.

## Setup

```bash
pnpm install        # or npm install / yarn install
pnpm seed           # regenerate db.json (already committed)
pnpm start          # start server on :4000
```

State is in-memory. Restart to reset.

## Test credentials

```
email:    demo@hopae.com
password: password123
```

## Endpoints

### `POST /api/auth/login`

```json
Request:  { "email": "demo@hopae.com", "password": "password123" }
Response: { "token": "mock.usr_demo.<ts>",
            "user":  { "id": "...", "name": "...", "email": "..." } }
```

### `GET /api/transactions?env=&limit=&cursor=`

Headers: `Authorization: Bearer <token>`

Query params:
- `env` — `sandbox` or `production` (required)
- `limit` — default 20, max 100
- `cursor` — pass `next_cursor` from the previous response

```json
{
  "data": [
    { "id": "txn_live_000001", "amount": 12350, "currency": "usd",
      "status": "succeeded",
      "customer": { "name": "...", "email": "..." },
      "created_at": "2026-05-22T08:16:18.209Z" }
  ],
  "has_more": true,
  "next_cursor": "txn_live_000020"
}
```

List rows return a **subset** of fields. `payment_method`, `events`, and
`metadata` are only on the detail endpoint.

### `GET /api/transactions/:id`

Headers:
- `Authorization: Bearer <token>`

Query params:
- `env` — `sandbox` or `production` (required)

Returns the full transaction object.

## Data changes over time

Every few seconds, per environment, the server either adds a new
transaction or moves a `pending` transaction to `succeeded` / `failed`.
How your client keeps the UI in sync is your call.

Tune or disable:

```bash
TICK_INTERVAL_MS=12000 pnpm start    # slower
TICK_INTERVAL_MS=0     pnpm start    # freeze data, for debugging
```

## Amounts and currencies

Amounts are in minor units (cents for USD/EUR/GBP). KRW and JPY have no
minor unit, so `12000` means ₩12,000 / ¥12,000. Currency codes are lowercase.

## A note on the API shape

This API is a **starting point**, not a finished contract. Some endpoints
may still leave room for improvement, or differ from what a real production
API would do. If you'd design any of it differently — or if you want to add
an endpoint that this one is missing — change it in your fork and write up
your reasoning in your project README.

## Regenerating data

`pnpm seed` regenerates `db.json` deterministically.
