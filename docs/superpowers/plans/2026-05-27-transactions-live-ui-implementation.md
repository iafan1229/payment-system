# 트랜잭션 라이브 UI 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `transactions` 목록/상세 화면에 환경별 시각 분리, `production` 진입 확인, 새 거래 큐잉, 상세 실시간 반영 규칙을 추가해 읽기 흐름을 유지하면서도 라이브 변화를 놓치지 않게 만든다.

**Architecture:** React Query는 계속 서버 원본 데이터를 소유하고, 라이브 UX는 페이지 로컬 상태와 순수 diff 유틸로 조합한다. Tailwind를 거래 화면부터 도입해 `sandbox`와 `production`의 첫인상을 분리하고, 환경 전환 규칙은 `lib/env.ts`에 모아 목록/상세가 같은 경로 해석을 공유하게 만든다.

**Tech Stack:** Next.js App Router, React 19, TypeScript, React Query, Zustand, Tailwind CSS, existing mock-server APIs

**Implementation note:** 사용자 요청에 따라 이 문서는 테스트 단계와 테스트 체크리스트를 포함하지 않는다.

---

## 파일 구조

### 스타일 / 설정

- 수정: `package.json`
  - Tailwind 의존성 추가
- 생성: `postcss.config.mjs`
  - Tailwind PostCSS 파이프라인 활성화
- 수정: `app/globals.css`
  - Tailwind 엔트리 선언, 기존 공통 셸 스타일 유지, 거래 전용 레거시 규칙 정리

### 환경 전환 / 경로 해석

- 수정: `lib/env.ts`
  - env 정규화, 저장 키, 상세 경로 판별, 환경 전환 대상 URL 생성
- 수정: `hooks/use-env.ts`
  - URL + localStorage 동기화, 상세 경로에서 env 변경 시 목록으로 우회
- 수정: `components/transactions/EnvSwitcher.tsx`
  - segmented control과 `production` 확인 패널 렌더링

### 목록 라이브 UX

- 생성: `lib/transactions-live.ts`
  - 목록 diff, 큐 적재, 하이라이트 대상 계산
- 생성: `components/transactions/EnvironmentContextStrip.tsx`
  - 현재 환경 설명 스트립
- 생성: `components/transactions/TransactionsLiveBar.tsx`
  - 마지막 동기화, 새 거래 수, 상태 변경 수, 오류 상태 노출
- 생성: `components/transactions/NewTransactionsBanner.tsx`
  - 큐에 쌓인 새 거래를 수동 반영하는 sticky 배너
- 수정: `components/transactions/TransactionsTable.tsx`
  - env별 톤, 새 row / 상태 변경 하이라이트, env별 empty copy 반영
- 수정: `app/(protected)/transactions/page.tsx`
  - 목록 페이지 로컬 상태, near-top 판정, 큐 flush, `production` 확인 플로우 연결

### 상세 라이브 UX

- 생성: `lib/transaction-detail-live.ts`
  - 상세 diff, 즉시 반영 필드와 적용 대기 필드 분리
- 생성: `components/transactions/TransactionDetailUpdateBar.tsx`
  - 상세 상단 sticky 업데이트 바
- 생성: `components/transactions/detail/TransactionSummaryCard.tsx`
  - summary 카드와 status 하이라이트
- 생성: `components/transactions/detail/TransactionTimelineCard.tsx`
  - timeline 카드와 새 event 강조
- 생성: `components/transactions/detail/TransactionMetadataCard.tsx`
  - metadata 카드와 적용 대기 액션
- 생성: `components/transactions/detail/TransactionPaymentMethodCard.tsx`
  - payment method 카드와 적용 후 강조
- 수정: `components/transactions/TransactionDetailView.tsx`
  - 상세 카드 조립, pending patch 전달
- 수정: `app/(protected)/transactions/[id]/page.tsx`
  - 5초 polling 유지, pending patch 상태, foreground refetch, 업데이트 바 연결

---

### Task 1: Tailwind 기반 거래 화면 토대 추가

**Files:**
- Modify: `package.json`
- Create: `postcss.config.mjs`
- Modify: `app/globals.css`

- [ ] **Step 1: `package.json`에 Tailwind 의존성을 추가한다**

```json
{
  "devDependencies": {
    "@tailwindcss/postcss": "^4.1.0",
    "tailwindcss": "^4.1.0"
  }
}
```

- [ ] **Step 2: `postcss.config.mjs`를 생성해 Next.js가 Tailwind를 읽게 한다**

```js
const config = {
  plugins: {
    '@tailwindcss/postcss': {}
  }
};

export default config;
```

- [ ] **Step 3: `app/globals.css` 상단을 Tailwind 엔트리로 바꾸고 공통 토큰은 그대로 남긴다**

```css
@import "tailwindcss";

:root {
  --background: #f6efe6;
  --foreground: #1f1d1a;
  --muted: #6e645b;
}
```

- [ ] **Step 4: 거래 화면이 Tailwind 유틸 클래스로 이동하면 `.env-switcher`, `.transactions-table`, `.detail-grid` 같은 거래 전용 레거시 규칙은 `app/globals.css`에서 제거한다**

```css
/* 유지: topbar, protected-shell, feedback-card, secondary-button */
/* 제거 대상: env-switcher, env-option, env-chip, transactions-table, detail-grid */
```

### Task 2: 환경 전환 규칙과 `production` 확인 흐름 고정

**Files:**
- Modify: `lib/env.ts`
- Modify: `hooks/use-env.ts`
- Modify: `components/transactions/EnvSwitcher.tsx`
- Modify: `app/(protected)/transactions/page.tsx`

- [ ] **Step 1: `lib/env.ts`에 저장 키와 환경 전환 URL 해석 함수를 추가한다**

```ts
export const ENV_STORAGE_KEY = 'test:last-env';

export function isTransactionDetailPath(pathname: string) {
  return /^\/transactions\/[^/]+$/.test(pathname);
}

export function buildEnvUrl(pathname: string, searchParams: URLSearchParams, nextEnv: Env) {
  const next = new URLSearchParams(searchParams.toString());
  next.set('env', nextEnv);

  const targetPath = isTransactionDetailPath(pathname) ? '/transactions' : pathname;
  const query = next.toString();

  return query ? `${targetPath}?${query}` : targetPath;
}
```

- [ ] **Step 2: `use-env.ts`가 URL과 localStorage를 동기화할 때 새 helper를 쓰도록 바꾼다**

```ts
const env = normalizeEnv(currentEnvParam);
const previousEnvRef = useRef(env);

useEffect(() => {
  const storedValue = window.localStorage.getItem(ENV_STORAGE_KEY);
  const nextEnv = resolveInitialEnv(currentEnvParam, storedValue);
  window.localStorage.setItem(ENV_STORAGE_KEY, nextEnv);

  if (currentEnvParam !== nextEnv) {
    const nextSearchParams = new URLSearchParams(searchParams.toString());
    nextSearchParams.set('env', nextEnv);
    router.replace(buildEnvUrl(pathname, nextSearchParams, nextEnv));
    return;
  }

  if (isTransactionDetailPath(pathname) && previousEnvRef.current !== env) {
    router.replace(buildEnvUrl(pathname, searchParams, env));
  }

  previousEnvRef.current = env;
}, [currentEnvParam, env, pathname, router, searchParams]);
```

- [ ] **Step 3: `EnvSwitcher`를 즉시 전환 UI가 아니라 “요청을 올리는” 제어 컴포넌트로 바꾼다**

```tsx
type EnvSwitcherProps = {
  env: Env;
  pendingEnv: Env | null;
  showProductionConfirm: boolean;
  onRequestChange: (env: Env) => void;
  onConfirm: () => void;
  onCancel: () => void;
};
```

- [ ] **Step 4: `sandbox -> production`에서만 우측 상단 anchored panel을 렌더링한다**

```tsx
{showProductionConfirm ? (
  <div
    className="absolute right-0 top-[calc(100%+12px)] w-[320px] rounded-3xl border border-slate-300 bg-white p-5 shadow-2xl"
    role="dialog"
    aria-modal="false"
    aria-label="Production 거래 확인"
  >
    <h2 className="text-base font-semibold text-slate-950">Production 거래를 보시겠습니까?</h2>
    <p className="mt-2 text-sm leading-6 text-slate-600">
      실시간 실거래 상태가 표시되며, 상세 화면을 보고 있었다면 목록으로 이동합니다.
    </p>
  </div>
) : null}
```

- [ ] **Step 5: 목록 페이지에서 전환 의도를 가로채 `production` 확인 상태를 관리한다**

```tsx
const [pendingEnv, setPendingEnv] = useState<Env | null>(null);
const [showProductionConfirm, setShowProductionConfirm] = useState(false);

function handleEnvRequest(nextEnv: Env) {
  if (env === 'sandbox' && nextEnv === 'production') {
    setPendingEnv(nextEnv);
    setShowProductionConfirm(true);
    return;
  }

  setEnv(nextEnv);
}
```

- [ ] **Step 6: 확인 패널이 열리면 취소 버튼에 첫 포커스를 두고 `Esc`로 닫히게 한다**

```tsx
const cancelButtonRef = useRef<HTMLButtonElement | null>(null);

useEffect(() => {
  if (!showProductionConfirm) return;

  cancelButtonRef.current?.focus();

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      onCancel();
    }
  }

  window.addEventListener('keydown', handleKeydown);
  return () => window.removeEventListener('keydown', handleKeydown);
}, [showProductionConfirm, onCancel]);
```

### Task 3: 목록 diff 유틸과 새 거래 큐 모델을 만든다

**Files:**
- Create: `lib/transactions-live.ts`
- Modify: `lib/transactions-feed.ts`
- Modify: `app/(protected)/transactions/page.tsx`

- [ ] **Step 1: `lib/transactions-live.ts`에 새 거래 / 상태 변경 / 큐 적재 계산을 모은다**

```ts
import type { TransactionRow } from '@/lib/transactions-api';

export type TransactionsDiff = {
  newRows: TransactionRow[];
  changedRowIds: string[];
  nextRowsById: Map<string, TransactionRow>;
};

export function diffTransactions(previousRows: TransactionRow[], nextRows: TransactionRow[]): TransactionsDiff {
  const previousMap = new Map(previousRows.map((row) => [row.id, row]));
  const nextRowsById = new Map(nextRows.map((row) => [row.id, row]));

  const newRows = nextRows.filter((row) => !previousMap.has(row.id));
  const changedRowIds = nextRows
    .filter((row) => previousMap.has(row.id) && previousMap.get(row.id)?.status !== row.status)
    .map((row) => row.id);

  return { newRows, changedRowIds, nextRowsById };
}
```

- [ ] **Step 2: 아래를 읽는 중일 때는 새 row를 바로 넣지 않고 현재 보이는 row만 최신 데이터로 덮어쓴 스냅샷을 만든다**

```ts
export function preserveVisibleRows(visibleRows: TransactionRow[], diff: TransactionsDiff) {
  return visibleRows.map((row) => diff.nextRowsById.get(row.id) ?? row);
}
```

- [ ] **Step 3: `buildTransactionsFeed`는 페이지 flatten 역할만 유지하고, 목록 페이지는 diff 유틸을 함께 사용하도록 정리한다**

```ts
const serverRows = buildTransactionsFeed(query.data?.pages ?? []).rows;
const diff = diffTransactions(previousRowsRef.current, serverRows);
```

- [ ] **Step 4: 목록 페이지에 로컬 라이브 상태를 추가한다**

```tsx
const [displayRows, setDisplayRows] = useState<TransactionRow[]>([]);
const [queuedNewRows, setQueuedNewRows] = useState<TransactionRow[]>([]);
const [freshRowIds, setFreshRowIds] = useState<string[]>([]);
const [changedRowIds, setChangedRowIds] = useState<string[]>([]);
const [isNearTop, setIsNearTop] = useState(true);
```

- [ ] **Step 5: 상단 160px 근처 판정은 sentinel + `IntersectionObserver`로 고정한다**

```tsx
const topSentinelRef = useRef<HTMLDivElement | null>(null);

useEffect(() => {
  if (!topSentinelRef.current) return;

  const observer = new IntersectionObserver(
    ([entry]) => {
      setIsNearTop(entry.isIntersecting);
    },
    { root: null, rootMargin: '160px 0px 0px 0px', threshold: 0 }
  );

  observer.observe(topSentinelRef.current);
  return () => observer.disconnect();
}, []);
```

- [ ] **Step 6: poll 결과가 들어오면 near-top 여부에 따라 즉시 반영 또는 큐 적재로 분기한다**

```tsx
if (diff.newRows.length === 0 && diff.changedRowIds.length === 0) {
  setDisplayRows(serverRows);
  return;
}

if (isNearTop) {
  setDisplayRows(serverRows);
  setQueuedNewRows([]);
  setFreshRowIds(diff.newRows.map((row) => row.id));
} else {
  setDisplayRows((current) => preserveVisibleRows(current, diff));
  setQueuedNewRows((current) => [...diff.newRows, ...current]);
}

setChangedRowIds(diff.changedRowIds);
```

### Task 4: 목록 화면을 Tailwind 기반 라이브 데스크로 바꾼다

**Files:**
- Create: `components/transactions/EnvironmentContextStrip.tsx`
- Create: `components/transactions/TransactionsLiveBar.tsx`
- Create: `components/transactions/NewTransactionsBanner.tsx`
- Modify: `components/transactions/TransactionsTable.tsx`
- Modify: `app/(protected)/transactions/page.tsx`

- [ ] **Step 1: 목록 페이지 루트를 `data-env`가 있는 Tailwind 래퍼로 바꾼다**

```tsx
<main
  data-env={env}
  className={[
    'overflow-x-hidden w-full max-w-full px-6 py-10 md:px-10 md:py-14',
    env === 'sandbox'
      ? 'bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.16),transparent_32%),linear-gradient(180deg,#fffaf0_0%,#f8eddc_100%)]'
      : 'bg-[linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)]'
  ].join(' ')}
>
```

- [ ] **Step 2: 헤더 아래에 환경 컨텍스트 스트립과 sticky live bar를 추가한다**

```tsx
<EnvironmentContextStrip env={env} />
<TransactionsLiveBar
  env={env}
  dataUpdatedAt={query.dataUpdatedAt}
  newCount={queuedNewRows.length}
  changedCount={changedRowIds.length}
  isFetching={query.isFetching && !query.isFetchingNextPage}
  hasPollingError={query.isRefetchError}
/>
```

- [ ] **Step 3: background refetch 오류가 나도 기존 `displayRows`는 유지하고, live bar에만 실패 상태를 보낸다**

```tsx
{query.isError && !query.data ? <p className="feedback-card">{query.error.message}</p> : null}
{displayRows.length > 0 ? (
  <TransactionsLiveBar
    env={env}
    dataUpdatedAt={query.dataUpdatedAt}
    newCount={queuedNewRows.length}
    changedCount={changedRowIds.length}
    isFetching={query.isFetching && !query.isFetchingNextPage}
    hasPollingError={query.isRefetchError}
  />
) : null}
```

- [ ] **Step 4: 큐에 새 거래가 있으면 상단 sticky 배너를 렌더링하고 클릭 시 한 번에 반영한다**

```tsx
<NewTransactionsBanner
  env={env}
  count={queuedNewRows.length}
  onApply={() => {
    startTransition(() => {
      setDisplayRows(serverRows);
      setFreshRowIds(queuedNewRows.map((row) => row.id));
      setQueuedNewRows([]);
    });
  }}
/>
```

- [ ] **Step 5: `TransactionsTable` props에 env와 하이라이트 정보를 추가한다**

```tsx
type TransactionsTableProps = {
  env: Env;
  rows: TransactionRow[];
  freshRowIds: string[];
  changedRowIds: string[];
  onSelect: (id: string) => void;
};
```

- [ ] **Step 6: 새 거래와 상태 변경을 서로 다른 시각 규칙으로 강조한다**

```tsx
<tr
  className={[
    'group relative cursor-pointer border-b border-black/5 transition-colors duration-500',
    fresh && env === 'sandbox' && 'bg-amber-100/70 ring-1 ring-amber-300',
    fresh && env === 'production' && 'bg-cyan-50 ring-1 ring-cyan-300',
    changed && 'before:absolute before:inset-y-3 before:left-0 before:w-0.5 before:rounded-full before:bg-current'
  ]
    .filter(Boolean)
    .join(' ')}
>
```

- [ ] **Step 7: empty state 문구를 env별로 분기하고 cheap meta label은 제거한다**

```tsx
<h2 className="text-2xl font-semibold text-slate-950">표시할 거래가 아직 없습니다</h2>
<p className="mt-3 text-sm leading-6 text-slate-600">
  {env === 'sandbox'
    ? '새 거래가 생성되면 자동으로 이 목록에 반영됩니다.'
    : '실거래가 들어오면 자동으로 이 목록에 반영됩니다.'}
</p>
```

### Task 5: 상세 diff 규칙과 5초 polling 컨트롤러를 추가한다

**Files:**
- Create: `lib/transaction-detail-live.ts`
- Modify: `app/(protected)/transactions/[id]/page.tsx`

- [ ] **Step 1: `transaction-detail-live.ts`에 즉시 반영 필드와 적용 대기 필드를 분리하는 함수를 만든다**

```ts
import type { TransactionDetail } from '@/lib/transactions-api';

export type DetailDiff = {
  nextAcceptedDetail: TransactionDetail;
  pendingMetadata: Record<string, string> | null;
  pendingPaymentMethod: TransactionDetail['payment_method'] | null;
  appendedEvents: TransactionDetail['events'];
  summaryChanged: boolean;
  message: string | null;
};
```

- [ ] **Step 2: diff 함수에서 `status`, `amount`, `currency`, `events`는 즉시 반영하고 `metadata`, `payment_method`는 보류한다**

```ts
export function diffTransactionDetail(previous: TransactionDetail, next: TransactionDetail): DetailDiff {
  const metadataChanged = JSON.stringify(previous.metadata) !== JSON.stringify(next.metadata);
  const paymentMethodChanged = JSON.stringify(previous.payment_method) !== JSON.stringify(next.payment_method);
  const appendedEvents = next.events.slice(previous.events.length);

  return {
    nextAcceptedDetail: {
      ...next,
      metadata: metadataChanged ? previous.metadata : next.metadata,
      payment_method: paymentMethodChanged ? previous.payment_method : next.payment_method
    },
    pendingMetadata: metadataChanged ? next.metadata : null,
    pendingPaymentMethod: paymentMethodChanged ? next.payment_method : null,
    appendedEvents,
    summaryChanged:
      previous.status !== next.status || previous.amount !== next.amount || previous.currency !== next.currency,
    message: buildDetailUpdateMessage(previous, next, appendedEvents, metadataChanged, paymentMethodChanged)
  };
}
```

- [ ] **Step 3: 상세 페이지는 `pending` 여부와 무관하게 5초 polling을 유지하도록 바꾼다**

```tsx
const query = useQuery({
  queryKey: ['transaction', env, id],
  queryFn: () => getTransactionDetail(env, id),
  refetchInterval: 5000,
  refetchIntervalInBackground: false,
  refetchOnWindowFocus: true
});
```

- [ ] **Step 4: 서버 최신값과 화면에 승인된 값을 분리하는 로컬 상태를 둔다**

```tsx
const [acceptedDetail, setAcceptedDetail] = useState<TransactionDetail | null>(null);
const [pendingMetadata, setPendingMetadata] = useState<Record<string, string> | null>(null);
const [pendingPaymentMethod, setPendingPaymentMethod] =
  useState<TransactionDetail['payment_method'] | null>(null);
const [updateMessage, setUpdateMessage] = useState<string | null>(null);
const [pollingErrorMessage, setPollingErrorMessage] = useState<string | null>(null);
const [highlightedCards, setHighlightedCards] = useState<string[]>([]);
```

- [ ] **Step 5: poll 성공 시 diff를 계산해 즉시 반영과 적용 대기를 각각 갱신한다**

```tsx
if (!acceptedDetail) {
  setAcceptedDetail(query.data);
  return;
}

const diff = diffTransactionDetail(acceptedDetail, query.data);
setAcceptedDetail(diff.nextAcceptedDetail);
setPendingMetadata(diff.pendingMetadata);
setPendingPaymentMethod(diff.pendingPaymentMethod);
setUpdateMessage(diff.message);
setHighlightedCards(getHighlightedCards(diff));
```

- [ ] **Step 6: background refetch 실패는 본문을 비우지 않고 update bar에만 짧게 노출한다**

```tsx
useEffect(() => {
  if (query.isRefetchError) {
    setPollingErrorMessage('최신 변경사항을 가져오지 못했습니다. 다음 주기에 다시 시도합니다.');
    return;
  }

  setPollingErrorMessage(null);
}, [query.isRefetchError]);
```

### Task 6: 상세 화면 UI를 카드 단위 업데이트 구조로 재조립한다

**Files:**
- Create: `components/transactions/TransactionDetailUpdateBar.tsx`
- Create: `components/transactions/detail/TransactionSummaryCard.tsx`
- Create: `components/transactions/detail/TransactionTimelineCard.tsx`
- Create: `components/transactions/detail/TransactionMetadataCard.tsx`
- Create: `components/transactions/detail/TransactionPaymentMethodCard.tsx`
- Modify: `components/transactions/TransactionDetailView.tsx`
- Modify: `app/(protected)/transactions/[id]/page.tsx`

- [ ] **Step 1: `TransactionDetailView`를 카드 조립 컴포넌트로 축소한다**

```tsx
type TransactionDetailViewProps = {
  env: Env;
  detail: TransactionDetail;
  pendingMetadata: Record<string, string> | null;
  pendingPaymentMethod: TransactionDetail['payment_method'] | null;
  highlightedCards: string[];
  onApplyPendingChanges: () => void;
};
```

- [ ] **Step 2: 상세 상단에 sticky 업데이트 바를 추가한다**

```tsx
<TransactionDetailUpdateBar
  env={env}
  message={updateMessage}
  errorMessage={pollingErrorMessage}
  hasPendingChanges={Boolean(pendingMetadata || pendingPaymentMethod)}
  onApply={handleApplyPendingChanges}
/>
```

- [ ] **Step 3: summary 카드와 timeline 카드는 즉시 반영 결과를 그대로 렌더링하고 바뀐 부분만 짧게 강조한다**

```tsx
<TransactionSummaryCard env={env} detail={detail} highlighted={highlightedCards.includes('summary')} />
<TransactionTimelineCard
  env={env}
  events={detail.events}
  highlightedEventKeys={detail.events.slice(-1).map((event) => `${event.type}-${event.at}`)}
/>
```

- [ ] **Step 4: metadata / payment method 카드는 pending patch가 있으면 적용 전 상태와 액션을 함께 보여준다**

```tsx
<TransactionMetadataCard
  env={env}
  metadata={detail.metadata}
  pendingMetadata={pendingMetadata}
  highlighted={highlightedCards.includes('metadata')}
/>
<TransactionPaymentMethodCard
  env={env}
  paymentMethod={detail.payment_method}
  pendingPaymentMethod={pendingPaymentMethod}
  highlighted={highlightedCards.includes('payment_method')}
/>
```

- [ ] **Step 5: 사용자가 적용 버튼을 누르면 보류 중인 필드만 merge해서 화면에 반영한다**

```tsx
function handleApplyPendingChanges() {
  if (!acceptedDetail) return;

  startTransition(() => {
    setAcceptedDetail({
      ...acceptedDetail,
      metadata: pendingMetadata ?? acceptedDetail.metadata,
      payment_method: pendingPaymentMethod ?? acceptedDetail.payment_method
    });
    setPendingMetadata(null);
    setPendingPaymentMethod(null);
    setHighlightedCards(['metadata', 'payment_method']);
  });
}
```

- [ ] **Step 6: 상세 페이지와 카드 컴포넌트 전체에 motion-reduce 대체 규칙과 `aria-live=\"polite\"` 업데이트 영역을 남긴다**

```tsx
<div aria-live="polite" className="sr-only">
  {updateMessage}
</div>
```
