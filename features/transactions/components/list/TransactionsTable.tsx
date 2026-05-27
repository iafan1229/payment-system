import type { Env } from '@/shared/lib/env';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { StatusBadge } from '@/shared/components/ui/StatusBadge';
import { formatAmount } from '@/shared/lib/formatAmount';
import { formatDate } from '@/shared/lib/formatDate';
import type { TransactionRow } from '@/features/transactions/types/transaction';

type TransactionsTableProps = {
  env: Env;
  rows: TransactionRow[];
  freshRowIds: string[];
  changedRowIds: string[];
  onSelect: (id: string) => void;
};

type StatusTone = 'success' | 'warning' | 'danger' | 'info';

function getStatusTone(status: TransactionRow['status']): StatusTone {
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

export function TransactionsTable({ env, rows, freshRowIds, changedRowIds, onSelect }: TransactionsTableProps) {
  const freshRowIdSet = new Set(freshRowIds);
  const changedRowIdSet = new Set(changedRowIds);

  if (rows.length === 0) {
    return (
      <EmptyState
        title="표시할 거래가 아직 없습니다"
        message={
          env === 'sandbox'
            ? '새 거래가 생성되면 자동으로 이 목록에 반영됩니다.'
            : '실거래가 들어오면 자동으로 이 목록에 반영됩니다.'
        }
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-[2rem] border border-black/10 bg-white/78 shadow-[0_24px_64px_rgba(15,23,42,0.08)] backdrop-blur">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse font-sans">
          <thead className="bg-black/[0.03]">
            <tr>
              <th className="px-5 py-4 text-left text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-500">
                ID
              </th>
              <th className="px-5 py-4 text-left text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-500">
                고객
              </th>
              <th className="px-5 py-4 text-left text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-500">
                상태
              </th>
              <th className="px-5 py-4 text-left text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-500">
                통화
              </th>
              <th className="px-5 py-4 text-left text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-500">
                금액
              </th>
              <th className="px-5 py-4 text-left text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-500">
                생성 시각
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const fresh = freshRowIdSet.has(row.id);
              const changed = changedRowIdSet.has(row.id);
              const tone = getStatusTone(row.status);

              return (
                <tr
                  key={row.id}
                  tabIndex={0}
                  onClick={() => onSelect(row.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onSelect(row.id);
                    }
                  }}
                  className={[
                    'group border-b border-black/5 text-sm text-slate-800 transition-colors duration-500 last:border-b-0',
                    fresh && env === 'sandbox' && 'bg-amber-100/70',
                    fresh && env === 'production' && 'bg-cyan-50',
                    !fresh && 'hover:bg-black/[0.03]'
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <td className="px-5 py-4 align-middle">
                    <div
                      className={[
                        'relative pl-4 font-mono text-[0.82rem]',
                        (fresh || changed) &&
                        'before:absolute before:bottom-0 before:left-0 before:top-0 before:w-0.5 before:rounded-full',
                        fresh && env === 'sandbox' && 'before:bg-amber-600',
                        fresh && env === 'production' && 'before:bg-cyan-600',
                        !fresh && changed && 'before:bg-slate-500'
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      {row.id}
                    </div>
                  </td>
                  <td className="px-5 py-4 align-middle">
                    <strong className="block text-[0.95rem] font-semibold text-slate-900">{row.customer.name}</strong>
                    <span className="mt-1 block text-[0.82rem] text-slate-500">{row.customer.email}</span>
                  </td>
                  <td className="px-5 py-4 align-middle">
                    <StatusBadge
                      label={row.status}
                      tone={tone}
                      className={[
                        changed && 'scale-[1.03] ring-2 ring-offset-2',
                        changed &&
                          (env === 'sandbox'
                            ? 'ring-amber-300 ring-offset-amber-50'
                            : 'ring-cyan-200 ring-offset-cyan-50')
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    />
                  </td>
                  <td className="px-5 py-4 align-middle font-mono text-[0.82rem] text-slate-600">
                    {row.currency.toUpperCase()}
                  </td>
                  <td className="px-5 py-4 align-middle text-[0.92rem] font-semibold text-slate-950">
                    {formatAmount(row.amount, row.currency)}
                  </td>
                  <td className="px-5 py-4 align-middle text-[0.82rem] text-slate-500">{formatDate(row.created_at)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
