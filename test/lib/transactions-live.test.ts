import { describe, expect, it } from 'vitest';
import type { TransactionRow } from '@/lib/transactions-api';
import { diffTransactions, mergeQueuedRows, preserveVisibleRows } from '@/lib/transactions-live';

function createRow(overrides: Partial<TransactionRow> & Pick<TransactionRow, 'id'>): TransactionRow {
  return {
    id: overrides.id,
    amount: overrides.amount ?? 1200,
    currency: overrides.currency ?? 'usd',
    status: overrides.status ?? 'pending',
    customer: overrides.customer ?? {
      name: 'Demo User',
      email: 'demo@example.com'
    },
    created_at: overrides.created_at ?? '2026-05-27T00:00:00.000Z'
  };
}

describe('transactions live helpers', () => {
  it('classifies new rows and changed statuses separately', () => {
    const previousRows = [
      createRow({ id: 'txn_1', status: 'pending' }),
      createRow({ id: 'txn_2', status: 'succeeded' })
    ];
    const nextRows = [
      createRow({ id: 'txn_3', status: 'pending' }),
      createRow({ id: 'txn_1', status: 'succeeded' }),
      createRow({ id: 'txn_2', status: 'succeeded' })
    ];

    expect(diffTransactions(previousRows, nextRows)).toMatchObject({
      newRows: [nextRows[0]],
      changedRowIds: ['txn_1']
    });
  });

  it('preserves the currently visible rows while refreshing their field values', () => {
    const currentRows = [
      createRow({ id: 'txn_1', status: 'pending' }),
      createRow({ id: 'txn_2', status: 'succeeded' })
    ];
    const nextRows = [
      createRow({ id: 'txn_3', status: 'pending' }),
      createRow({ id: 'txn_1', status: 'failed' }),
      createRow({ id: 'txn_2', status: 'succeeded' })
    ];
    const diff = diffTransactions(currentRows, nextRows);

    expect(preserveVisibleRows(currentRows, diff)).toEqual([
      createRow({ id: 'txn_1', status: 'failed' }),
      createRow({ id: 'txn_2', status: 'succeeded' })
    ]);
  });

  it('deduplicates queued rows while keeping the newest incoming rows first', () => {
    const currentQueue = [createRow({ id: 'txn_2' }), createRow({ id: 'txn_1' })];
    const incomingRows = [createRow({ id: 'txn_3' }), createRow({ id: 'txn_2' })];

    expect(mergeQueuedRows(currentQueue, incomingRows).map((row) => row.id)).toEqual([
      'txn_3',
      'txn_2',
      'txn_1'
    ]);
  });
});
