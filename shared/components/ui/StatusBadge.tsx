import type { ReactNode } from 'react';

type StatusBadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

type StatusBadgeProps = {
  label: ReactNode;
  tone: StatusBadgeTone;
  className?: string;
};

const TONE_CLASSNAMES: Record<StatusBadgeTone, string> = {
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-rose-50 text-rose-700',
  info: 'bg-sky-50 text-sky-700',
  neutral: 'bg-slate-100 text-slate-700'
};

export function StatusBadge({ label, tone, className }: StatusBadgeProps) {
  return (
    <span
      className={[
        'inline-flex min-w-[96px] items-center justify-center rounded-full px-3 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.16em] transition-transform duration-300',
        TONE_CLASSNAMES[tone],
        className
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {label}
    </span>
  );
}
