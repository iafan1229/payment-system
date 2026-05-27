import type { Env } from '@/shared/lib/env';

type TransactionsLiveBarProps = {
  env: Env;
  dataUpdatedAt: number;
  newCount: number;
  changedCount: number;
  isFetching: boolean;
  hasPollingError: boolean;
};

function formatSyncTime(value: number) {
  if (!value) {
    return '초기 동기화 대기 중';
  }

  return new Date(value).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

export function TransactionsLiveBar({
  env,
  dataUpdatedAt,
  newCount,
  changedCount,
  isFetching,
  hasPollingError
}: TransactionsLiveBarProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={[
        'sticky top-3 z-20 mb-4 flex flex-col gap-3 rounded-full border px-4 py-3 shadow-[0_18px_48px_rgba(15,23,42,0.12)] backdrop-blur md:flex-row md:items-center md:justify-between',
        env === 'sandbox'
          ? 'border-amber-300/50 bg-white/78 text-stone-900'
          : 'border-slate-300/80 bg-white/86 text-slate-900'
      ].join(' ')}
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className={[
            'h-2.5 w-2.5 rounded-full transition-colors',
            isFetching ? 'bg-amber-600' : env === 'sandbox' ? 'bg-emerald-700' : 'bg-cyan-700'
          ].join(' ')}
        />
        <p className="m-0 text-sm font-medium">
          마지막 동기화 <span className="font-semibold">{formatSyncTime(dataUpdatedAt)}</span>
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="rounded-full border border-black/10 px-3 py-1 font-medium">새 거래 {newCount}건</span>
        <span className="rounded-full border border-black/10 px-3 py-1 font-medium">상태 변경 {changedCount}건</span>
        {hasPollingError ? (
          <span className="rounded-full border border-rose-300 bg-rose-50 px-3 py-1 text-rose-700">
            최신 갱신을 가져오지 못했습니다
          </span>
        ) : null}
      </div>
    </div>
  );
}
