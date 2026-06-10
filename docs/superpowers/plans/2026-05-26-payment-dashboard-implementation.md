# 결제 대시보드 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** cookie 기반 인증, URL 기반 환경 상태, React Query 기반 거래 데이터 흐름을 갖춘 결제 대시보드 프론트엔드와 필요한 mock-server API를 구현한다.

**Architecture:** 루트에는 Next.js App Router 프론트엔드를 만들고, `mock-server/`는 별도 프로세스로 유지한다. 인증은 `httpOnly` cookie + `/api/auth/me` 복원 흐름으로 구성하고, 전역 클라이언트 상태는 `user`와 세션 해석 상태만 Zustand에 둔다. 트랜잭션 목록/상세는 React Query가 소유하며, `env`는 URL을 기준으로 하고 `localStorage`는 URL이 비어 있을 때만 보조적으로 쓴다.

**Tech Stack:** Next.js, TypeScript, React Query, Zustand, Vitest, Testing Library, mock-server(Node + json-server)

---

## 파일 구조

### 루트 프론트엔드

- 생성: `package.json`
  - 프론트엔드 의존성, 스크립트 정의
- 생성: `tsconfig.json`
  - TypeScript 설정
- 생성: `next.config.mjs`
  - Next.js 설정
- 생성: `next-env.d.ts`
  - Next 타입 선언
- 생성: `vitest.config.ts`
  - 단위 테스트 설정
- 생성: `test/setup.ts`
  - Testing Library, jsdom 공통 설정
- 생성: `app/layout.tsx`
  - 전역 레이아웃, Provider 마운트
- 생성: `app/globals.css`
  - 기본 스타일
- 생성: `app/page.tsx`
  - 루트에서 `/transactions` 또는 `/login`으로 보내는 진입 페이지
- 생성: `app/login/page.tsx`
  - 로그인 화면
- 생성: `app/(protected)/layout.tsx`
  - 보호된 라우트 셸
- 생성: `app/(protected)/transactions/page.tsx`
  - 거래 목록 화면
- 생성: `app/(protected)/transactions/[id]/page.tsx`
  - 거래 상세 화면
- 생성: `components/auth/LoginForm.tsx`
  - 로그인 폼 UI
- 생성: `components/auth/auth-bootstrap.tsx`
  - 앱 시작 시 세션 복원
- 생성: `components/transactions/EnvSwitcher.tsx`
  - 환경 전환 UI
- 생성: `components/transactions/TransactionsTable.tsx`
  - 거래 목록 테이블
- 생성: `components/transactions/TransactionDetailView.tsx`
  - 거래 상세 본문
- 생성: `providers/app-providers.tsx`
  - React Query Provider 및 공통 클라이언트 프로바이더
- 생성: `stores/auth-store.ts`
  - Zustand auth store
- 생성: `lib/http.ts`
  - `credentials: 'include'`가 기본인 fetch 래퍼
- 생성: `lib/auth-api.ts`
  - login / me / logout API 함수
- 생성: `lib/transactions-api.ts`
  - 거래 목록/상세 API 함수
- 생성: `lib/env.ts`
  - env 파싱/정규화/저장 유틸
- 생성: `hooks/use-env.ts`
  - URL + localStorage fallback을 다루는 env 훅
- 생성: `hooks/use-auth-bootstrap.ts`
  - `/api/auth/me` 기반 세션 부트스트랩 훅
- 생성: `test/lib/env.test.ts`
  - env 유틸 테스트
- 생성: `test/stores/auth-store.test.ts`
  - auth store 테스트
- 생성: `test/components/LoginForm.test.tsx`
  - 로그인 폼 동작 테스트

### mock-server

- 수정: `mock-server/server.js`
  - `/api/auth/me`, `/api/auth/logout` 추가
- 수정: `mock-server/README.md`
  - 인증 흐름 문서 업데이트
- 수정: `mock-server/test/server.test.js`
  - me/logout 쿠키 세션 테스트 추가

---

### Task 1: mock-server 세션 복원 API 추가

**Files:**
- Modify: `mock-server/server.js`
- Modify: `mock-server/README.md`
- Test: `mock-server/test/server.test.js`

- [ ] **Step 1: `/api/auth/me`와 `/api/auth/logout`의 failing test를 먼저 추가**

```js
const http = require('node:http');
const { server } = require('../server');

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
          app.close(() => resolve({ status: res.statusCode, headers: res.headers, body: data }));
        });
      });
      req.on('error', reject);
      if (body) req.write(body);
      req.end();
    });
  });
}

test('GET /api/auth/me returns 401 when the auth cookie is missing', async () => {
  const response = await request('GET', '/api/auth/me');
  assert.equal(response.status, 401);
});

test('GET /api/auth/me returns the current user when the auth cookie is valid', async () => {
  const login = await request(
    'POST',
    '/api/auth/login',
    { 'Content-Type': 'application/json' },
    JSON.stringify({ email: 'demo@test.com', password: 'password123' })
  );
  const cookie = login.headers['set-cookie'][0];
  const me = await request('GET', '/api/auth/me', { Cookie: cookie });

  assert.equal(me.status, 200);
  assert.equal(JSON.parse(me.body).user.email, 'demo@test.com');
});

test('POST /api/auth/logout clears the auth cookie', async () => {
  const login = await request(
    'POST',
    '/api/auth/login',
    { 'Content-Type': 'application/json' },
    JSON.stringify({ email: 'demo@test.com', password: 'password123' })
  );
  const cookie = login.headers['set-cookie'][0];
  const logout = await request('POST', '/api/auth/logout', { Cookie: cookie });

  assert.equal(logout.status, 200);
  assert.match(logout.headers['set-cookie'][0], /Max-Age=0/);
});
```

- [ ] **Step 2: 테스트가 실제로 실패하는지 확인**

Run: `cd /Users/hylee/Desktop/payment-system/mock-server && npm test`  
Expected: `GET /api/auth/me` 또는 `POST /api/auth/logout` 관련 테스트가 `404` 또는 예상과 다른 응답으로 실패

- [ ] **Step 3: 최소 구현으로 `/api/auth/me`와 `/api/auth/logout` 추가**

```js
function buildExpiredAuthCookie() {
  return [
    `${AUTH_COOKIE_NAME}=`,
    'HttpOnly',
    'Path=/',
    'SameSite=Lax',
    'Max-Age=0',
  ].join('; ');
}

server.get('/api/auth/me', requireAuth, (req, res) => {
  return res.json({
    user: { id: VALID_USER.id, name: VALID_USER.name, email: VALID_USER.email },
  });
});

server.post('/api/auth/logout', (req, res) => {
  res.setHeader('Set-Cookie', buildExpiredAuthCookie());
  return res.json({ ok: true });
});
```

- [ ] **Step 4: mock-server README를 새 인증 흐름에 맞게 수정**

````md
### `GET /api/auth/me`

Authenticated via cookie (`credentials: 'include'` in the browser)

```json
Response: { "user": { "id": "...", "name": "...", "email": "..." } }
```

### `POST /api/auth/logout`

Authenticated via cookie (`credentials: 'include'` in the browser)

```json
Response: { "ok": true }
```
````

- [ ] **Step 5: 테스트를 다시 실행해서 통과 확인**

Run: `cd /Users/hylee/Desktop/payment-system/mock-server && npm test`  
Expected: `server.test.js` 전체 통과

- [ ] **Step 6: 커밋**

```bash
git add /Users/hylee/Desktop/payment-system/mock-server/server.js /Users/hylee/Desktop/payment-system/mock-server/README.md /Users/hylee/Desktop/payment-system/mock-server/test/server.test.js
git commit -m "feat: add mock auth session endpoints"
```

### Task 2: Next.js 프론트엔드 스캐폴딩

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.mjs`
- Create: `next-env.d.ts`
- Create: `vitest.config.ts`
- Create: `test/setup.ts`
- Create: `app/layout.tsx`
- Create: `app/globals.css`
- Create: `app/page.tsx`

- [ ] **Step 1: 프론트엔드 패키지 파일 생성**

```json
{
  "name": "test-payment-dashboard",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@tanstack/react-query": "^5.59.0",
    "next": "^15.0.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "zustand": "^5.0.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.0.1",
    "@testing-library/user-event": "^14.5.2",
    "@types/node": "^22.8.1",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "jsdom": "^25.0.1",
    "typescript": "^5.6.3",
    "vitest": "^2.1.4"
  }
}
```

- [ ] **Step 2: 타입스크립트/테스트 설정 파일 생성**

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "es2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname),
    },
  },
});
```

```js
// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {};

export default nextConfig;
```

```ts
// next-env.d.ts
/// <reference types="next" />
/// <reference types="next/image-types/global" />
```

```ts
// test/setup.ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 3: 최소 App Router 뼈대 생성**

```tsx
// app/layout.tsx
import './globals.css';
import type { ReactNode } from 'react';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
```

```tsx
// app/page.tsx
import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/transactions');
}
```

- [ ] **Step 4: 의존성 설치**

Run: `cd /Users/hylee/Desktop/payment-system && npm install`  
Expected: 루트 `node_modules`, `package-lock.json` 생성

- [ ] **Step 5: 타입 검사로 스캐폴딩 검증**

Run: `cd /Users/hylee/Desktop/payment-system && npm run typecheck`  
Expected: `0 errors`

- [ ] **Step 6: 커밋**

```bash
git add /Users/hylee/Desktop/payment-system/package.json /Users/hylee/Desktop/payment-system/package-lock.json /Users/hylee/Desktop/payment-system/tsconfig.json /Users/hylee/Desktop/payment-system/next.config.mjs /Users/hylee/Desktop/payment-system/next-env.d.ts /Users/hylee/Desktop/payment-system/vitest.config.ts /Users/hylee/Desktop/payment-system/test/setup.ts /Users/hylee/Desktop/payment-system/app/layout.tsx /Users/hylee/Desktop/payment-system/app/globals.css /Users/hylee/Desktop/payment-system/app/page.tsx
git commit -m "feat: scaffold next dashboard app"
```

### Task 3: auth store와 세션 부트스트랩

**Files:**
- Create: `stores/auth-store.ts`
- Create: `lib/http.ts`
- Create: `lib/auth-api.ts`
- Create: `hooks/use-auth-bootstrap.ts`
- Create: `providers/app-providers.tsx`
- Modify: `app/layout.tsx`
- Test: `test/stores/auth-store.test.ts`

- [ ] **Step 1: auth store의 failing test 작성**

```ts
import { describe, expect, it } from 'vitest';
import { useAuthStore } from '@/stores/auth-store';

describe('auth store', () => {
  it('stores the current user', () => {
    useAuthStore.getState().setUser({
      id: 'usr_demo',
      name: 'Demo Merchant',
      email: 'demo@test.com',
    });

    expect(useAuthStore.getState().user?.email).toBe('demo@test.com');
    expect(useAuthStore.getState().isAuthResolved).toBe(true);
  });

  it('clears the current user', () => {
    useAuthStore.getState().clearUser();
    expect(useAuthStore.getState().user).toBeNull();
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `cd /Users/hylee/Desktop/payment-system && npm test -- test/stores/auth-store.test.ts`  
Expected: `Cannot find module '@/stores/auth-store'` 또는 유사한 실패

- [ ] **Step 3: auth store 최소 구현**

```ts
import { create } from 'zustand';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
};

type AuthState = {
  user: AuthUser | null;
  isAuthResolved: boolean;
  setUser: (user: AuthUser) => void;
  clearUser: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthResolved: false,
  setUser: (user) => set({ user, isAuthResolved: true }),
  clearUser: () => set({ user: null, isAuthResolved: true }),
}));
```

- [ ] **Step 4: 공통 fetch와 auth API 함수 추가**

```ts
// lib/http.ts
export async function http<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`http://localhost:4000${input}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error ?? 'Request failed');
  }

  return response.json() as Promise<T>;
}
```

```ts
// lib/auth-api.ts
import { http } from '@/lib/http';
import type { AuthUser } from '@/stores/auth-store';

export function login(input: { email: string; password: string }) {
  return http<{ user: AuthUser }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function getMe() {
  return http<{ user: AuthUser }>('/api/auth/me');
}

export function logout() {
  return http<{ ok: true }>('/api/auth/logout', {
    method: 'POST',
  });
}
```

- [ ] **Step 5: auth bootstrap 훅과 Provider 추가**

```tsx
// hooks/use-auth-bootstrap.ts
'use client';

import { useEffect } from 'react';
import { getMe } from '@/lib/auth-api';
import { useAuthStore } from '@/stores/auth-store';

export function useAuthBootstrap() {
  const setUser = useAuthStore((state) => state.setUser);
  const clearUser = useAuthStore((state) => state.clearUser);

  useEffect(() => {
    getMe()
      .then(({ user }) => setUser(user))
      .catch(() => clearUser());
  }, [setUser, clearUser]);
}
```

```tsx
// providers/app-providers.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { useAuthBootstrap } from '@/hooks/use-auth-bootstrap';

export function AppProviders({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient());
  useAuthBootstrap();

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
```

- [ ] **Step 6: 루트 레이아웃에 Provider 연결**

```tsx
import './globals.css';
import type { ReactNode } from 'react';
import { AppProviders } from '@/providers/app-providers';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
```

- [ ] **Step 7: 테스트 재실행**

Run: `cd /Users/hylee/Desktop/payment-system && npm test -- test/stores/auth-store.test.ts`  
Expected: PASS

- [ ] **Step 8: 커밋**

```bash
git add /Users/hylee/Desktop/payment-system/stores/auth-store.ts /Users/hylee/Desktop/payment-system/lib/http.ts /Users/hylee/Desktop/payment-system/lib/auth-api.ts /Users/hylee/Desktop/payment-system/hooks/use-auth-bootstrap.ts /Users/hylee/Desktop/payment-system/providers/app-providers.tsx /Users/hylee/Desktop/payment-system/app/layout.tsx /Users/hylee/Desktop/payment-system/test/stores/auth-store.test.ts
git commit -m "feat: add auth bootstrap flow"
```

### Task 4: URL 기반 env 유틸과 훅

**Files:**
- Create: `lib/env.ts`
- Create: `hooks/use-env.ts`
- Test: `test/lib/env.test.ts`

- [ ] **Step 1: env 유틸의 failing test 작성**

```ts
import { describe, expect, it } from 'vitest';
import { normalizeEnv, resolveInitialEnv } from '@/lib/env';

describe('env helpers', () => {
  it('normalizes invalid values to sandbox', () => {
    expect(normalizeEnv('staging')).toBe('sandbox');
  });

  it('prefers the URL value over localStorage', () => {
    expect(resolveInitialEnv('production', 'sandbox')).toBe('production');
  });

  it('falls back to localStorage when URL is missing', () => {
    expect(resolveInitialEnv(null, 'production')).toBe('production');
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `cd /Users/hylee/Desktop/payment-system && npm test -- test/lib/env.test.ts`  
Expected: `Cannot find module '@/lib/env'`

- [ ] **Step 3: env 유틸 구현**

```ts
export type Env = 'sandbox' | 'production';

export function normalizeEnv(value: string | null | undefined): Env {
  return value === 'production' ? 'production' : 'sandbox';
}

export function resolveInitialEnv(
  searchParamValue: string | null,
  storedValue: string | null
): Env {
  if (searchParamValue) return normalizeEnv(searchParamValue);
  if (storedValue) return normalizeEnv(storedValue);
  return 'sandbox';
}
```

- [ ] **Step 4: URL + localStorage fallback 훅 구현**

```tsx
'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { normalizeEnv, resolveInitialEnv, type Env } from '@/lib/env';

const STORAGE_KEY = 'test:last-env';

export function useEnv() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const env = normalizeEnv(searchParams.get('env'));

  useEffect(() => {
    const current = searchParams.get('env');
    if (current) {
      window.localStorage.setItem(STORAGE_KEY, env);
      return;
    }

    const fallback = resolveInitialEnv(current, window.localStorage.getItem(STORAGE_KEY));
    const next = new URLSearchParams(searchParams.toString());
    next.set('env', fallback);
    router.replace(`${pathname}?${next.toString()}`);
  }, [env, pathname, router, searchParams]);

  function setEnv(nextEnv: Env) {
    const next = new URLSearchParams(searchParams.toString());
    next.set('env', nextEnv);
    window.localStorage.setItem(STORAGE_KEY, nextEnv);
    router.push(`${pathname}?${next.toString()}`);
  }

  return { env, setEnv };
}
```

- [ ] **Step 5: 테스트 재실행**

Run: `cd /Users/hylee/Desktop/payment-system && npm test -- test/lib/env.test.ts`  
Expected: PASS

- [ ] **Step 6: 커밋**

```bash
git add /Users/hylee/Desktop/payment-system/lib/env.ts /Users/hylee/Desktop/payment-system/hooks/use-env.ts /Users/hylee/Desktop/payment-system/test/lib/env.test.ts
git commit -m "feat: add url-based env helpers"
```

### Task 5: 로그인 페이지와 보호 레이아웃

**Files:**
- Create: `components/auth/LoginForm.tsx`
- Create: `app/login/page.tsx`
- Create: `app/(protected)/layout.tsx`
- Test: `test/components/LoginForm.test.tsx`

- [ ] **Step 1: 로그인 폼 failing test 작성**

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { LoginForm } from '@/components/auth/LoginForm';

test('submits email and password', async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn().mockResolvedValue(undefined);

  render(<LoginForm onSubmit={onSubmit} isPending={false} error={null} />);

  await user.type(screen.getByLabelText('이메일'), 'demo@test.com');
  await user.type(screen.getByLabelText('비밀번호'), 'password123');
  await user.click(screen.getByRole('button', { name: '로그인' }));

  expect(onSubmit).toHaveBeenCalledWith({
    email: 'demo@test.com',
    password: 'password123',
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `cd /Users/hylee/Desktop/payment-system && npm test -- test/components/LoginForm.test.tsx`  
Expected: `Cannot find module '@/components/auth/LoginForm'`

- [ ] **Step 3: 로그인 폼 최소 구현**

```tsx
'use client';

import { useState, type FormEvent } from 'react';

type LoginFormProps = {
  onSubmit: (input: { email: string; password: string }) => Promise<void>;
  isPending: boolean;
  error: string | null;
};

export function LoginForm({ onSubmit, isPending, error }: LoginFormProps) {
  const [email, setEmail] = useState('demo@test.com');
  const [password, setPassword] = useState('password123');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit({ email, password });
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        이메일
        <input value={email} onChange={(event) => setEmail(event.target.value)} />
      </label>
      <label>
        비밀번호
        <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
      </label>
      {error ? <p>{error}</p> : null}
      <button type="submit" disabled={isPending}>
        로그인
      </button>
    </form>
  );
}
```

- [ ] **Step 4: `/login` 페이지 구현**

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { login } from '@/lib/auth-api';
import { useAuthStore } from '@/stores/auth-store';

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(input: { email: string; password: string }) {
    setIsPending(true);
    setError(null);
    try {
      const { user } = await login(input);
      setUser(user);
      router.push('/transactions');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '로그인에 실패했습니다.');
    } finally {
      setIsPending(false);
    }
  }

  return <LoginForm onSubmit={handleLogin} isPending={isPending} error={error} />;
}
```

- [ ] **Step 5: 보호 레이아웃 구현**

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useAuthStore } from '@/stores/auth-store';

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthResolved = useAuthStore((state) => state.isAuthResolved);

  useEffect(() => {
    if (isAuthResolved && !user) {
      router.replace('/login');
    }
  }, [isAuthResolved, router, user]);

  if (!isAuthResolved) {
    return <p>세션 확인 중...</p>;
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
```

- [ ] **Step 6: 테스트 재실행**

Run: `cd /Users/hylee/Desktop/payment-system && npm test -- test/components/LoginForm.test.tsx`  
Expected: PASS

- [ ] **Step 7: 커밋**

```bash
git add /Users/hylee/Desktop/payment-system/components/auth/LoginForm.tsx /Users/hylee/Desktop/payment-system/app/login/page.tsx /Users/hylee/Desktop/payment-system/app/(protected)/layout.tsx /Users/hylee/Desktop/payment-system/test/components/LoginForm.test.tsx
git commit -m "feat: add login page and protected layout"
```

### Task 6: 거래 목록 페이지와 polling

**Files:**
- Create: `lib/transactions-api.ts`
- Create: `components/transactions/EnvSwitcher.tsx`
- Create: `components/transactions/TransactionsTable.tsx`
- Create: `app/(protected)/transactions/page.tsx`

- [ ] **Step 1: 거래 목록 API 함수 구현**

```ts
import { http } from '@/lib/http';
import type { Env } from '@/lib/env';

export type TransactionRow = {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  customer: { name: string; email: string };
  created_at: string;
};

export type TransactionsPage = {
  data: TransactionRow[];
  has_more: boolean;
  next_cursor: string | null;
};

export function getTransactions(env: Env, cursor?: string | null) {
  const search = new URLSearchParams({ env, limit: '20' });
  if (cursor) search.set('cursor', cursor);
  return http<TransactionsPage>(`/api/transactions?${search.toString()}`);
}
```

- [ ] **Step 2: env 전환 UI 구현**

```tsx
'use client';

import type { Env } from '@/lib/env';

export function EnvSwitcher({
  env,
  onChange,
}: {
  env: Env;
  onChange: (env: Env) => void;
}) {
  return (
    <div>
      <button
        type="button"
        aria-pressed={env === 'sandbox'}
        onClick={() => onChange('sandbox')}
      >
        Sandbox
      </button>
      <button
        type="button"
        aria-pressed={env === 'production'}
        onClick={() => onChange('production')}
      >
        Production
      </button>
    </div>
  );
}
```

- [ ] **Step 3: 거래 테이블 구현**

```tsx
import type { TransactionRow } from '@/lib/transactions-api';

export function TransactionsTable({
  rows,
  onSelect,
}: {
  rows: TransactionRow[];
  onSelect: (id: string) => void;
}) {
  return (
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>금액</th>
          <th>통화</th>
          <th>상태</th>
          <th>고객</th>
          <th>생성 시각</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id} onClick={() => onSelect(row.id)}>
            <td>{row.id}</td>
            <td>{row.amount}</td>
            <td>{row.currency}</td>
            <td>{row.status}</td>
            <td>{row.customer.name}</td>
            <td>{row.created_at}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

- [ ] **Step 4: 목록 페이지와 polling 연결**

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { EnvSwitcher } from '@/components/transactions/EnvSwitcher';
import { TransactionsTable } from '@/components/transactions/TransactionsTable';
import { useEnv } from '@/hooks/use-env';
import { getTransactions } from '@/lib/transactions-api';

export default function TransactionsPage() {
  const router = useRouter();
  const { env, setEnv } = useEnv();
  const query = useQuery({
    queryKey: ['transactions', env],
    queryFn: () => getTransactions(env),
    refetchInterval: 5000,
  });

  if (query.isLoading) return <p>목록을 불러오는 중...</p>;
  if (query.isError) return <p>{query.error.message}</p>;

  return (
    <section>
      <EnvSwitcher env={env} onChange={setEnv} />
      <TransactionsTable
        rows={query.data.data}
        onSelect={(id) => router.push(`/transactions/${id}?env=${env}`)}
      />
    </section>
  );
}
```

- [ ] **Step 5: 목록 페이지 검증**

Run: `cd /Users/hylee/Desktop/payment-system && npm run typecheck`  
Expected: PASS

- [ ] **Step 6: 커밋**

```bash
git add /Users/hylee/Desktop/payment-system/lib/transactions-api.ts /Users/hylee/Desktop/payment-system/components/transactions/EnvSwitcher.tsx /Users/hylee/Desktop/payment-system/components/transactions/TransactionsTable.tsx /Users/hylee/Desktop/payment-system/app/(protected)/transactions/page.tsx
git commit -m "feat: add transaction list page"
```

### Task 7: 거래 상세 페이지와 조건부 polling

**Files:**
- Create: `components/transactions/TransactionDetailView.tsx`
- Modify: `lib/transactions-api.ts`
- Create: `app/(protected)/transactions/[id]/page.tsx`

- [ ] **Step 1: 상세 API 함수 추가**

```ts
export type TransactionDetail = TransactionRow & {
  payment_method: {
    type: string;
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
  events: Array<{ type: string; at: string }>;
  metadata: Record<string, string>;
};

export function getTransactionDetail(env: Env, id: string) {
  return http<TransactionDetail>(`/api/transactions/${id}?env=${env}`);
}
```

- [ ] **Step 2: 상세 본문 컴포넌트 구현**

```tsx
import type { TransactionDetail } from '@/lib/transactions-api';

export function TransactionDetailView({ detail }: { detail: TransactionDetail }) {
  return (
    <section>
      <h1>{detail.id}</h1>
      <p>상태: {detail.status}</p>
      <p>금액: {detail.amount}</p>
      <p>고객: {detail.customer.name}</p>
      <p>
        카드: {detail.payment_method.brand} •••• {detail.payment_method.last4}
      </p>
      <ul>
        {detail.events.map((event) => (
          <li key={`${event.type}-${event.at}`}>
            {event.type} - {event.at}
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 3: 상세 페이지와 조건부 polling 구현**

```tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { TransactionDetailView } from '@/components/transactions/TransactionDetailView';
import { useEnv } from '@/hooks/use-env';
import { getTransactionDetail } from '@/lib/transactions-api';

export default function TransactionDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { env } = useEnv();

  const query = useQuery({
    queryKey: ['transaction', env, params.id],
    queryFn: () => getTransactionDetail(env, params.id),
    refetchInterval: (state) =>
      state.state.data?.status === 'pending' ? 5000 : false,
  });

  if (query.isLoading) return <p>상세를 불러오는 중...</p>;
  if (query.isError) return <p>{query.error.message}</p>;

  return (
    <section>
      <button type="button" onClick={() => router.push(`/transactions?env=${env}`)}>
        목록으로
      </button>
      <TransactionDetailView detail={query.data} />
    </section>
  );
}
```

- [ ] **Step 4: 상세 페이지 검증**

Run: `cd /Users/hylee/Desktop/payment-system && npm run typecheck`  
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add /Users/hylee/Desktop/payment-system/lib/transactions-api.ts /Users/hylee/Desktop/payment-system/components/transactions/TransactionDetailView.tsx /Users/hylee/Desktop/payment-system/app/(protected)/transactions/[id]/page.tsx
git commit -m "feat: add transaction detail page"
```

### Task 8: README 정리와 최종 검증

**Files:**
- Modify: `README.ko.md`
- Modify: `README.en.md`

- [ ] **Step 1: README에 실행 방법과 의사결정 근거 추가**

```md
## 실행 방법

1. `cd mock-server && npm install && npm start`
2. 새 터미널에서 `npm install`
3. `npm run dev`

## 주요 선택

- 인증 토큰은 `httpOnly` cookie로 보관했다.
- `user`만 Zustand에 저장하고, 트랜잭션은 React Query가 관리한다.
- `env`는 URL이 기준값이고, URL이 없을 때만 `localStorage`를 보조적으로 사용한다.
- 준실시간 갱신은 polling으로 구현했다.
```

- [ ] **Step 2: 전체 타입/테스트 검증**

Run: `cd /Users/hylee/Desktop/payment-system && npm run typecheck && npm test && cd mock-server && npm test`  
Expected: 세 명령 모두 PASS

- [ ] **Step 3: 수동 시나리오 점검**

Run:

```bash
cd /Users/hylee/Desktop/payment-system/mock-server && npm start
cd /Users/hylee/Desktop/payment-system && npm run dev
```

확인할 것:

- 로그인 성공/실패
- 새로고침 후 세션 유지
- env 전환
- 목록 polling 반영
- 상세 `pending`일 때만 polling

- [ ] **Step 4: 커밋**

```bash
git add /Users/hylee/Desktop/payment-system/README.ko.md /Users/hylee/Desktop/payment-system/README.en.md
git commit -m "docs: add dashboard implementation notes"
```

## 셀프 리뷰

### 스펙 커버리지

- 인증/login/me/logout: Task 1, Task 3, Task 5
- 세션 유지: Task 1, Task 3
- env URL + localStorage fallback: Task 4
- 목록 polling: Task 6
- 상세 conditional polling: Task 7
- README 설명 강화: Task 8

누락된 요구사항은 없다.

### placeholder 점검

- `TODO`, `TBD`, `implement later` 같은 placeholder는 넣지 않았다.
- 각 Task에 파일 경로, 코드 블록, 실행 명령, 기대 결과를 넣었다.

### 타입/이름 일관성 점검

- Zustand auth 상태는 `user`, `isAuthResolved`, `setUser`, `clearUser`로 문서 전체에서 일관되게 사용했다.
- env 타입은 `Env = 'sandbox' | 'production'`으로 유지했다.
- React Query key는 목록 `['transactions', env]`, 상세 `['transaction', env, id]`로 유지했다.
