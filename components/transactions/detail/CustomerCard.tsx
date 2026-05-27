import type { Env } from '@/lib/env';
import type { TransactionDetail } from '@/lib/transactions-api';

type CustomerCardProps = {
  env: Env;
  customer: TransactionDetail['customer'];
  highlighted: boolean;
};

export function CustomerCard({ env, customer, highlighted }: CustomerCardProps) {
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
          <p className="mb-3 font-mono text-[18px] font-semibold uppercase tracking-[0.24em] text-slate-500">
            Customer
          </p>
        </div>
      </div>
      <div style={{ background: 'lightgray', marginTop: 10, width: '100%', height: '1px' }} />
      <div className="mt-6 grid gap-4 grid-cols-1 sm:grid-cols-3">
        <div>
          <span className="block text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Name</span>
          <strong className="mt-2 block text-base font-semibold text-slate-950">{customer.name}</strong>
        </div>
        <div>
          <span className="block text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Email</span>
          <strong className="mt-2 block text-base font-semibold text-slate-950 font-mono break-all">{customer.email}</strong>
        </div>
        <div>
          <span className="block text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Customer ID</span>
          <strong className="mt-2 block text-base font-semibold text-slate-950 font-mono">{customer.id || 'N/A'}</strong>
        </div>
      </div>
    </section>
  );
}
