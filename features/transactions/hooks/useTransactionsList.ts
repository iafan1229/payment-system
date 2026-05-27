'use client';

import { startTransition, useDeferredValue, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/store/authStore';
import { getTransactions } from '@/features/transactions/api/transactionsApi';
import { buildTransactionsFeed } from '@/features/transactions/lib/transactionsFeed';
import { diffTransactions, mergeQueuedRows, preserveVisibleRows } from '@/features/transactions/lib/transactionsLive';
import { useEnv } from '@/shared/hooks/useEnv';
import type { Env } from '@/shared/lib/env';

export function useTransactionsList() {
  const router = useRouter();
  const userName = useAuthStore((state) => state.user?.name ?? null);
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
  const rows = useDeferredValue(displayRows);
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

  function handleApplyQueuedRows() {
    startTransition(() => {
      setDisplayRows(feed.rows);
      setFreshRowIds(queuedNewRows.map((row) => row.id));
      setQueuedNewRows([]);
    });
  }

  function handleSelectTransaction(id: string) {
    router.push(`/transactions/${id}?env=${env}`);
  }

  function handleFetchNextPage() {
    void query.fetchNextPage();
  }

  return {
    env,
    userName,
    topSentinelRef,
    pendingEnv,
    showProductionConfirm,
    handleEnvRequest,
    handleEnvConfirm,
    handleEnvCancel,
    isLoading: query.isLoading,
    errorMessage: query.isError && !query.data ? query.error.message : null,
    hasData: Boolean(query.data),
    dataUpdatedAt: query.dataUpdatedAt,
    liveNewCount,
    changedCount: changedRowIds.length,
    isPolling: query.isFetching && !query.isFetchingNextPage,
    hasPollingError: query.isRefetchError,
    queuedNewCount: queuedNewRows.length,
    handleApplyQueuedRows,
    rows,
    freshRowIds,
    changedRowIds,
    handleSelectTransaction,
    hasMore: feed.hasMore,
    isFetchingNextPage: query.isFetchingNextPage,
    handleFetchNextPage,
    hasRows: rows.length > 0
  };
}
