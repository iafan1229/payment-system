import { http } from '@/shared/api/http';
import type { TransactionDetail, TransactionsPage } from '@/features/transactions/types/transaction';
import type { Env } from '@/shared/lib/env';
export type {
  TransactionDetail,
  TransactionsPage,
  TransactionRow,
  TransactionStatus
} from '@/features/transactions/types/transaction';

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
