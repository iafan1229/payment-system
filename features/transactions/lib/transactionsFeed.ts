//여러 페이지로 받아온 거래 데이터를 한 줄 목록으로 합쳐주는 파일
import type { TransactionRow, TransactionsPage } from '@/features/transactions/types/transaction';

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
