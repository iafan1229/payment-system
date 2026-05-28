import { describe, expect, it } from 'vitest';
import type { TransactionDetail } from '@/features/transactions/types/transaction';
import { diffTransactionDetail } from '@/features/transactions/lib/transactionDetailLive';

function createDetail(overrides: Partial<TransactionDetail> & Pick<TransactionDetail, 'id'>): TransactionDetail {
  return {
    id: overrides.id,
    amount: overrides.amount ?? 1200,
    currency: overrides.currency ?? 'usd',
    status: overrides.status ?? 'pending',
    customer: overrides.customer ?? {
      id: 'cus_demo',
      name: 'Demo User',
      email: 'demo@example.com'
    },
    created_at: overrides.created_at ?? '2026-05-27T00:00:00.000Z',
    payment_method: overrides.payment_method ?? {
      type: 'card',
      brand: 'visa',
      last4: '4242',
      exp_month: 12,
      exp_year: 2030
    },
    events: overrides.events ?? [{ type: 'created', at: '2026-05-27T00:00:00.000Z' }],
    metadata: overrides.metadata ?? {
      order_id: 'ord_123'
    }
  };
}

describe('transaction detail live helpers', () => {
  it('applies status and timeline updates immediately', () => {
    const previousServerDetail = createDetail({ id: 'txn_1', status: 'pending' });
    const nextServerDetail = createDetail({
      id: 'txn_1',
      status: 'succeeded',
      events: [
        { type: 'created', at: '2026-05-27T00:00:00.000Z' },
        { type: 'succeeded', at: '2026-05-27T00:00:05.000Z' }
      ]
    });

    const diff = diffTransactionDetail({
      previousServerDetail,
      nextServerDetail
    });

    expect(diff.nextAcceptedDetail.status).toBe('succeeded');
    expect(diff.nextAcceptedDetail.events).toHaveLength(2);
    expect(diff.appendedEvents).toEqual([{ type: 'succeeded', at: '2026-05-27T00:00:05.000Z' }]);
  });

  it('applies metadata and payment method updates immediately', () => {
    const previousServerDetail = createDetail({ id: 'txn_1' });
    const nextServerDetail = createDetail({
      id: 'txn_1',
      metadata: {
        order_id: 'ord_999',
        source: 'live'
      },
      payment_method: {
        type: 'card',
        brand: 'mastercard',
        last4: '4444',
        exp_month: 11,
        exp_year: 2032
      }
    });

    const diff = diffTransactionDetail({
      previousServerDetail,
      nextServerDetail
    });

    expect(diff.metadataChanged).toBe(true);
    expect(diff.paymentMethodChanged).toBe(true);
    expect(diff.nextAcceptedDetail.metadata).toEqual(nextServerDetail.metadata);
    expect(diff.nextAcceptedDetail.payment_method).toEqual(nextServerDetail.payment_method);
  });
});
