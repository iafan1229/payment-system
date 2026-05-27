'use client';

import { startTransition, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { TransactionDetailUpdateBar } from '@/components/transactions/TransactionDetailUpdateBar';
import { TransactionDetailView } from '@/components/transactions/TransactionDetailView';
import { useEnv } from '@/hooks/use-env';
import type { TransactionDetail } from '@/lib/transactions-api';
import { getTransactionDetail } from '@/lib/transactions-api';
import { diffTransactionDetail } from '@/lib/transaction-detail-live';

function formatEnvLabel(env: 'sandbox' | 'production') {
  return env === 'sandbox' ? 'Sandbox' : 'Production';
}

export default function TransactionDetailPage() {
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

    startTransition(() => {
      const nextDetail = {
        ...acceptedDetailRef.current!,
        metadata: pendingMetadata ?? acceptedDetailRef.current!.metadata,
        payment_method: pendingPaymentMethod ?? acceptedDetailRef.current!.payment_method
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
      <section className="mx-auto w-full max-w-7xl">
        <header className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-5xl">
            <p className="mb-3 font-mono text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-amber-700">
              Transaction Detail
            </p>
            <h1 className="max-w-5xl text-[clamp(2.5rem,4.8vw,4.6rem)] font-semibold tracking-[-0.05em] text-slate-950">
              읽고 있는 본문은 지키면서, 핵심 상태 변화는 바로 따라갑니다.
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
              상세 화면은 5초 주기로 최신 상태를 따라가되, 본문 맥락을 깨는 정보는 사용자가 적용할 때까지
              보류합니다.
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 md:items-end">
            <span
              className={[
                'inline-flex min-w-[118px] items-center justify-center rounded-full px-4 py-2 text-sm font-semibold',
                env === 'sandbox' ? 'bg-amber-300 text-amber-950' : 'bg-slate-950 text-slate-50'
              ].join(' ')}
            >
              {formatEnvLabel(env)}
            </span>
            <p className="text-sm text-slate-500">현재 보고 있는 거래가 속한 환경</p>
          </div>
        </header>

        <TransactionDetailUpdateBar
          env={env}
          message={updateMessage}
          errorMessage={pollingErrorMessage}
          hasPendingChanges={Boolean(pendingMetadata || pendingPaymentMethod)}
          onApply={handleApplyPendingChanges}
        />

        <div className="mb-5">
          <button
            type="button"
            onClick={() => router.push(`/transactions?env=${env}`)}
            className="rounded-full border border-black/10 bg-white/78 px-5 py-3 text-sm font-semibold text-slate-800 shadow-[0_16px_32px_rgba(15,23,42,0.08)] transition-colors hover:bg-white"
          >
            목록으로
          </button>
        </div>

        {query.isLoading && !acceptedDetail ? (
          <p className="rounded-[2rem] border border-black/10 bg-white/78 p-6 shadow-[0_24px_64px_rgba(15,23,42,0.08)]">
            상세를 불러오는 중...
          </p>
        ) : null}

        {query.isError && !acceptedDetail ? (
          <p className="rounded-[2rem] border border-rose-200 bg-rose-50 p-6 text-rose-700 shadow-[0_24px_64px_rgba(15,23,42,0.08)]">
            {query.error.message}
          </p>
        ) : null}

        {acceptedDetail ? (
          <TransactionDetailView
            env={env}
            detail={acceptedDetail}
            pendingMetadata={pendingMetadata}
            pendingPaymentMethod={pendingPaymentMethod}
            highlightedCards={highlightedCards}
            highlightedEventKeys={highlightedEventKeys}
          />
        ) : null}
      </section>
    </main>
  );
}
