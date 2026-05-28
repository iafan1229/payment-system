'use client';

import { TransactionDetailUpdateBar } from '@/features/transactions/components/detail/TransactionDetailUpdateBar';
import { TransactionDetailView } from '@/features/transactions/components/detail/TransactionDetailView';
import { useTransactionDetail } from '@/features/transactions/hooks/useTransactionDetail';
import { ErrorState } from '@/shared/components/ui/ErrorState';
import { LoadingState } from '@/shared/components/ui/LoadingState';

function formatEnvLabel(env: 'sandbox' | 'production') {
  return env === 'sandbox' ? 'Sandbox' : 'Production';
}

export default function TransactionDetailPage() {
  const {
    env,
    acceptedDetail,
    highlightedCards,
    highlightedEventKeys,
    updateMessage,
    pollingErrorMessage,
    handleBackToList,
    isLoading,
    errorMessage
  } = useTransactionDetail();

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

            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
              상세 화면은 5초 주기로 최신 상태를 반영하고, 바뀐 카드와 이벤트를 바로 드러냅니다.
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
        />

        <div className="mb-5">
          <button
            type="button"
            onClick={handleBackToList}
            className="rounded-full border border-black/10 bg-white/78 px-5 py-3 text-sm font-semibold text-slate-800 shadow-[0_16px_32px_rgba(15,23,42,0.08)] transition-colors hover:bg-white"
          >
            목록으로
          </button>
        </div>

        {isLoading ? <LoadingState message="상세를 불러오는 중..." /> : null}
        {errorMessage ? <ErrorState message={errorMessage} /> : null}

        {acceptedDetail ? (
          <TransactionDetailView
            env={env}
            detail={acceptedDetail}
            highlightedCards={highlightedCards}
            highlightedEventKeys={highlightedEventKeys}
          />
        ) : null}
      </section>
    </main>
  );
}
