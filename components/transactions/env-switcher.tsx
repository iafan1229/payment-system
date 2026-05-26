'use client';

import type { Env } from '@/lib/env';

type EnvSwitcherProps = {
  env: Env;
  onChange: (env: Env) => void;
};

export function EnvSwitcher({ env, onChange }: EnvSwitcherProps) {
  return (
    <div className="env-switcher" role="tablist" aria-label="환경 전환">
      <button
        type="button"
        className={`env-option ${env === 'sandbox' ? 'is-active is-sandbox' : ''}`}
        aria-pressed={env === 'sandbox'}
        onClick={() => onChange('sandbox')}
      >
        Sandbox
      </button>
      <button
        type="button"
        className={`env-option ${env === 'production' ? 'is-active is-production' : ''}`}
        aria-pressed={env === 'production'}
        onClick={() => onChange('production')}
      >
        Production
      </button>
    </div>
  );
}
