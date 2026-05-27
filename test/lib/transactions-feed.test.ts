import { describe, expect, it } from 'vitest';
import { buildTransactionsFeed } from '@/lib/transaction/transactionsFeed';
import type { TransactionsPage } from '@/lib/transaction/transactionsApi';

function createPage(input: Partial<TransactionsPage> & Pick<TransactionsPage, 'data'>): TransactionsPage {
  return {
    data: input.data,
    has_more: input.has_more ?? false,
    next_cursor: input.next_cursor ?? null
  };
}

describe('buildTransactionsFeed', () => {
  it('flattens rows in page order and exposes the last cursor state', () => {
    const pageOne = createPage({
      data: [
        {
          id: 'txn_1',
          amount: 1000,
          currency: 'usd',
          status: 'pending',
          customer: { id: 'cus_1', name: 'A', email: 'a@example.com' },
          created_at: '2026-05-27T00:00:00.000Z'
        }
      ],
      has_more: true,
      next_cursor: 'txn_1'
    });
    const pageTwo = createPage({
      data: [
        {
          id: 'txn_2',
          amount: 2000,
          currency: 'usd',
          status: 'succeeded',
          customer: { id: 'cus_2', name: 'B', email: 'b@example.com' },
          created_at: '2026-05-26T00:00:00.000Z'
        }
      ],
      has_more: false,
      next_cursor: null
    });

    expect(buildTransactionsFeed([pageOne, pageTwo])).toEqual({
      rows: [...pageOne.data, ...pageTwo.data],
      hasMore: false,
      nextCursor: null
    });
  });

  it('returns empty defaults when no page has loaded yet', () => {
    expect(buildTransactionsFeed([])).toEqual({
      rows: [],
      hasMore: false,
      nextCursor: null
    });
  });
});
