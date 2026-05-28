'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getTransactionDetail } from '@/features/transactions/api/transactionsApi';
import { diffTransactionDetail } from '@/features/transactions/lib/transactionDetailLive';
import { useEnv } from '@/shared/hooks/useEnv';

export function useTransactionDetail() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { env } = useEnv();
  const id = params.id;
  const previousServerDetailRef = useRef<Awaited<ReturnType<typeof getTransactionDetail>> | null>(null);
  const [acceptedDetail, setAcceptedDetail] = useState<Awaited<ReturnType<typeof getTransactionDetail>> | null>(null);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);
  const [pollingErrorMessage, setPollingErrorMessage] = useState<string | null>(null);
  const [highlightedCards, setHighlightedCards] = useState<string[]>([]);
  const [highlightedEventKeys, setHighlightedEventKeys] = useState<string[]>([]);
  const query = useQuery({
    queryKey: ['transaction', env, id],
    queryFn: () => getTransactionDetail(env, id),
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true
  });

  useEffect(() => {
    if (!query.data) {
      return;
    }

    if (!previousServerDetailRef.current) {
      previousServerDetailRef.current = query.data;
      setAcceptedDetail(query.data);
      setUpdateMessage(null);
      setHighlightedCards([]);
      setHighlightedEventKeys([]);
      return;
    }

    const diff = diffTransactionDetail({
      previousServerDetail: previousServerDetailRef.current,
      nextServerDetail: query.data
    });

    previousServerDetailRef.current = query.data;
    setAcceptedDetail(diff.nextAcceptedDetail);
    setUpdateMessage(diff.message);
    setHighlightedCards([
      ...(diff.summaryChanged ? ['summary'] : []),
      ...(diff.metadataChanged ? ['metadata'] : []),
      ...(diff.paymentMethodChanged ? ['payment_method'] : []),
      ...(diff.appendedEvents.length > 0 ? ['timeline'] : [])
    ]);
    setHighlightedEventKeys(diff.appendedEvents.map((event) => `${event.type}-${event.at}`));
  }, [query.data, query.dataUpdatedAt]);

  useEffect(() => {
    if (!query.isRefetchError) {
      setPollingErrorMessage(null);
      return;
    }

    setPollingErrorMessage('최신 변경사항을 가져오지 못했습니다. 다음 주기에 다시 시도합니다.');
  }, [query.isRefetchError]);

  useEffect(() => {
    if (highlightedCards.length === 0 && highlightedEventKeys.length === 0) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setHighlightedCards([]);
      setHighlightedEventKeys([]);
    }, 2600);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [highlightedCards, highlightedEventKeys]);

  useEffect(() => {
    previousServerDetailRef.current = null;
    setAcceptedDetail(null);
    setUpdateMessage(null);
    setPollingErrorMessage(null);
    setHighlightedCards([]);
    setHighlightedEventKeys([]);
  }, [env, id]);

  function handleBackToList() {
    router.push(`/transactions?env=${env}`);
  }

  return {
    env,
    acceptedDetail,
    highlightedCards,
    highlightedEventKeys,
    updateMessage,
    pollingErrorMessage,
    handleBackToList,
    isLoading: query.isLoading && !acceptedDetail,
    errorMessage: query.isError && !acceptedDetail ? query.error.message : null
  };
}
