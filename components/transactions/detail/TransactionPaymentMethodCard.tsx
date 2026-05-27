import type { Env } from '@/lib/env';
import type { TransactionDetail } from '@/lib/transactions-api';

type TransactionPaymentMethodCardProps = {
  env: Env;
  paymentMethod: TransactionDetail['payment_method'];
  pendingPaymentMethod: TransactionDetail['payment_method'] | null;
  highlighted: boolean;
};

export function TransactionPaymentMethodCard({
  env,
  paymentMethod,
  pendingPaymentMethod,
  highlighted
}: TransactionPaymentMethodCardProps) {
  return (
    <section
      className={[
        'xl:col-span-5 rounded-[2rem] border bg-white/82 p-6 shadow-[0_24px_64px_rgba(15,23,42,0.08)] backdrop-blur transition-colors duration-500',
        highlighted && env === 'sandbox' && 'border-amber-300 bg-amber-50/80',
        highlighted && env === 'production' && 'border-cyan-300 bg-cyan-50/70',
        !highlighted && 'border-black/10'
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="mb-5 flex flex-col gap-2">
        <p className="font-mono text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-slate-500">
          Payment Method
        </p>
        <h2 className="text-[1.45rem] font-semibold tracking-[-0.03em] text-slate-950">
          {paymentMethod.brand} •••• {paymentMethod.last4}
        </h2>
        {pendingPaymentMethod ? (
          <span className="w-fit rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
            서버에 새 결제수단 정보 대기 중
          </span>
        ) : null}
      </div>

      <div className="grid gap-4 text-sm text-slate-700">
        <div>
          <span className="block text-xs font-medium uppercase tracking-[0.18em] text-slate-500">브랜드</span>
          <strong className="mt-2 block text-base font-semibold text-slate-950">{paymentMethod.brand}</strong>
        </div>
        <div>
          <span className="block text-xs font-medium uppercase tracking-[0.18em] text-slate-500">타입</span>
          <strong className="mt-2 block text-base font-semibold text-slate-950">{paymentMethod.type}</strong>
        </div>
        <div>
          <span className="block text-xs font-medium uppercase tracking-[0.18em] text-slate-500">만료</span>
          <strong className="mt-2 block text-base font-semibold text-slate-950">
            {paymentMethod.exp_month}/{paymentMethod.exp_year}
          </strong>
        </div>
      </div>
    </section>
  );
}
