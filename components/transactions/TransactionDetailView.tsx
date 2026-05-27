import type { TransactionDetail } from '@/lib/transactions-api';

type TransactionDetailViewProps = {
  detail: TransactionDetail;
};

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase()
  }).format(amount / (currency === 'krw' || currency === 'jpy' ? 1 : 100));
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

export function TransactionDetailView({ detail }: TransactionDetailViewProps) {
  return (
    <div className="detail-grid">
      <section className="detail-card detail-summary">
        <p className="eyebrow">Transaction</p>
        <h1>{detail.id}</h1>
        <div className="summary-metrics">
          <div>
            <span>상태</span>
            <strong>{detail.status}</strong>
          </div>
          <div>
            <span>금액</span>
            <strong>{formatAmount(detail.amount, detail.currency)}</strong>
          </div>
          <div>
            <span>고객</span>
            <strong>{detail.customer.name}</strong>
          </div>
          <div>
            <span>생성 시각</span>
            <strong>{formatDate(detail.created_at)}</strong>
          </div>
        </div>
      </section>

      <section className="detail-card">
        <p className="eyebrow">Payment Method</p>
        <h2>
          {detail.payment_method.brand} •••• {detail.payment_method.last4}
        </h2>
        <p className="lead">
          {detail.payment_method.type} · {detail.payment_method.exp_month}/
          {detail.payment_method.exp_year}
        </p>
      </section>

      <section className="detail-card">
        <p className="eyebrow">Timeline</p>
        <ul className="event-list">
          {detail.events.map((event) => (
            <li key={`${event.type}-${event.at}`}>
              <strong>{event.type}</strong>
              <span>{formatDate(event.at)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="detail-card">
        <p className="eyebrow">Metadata</p>
        <dl className="metadata-list">
          {Object.entries(detail.metadata).map(([key, value]) => (
            <div key={key}>
              <dt>{key}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
