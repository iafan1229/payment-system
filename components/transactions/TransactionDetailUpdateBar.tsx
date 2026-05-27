import type { Env } from '@/lib/env';

type TransactionDetailUpdateBarProps = {
  env: Env;
  message: string | null;
  errorMessage: string | null;
  hasPendingChanges: boolean;
  onApply: () => void;
};

export function TransactionDetailUpdateBar({
  env,
  message,
  errorMessage,
  hasPendingChanges,
  onApply
}: TransactionDetailUpdateBarProps) {
  if (!message && !errorMessage && !hasPendingChanges) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={[
        'sticky top-3 z-20 mb-5 flex flex-col gap-3 rounded-[1.5rem] border px-4 py-3 shadow-[0_18px_48px_rgba(15,23,42,0.12)] backdrop-blur md:flex-row md:items-center md:justify-between',
        env === 'sandbox'
          ? 'border-amber-300/50 bg-white/82 text-stone-900'
          : 'border-slate-300/80 bg-white/86 text-slate-900'
      ].join(' ')}
    >
      <div className="space-y-1">
        {message ? <p className="m-0 text-sm font-medium text-slate-800">{message}</p> : null}
        {errorMessage ? <p className="m-0 text-sm text-rose-700">{errorMessage}</p> : null}
        {!message && hasPendingChanges ? (
          <p className="m-0 text-sm font-medium text-slate-800">보류 중인 본문 변경이 있습니다.</p>
        ) : null}
      </div>

      {hasPendingChanges ? (
        <button
          type="button"
          onClick={onApply}
          className="shrink-0 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
        >
          변경 적용
        </button>
      ) : null}
    </div>
  );
}
