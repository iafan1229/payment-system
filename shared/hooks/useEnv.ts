'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  buildEnvChangeUrl,
  buildUrlWithEnv,
  ENV_STORAGE_KEY,
  isTransactionDetailPath,
  normalizeEnv,
  resolveInitialEnv,
  type Env
} from '@/shared/lib/env';

export function useEnv() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentEnvParam = searchParams.get('env');
  const env = normalizeEnv(currentEnvParam);
  const previousEnvRef = useRef(env);

  useEffect(() => {
    const storedValue = window.localStorage.getItem(ENV_STORAGE_KEY);
    const nextEnv = resolveInitialEnv(currentEnvParam, storedValue);

    window.localStorage.setItem(ENV_STORAGE_KEY, nextEnv);

    if (currentEnvParam === nextEnv) {
      if (isTransactionDetailPath(pathname) && previousEnvRef.current !== env) {
        router.replace(buildEnvChangeUrl(pathname, searchParams, env));
      }
    } else {
      router.replace(buildUrlWithEnv(pathname, searchParams, nextEnv));
    }

    previousEnvRef.current = env;
  }, [currentEnvParam, env, pathname, router, searchParams]);

  function setEnv(nextEnv: Env) {
    const normalizedEnv = normalizeEnv(nextEnv);
    window.localStorage.setItem(ENV_STORAGE_KEY, normalizedEnv);
    router.push(buildEnvChangeUrl(pathname, searchParams, normalizedEnv));
  }

  return { env, setEnv };
}
