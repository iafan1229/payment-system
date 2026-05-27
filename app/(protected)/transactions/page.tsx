'use client';

import { useRouter } from 'next/navigation';
import { useInfiniteQuery } from '@tanstack/react-query';
import { EnvSwitcher } from '@/components/transactions/EnvSwitcher';
import { TransactionsTable } from '@/components/transactions/TransactionsTable';
import { useAuthStore } from '@/stores/auth-store';
import { useEnv } from '@/hooks/use-env';
import { getTransactions } from '@/lib/transactions-api';
import { buildTransactionsFeed } from '@/lib/transactions-feed';

function formatSyncTime(value: number) {
  return new Date(value).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

export default function TransactionsPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { env, setEnv } = useEnv();
  const query = useInfiniteQuery({
    queryKey: ['transactions', env],
    queryFn: ({ pageParam }) => getTransactions(env, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    refetchInterval: 5000,
    refetchOnWindowFocus: false
  });
  const feed = buildTransactionsFeed(query.data?.pages ?? []);

  return (
    <main className="page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Hopae Payments</p>
          <h1>Transactions</h1>
          <p className="lead">
            {user ? `${user.name} 계정으로 로그인됨` : '세션 연결 중'} · 새 거래와 상태 변경이 주기적으로
            반영됩니다.
          </p>
        </div>
        <EnvSwitcher env={env} onChange={setEnv} />
      </header>

      {query.isLoading ? <p className="feedback-card">목록을 불러오는 중...</p> : null}
      {query.isError ? <p className="feedback-card">{query.error.message}</p> : null}

      {query.data ? (
        <>
          <div className="sync-row">
            <span
              className={`sync-indicator ${query.isFetching && !query.isFetchingNextPage ? 'is-fetching' : ''}`}
            />
            <p>마지막 동기화 {formatSyncTime(query.dataUpdatedAt)} · {feed.rows.length}건 표시 중</p>
          </div>
          <TransactionsTable rows={feed.rows} onSelect={(id) => router.push(`/transactions/${id}?env=${env}`)} />
          {feed.hasMore ? (
            <div className="load-more-row">
              <button
                className="secondary-button"
                type="button"
                onClick={() => query.fetchNextPage()}
                disabled={query.isFetchingNextPage}
              >
                {query.isFetchingNextPage ? '이전 거래를 불러오는 중...' : '이전 거래 더 불러오기'}
              </button>
            </div>
          ) : feed.rows.length > 0 ? (
            <div className="load-more-row">
              <p className="load-more-copy">현재 불러올 수 있는 거래를 모두 확인했습니다.</p>
            </div>
          ) : null}
        </>
      ) : null}
    </main>
  );
}
