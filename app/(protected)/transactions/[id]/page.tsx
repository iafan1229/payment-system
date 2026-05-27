'use client';

import { useEffect, useRef, useState } from 'react';
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
  const latestUpdateRef = useRef<number | null>(null);
  const [showRefreshNotice, setShowRefreshNotice] = useState(false);
  const query = useQuery({
    queryKey: ['transaction', env, id],
    queryFn: () => getTransactionDetail(env, id),
    refetchInterval: (currentQuery) =>
      currentQuery.state.data?.status === 'pending' ? 5000 : false,
    refetchOnWindowFocus: false
  });

  useEffect(() => {
    if (!query.data) {
      return;
    }

    // 초기 진입 시점은 갱신 알림을 띄우지 않고 기준 시각만 저장함.
    if (latestUpdateRef.current === null) {
      latestUpdateRef.current = query.dataUpdatedAt;
      return;
    }

    if (query.dataUpdatedAt === latestUpdateRef.current) {
      return;
    }

    latestUpdateRef.current = query.dataUpdatedAt;
    setShowRefreshNotice(true);

    const timeoutId = window.setTimeout(() => {
      setShowRefreshNotice(false);
    }, 2500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [query.data, query.dataUpdatedAt]);

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

      {showRefreshNotice ? (
        <div className="inline-refresh-notice" role="status" aria-live="polite">
          방금 갱신됨
        </div>
      ) : null}

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
