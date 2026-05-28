import type { Env } from '@/shared/lib/env';

type TransactionMetadataCardProps = {
  env: Env;
  metadata: Record<string, string>;
  highlighted: boolean;
};

export function TransactionMetadataCard({ env, metadata, highlighted }: TransactionMetadataCardProps) {
  return (
    <section
      className={[
        'xl:col-span-12 rounded-[2rem] border bg-white/82 p-6 shadow-[0_24px_64px_rgba(15,23,42,0.08)] backdrop-blur transition-colors duration-500',
        highlighted && env === 'sandbox' && 'border-amber-300 bg-amber-50/80',
        highlighted && env === 'production' && 'border-cyan-300 bg-cyan-50/70',
        !highlighted && 'border-black/10'
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-[18px] font-semibold uppercase tracking-[0.24em] text-slate-500">
            Metadata
          </p>
        </div>
      </div>
      <div style={{ background: 'lightgray', marginBottom: 20, width: '100%', height: '1px' }} />
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
