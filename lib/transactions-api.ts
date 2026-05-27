import { http } from '@/lib/http';
import type { Env } from '@/lib/env';

export type TransactionStatus = 'pending' | 'succeeded' | 'failed' | 'refunded';

export type TransactionRow = {
  id: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  customer: {
    id: string;
    name: string;
    email: string;
  };
  created_at: string;
};

export type TransactionsPage = {
  data: TransactionRow[];
  has_more: boolean;
  next_cursor: string | null;
};

export type TransactionDetail = TransactionRow & {
  payment_method: {
    type: string;
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
  events: Array<{
    type: string;
    at: string;
  }>;
  metadata: Record<string, string>;
};

export function getTransactions(env: Env, cursor?: string | null) {
  const searchParams = new URLSearchParams({
    env,
    limit: '20'
  });

  if (cursor) {
    searchParams.set('cursor', cursor);
  }

  return http<TransactionsPage>(`/api/transactions?${searchParams.toString()}`);
}

export function getTransactionDetail(env: Env, id: string) {
  return http<TransactionDetail>(`/api/transactions/${id}?env=${env}`);
}
