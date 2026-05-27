'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { TransactionDetailView } from '@/components/transactions/TransactionDetailView';
import { useEnv } from '@/hooks/use-env';
import { getTransactionDetail } from '@/lib/transactions-api';

function formatEnvLabel(env: 'sandbox' | 'production') {
  return env === 'sandbox' ? 'Sandbox' : 'Production';
}

export default function TransactionDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { env } = useEnv();
  const id = params.id;
  const query = useQuery({
    queryKey: ['transaction', env, id],
    queryFn: () => getTransactionDetail(env, id),
    refetchInterval: (currentQuery) =>
      currentQuery.state.data?.status === 'pending' ? 5000 : false,
    refetchOnWindowFocus: false
  });

  return (
    <main className="page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Transaction Detail</p>
          <h1>거래 상세</h1>
          <p className="lead">
            상세 화면에서는 `pending` 상태일 때만 주기적으로 다시 조회해서 흐름을 따라갑니다.
          </p>
        </div>
        <div className="env-context">
          <span className={`env-chip env-chip-${env}`}>{formatEnvLabel(env)}</span>
          <p>현재 보고 있는 거래가 속한 환경</p>
        </div>
      </header>

      <div className="detail-actions">
        <button className="secondary-button" type="button" onClick={() => router.push(`/transactions?env=${env}`)}>
          목록으로
        </button>
      </div>

      {query.isLoading ? <p className="feedback-card">상세를 불러오는 중...</p> : null}
      {query.isError ? <p className="feedback-card">{query.error.message}</p> : null}
      {query.data ? <TransactionDetailView detail={query.data} /> : null}
    </main>
  );
}
