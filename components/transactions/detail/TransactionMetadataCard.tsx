import type { Env } from '@/lib/env';

type TransactionMetadataCardProps = {
  env: Env;
  metadata: Record<string, string>;
  pendingMetadata: Record<string, string> | null;
  highlighted: boolean;
};

export function TransactionMetadataCard({
  env,
  metadata,
  pendingMetadata,
  highlighted
}: TransactionMetadataCardProps) {
  return (
    <section
      className={[
        'xl:col-span-7 rounded-[2rem] border bg-white/82 p-6 shadow-[0_24px_64px_rgba(15,23,42,0.08)] backdrop-blur transition-colors duration-500',
        highlighted && env === 'sandbox' && 'border-amber-300 bg-amber-50/80',
        highlighted && env === 'production' && 'border-cyan-300 bg-cyan-50/70',
        !highlighted && 'border-black/10'
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-3 font-mono text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-slate-500">
            Metadata
          </p>
          <h2 className="text-[1.45rem] font-semibold tracking-[-0.03em] text-slate-950">본문 메타데이터</h2>
        </div>
        {pendingMetadata ? (
          <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
            변경 {Object.keys(pendingMetadata).length}건 대기 중
          </span>
        ) : null}
      </div>

      <dl className="m-0 grid gap-4">
        {Object.entries(metadata).map(([key, value]) => (
          <div key={key} className="border-t border-black/6 pt-4 first:border-t-0 first:pt-0">
            <dt className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">{key}</dt>
            <dd className="mt-2 text-sm leading-6 text-slate-800">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
