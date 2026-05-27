import type { Env } from '@/lib/env';
import type { TransactionDetail } from '@/lib/transactions-api';

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
        'xl:col-span-6 rounded-[2rem] border bg-white/82 p-6 shadow-[0_24px_64px_rgba(15,23,42,0.08)] backdrop-blur transition-colors duration-500',
        highlighted && env === 'sandbox' && 'border-amber-300 bg-amber-50/90',
        highlighted && env === 'production' && 'border-cyan-300 bg-cyan-50/80',
        !highlighted && 'border-black/10'
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <p className="mb-3 font-mono text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-slate-500">
            Transaction
          </p>
          <h2 className="text-[1.8rem] font-semibold tracking-[-0.04em] text-slate-950">{detail.id}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            상태와 핵심 식별 정보는 즉시 반영되어 현재 흐름을 늦추지 않습니다.
          </p>
        </div>

        <span
          className={[
            'inline-flex min-w-[112px] items-center justify-center rounded-full px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.18em]',
            getStatusClasses(detail.status)
          ].join(' ')}
        >
          {detail.status}
        </span>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <span className="block text-xs font-medium uppercase tracking-[0.18em] text-slate-500">금액</span>
          <strong className="mt-2 block text-xl font-semibold text-slate-950">
            {formatAmount(detail.amount, detail.currency)}
          </strong>
        </div>
        <div>
          <span className="block text-xs font-medium uppercase tracking-[0.18em] text-slate-500">통화</span>
          <strong className="mt-2 block text-xl font-semibold text-slate-950">{detail.currency.toUpperCase()}</strong>
        </div>
        <div>
          <span className="block text-xs font-medium uppercase tracking-[0.18em] text-slate-500">고객</span>
          <strong className="mt-2 block text-xl font-semibold text-slate-950">{detail.customer.name}</strong>
          <p className="mt-1 text-sm text-slate-500">{detail.customer.email}</p>
        </div>
        <div>
          <span className="block text-xs font-medium uppercase tracking-[0.18em] text-slate-500">생성 시각</span>
          <strong className="mt-2 block text-base font-semibold text-slate-950">{formatDate(detail.created_at)}</strong>
        </div>
      </div>
    </section>
  );
}
