'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { useAuthBootstrap } from '@/hooks/useAuthBootstrap';

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  const [queryClient] = useState(() => new QueryClient());

  useAuthBootstrap();

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
