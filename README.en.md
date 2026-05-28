# Payment Platform Admin Dashboard

## 1. Screenshots

* Notion: https://pouncing-jaguar-da7.notion.site/36e5d4f5ac7a803589e5f9770ae441d1?source=copy_link

---

## 2. How to Run

### Run Mock Server

```bash
cd mock-server
npm install
npm start
```

### Run Web App

```bash
# after starting mock-server
npm install
npm run dev
```

---

## 3. Development History

The development process and commit history are organized sequentially in Github Issues.

* View Issues: https://github.com/iafan1229/payment-system/issues

---

## 4. Project Structure

### Architecture

This project uses a Feature-first architecture pattern.

### Why Feature-first?

* Related files are grouped together by feature.
* Easier to identify the scope of changes when modifying a specific feature.
* Clear separation of concerns.
* New features can be added consistently with the same structure.
* Designed with scalability in mind for potential future migration to Feature-Sliced Design (FSD).

```txt
features/
  auth/
    api/
    components/
    hooks/
    store/
    types/

  transactions/
    api/
    components/
      list/
      detail/
        sections/
    hooks/
    lib/
    types/

shared/
  api/
  components/
  hooks/
  lib/
```

---

## 5. Main Libraries & Reasons for Selection

### Tailwind CSS

#### Why Tailwind CSS?

* Enables rapid UI development with a utility-first approach.
* CSS is generated at build time, reducing runtime overhead.
* Minimizes the maintenance cost of separate CSS files.

---

### TanStack Query

#### Why TanStack Query?

* Efficient server-state management.
* Implemented cursor-based pagination using `useInfiniteQuery`.
* Implemented near real-time updates using `refetchInterval`.

---

### Zustand

#### Why Zustand?

* Lightweight and simple client-state management.
* Less boilerplate compared to Redux.
* Suitable for managing minimal global state such as authentication.
* Added intentionally with scalability in mind, anticipating future global states such as user, filter, and modal management.

---

## 6. Environment State Management

`sandbox` / `production` environment states are managed through URL query parameters.

### Why?

* The current screen state is explicitly reflected in the URL.
* Easier to refresh, bookmark, share, and reproduce QA scenarios.
* Keeps the environment context consistent between list and detail pages.

---

## 7. Near Real-time Updates

Implemented polling every 5 seconds using TanStack Query’s `refetchInterval`.

### Why Polling?

* SSE requires additional endpoints and reconnection handling, which increases implementation complexity.
* WebSocket introduces additional overhead for a relatively small-scale assignment.
* Polling is the simplest implementation approach, and a 5-second interval was considered acceptable in terms of performance cost.

---

## 8. API Specification Improvement Suggestions

### Inconsistent Environment Passing Strategy

The Transaction List API uses query parameters, while the Transaction Detail API uses the `X-Environment` header.

```txt
GET /api/transactions?env=sandbox
→ list API uses query parameters

GET /api/transactions/:id
X-Environment: sandbox
→ detail API uses request headers
```

Since both APIs represent the same resource (`/api/transactions`), using different environment-passing strategies reduces API consistency.

---

### Transaction Status Flow Adjustment

The failed transaction flow after `authorized` was adjusted as follows:

```txt
created -> authorized -> capture_failed
```

Original flow:

```txt
authorized -> pending -> authorization_failed
```

#### Reason

`pending` already implies that authorization has been completed, so transitioning to `authorization_failed` afterward felt semantically inconsistent.

---

### Seed Data: Fixed Created Timestamp

The original `seed.js` used `Date.now()`, causing generated timestamps to change on every execution.

#### Problem

* `db.json` changed every time.
* Difficult to use as stable snapshot or review data.

#### Improvement

Modified the seed generation to use fixed timestamps so that the same dataset is generated consistently.

---

### Seed Data: Recent 30-day Range Fix

The original implementation could generate transactions outside the intended 30-day range when the transaction count exceeded 30.

#### Improvement

Adjusted the logic so that all generated data remains strictly within the recent 30-day range (4/22 ~ 5/22).

---

## 9. Additional Decisions Beyond the Specification

### Persist Login State After Refresh

Authentication tokens are stored in HttpOnly cookies.

On app initialization:

* `getMe()` is called to validate the cookie session.
* If valid, the user state is restored into the auth store.

As a result, the login session persists after page refresh.

---

### Persist Environment After Refresh

The selected environment state is persisted in `localStorage`.

---

### Real-time New Transaction Detection

Implemented polling every 5 seconds using `refetchInterval` to detect newly created transactions.

---

### Production Switch Confirmation Modal

A confirmation modal is displayed when switching to the Production environment.

---

### Real-time Detail Page Synchronization

If transaction data changes while viewing the detail page, the latest data is re-fetched and reflected in the UI automatically.

---

## 10. Intentionally Simplified or Omitted Areas

### Token Expiration Handling

Given more time, I would additionally implement:

* Access token expiration handling
* Automatic logout
* Refresh token-based reissuance flow

However, since this assignment used a mock token-based authentication structure, implementing a full token expiration flow was considered beyond the intended scope.
