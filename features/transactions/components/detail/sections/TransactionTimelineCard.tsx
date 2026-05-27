import type { Env } from '@/shared/lib/env';
import { formatDate } from '@/shared/lib/formatDate';
import type { TransactionDetail } from '@/features/transactions/types/transaction';

type TransactionTimelineCardProps = {
  env: Env;
  events: TransactionDetail['events'];
  highlightedEventKeys: string[];
};

export function TransactionTimelineCard({ env, events, highlightedEventKeys }: TransactionTimelineCardProps) {
  const highlightedSet = new Set(highlightedEventKeys);

  return (
    <section className="xl:col-span-6 rounded-[2rem] border border-black/10 bg-white/82 p-6 shadow-[0_24px_64px_rgba(15,23,42,0.08)] backdrop-blur">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[18px] font-semibold uppercase tracking-[0.24em] text-slate-500">
            Timeline
          </p>
        </div>
        {/* <p className="text-sm text-slate-500 font-medium">{events.length}개 이벤트</p> */}
      </div>
      <div style={{ background: 'lightgray', marginBottom: 10, width: '100%', height: '1px' }} />
      <div className="relative pl-6 before:absolute before:bottom-4 before:left-[8px] before:top-4 before:w-[2px] before:bg-slate-200">
        <ul className="m-0 list-none p-0 flex flex-col gap-4">
          {events.map((event, index) => {
            const key = `${event.type}-${event.at}`;
            const highlighted = highlightedSet.has(key);
            const isLast = index === events.length - 1;

            return (
              <li
                key={key}
                className={[
                  'relative flex items-center justify-between gap-4 rounded-2xl px-4 py-3 transition-all duration-500',
                  highlighted && env === 'sandbox' && 'bg-amber-50/80 shadow-sm ring-1 ring-amber-200/50',
                  highlighted && env === 'production' && 'bg-cyan-50/80 shadow-sm ring-1 ring-cyan-200/50'
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {/* Timeline Dot */}
                <div
                  className={[
                    'absolute -left-[24px] top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full border-2 transition-all duration-500',
                    isLast
                      ? env === 'sandbox'
                        ? 'border-amber-600 bg-amber-600' + (highlighted ? ' ring-4 ring-amber-100' : '')
                        : 'border-slate-950 bg-slate-950' + (highlighted ? ' ring-4 ring-slate-200' : '')
                      : highlighted
                        ? env === 'sandbox'
                          ? 'border-amber-600 ring-4 ring-amber-100 bg-amber-50'
                          : 'border-cyan-600 ring-4 ring-cyan-100 bg-cyan-50'
                        : 'border-slate-300 bg-white'
                  ]
                    .filter(Boolean)
                    .join(' ')}
                />

                <strong className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-900">
                  {event.type}
                </strong>
                <span className="text-xs font-mono font-medium text-slate-400">
                  {formatDate(event.at, { includeSeconds: true })}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
