type EmptyStateProps = {
  title: string;
  message: string;
};

export function EmptyState({ title, message }: EmptyStateProps) {
  return (
    <div className="rounded-[2rem] border border-black/10 bg-white/78 p-8 shadow-[0_24px_64px_rgba(15,23,42,0.08)] backdrop-blur">
      <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">{title}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">{message}</p>
    </div>
  );
}
