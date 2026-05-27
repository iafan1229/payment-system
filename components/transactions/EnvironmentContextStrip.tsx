import type { Env } from '@/lib/auth/env';

type EnvironmentContextStripProps = {
  env: Env;
};

const ENV_COPY = {
  sandbox: {
    label: 'Sandbox feed',
    title: '',
    body: ''
  },
  production: {
    label: 'Production console',
    title: '',
    body: ''
  }
} satisfies Record<Env, { label: string; title: string; body: string }>;

export function EnvironmentContextStrip({ env }: EnvironmentContextStripProps) {
  const copy = ENV_COPY[env];

  return (
    <section
      className={[
        'mb-6 rounded-[2rem] border px-5 py-4 shadow-[0_16px_48px_rgba(15,23,42,0.08)] backdrop-blur md:px-6',
        env === 'sandbox'
          ? 'border-amber-300/40 bg-amber-100/70 text-amber-950'
          : 'border-slate-300/70 bg-slate-900 text-slate-50'
      ].join(' ')}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="max-w-3xl">
          <p className="font-mono text-[18px] font-semibold uppercase tracking-[0.28em] opacity-80">
            {copy.label}
          </p>
          <h2 className="text-lg font-semibold tracking-[-0.02em] md:text-[1.35rem]">{copy.title}</h2>
        </div>
        <p
          className={[
            'max-w-2xl text-sm leading-6 md:text-right',
            env === 'sandbox' ? 'text-amber-950/80' : 'text-slate-200'
          ].join(' ')}
        >
          {copy.body}
        </p>
      </div>
    </section>
  );
}
