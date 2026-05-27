import type { Env } from '@/lib/env';
import type { TransactionDetail } from '@/lib/transactions-api';

type TransactionTimelineCardProps = {
  env: Env;
  events: TransactionDetail['events'];
  highlightedEventKeys: string[];
};

function formatDate(value: string) {
  return new Date(value).toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

export function TransactionTimelineCard({ env, events, highlightedEventKeys }: TransactionTimelineCardProps) {
  const highlightedSet = new Set(highlightedEventKeys);

  return (
    <section className="xl:col-span-6 rounded-[2rem] border border-black/10 bg-white/82 p-6 shadow-[0_24px_64px_rgba(15,23,42,0.08)] backdrop-blur">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="mb-3 font-mono text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-slate-500">
            Timeline
          </p>
          <h2 className="text-[1.45rem] font-semibold tracking-[-0.03em] text-slate-950">이벤트 흐름</h2>
        </div>
        <p className="text-sm text-slate-500">{events.length}개 이벤트</p>
      </div>

      <ul className="m-0 list-none p-0">
        {events.map((event) => {
          const key = `${event.type}-${event.at}`;
          const highlighted = highlightedSet.has(key);

          return (
            <li
              key={key}
              className={[
                'flex items-center justify-between gap-4 border-t border-black/6 py-4 first:border-t-0 first:pt-0 last:pb-0',
                highlighted && env === 'sandbox' && 'bg-amber-50/70',
                highlighted && env === 'production' && 'bg-cyan-50/70'
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <strong className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-900">{event.type}</strong>
              <span className="text-sm text-slate-500">{formatDate(event.at)}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
