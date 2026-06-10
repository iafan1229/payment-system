'use client';

import Link from 'next/link';

interface HeaderProps {
  user: {
    name: string;
    email: string;
  };
  onLogout: () => void;
  isLoggingOut: boolean;
}

export function Header({ user, onLogout, isLoggingOut }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-black/5 bg-white/60 py-3.5 px-6 backdrop-blur-md md:px-10">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        {/* Brand Mark */}
        <Link href="/transactions" className="group flex items-center gap-3 transition-colors hover:opacity-90">
          <div className="flex h-6 w-6 rotate-45 items-center justify-center border-2 border-slate-950 bg-transparent transition-all group-hover:bg-slate-950">
            <div className="h-1.5 w-1.5 bg-slate-950 group-hover:bg-white" />
          </div>
          <span className="font-mono text-xs font-extrabold tracking-[0.2em] text-slate-950">
            Test PAYMENTS
          </span>
        </Link>

        {/* User Info & Actions */}
        <div className="flex items-center gap-5">
          <div className="flex flex-col items-end text-right">
            <span className="text-xs font-bold text-slate-950 leading-tight">{user.name}</span>
            <span className="font-mono text-[9px] font-medium text-slate-400 tracking-tight">{user.email}</span>
          </div>

          <button
            type="button"
            onClick={onLogout}
            disabled={isLoggingOut}
            className="rounded-full bg-slate-950 px-4 py-1.5 text-xs font-semibold text-slate-50 transition-all hover:bg-slate-800 disabled:cursor-wait disabled:opacity-50"
          >
            {isLoggingOut ? '로그아웃 중...' : '로그아웃'}
          </button>
        </div>
      </div>
    </header>
  );
}
