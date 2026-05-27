'use client';

interface TransactionsHeaderProps {
  userName: string | null;
}

export function TransactionsHeader({ userName }: TransactionsHeaderProps) {
  return (
    <div className="max-w-3xl mb-2">
      <span className="mb-2 block font-mono text-xs font-bold uppercase tracking-[0.2em] text-amber-600">
        Hopae Payments
      </span>
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
        거래 흐름 분석
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-500">
        {userName
          ? `${userName} 계정으로 로그인됨 · 실시간 거래 흐름 및 상태 변화를 한눈에 모니터링합니다.`
          : '실시간 거래 흐름 및 상태 변화를 한눈에 모니터링합니다.'}
      </p>
    </div>
  );
}
