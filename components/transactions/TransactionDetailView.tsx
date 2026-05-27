import type { Env } from '@/lib/env';
import type { TransactionDetail } from '@/lib/transactions-api';
import { TransactionMetadataCard } from '@/components/transactions/detail/TransactionMetadataCard';
import { TransactionPaymentMethodCard } from '@/components/transactions/detail/TransactionPaymentMethodCard';
import { TransactionSummaryCard } from '@/components/transactions/detail/TransactionSummaryCard';
import { TransactionTimelineCard } from '@/components/transactions/detail/TransactionTimelineCard';
import { CustomerCard } from '@/components/transactions/detail/CustomerCard';

type TransactionDetailViewProps = {
  env: Env;
  detail: TransactionDetail;
  pendingMetadata: Record<string, string> | null;
  pendingPaymentMethod: TransactionDetail['payment_method'] | null;
  highlightedCards: string[];
  highlightedEventKeys: string[];
};

export function TransactionDetailView({
  env,
  detail,
  pendingMetadata,
  pendingPaymentMethod,
  highlightedCards,
  highlightedEventKeys
}: TransactionDetailViewProps) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-12 xl:grid-flow-dense">
      <TransactionSummaryCard env={env} detail={detail} highlighted={highlightedCards.includes('summary')} />
      <CustomerCard env={env} customer={detail.customer} highlighted={highlightedCards.includes('summary')} />
      <TransactionTimelineCard env={env} events={detail.events} highlightedEventKeys={highlightedEventKeys} />
      <TransactionPaymentMethodCard
        env={env}
        paymentMethod={detail.payment_method}
        pendingPaymentMethod={pendingPaymentMethod}
        highlighted={highlightedCards.includes('payment_method')}
      />
      <TransactionMetadataCard
        env={env}
        metadata={detail.metadata}
        pendingMetadata={pendingMetadata}
        highlighted={highlightedCards.includes('metadata')}
      />
    </div>
  );
}
