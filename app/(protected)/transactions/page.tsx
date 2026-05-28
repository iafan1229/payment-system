'use client';

import { EnvironmentContextStrip } from '@/features/transactions/components/list/EnvironmentContextStrip';
import { NewTransactionsBanner } from '@/features/transactions/components/list/NewTransactionsBanner';
import { TransactionsHeader } from '@/features/transactions/components/list/TransactionsHeader';
import { TransactionsLiveBar } from '@/features/transactions/components/list/TransactionsLiveBar';
import { TransactionsTable } from '@/features/transactions/components/list/TransactionsTable';
import { useTransactionsList } from '@/features/transactions/hooks/useTransactionsList';
import { EnvSwitcher } from '@/shared/components/env/EnvSwitcher';
import { ErrorState } from '@/shared/components/ui/ErrorState';
import { LoadingState } from '@/shared/components/ui/LoadingState';

export default function TransactionsPage() {
  const {
    env,
    userName,
    topSentinelRef,
    pendingEnv,
    showProductionConfirm,
    handleEnvRequest,
    handleEnvConfirm,
    handleEnvCancel,
    isLoading,
    errorMessage,
    hasData,
    dataUpdatedAt,
    liveNewCount,
    changedCount,
    isPolling,
    hasPollingError,
    queuedNewCount,
    handleApplyQueuedRows,
    rows,
    freshRowIds,
    changedRowIds,
    handleSelectTransaction,
    hasMore,
    isFetchingNextPage,
    handleFetchNextPage,
    hasRows
  } = useTransactionsList();

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
          <TransactionsHeader userName={userName} />

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

        {isLoading ? <LoadingState message="목록을 불러오는 중..." /> : null}
        {errorMessage ? <ErrorState message={errorMessage} /> : null}

        {hasData ? (
          <>
            <TransactionsLiveBar
              env={env}
              dataUpdatedAt={dataUpdatedAt}
              newCount={liveNewCount}
              changedCount={changedCount}
              isFetching={isPolling}
              hasPollingError={hasPollingError}
              changedRowIds={changedRowIds}
            />

            <NewTransactionsBanner env={env} count={queuedNewCount} onApply={handleApplyQueuedRows} />

            <TransactionsTable
              env={env}
              rows={rows}
              freshRowIds={freshRowIds}
              changedRowIds={changedRowIds}
              onSelect={handleSelectTransaction}
            />

            {hasMore ? (
              <div className="mt-5 flex justify-center">
                <button
                  type="button"
                  onClick={handleFetchNextPage}
                  disabled={isFetchingNextPage}
                  className="rounded-full border border-black/10 bg-white/78 px-5 py-3 text-sm font-semibold text-slate-800 shadow-[0_16px_32px_rgba(15,23,42,0.08)] transition-colors hover:bg-white disabled:cursor-wait disabled:opacity-70"
                >
                  {isFetchingNextPage ? '이전 거래를 불러오는 중...' : '이전 거래 더 불러오기'}
                </button>
              </div>
            ) : hasRows ? (
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
