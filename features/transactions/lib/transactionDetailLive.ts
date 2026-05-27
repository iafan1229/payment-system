//상세 화면용 diff 계산기
import type { TransactionDetail } from '@/features/transactions/types/transaction';

type DetailDiffInput = {
  displayedDetail: TransactionDetail;
  previousServerDetail: TransactionDetail;
  nextServerDetail: TransactionDetail;
};

export type DetailDiff = {
  nextAcceptedDetail: TransactionDetail;
  pendingMetadata: Record<string, string> | null;
  pendingPaymentMethod: TransactionDetail['payment_method'] | null;
  appendedEvents: TransactionDetail['events'];
  summaryChanged: boolean;
  message: string | null;
};

function isSameRecord(left: Record<string, string>, right: Record<string, string>) {
  const leftEntries = Object.entries(left);
  const rightEntries = Object.entries(right);

  if (leftEntries.length !== rightEntries.length) {
    return false;
  }

  return leftEntries.every(([key, value]) => right[key] === value);
}

function isSamePaymentMethod(
  left: TransactionDetail['payment_method'],
  right: TransactionDetail['payment_method']
) {
  return (
    left.type === right.type &&
    left.brand === right.brand &&
    left.last4 === right.last4 &&
    left.exp_month === right.exp_month &&
    left.exp_year === right.exp_year
  );
}

function buildDetailUpdateMessage({
  previousServerDetail,
  nextServerDetail,
  appendedEvents,
  pendingMetadata,
  pendingPaymentMethod
}: {
  previousServerDetail: TransactionDetail;
  nextServerDetail: TransactionDetail;
  appendedEvents: TransactionDetail['events'];
  pendingMetadata: Record<string, string> | null;
  pendingPaymentMethod: TransactionDetail['payment_method'] | null;
}) {
  const messages: string[] = [];

  if (previousServerDetail.status !== nextServerDetail.status) {
    messages.push(`상태가 ${nextServerDetail.status}로 변경됨`);
  }

  if (appendedEvents.length > 0) {
    messages.push(`이벤트 ${appendedEvents.length}건 추가됨`);
  }

  if (pendingMetadata) {
    messages.push(`메타데이터 변경 ${Object.keys(pendingMetadata).length}건 대기 중`);
  }

  if (pendingPaymentMethod) {
    messages.push('결제수단 변경 대기 중');
  }

  return messages.length > 0 ? messages.join(' · ') : null;
}

export function diffTransactionDetail({
  displayedDetail,
  previousServerDetail,
  nextServerDetail
}: DetailDiffInput): DetailDiff {
  const pendingMetadata = isSameRecord(displayedDetail.metadata, nextServerDetail.metadata)
    ? null
    : nextServerDetail.metadata;
  const pendingPaymentMethod = isSamePaymentMethod(displayedDetail.payment_method, nextServerDetail.payment_method)
    ? null
    : nextServerDetail.payment_method;
  const appendedEvents = nextServerDetail.events.slice(previousServerDetail.events.length);
  const summaryChanged =
    previousServerDetail.status !== nextServerDetail.status ||
    previousServerDetail.amount !== nextServerDetail.amount ||
    previousServerDetail.currency !== nextServerDetail.currency;

  return {
    nextAcceptedDetail: {
      ...nextServerDetail,
      metadata: pendingMetadata ? displayedDetail.metadata : nextServerDetail.metadata,
      payment_method: pendingPaymentMethod ? displayedDetail.payment_method : nextServerDetail.payment_method
    },
    pendingMetadata,
    pendingPaymentMethod,
    appendedEvents,
    summaryChanged,
    message: buildDetailUpdateMessage({
      previousServerDetail,
      nextServerDetail,
      appendedEvents,
      pendingMetadata,
      pendingPaymentMethod
    })
  };
}
