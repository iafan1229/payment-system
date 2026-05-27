import type { Env } from '@/shared/lib/env';
import { StatusBadge } from '@/shared/components/ui/StatusBadge';
import { formatAmount } from '@/shared/lib/formatAmount';
import { formatDate } from '@/shared/lib/formatDate';
import type { TransactionDetail } from '@/features/transactions/types/transaction';

type TransactionSummaryCardProps = {
  env: Env;
  detail: TransactionDetail;
  highlighted: boolean;
};

function getStatusTone(status: TransactionDetail['status']) {
  switch (status) {
    case 'succeeded':
      return 'success';
    case 'pending':
      return 'warning';
    case 'failed':
      return 'danger';
    case 'refunded':
      return 'info';
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
      {/* 상단: 라벨 + 상태 배지 */}
      <div className="flex items-center justify-between gap-4">
        <p className="font-mono text-[18px] font-semibold uppercase tracking-[0.24em] text-slate-500">
          Transaction
        </p>

        <StatusBadge label={detail.status} tone={getStatusTone(detail.status)} className="min-w-[112px] px-4 py-2" />
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
        <span className="text-xs text-slate-400">{formatDate(detail.created_at, { includeSeconds: true })}</span>
      </div>
    </section>
  );
}
