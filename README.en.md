# Hopae Software Engineer

## Background

You are an engineer building an admin dashboard for a payment platform. You will implement part of the screen where merchants review their own payment history.
There are two core requirements:

1. **Switching between Sandbox / Production environments**
2. **Near real-time updates of the transaction list** — the mock server emits new
   transactions and transitions `pending` transactions to `succeeded`/`failed`.
   While the user is viewing the screen, those changes should be reflected within
   a reasonable time (within tens of seconds). The specific approach is your choice.

## Tech Stack

- **React + TypeScript**, or **Next.js (App Router recommended)**
- Other libraries (state management, data fetching, styling) are up to you
- However, please record the reason for each choice in the README, even if it's just one line

## Screens to Implement

### 1. Login

- Email + password form
- Calls `POST /api/auth/login`
- On success, save the token and navigate to the dashboard
- On failure, give the user clear feedback

Test account: `demo@hopae.com / password123`

### 2. Dashboard Transaction List

- **Expose the Sandbox ↔ Production environment switcher**
- Transaction list (ID, amount, currency, status, customer name, created at)
- When the environment is switched, the data updates accordingly
- **Near real-time updates**:
  - The mock server's data changes over time — new transactions are added and
    the status of `pending` transactions changes (see `mock-server/README.md`
    for detailed behavior)
  - These changes should be reflected while the user is viewing the list
  - The sync mechanism and UI exposure are your choice. You may modify the mock
    server if needed.
- Click a row → detail page

### 3. Transaction Detail

- Basic transaction info (amount, status, timestamp, ID)
- Customer info
- Payment method
- Event timeline (`created` → `authorized` → `captured`, etc.)
- **How to handle the transaction updating while the detail page is displayed**
  is also up to you to decide
- Back to list

## Provided API

Base URL: `http://localhost:4000`. A mock server is provided (`mock-server/`).

```
POST /api/auth/login
GET  /api/transactions?env=sandbox|production&limit=&cursor=
GET  /api/transactions/:id           (X-Environment header)
```

The mock server mutates data in the background. See `mock-server/README.md` for
detailed behavior.

## ⚠️ The API spec is a guideline

This API may be intentionally incomplete, inconsistent, or have room for improvement.

- If you think you have a better design, **you may change the API shape or
  define a new one.** The mock server code can also be freely modified.
- Whether you followed the spec or changed it, **please write down the reasoning
  for that judgment in the README.**

## Submission

Submit via a GitHub repository (public or invited). Please include the following
in the README:

1. **How to run** (app + mock server)
2. **Main libraries used and why you chose them.** In particular, be explicit about these two:
   - Where you store the environment (env) state (URL? Context? store?) and why
   - How you implemented near real-time updates and why you chose that approach
3. **Problems you found in the API spec or improvement suggestions** (or "none" if none)
4. **Decisions you made that were not in the spec, and your reasoning**
   Examples:
   - Page handling on environment switch (especially the detail screen)
   - Preserving environment across page reloads
   - Token expiration handling
   - Confirmation when switching to Production
   - How new transactions arriving in real time are surfaced in the UI
   - When the transaction you're viewing in detail gets updated
5. **Things you would add/improve if you had more time**
6. **Parts you intentionally simplified or omitted** (if any)

## Evaluation Criteria

- **Code quality** — structure, readability, type safety, component separation
- **State management design** — auth, environment (env), cache merging for real-time data
- **Correctness of technique use** — hooks, data fetching, caching, re-render control
- **UX details** — loading/error/empty states, visual distinction between environments,
  UX of real-time updates (revealing changes without interrupting the user's flow)
- **Depth of the README** — for items 3, 4, and 5 above, we look at your thinking
  process. **This is the most important part.**

## Time

Clarity of decisions matters more than completeness.
Even if you don't finish every screen, it's enough if your decisions and reasoning
are well organized in the README.

Please submit within **5 days** from the start date (actual working time should
not exceed the recommended time above).
