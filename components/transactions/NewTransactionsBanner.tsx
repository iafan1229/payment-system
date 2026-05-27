import type { Env } from '@/lib/auth/env';

type NewTransactionsBannerProps = {
  env: Env;
  count: number;
  onApply: () => void;
};

export function NewTransactionsBanner({ env, count, onApply }: NewTransactionsBannerProps) {
  if (count <= 0) {
    return null;
  }

  return (
    <div className="sticky top-24 z-20 mb-5 flex justify-center">
      <button
        type="button"
        onClick={onApply}
        className={[
          'inline-flex items-center gap-3 rounded-full border px-5 py-3 text-left shadow-[0_20px_48px_rgba(15,23,42,0.14)] transition-transform duration-300 ease-out hover:-translate-y-0.5',
          env === 'sandbox'
            ? 'border-amber-300 bg-amber-100/95 text-amber-950'
            : 'border-cyan-200 bg-cyan-50/95 text-slate-950'
        ].join(' ')}
      >
        <span className="font-semibold">{`새 거래 ${count}건 보기`}</span>
        <span className="text-sm opacity-75">현재 읽고 있는 위치는 그대로 유지됩니다.</span>
      </button>
    </div>
  );
}
