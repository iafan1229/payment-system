import type { Env } from '@/lib/env';
import type { TransactionRow } from '@/lib/transactions-api';

type TransactionsTableProps = {
  env: Env;
  rows: TransactionRow[];
  freshRowIds: string[];
  changedRowIds: string[];
  onSelect: (id: string) => void;
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
    minute: '2-digit'
  });
}

type StatusTone = 'success' | 'pending' | 'failed' | 'refunded';

function getStatusTone(status: TransactionRow['status']): StatusTone {
  switch (status) {
    case 'succeeded':
      return 'success';
    case 'pending':
      return 'pending';
    case 'failed':
      return 'failed';
    case 'refunded':
      return 'refunded';
  }
}

export function TransactionsTable({ env, rows, freshRowIds, changedRowIds, onSelect }: TransactionsTableProps) {
  const freshRowIdSet = new Set(freshRowIds);
  const changedRowIdSet = new Set(changedRowIds);

  if (rows.length === 0) {
    return (
      <div className="rounded-[2rem] border border-black/10 bg-white/78 p-8 shadow-[0_24px_64px_rgba(15,23,42,0.08)] backdrop-blur">
        <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">표시할 거래가 아직 없습니다</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          {env === 'sandbox'
            ? '새 거래가 생성되면 자동으로 이 목록에 반영됩니다.'
            : '실거래가 들어오면 자동으로 이 목록에 반영됩니다.'}
        </p>
      </div>
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
                    <span
                      className={[
                        'inline-flex min-w-[96px] items-center justify-center rounded-full px-3 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.16em] transition-transform duration-300',
                        changed && 'scale-[1.03] ring-2 ring-offset-2',
                        tone === 'success' && 'bg-emerald-50 text-emerald-700',
                        tone === 'pending' && 'bg-amber-50 text-amber-700',
                        tone === 'failed' && 'bg-rose-50 text-rose-700',
                        tone === 'refunded' && 'bg-sky-50 text-sky-700',
                        changed &&
                          (env === 'sandbox'
                            ? 'ring-amber-300 ring-offset-amber-50'
                            : 'ring-cyan-200 ring-offset-cyan-50')
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      {row.status}
                    </span>
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
