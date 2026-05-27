'use client';

import { useEffect, useRef } from 'react';
import type { Env } from '@/lib/env';

type EnvSwitcherProps = {
  env: Env;
  pendingEnv: Env | null;
  showProductionConfirm: boolean;
  onRequestChange: (env: Env) => void;
  onConfirm: () => void;
  onCancel: () => void;
};

export function EnvSwitcher({
  env,
  pendingEnv,
  showProductionConfirm,
  onRequestChange,
  onConfirm,
  onCancel
}: EnvSwitcherProps) {
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!showProductionConfirm) {
      return;
    }

    cancelButtonRef.current?.focus();

    function handleKeydown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onCancel();
      }
    }

    window.addEventListener('keydown', handleKeydown);

    return () => {
      window.removeEventListener('keydown', handleKeydown);
    };
  }, [onCancel, showProductionConfirm]);

  return (
    <div className="relative">
      <div
        className="inline-flex gap-1 rounded-full border border-black/10 bg-white/75 p-1 shadow-[0_16px_32px_rgba(15,23,42,0.08)] backdrop-blur"
        role="tablist"
        aria-label="환경 전환"
      >
        <button
          type="button"
          className={[
            'rounded-full px-4 py-2.5 text-sm font-semibold transition-colors',
            env === 'sandbox' ? 'bg-amber-300 text-amber-950' : 'text-stone-700 hover:bg-stone-100'
          ].join(' ')}
          aria-pressed={env === 'sandbox'}
          onClick={() => onRequestChange('sandbox')}
        >
          Sandbox
        </button>
        <button
          type="button"
          className={[
            'rounded-full px-4 py-2.5 text-sm font-semibold transition-colors',
            env === 'production'
              ? 'bg-slate-950 text-slate-50'
              : pendingEnv === 'production' && showProductionConfirm
                ? 'bg-slate-200 text-slate-950'
                : 'text-stone-700 hover:bg-stone-100'
          ].join(' ')}
          aria-pressed={env === 'production'}
          onClick={() => onRequestChange('production')}
        >
          Production
        </button>
      </div>

      {showProductionConfirm ? (
        <div
          className="absolute right-0 top-[calc(100%+12px)] z-30 w-[320px] rounded-[1.75rem] border border-slate-300 bg-white p-5 shadow-2xl"
          role="dialog"
          aria-modal="false"
          aria-label="Production 거래 확인"
        >
          <h2 className="text-base font-semibold text-slate-950">Production 거래를 보시겠습니까?</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            실시간 실거래 상태가 표시되며, 상세 화면을 보고 있었다면 목록으로 이동합니다.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button
              ref={cancelButtonRef}
              type="button"
              onClick={onCancel}
              className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700"
            >
              취소
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
            >
              계속
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
