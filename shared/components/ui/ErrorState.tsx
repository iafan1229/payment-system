type ErrorStateProps = {
  message: string;
};

export function ErrorState({ message }: ErrorStateProps) {
  return (
    <p className="rounded-[2rem] border border-rose-200 bg-rose-50 p-6 text-rose-700 shadow-[0_24px_64px_rgba(15,23,42,0.08)]">
      {message}
    </p>
  );
}
