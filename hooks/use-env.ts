'use client';

import { useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { normalizeEnv, resolveInitialEnv, type Env } from '@/lib/env';

const STORAGE_KEY = 'hopae:last-env';

function buildUrl(pathname: string, searchParams: URLSearchParams) {
  const query = searchParams.toString();

  return query ? `${pathname}?${query}` : pathname;
}

export function useEnv() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentEnvParam = searchParams.get('env');
  const env = normalizeEnv(currentEnvParam);

  useEffect(() => {
    const storedValue = window.localStorage.getItem(STORAGE_KEY);
    const nextEnv = resolveInitialEnv(currentEnvParam, storedValue);

    window.localStorage.setItem(STORAGE_KEY, nextEnv);

    if (currentEnvParam === nextEnv) {
      return;
    }

    const nextSearchParams = new URLSearchParams(searchParams.toString());
    nextSearchParams.set('env', nextEnv);
    router.replace(buildUrl(pathname, nextSearchParams));
  }, [currentEnvParam, pathname, router, searchParams]);

  function setEnv(nextEnv: Env) {
    const normalizedEnv = normalizeEnv(nextEnv);
    const nextSearchParams = new URLSearchParams(searchParams.toString());

    nextSearchParams.set('env', normalizedEnv);
    window.localStorage.setItem(STORAGE_KEY, normalizedEnv);
    router.push(buildUrl(pathname, nextSearchParams));
  }

  return { env, setEnv };
}
