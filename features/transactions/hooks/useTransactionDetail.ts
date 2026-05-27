'use client';

import { startTransition, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getTransactionDetail } from '@/features/transactions/api/transactionsApi';
import { diffTransactionDetail } from '@/features/transactions/lib/transactionDetailLive';
import type { TransactionDetail } from '@/features/transactions/types/transaction';
import { useEnv } from '@/shared/hooks/useEnv';

export function useTransactionDetail() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { env } = useEnv();
  const id = params.id;
  const acceptedDetailRef = useRef<TransactionDetail | null>(null);
  const previousServerDetailRef = useRef<TransactionDetail | null>(null);
  const [acceptedDetail, setAcceptedDetail] = useState<TransactionDetail | null>(null);
  const [pendingMetadata, setPendingMetadata] = useState<Record<string, string> | null>(null);
  const [pendingPaymentMethod, setPendingPaymentMethod] = useState<TransactionDetail['payment_method'] | null>(null);
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
      acceptedDetailRef.current = query.data;
      setAcceptedDetail(query.data);
      setPendingMetadata(null);
      setPendingPaymentMethod(null);
      setUpdateMessage(null);
      setHighlightedCards([]);
      setHighlightedEventKeys([]);
      return;
    }

    if (!acceptedDetailRef.current) {
      acceptedDetailRef.current = query.data;
      setAcceptedDetail(query.data);
      return;
    }

    const diff = diffTransactionDetail({
      displayedDetail: acceptedDetailRef.current,
      previousServerDetail: previousServerDetailRef.current,
      nextServerDetail: query.data
    });

    previousServerDetailRef.current = query.data;
    acceptedDetailRef.current = diff.nextAcceptedDetail;
    setAcceptedDetail(diff.nextAcceptedDetail);
    setPendingMetadata(diff.pendingMetadata);
    setPendingPaymentMethod(diff.pendingPaymentMethod);
    setUpdateMessage(diff.message);
    setHighlightedCards([
      ...(diff.summaryChanged ? ['summary'] : []),
      ...(diff.pendingMetadata ? ['metadata'] : []),
      ...(diff.pendingPaymentMethod ? ['payment_method'] : []),
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
    acceptedDetailRef.current = null;
    previousServerDetailRef.current = null;
    setAcceptedDetail(null);
    setPendingMetadata(null);
    setPendingPaymentMethod(null);
    setUpdateMessage(null);
    setPollingErrorMessage(null);
    setHighlightedCards([]);
    setHighlightedEventKeys([]);
  }, [env, id]);

  function handleApplyPendingChanges() {
    if (!acceptedDetailRef.current || (!pendingMetadata && !pendingPaymentMethod)) {
      return;
    }

    const currentDetail = acceptedDetailRef.current;

    startTransition(() => {
      const nextDetail = {
        ...currentDetail,
        metadata: pendingMetadata ?? currentDetail.metadata,
        payment_method: pendingPaymentMethod ?? currentDetail.payment_method
      };

      acceptedDetailRef.current = nextDetail;
      setAcceptedDetail(nextDetail);
      setPendingMetadata(null);
      setPendingPaymentMethod(null);
      setHighlightedCards([
        ...(pendingMetadata ? ['metadata'] : []),
        ...(pendingPaymentMethod ? ['payment_method'] : [])
      ]);
      setUpdateMessage('보류 중이던 본문 변경을 화면에 반영했습니다.');
    });
  }

  function handleBackToList() {
    router.push(`/transactions?env=${env}`);
  }

  return {
    env,
    acceptedDetail,
    pendingMetadata,
    pendingPaymentMethod,
    highlightedCards,
    highlightedEventKeys,
    updateMessage,
    pollingErrorMessage,
    hasPendingChanges: Boolean(pendingMetadata || pendingPaymentMethod),
    handleApplyPendingChanges,
    handleBackToList,
    isLoading: query.isLoading && !acceptedDetail,
    errorMessage: query.isError && !acceptedDetail ? query.error.message : null
  };
}
