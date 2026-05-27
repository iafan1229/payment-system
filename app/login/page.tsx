'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoginForm } from '@/components/auth/LoginForm';
import { login } from '@/lib/auth/auth-api';
import { useAuthStore } from '@/stores/auth-store';

export default function LoginPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthResolved = useAuthStore((state) => state.isAuthResolved);
  const setUser = useAuthStore((state) => state.setUser);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthResolved && user) {
      router.replace('/transactions');
    }
  }, [isAuthResolved, router, user]);

  async function handleLogin(input: { email: string; password: string }) {
    setIsPending(true);
    setError(null);

    try {
      const response = await login(input);
      setUser(response.user);
      router.replace('/transactions');
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : '로그인에 실패했습니다.');
    } finally {
      setIsPending(false);
    }
  }

  if (!isAuthResolved) {
    return (
      <main className="login-shell">
        <section className="login-card">
          <p className="eyebrow">세션 확인 중</p>
          <h1>결제 대시보드에 연결하고 있어요</h1>
        </section>
      </main>
    );
  }

  return (
    <main className="login-shell">
      <section className="login-card">
        <p className="eyebrow">Hopae Payments</p>
        <h1>결제 운영 대시보드</h1>
        <p className="lead">
          Sandbox와 Production 거래 흐름을 한 화면에서 확인하고, 상태 변화를 몇 초 안에 따라갈 수
          있도록 구성합니다.
        </p>
        <LoginForm onSubmit={handleLogin} isPending={isPending} error={error} />
      </section>
    </main>
  );
}
