import type { Env } from '@/lib/auth/env';
import type { TransactionDetail } from '@/lib/transaction/transactionsApi';

type TransactionSummaryCardProps = {
  env: Env;
  detail: TransactionDetail;
  highlighted: boolean;
};

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase()
  }).format(amount / (currency === 'krw' || currency === 'jpy' ? 1 : 100));
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

function getStatusClasses(status: TransactionDetail['status']) {
  switch (status) {
    case 'succeeded':
      return 'bg-emerald-50 text-emerald-700';
    case 'pending':
      return 'bg-amber-50 text-amber-700';
    case 'failed':
      return 'bg-rose-50 text-rose-700';
    case 'refunded':
      return 'bg-sky-50 text-sky-700';
  }
}

export function TransactionSummaryCard({ env, detail, highlighted }: TransactionSummaryCardProps) {
  return (
    <section
      className={[
        'xl:col-span-6 rounded-[2rem] border bg-/82 p-6 shadow-[0_24px_64px_rgba(15,23,42,0.08)] backdrop-blur transition-colors duration-500',
        highlighted && env === 'sandbox' && 'border-amber-300 bg-amber-50/90',
        highlighted && env === 'production' && 'border-cyan-300 bg-cyan-50/80',
        !highlighted && 'border-black/10'
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* 상단: 라벨 + 상태 배지 */}
      <div className="flex items-center justify-between gap-4">
        <p className="font-mono text-[18px] font-semibold uppercase tracking-[0.24em] text-slate-500">
          Transaction
        </p>

        <span
          className={[
            'inline-flex min-w-[112px] items-center justify-center rounded-full px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.18em]',
            getStatusClasses(detail.status)
          ].join(' ')}
        >
          {detail.status}
        </span>
      </div>

      {/* 금액 + 통화: 메인 히어로 */}
      <div className="mt-4 flex items-end gap-3">
        <h2 className="text-5xl font-bold tracking-tight text-slate-950 leading-none">
          {formatAmount(detail.amount, detail.currency)}
        </h2>
        <span className="mb-1 text-xl font-semibold text-slate-400">{detail.currency.toUpperCase()}</span>
      </div>

      {/* 하단: ID + 생성 시각 */}
      <div className="mt-5 flex flex-col gap-1 border-t border-black/6 pt-4">
        <span className="font-mono text-xs text-slate-400 tracking-tight">{detail.id}</span>
        <span className="text-xs text-slate-400">{formatDate(detail.created_at)}</span>
      </div>
    </section>
  );
}
