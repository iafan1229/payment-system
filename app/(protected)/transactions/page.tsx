'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { EnvSwitcher } from '@/components/transactions/env-switcher';
import { TransactionsTable } from '@/components/transactions/transactions-table';
import { useAuthStore } from '@/stores/auth-store';
import { useEnv } from '@/hooks/use-env';
import { getTransactions } from '@/lib/transactions-api';

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
  const query = useQuery({
    queryKey: ['transactions', env],
    queryFn: () => getTransactions(env),
    refetchInterval: 5000,
    refetchOnWindowFocus: false
  });

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
            <span className={`sync-indicator ${query.isFetching ? 'is-fetching' : ''}`} />
            <p>마지막 동기화 {formatSyncTime(query.dataUpdatedAt)}</p>
          </div>
          <TransactionsTable
            rows={query.data.data}
            onSelect={(id) => router.push(`/transactions/${id}?env=${env}`)}
          />
        </>
      ) : null}
    </main>
  );
}
