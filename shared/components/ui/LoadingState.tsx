type LoadingStateProps = {
  message: string;
};

export function LoadingState({ message }: LoadingStateProps) {
  return (
    <p className="rounded-[2rem] border border-black/10 bg-white/78 p-6 shadow-[0_24px_64px_rgba(15,23,42,0.08)]">
      {message}
    </p>
  );
}
