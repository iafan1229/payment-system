import type { TransactionRow, TransactionsPage } from '@/lib/transactions-api';

type TransactionsFeed = {
  rows: TransactionRow[];
  hasMore: boolean;
  nextCursor: string | null;
};

export function buildTransactionsFeed(pages: TransactionsPage[]): TransactionsFeed {
  const rows = pages.flatMap((page) => page.data);
  const lastPage = pages.at(-1);

  return {
    rows,
    hasMore: lastPage?.has_more ?? false,
    nextCursor: lastPage?.next_cursor ?? null
  };
}
