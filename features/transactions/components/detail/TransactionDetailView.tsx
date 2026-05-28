import type { Env } from '@/shared/lib/env';
import type { TransactionDetail } from '@/features/transactions/types/transaction';
import { TransactionMetadataCard } from '@/features/transactions/components/detail/sections/TransactionMetadataCard';
import { TransactionPaymentMethodCard } from '@/features/transactions/components/detail/sections/TransactionPaymentMethodCard';
import { TransactionSummaryCard } from '@/features/transactions/components/detail/sections/TransactionSummaryCard';
import { TransactionTimelineCard } from '@/features/transactions/components/detail/sections/TransactionTimelineCard';
import { CustomerCard } from '@/features/transactions/components/detail/sections/CustomerCard';

type TransactionDetailViewProps = {
  env: Env;
  detail: TransactionDetail;
  highlightedCards: string[];
  highlightedEventKeys: string[];
};

export function TransactionDetailView({
  env,
  detail,
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
        highlighted={highlightedCards.includes('payment_method')}
      />
      <TransactionMetadataCard
        env={env}
        metadata={detail.metadata}
        highlighted={highlightedCards.includes('metadata')}
      />
    </div>
  );
}
