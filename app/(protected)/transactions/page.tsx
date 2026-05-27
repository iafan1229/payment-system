'use client';

import { startTransition, useDeferredValue, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useInfiniteQuery } from '@tanstack/react-query';
import { EnvironmentContextStrip } from '@/components/transactions/EnvironmentContextStrip';
import { EnvSwitcher } from '@/components/transactions/EnvSwitcher';
import { TransactionsHeader } from '@/components/transactions/TransactionsHeader';
import { NewTransactionsBanner } from '@/components/transactions/NewTransactionsBanner';
import { TransactionsLiveBar } from '@/components/transactions/TransactionsLiveBar';
import { TransactionsTable } from '@/components/transactions/TransactionsTable';
import { useAuthStore } from '@/stores/auth-store';
import { useEnv } from '@/hooks/useEnv';
import type { Env } from '@/lib/auth/env';
import { getTransactions } from '@/lib/transaction/transactionsApi';
import { buildTransactionsFeed } from '@/lib/transaction/transactionsFeed';
import { diffTransactions, mergeQueuedRows, preserveVisibleRows } from '@/lib/transaction/transactionsLive';

export default function TransactionsPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { env, setEnv } = useEnv();
  const [displayRows, setDisplayRows] = useState<ReturnType<typeof buildTransactionsFeed>['rows']>([]);
  const [queuedNewRows, setQueuedNewRows] = useState<ReturnType<typeof buildTransactionsFeed>['rows']>([]);
  const [freshRowIds, setFreshRowIds] = useState<string[]>([]);
  const [changedRowIds, setChangedRowIds] = useState<string[]>([]);
  const [isNearTop, setIsNearTop] = useState(true);
  const [pendingEnv, setPendingEnv] = useState<Env | null>(null);
  const [showProductionConfirm, setShowProductionConfirm] = useState(false);
  const topSentinelRef = useRef<HTMLDivElement | null>(null);
  const previousServerRowsRef = useRef<ReturnType<typeof buildTransactionsFeed>['rows']>([]);
  const query = useInfiniteQuery({
    queryKey: ['transactions', env],
    queryFn: ({ pageParam }) => getTransactions(env, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    refetchInterval: 5000,
    refetchOnWindowFocus: false
  });
  const feed = buildTransactionsFeed(query.data?.pages ?? []);
  const deferredRows = useDeferredValue(displayRows);
  const liveNewCount = queuedNewRows.length > 0 ? queuedNewRows.length : freshRowIds.length;

  useEffect(() => {
    if (!topSentinelRef.current) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsNearTop(entry.isIntersecting);
      },
      {
        root: null,
        rootMargin: '160px 0px 0px 0px',
        threshold: 0
      }
    );

    observer.observe(topSentinelRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!query.data) {
      return;
    }

    const serverRows = feed.rows;
    const previousRows = previousServerRowsRef.current;
    const diff = diffTransactions(previousRows, serverRows);

    if (previousRows.length === 0) {
      setDisplayRows(serverRows);
      setFreshRowIds([]);
      setChangedRowIds([]);
      previousServerRowsRef.current = serverRows;
      return;
    }

    if (diff.newRows.length === 0 && diff.appendedRows.length === 0 && diff.changedRowIds.length === 0) {
      if (queuedNewRows.length > 0) {
        setDisplayRows((currentRows) => preserveVisibleRows(currentRows, diff));
      } else {
        setDisplayRows(serverRows);
      }

      setChangedRowIds([]);
      previousServerRowsRef.current = serverRows;
      return;
    }

    if (isNearTop) {
      setDisplayRows(serverRows);
      setQueuedNewRows([]);
      setFreshRowIds(diff.newRows.map((row) => row.id));
    } else {
      setDisplayRows((currentRows) => {
        const visibleRows = preserveVisibleRows(currentRows, diff);

        if (diff.appendedRows.length === 0) {
          return visibleRows;
        }

        return [...visibleRows, ...diff.appendedRows];
      });
      setQueuedNewRows((currentRows) => mergeQueuedRows(currentRows, diff.newRows));
    }

    setChangedRowIds(diff.changedRowIds);
    previousServerRowsRef.current = serverRows;
  }, [isNearTop, query.data, query.dataUpdatedAt, queuedNewRows.length]);

  useEffect(() => {
    previousServerRowsRef.current = [];
    setDisplayRows([]);
    setQueuedNewRows([]);
    setFreshRowIds([]);
    setChangedRowIds([]);
  }, [env]);

  useEffect(() => {
    if (freshRowIds.length === 0) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setFreshRowIds([]);
    }, 4000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [freshRowIds]);

  useEffect(() => {
    if (changedRowIds.length === 0) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setChangedRowIds([]);
    }, 2600);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [changedRowIds]);

  useEffect(() => {
    setPendingEnv(null);
    setShowProductionConfirm(false);
  }, [env]);

  function handleEnvRequest(nextEnv: Env) {
    if (env === 'sandbox' && nextEnv === 'production') {
      setPendingEnv(nextEnv);
      setShowProductionConfirm(true);
      return;
    }

    setEnv(nextEnv);
  }

  function handleEnvConfirm() {
    if (!pendingEnv) {
      return;
    }

    setShowProductionConfirm(false);
    setEnv(pendingEnv);
    setPendingEnv(null);
  }

  function handleEnvCancel() {
    setShowProductionConfirm(false);
    setPendingEnv(null);
  }

  return (
    <main
      data-env={env}
      className={[
        'min-h-screen overflow-x-hidden px-6 py-8 md:px-10 md:py-10',
        env === 'sandbox'
          ? 'bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.16),transparent_32%),linear-gradient(180deg,#fffaf0_0%,#f8eddc_100%)]'
          : 'bg-[linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)]'
      ].join(' ')}
    >
      <div ref={topSentinelRef} aria-hidden="true" className="h-px w-full" />

      <section className="mx-auto w-full max-w-7xl">
        <header className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <TransactionsHeader userName={user ? user.name : null} />

          <EnvSwitcher
            env={env}
            pendingEnv={pendingEnv}
            showProductionConfirm={showProductionConfirm}
            onRequestChange={handleEnvRequest}
            onConfirm={handleEnvConfirm}
            onCancel={handleEnvCancel}
          />
        </header>

        <EnvironmentContextStrip env={env} />

        {query.isLoading ? (
          <p className="rounded-[2rem] border border-black/10 bg-white/78 p-6 shadow-[0_24px_64px_rgba(15,23,42,0.08)]">
            목록을 불러오는 중...
          </p>
        ) : null}

        {query.isError && !query.data ? (
          <p className="rounded-[2rem] border border-rose-200 bg-rose-50 p-6 text-rose-700 shadow-[0_24px_64px_rgba(15,23,42,0.08)]">
            {query.error.message}
          </p>
        ) : null}

        {query.data ? (
          <>
            <TransactionsLiveBar
              env={env}
              dataUpdatedAt={query.dataUpdatedAt}
              newCount={liveNewCount}
              changedCount={changedRowIds.length}
              isFetching={query.isFetching && !query.isFetchingNextPage}
              hasPollingError={query.isRefetchError}
            />

            <NewTransactionsBanner
              env={env}
              count={queuedNewRows.length}
              onApply={() => {
                startTransition(() => {
                  setDisplayRows(feed.rows);
                  setFreshRowIds(queuedNewRows.map((row) => row.id));
                  setQueuedNewRows([]);
                });
              }}
            />

            <TransactionsTable
              env={env}
              rows={deferredRows}
              freshRowIds={freshRowIds}
              changedRowIds={changedRowIds}
              onSelect={(id) => router.push(`/transactions/${id}?env=${env}`)}
            />

            {feed.hasMore ? (
              <div className="mt-5 flex justify-center">
                <button
                  type="button"
                  onClick={() => query.fetchNextPage()}
                  disabled={query.isFetchingNextPage}
                  className="rounded-full border border-black/10 bg-white/78 px-5 py-3 text-sm font-semibold text-slate-800 shadow-[0_16px_32px_rgba(15,23,42,0.08)] transition-colors hover:bg-white disabled:cursor-wait disabled:opacity-70"
                >
                  {query.isFetchingNextPage ? '이전 거래를 불러오는 중...' : '이전 거래 더 불러오기'}
                </button>
              </div>
            ) : deferredRows.length > 0 ? (
              <div className="mt-5 flex justify-center">
                <p className="text-sm text-slate-500">현재 불러올 수 있는 거래를 모두 확인했습니다.</p>
              </div>
            ) : null}
          </>
        ) : null}
      </section>
    </main>
  );
}
