import type { Env } from '@/lib/env';

type EnvironmentContextStripProps = {
  env: Env;
};

const ENV_COPY = {
  sandbox: {
    label: 'Sandbox feed',
    title: '실험용 거래 흐름을 빠르게 읽는 환경입니다.',
    body: '새 거래 하이라이트와 반응 톤을 조금 더 적극적으로 드러내 현재 들어오는 변화를 놓치지 않게 합니다.'
  },
  production: {
    label: 'Production console',
    title: '실거래 상태를 절제된 운영 톤으로 보여줍니다.',
    body: '읽는 흐름은 차분하게 유지하되, 현재 보고 있는 데이터가 실운영 맥락이라는 점은 즉시 인지되도록 구성합니다.'
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
          <p className="mb-2 font-mono text-[0.68rem] font-semibold uppercase tracking-[0.28em] opacity-80">
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
