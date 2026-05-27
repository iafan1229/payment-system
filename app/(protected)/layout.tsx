'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { logout } from '@/lib/auth-api';
import { useAuthStore } from '@/stores/auth-store';
import { Header } from '@/components/Header';

type ProtectedLayoutProps = {
  children: ReactNode;
};

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthResolved = useAuthStore((state) => state.isAuthResolved);
  const clearUser = useAuthStore((state) => state.clearUser);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (isAuthResolved && !user) {
      router.replace('/login');
    }
  }, [isAuthResolved, router, user]);

  if (!isAuthResolved) {
    return (
      <main className="protected-loading">
        <p>세션을 확인하는 중입니다...</p>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      await logout();
    } finally {
      clearUser();
      router.replace('/login');
      setIsLoggingOut(false);
    }
  }

  return (
    <div className="protected-shell">
      <Header user={user} onLogout={handleLogout} isLoggingOut={isLoggingOut} />
      {children}
    </div>
  );
}
