//상세 화면용 diff 계산기
import type { TransactionDetail } from '@/features/transactions/types/transaction';

type DetailDiffInput = {
  previousServerDetail: TransactionDetail;
  nextServerDetail: TransactionDetail;
};

export type DetailDiff = {
  nextAcceptedDetail: TransactionDetail;
  appendedEvents: TransactionDetail['events'];
  summaryChanged: boolean;
  metadataChanged: boolean;
  paymentMethodChanged: boolean;
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
  metadataChanged,
  paymentMethodChanged
}: {
  previousServerDetail: TransactionDetail;
  nextServerDetail: TransactionDetail;
  appendedEvents: TransactionDetail['events'];
  metadataChanged: boolean;
  paymentMethodChanged: boolean;
}) {
  const messages: string[] = [];

  if (previousServerDetail.status !== nextServerDetail.status) {
    messages.push(`상태가 ${nextServerDetail.status}로 변경됨`);
  }

  if (appendedEvents.length > 0) {
    messages.push(`이벤트 ${appendedEvents.length}건 추가됨`);
  }

  if (metadataChanged) {
    messages.push('메타데이터 갱신됨');
  }

  if (paymentMethodChanged) {
    messages.push('결제수단 정보 갱신됨');
  }

  return messages.length > 0 ? messages.join(' · ') : null;
}

export function diffTransactionDetail({
  previousServerDetail,
  nextServerDetail
}: DetailDiffInput): DetailDiff {
  const metadataChanged = !isSameRecord(previousServerDetail.metadata, nextServerDetail.metadata);
  const paymentMethodChanged = !isSamePaymentMethod(previousServerDetail.payment_method, nextServerDetail.payment_method);
  const appendedEvents = nextServerDetail.events.slice(previousServerDetail.events.length);
  const summaryChanged =
    previousServerDetail.status !== nextServerDetail.status ||
    previousServerDetail.amount !== nextServerDetail.amount ||
    previousServerDetail.currency !== nextServerDetail.currency;

  return {
    nextAcceptedDetail: nextServerDetail,
    appendedEvents,
    summaryChanged,
    metadataChanged,
    paymentMethodChanged,
    message: buildDetailUpdateMessage({
      previousServerDetail,
      nextServerDetail,
      appendedEvents,
      metadataChanged,
      paymentMethodChanged
    })
  };
}
